import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Message} from '../ui';
import styles from '../playground.module.css';

/**
 * 4.4 节：并行训练策略图解。
 * 4 张 GPU × 4 层模型的示意：单卡 / 数据并行 / 张量并行 / 流水线并行 / ZeRO-3。
 * 每张卡下方的显存条按「参数 2 : 梯度 2 : 优化器状态 12」(字节/参数) 比例绘制，
 * 红色虚线是显存容量线——一眼看出谁爆显存、谁省显存。
 */

type Mode = 'single' | 'dp' | 'tp' | 'pp' | 'zero';

const LAYER_COLORS = ['var(--viz-s1)', 'var(--viz-s5)', 'var(--viz-s6)', 'var(--viz-s7)'];
const MB_COLORS = ['var(--viz-s1)', 'var(--viz-s5)', 'var(--viz-s6)', 'var(--viz-s3)'];

const MODES: {key: Mode; name: string; caption: string}[] = [
  {
    key: 'single',
    name: '单卡',
    caption:
      '一张卡装下全部：参数 + 梯度 + 优化器状态 ≈ 每参数 16 字节。千亿参数就是 1.6 TB，而一张卡只有几十 GB——💥 显存直接爆掉。这就是一切并行策略的出发点。',
  },
  {
    key: 'dp',
    name: '数据并行 DP',
    caption:
      '每张卡放一份完整模型，各吃一批不同的数据，算完把梯度求平均（All-Reduce）再各自更新。训练速度 ×4，但注意显存条：每张卡还是完整的 16 字节/参数——DP 只提速，不省显存，模型放不下时它救不了你。',
  },
  {
    key: 'tp',
    name: '张量并行 TP',
    caption:
      '把每一层内部的大矩阵切成 4 份，每张卡算每层的 1/4。显存立刻降到 1/4，但代价是算每一层都要卡间通信——通信极其频繁，只适合有超高速互联（NVLink 级）的同机 GPU 之间。',
  },
  {
    key: 'pp',
    name: '流水线并行 PP',
    caption:
      '按层切段：GPU1 管第 1 层、GPU2 管第 2 层……数据像工厂流水线一样逐段接力。显存同样降到 1/4，通信量小（只传层间结果），但看下面的时间表：流水线灌满前后总有人闲着——这就是「气泡」，微批次切得越细气泡越小。',
  },
  {
    key: 'zero',
    name: 'ZeRO-3',
    caption:
      '数据并行的省显存魔改：参数、梯度、优化器状态统统切成 4 片分摊（虚线块 = 只存 1/4），算到哪一层，就临时把那层参数从别的卡拼装过来（All-Gather），用完就丢。显存像 TP 一样省，用法像 DP 一样简单，代价是更多通信。',
  },
];

const GPU_W = 112;
const GPU_H = 120;
const gpuX = (i: number) => 14 + i * 124;
const GPU_Y = 26;

/** 显存条：1 字节/参数 = 4px，容量线画在 10 单位处 */
function MemBar({x, y, p, g, o}: {x: number; y: number; p: number; g: number; o: number}) {
  const U = 4;
  const cap = 10 * U;
  const segs = [
    {w: p * U, c: 'var(--viz-s1)'},
    {w: g * U, c: 'var(--viz-s6)'},
    {w: o * U, c: 'var(--viz-s7)'},
  ];
  let cx = x;
  const total = (p + g + o) * U;
  return (
    <g>
      {segs.map((s, i) => {
        const r = <rect key={i} x={cx} y={y} width={s.w} height={10} fill={s.c} opacity={0.9} />;
        cx += s.w;
        return r;
      })}
      <rect x={x} y={y} width={cap} height={10} fill="none" stroke="var(--viz-axis)" strokeWidth={1} />
      <line x1={x + cap} y1={y - 3} x2={x + cap} y2={y + 13} stroke="var(--viz-bad)" strokeWidth={1.5} strokeDasharray="3 2" />
      {total > cap && (
        <text x={x + total + 4} y={y + 9} fontSize={11} fill="var(--viz-bad)">💥</text>
      )}
    </g>
  );
}

