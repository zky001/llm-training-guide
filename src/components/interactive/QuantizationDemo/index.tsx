import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Message, Stat, StatRow} from '../ui';
import styles from '../playground.module.css';

/**
 * 6.3 节：量化演示。
 * 12 个示例权重（钟形分布）被压到不同精度的「刻度尺」上，
 * 红色线段 = 量化误差。同时显示 7B 模型在各精度下的体积。
 */

const WEIGHTS = [-0.82, -0.55, -0.43, -0.31, -0.18, -0.07, 0.02, 0.12, 0.24, 0.38, 0.61, 0.88];

interface Level {
  key: string;
  name: string;
  bits: number;
  levels: number | null; // null = 视为连续
  size7b: string;
  note: string;
}

const LEVELS: Level[] = [
  {key: 'fp16', name: 'fp16 / bf16（基准）', bits: 16, levels: null, size7b: '14 GB', note: '训练用的精度，权重几乎「连续」。7B 模型要 14 GB——消费级显卡（12 GB，2025 年主流）装不下。'},
  {key: 'int8', name: 'int8', bits: 8, levels: 256, size7b: '7 GB', note: '256 个刻度。看红色误差线：几乎贴着零——int8 量化通常几乎无损，体积直接减半。'},
  {key: 'int4', name: 'int4', bits: 4, levels: 16, size7b: '3.5 GB', note: '只剩 16 个刻度，误差明显变长。但配合「分组缩放」等技巧（每几十个权重共享一把自适应刻度尺），4 bit 仍能保住绝大部分能力——这是 2024-2025 年本地部署的主流选择。'},
  {key: 'int2', name: 'int2（玩坏看看）', bits: 2, levels: 4, size7b: '1.75 GB', note: '4 个刻度：所有权重被硬塞进 4 种取值，误差惨不忍睹——模型能力大幅退化。压缩和智力之间，终究有一条底线。'},
];

const W = 500;
const LINE_Y = 120;
const PAD = 30;
const px = (v: number) => PAD + ((v + 1) / 2) * (W - 2 * PAD);

function snap(v: number, levels: number): number {
  // 对称均匀量化到 [-1, 1] 的 levels 个刻度
  const stepSize = 2 / (levels - 1);
  return Math.round((v + 1) / stepSize) * stepSize - 1;
}

export default function QuantizationDemo() {
  const [idx, setIdx] = useState(0);
  const lv = LEVELS[idx];

  const snapped = WEIGHTS.map((w) => (lv.levels ? snap(w, lv.levels) : w));
  const avgErr = WEIGHTS.reduce((s, w, i) => s + Math.abs(w - snapped[i]), 0) / WEIGHTS.length;

  // 刻度线（太密时抽样画）
  const ticks: number[] = [];
  if (lv.levels) {
    const drawEvery = lv.levels > 40 ? Math.ceil(lv.levels / 40) : 1;
    for (let i = 0; i < lv.levels; i += drawEvery) {
      ticks.push(-1 + (2 / (lv.levels - 1)) * i);
    }
  }

  return (
    <PlaygroundCard
      title="量化：把权重压上更粗的刻度尺"
      subtitle="蓝点是 12 个模型权重的真实值，它们必须落到当前精度允许的刻度（灰线）上——红色线段就是被迫挪动的距离（量化误差）。逐个点开四种精度对比。"
      footer={
        <>
          💡 要点：量化就是「用更少的比特存每个数字」——刻度变粗、误差变大，但换来体积和显存的成倍下降。神奇之处在于大模型对小误差<b>相当迟钝</b>（亿万个参数的误差互相抵消），所以 int8 几乎白赚、int4 靠技巧也能用。你下载的「Q4 量化版」开源模型、推理服务用的 fp8 权重，都是这一套的工业版本。
        </>
      }
    >
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8}}>
        {LEVELS.map((l, i) => (
          <button
            key={l.key}
            type="button"
            className={styles.btn}
            style={i === idx ? {background: 'var(--ifm-color-primary)', color: '#fff', borderColor: 'var(--ifm-color-primary)'} : {}}
            onClick={() => setIdx(i)}
          >
            {l.name}
          </button>
        ))}
      </div>

      <div className={styles.svgWrap}>
        <svg viewBox={`0 0 ${W} 170`}>
          {/* 数轴 */}
          <line x1={PAD} y1={LINE_Y} x2={W - PAD} y2={LINE_Y} stroke="var(--viz-axis)" strokeWidth={2} />
          {[-1, -0.5, 0, 0.5, 1].map((v) => (
            <text key={v} x={px(v)} y={LINE_Y + 26} textAnchor="middle" fontSize={10} fill="var(--viz-muted)">{v}</text>
          ))}
          {/* 量化刻度 */}
          {ticks.map((t, i) => (
            <line key={i} x1={px(t)} y1={LINE_Y - 7} x2={px(t)} y2={LINE_Y + 7} stroke="var(--viz-grid)" strokeWidth={1.5} />
          ))}
          {lv.levels && lv.levels > 40 && (
            <text x={W - PAD} y={LINE_Y - 14} textAnchor="end" fontSize={9.5} fill="var(--viz-muted)">
              （{lv.levels} 个刻度，图中抽样显示）
            </text>
          )}
          {!lv.levels && (
            <text x={W - PAD} y={LINE_Y - 14} textAnchor="end" fontSize={9.5} fill="var(--viz-muted)">
              （约 6.5 万级，近似连续，误差 ≈ 0）
            </text>
          )}
          {/* 权重点与误差 */}
          {WEIGHTS.map((w, i) => {
            const y0 = LINE_Y - 34 - (i % 3) * 16;
            return (
              <g key={i}>
                {/* 误差段 */}
                <line x1={px(w)} y1={LINE_Y} x2={px(snapped[i])} y2={LINE_Y} stroke="var(--viz-s8)" strokeWidth={4} opacity={0.75} />
                <line x1={px(w)} y1={y0 + 5} x2={px(w)} y2={LINE_Y - 2} stroke="var(--viz-s1)" strokeWidth={1} opacity={0.35} />
                <circle cx={px(w)} cy={y0} r={4.5} fill="var(--viz-s1)" />
                {/* 落点 */}
                <circle cx={px(snapped[i])} cy={LINE_Y} r={4} fill={Math.abs(w - snapped[i]) > 1e-9 ? 'var(--viz-s6)' : 'var(--viz-s1)'} stroke="var(--viz-surface)" strokeWidth={1.5} />
              </g>
            );
          })}
          <text x={PAD} y={16} fontSize={10.5} fill="var(--viz-ink-2)">🔵 原始权重值　🟠 量化后的落点　🟥 量化误差</text>
        </svg>
      </div>

      <StatRow>
        <Stat label="每参数比特数" value={`${lv.bits} bit`} />
        <Stat label="可用刻度数" value={lv.levels ? `${lv.levels} 级` : '≈ 连续'} />
        <Stat label="7B 模型体积" value={lv.size7b} />
        <Stat
          label="平均量化误差"
          value={
            <span style={{color: avgErr > 0.05 ? 'var(--viz-bad)' : avgErr > 0.001 ? 'inherit' : 'var(--viz-good)'}}>
              {avgErr < 1e-9 ? '≈ 0' : avgErr.toFixed(3)}
            </span>
          }
        />
      </StatRow>

      <Message>{['📏', '✅', '⚖️', '💥'][idx]} {lv.note}</Message>
    </PlaygroundCard>
  );
}