function Gpu({i, kind}: {i: number; kind: 'full' | 'slice' | 'one' | 'ghost'}) {
  const x = gpuX(i);
  return (
    <g>
      <rect x={x} y={GPU_Y} width={GPU_W} height={GPU_H} rx={10} fill="none" stroke="var(--viz-axis)" strokeWidth={1.5} />
      <text x={x + GPU_W / 2} y={GPU_Y + 15} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--viz-ink-2)">
        GPU {i + 1}
      </text>
      {/* 模型层 */}
      {kind === 'one' ? (
        <g>
          <rect x={x + 16} y={GPU_Y + 24} width={GPU_W - 32} height={52} rx={6} fill={LAYER_COLORS[i]} opacity={0.85} />
          <text x={x + GPU_W / 2} y={GPU_Y + 54} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">第 {i + 1} 层</text>
        </g>
      ) : (
        [0, 1, 2, 3].map((l) => (
          <g key={l}>
            <rect
              x={x + 16}
              y={GPU_Y + 22 + l * 14}
              width={kind === 'slice' ? (GPU_W - 32) / 4 : GPU_W - 32}
              height={11}
              rx={3}
              fill={LAYER_COLORS[l]}
              opacity={kind === 'ghost' ? 0.25 : 0.85}
              stroke={kind === 'ghost' ? LAYER_COLORS[l] : 'none'}
              strokeWidth={kind === 'ghost' ? 1.2 : 0}
              strokeDasharray={kind === 'ghost' ? '3 2' : undefined}
            />
            {kind === 'slice' && (
              <text x={x + 16 + (GPU_W - 32) / 4 + 5} y={GPU_Y + 31 + l * 14} fontSize={8.5} fill="var(--viz-muted)">¼ 层</text>
            )}
          </g>
        ))
      )}
      {kind === 'ghost' && (
        <text x={x + GPU_W / 2} y={GPU_Y + 88} textAnchor="middle" fontSize={8.5} fill="var(--viz-muted)">只存 ¼，用时拼装</text>
      )}
    </g>
  );
}

function DataChip({i, label}: {i: number; label: string}) {
  const x = gpuX(i);
  return (
    <g>
      <rect x={x + 26} y={2} width={GPU_W - 52} height={17} rx={8} fill="var(--ifm-color-emphasis-200)" />
      <text x={x + GPU_W / 2} y={14} textAnchor="middle" fontSize={9.5} fontWeight={600} fill="var(--viz-ink-2)">{label}</text>
      <line x1={x + GPU_W / 2} y1={19} x2={x + GPU_W / 2} y2={GPU_Y} stroke="var(--viz-axis)" strokeWidth={1} />
    </g>
  );
}

export default function ParallelismViz() {
  const [mode, setMode] = useState<Mode>('single');
  const m = MODES.find((x) => x.key === mode)!;

  const W = 520;
  const H = mode === 'single' ? 200 : 214;
  const memY = GPU_Y + GPU_H + 18;

  return (
    <PlaygroundCard
      title="4 张卡怎么扛起一个大模型"
      subtitle="模型有 4 层（彩色块），显存条按「参数🟦 : 梯度🟧 : 优化器状态🟪 = 2 : 2 : 12 字节/参数」绘制，红色虚线是显存容量。逐个点开五种策略，重点看显存条和通信箭头的变化。"
      footer={
        <>
          💡 要点：先记住显存账本——<b>优化器状态（12/16）才是显存大头</b>，所以 ZeRO 第一刀就切它。真实的万卡训练是「3D 并行」组合拳：同机 8 卡内部用 TP（通信最凶、走 NVLink），跨机用 PP 和 DP/ZeRO 分摊其余。怎么切、切多少，是大模型基建工程师的核心手艺。
        </>
      }
    >
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8}}>
        {MODES.map((x) => (
          <button
            key={x.key}
            type="button"
            className={styles.btn}
            style={x.key === mode ? {background: 'var(--ifm-color-primary)', color: '#fff', borderColor: 'var(--ifm-color-primary)'} : {}}
            onClick={() => setMode(x.key)}
          >
            {x.name}
          </button>
        ))}
      </div>

      <div className={styles.svgWrap}>
        <svg viewBox={`0 0 ${W} ${H}`}>
          {mode === 'single' && (
            <g transform={`translate(${(W - GPU_W) / 2 - 14}, 0)`}>
              <DataChip i={0} label="所有数据" />
              <Gpu i={0} kind="full" />
              <MemBar x={gpuX(0)} y={memY} p={2} g={2} o={12} />
              <text x={gpuX(0)} y={memY + 26} fontSize={9.5} fill="var(--viz-bad)">每参数 16 字节，远超容量线 → 爆显存</text>
            </g>
          )}

          {mode === 'dp' && (
            <g>
              {[0, 1, 2, 3].map((i) => (
                <g key={i}>
                  <DataChip i={i} label={`数据批 ${i + 1}`} />
                  <Gpu i={i} kind="full" />
                  <MemBar x={gpuX(i)} y={memY} p={2} g={2} o={12} />
                </g>
              ))}
              <line x1={gpuX(0) + GPU_W / 2} y1={memY + 34} x2={gpuX(3) + GPU_W / 2} y2={memY + 34} stroke="var(--viz-s2)" strokeWidth={2} />
              {[0, 1, 2, 3].map((i) => (
                <line key={i} x1={gpuX(i) + GPU_W / 2} y1={memY + 34} x2={gpuX(i) + GPU_W / 2} y2={GPU_Y + GPU_H} stroke="var(--viz-s2)" strokeWidth={2} />
              ))}
              <text x={W / 2} y={H - 2} textAnchor="middle" fontSize={10} fill="var(--viz-s2)" fontWeight={600}>
                ⇅ 每步结束：4 张卡的梯度求平均（All-Reduce），保证模型副本永远一致
              </text>
            </g>
          )}

          {mode === 'tp' && (
            <g>
              {[0, 1, 2, 3].map((i) => (
                <g key={i}>
                  <DataChip i={i} label="同一批数据" />
                  <Gpu i={i} kind="slice" />
                  <MemBar x={gpuX(i)} y={memY} p={0.5} g={0.5} o={3} />
                </g>
              ))}
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <text x={gpuX(i) + GPU_W + 6} y={GPU_Y + 45} fontSize={13} fill="var(--viz-s8)" fontWeight={700}>⇄</text>
                  <text x={gpuX(i) + GPU_W + 6} y={GPU_Y + 75} fontSize={13} fill="var(--viz-s8)" fontWeight={700}>⇄</text>
                </g>
              ))}
              <text x={W / 2} y={H - 2} textAnchor="middle" fontSize={10} fill="var(--viz-s8)" fontWeight={600}>
                ⇄ 算每一层都要通信——极频繁，必须 NVLink 级带宽（通常限于同一台机器的 8 卡内）
              </text>
            </g>
          )}

          {mode === 'pp' && (
            <g>
              <DataChip i={0} label="数据流入 →" />
              {[0, 1, 2, 3].map((i) => (
                <g key={i}>
                  <Gpu i={i} kind="one" />
                  <MemBar x={gpuX(i)} y={memY} p={0.5} g={0.5} o={3} />
                  {i < 3 && (
                    <text x={gpuX(i) + GPU_W + 1} y={GPU_Y + 62} fontSize={14} fill="var(--viz-s6)" fontWeight={700}>→</text>
                  )}
                </g>
              ))}
              <text x={W / 2} y={H - 2} textAnchor="middle" fontSize={10} fill="var(--viz-s6)" fontWeight={600}>
                → 只在相邻段之间传中间结果，通信量小，可跨机器
              </text>
            </g>
          )}

          {mode === 'zero' && (
            <g>
              {[0, 1, 2, 3].map((i) => (
                <g key={i}>
                  <DataChip i={i} label={`数据批 ${i + 1}`} />
                  <Gpu i={i} kind="ghost" />
                  <MemBar x={gpuX(i)} y={memY} p={0.5} g={0.5} o={3} />
                </g>
              ))}
              <line x1={gpuX(0) + GPU_W / 2} y1={memY + 34} x2={gpuX(3) + GPU_W / 2} y2={memY + 34} stroke="var(--viz-s7)" strokeWidth={2} strokeDasharray="6 3" />
              {[0, 1, 2, 3].map((i) => (
                <line key={i} x1={gpuX(i) + GPU_W / 2} y1={memY + 34} x2={gpuX(i) + GPU_W / 2} y2={GPU_Y + GPU_H} stroke="var(--viz-s7)" strokeWidth={2} strokeDasharray="6 3" />
              ))}
              <text x={W / 2} y={H - 2} textAnchor="middle" fontSize={10} fill="var(--viz-s7)" fontWeight={600}>
                ⇅ 算到第 k 层时，临时从各卡拼装该层完整参数（All-Gather），用完即丢
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* 显存图例 */}
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: '0.82rem', margin: '4px 0 8px'}}>
        {[['参数 (2字节/参数)', 'var(--viz-s1)'], ['梯度 (2字节)', 'var(--viz-s6)'], ['优化器状态 (12字节)', 'var(--viz-s7)']].map(([t, c]) => (
          <span key={t} style={{display: 'flex', alignItems: 'center', gap: 5}}>
            <span style={{width: 10, height: 10, background: c as string, display: 'inline-block', borderRadius: 2}} />
            {t}
          </span>
        ))}
        <span style={{color: 'var(--viz-bad)'}}>┆ 显存容量线</span>
      </div>

      {mode === 'pp' && (
        <div className={styles.svgWrap}>
          <svg viewBox="0 0 520 96">
            <text x={10} y={12} fontSize={10} fontWeight={700} fill="var(--viz-ink-2)">流水线时间表（4 个微批次 m1~m4）：</text>
            {[0, 1, 2, 3].map((g) => (
              <g key={g}>
                <text x={44} y={34 + g * 17} textAnchor="end" fontSize={9.5} fill="var(--viz-muted)">GPU{g + 1}</text>
                {[0, 1, 2, 3, 4, 5, 6].map((t) => {
                  const mIdx = t - g;
                  const busy = mIdx >= 0 && mIdx < 4;
                  return (
                    <g key={t}>
                      <rect
                        x={52 + t * 62} y={24 + g * 17} width={58} height={13} rx={3}
                        fill={busy ? MB_COLORS[mIdx] : 'var(--ifm-color-emphasis-200)'}
                        opacity={busy ? 0.85 : 1}
                      />
                      {busy && (
                        <text x={52 + t * 62 + 29} y={34 + g * 17} textAnchor="middle" fontSize={8.5} fill="#fff" fontWeight={700}>m{mIdx + 1}</text>
                      )}
                    </g>
                  );
                })}
              </g>
            ))}
            <text x={52} y={94} fontSize={9.5} fill="var(--viz-muted)">灰色格子 = 「气泡」：这张卡此刻没活干。微批次切得越多，气泡占比越小。</text>
          </svg>
        </div>
      )}

      <Message>{m.caption}</Message>
    </PlaygroundCard>
  );
}
