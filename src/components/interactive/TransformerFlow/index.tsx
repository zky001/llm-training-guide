import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow} from '../ui';
import styles from '../playground.module.css';

/**
 * 3.5 节：一个 token 的完整旅程——GPT 数据流分步动画。
 * 输入「天空是」，逐步展示分词 → 向量化 → N 个 Transformer 块 → logits →
 * softmax → 采样 → 拼回输入的自回归循环。数值为示意。
 */

const STAGES = ['输入文字', '分词', '向量化', 'Transformer 块 ×N', '打分 logits', '变概率 softmax', '采样 & 循环'];

const CAPTIONS = [
  '一切从一段文字开始。模型的任务：接着「天空是」往下写。',
  '文本先被分词器切成 token 并换成编号（第 1.3 节亲手训练过）。模型从头到尾只见编号，不见汉字。',
  '每个 token 编号去 embedding 表里领一个向量（第 1.4 节的「住进空间」），并加上位置信息——从这里开始，一切都是数字。',
  '向量列队穿过 N 个结构完全相同的块：先用多头注意力互相交换信息（谁该看谁），再各自过前馈网络加工。GPT-2 有 12 层，旗舰模型上百层（2025 年）。',
  '最后一个位置的向量对词表里的每个 token 打一个原始分（logit）——可正可负，还不是概率。',
  'softmax 把打分变成总和为 100% 的概率分布：打分高的占大头，但谁都有份。',
  '按概率掷骰子选出「蓝」（第 0.3 节的语言骰子！），拼回输入变成「天空是蓝」，回到第 1 步继续预测下一个字——这就是自回归循环。',
];

const LOGITS: {tok: string; logit: number; p: number}[] = [
  {tok: '蓝', logit: 3.2, p: 0.77},
  {tok: '灰', logit: 1.1, p: 0.1},
  {tok: '白', logit: 0.8, p: 0.07},
  {tok: '高', logit: 0.3, p: 0.04},
  {tok: '黑', logit: -0.5, p: 0.02},
];

// 示意 embedding（4 维展示，注明真实为几千维）
const EMB: {tok: string; v: number[]}[] = [
  {tok: '天', v: [0.6, -0.3, 0.8, 0.1]},
  {tok: '空', v: [0.5, -0.1, 0.7, -0.4]},
  {tok: '是', v: [-0.2, 0.9, 0.0, 0.3]},
];

export default function TransformerFlow() {
  const [step, setStep] = useState(0);

  const W = 500;

  return (
    <PlaygroundCard
      title="一个 token 的完整旅程"
      subtitle="从「天空是」进去，到「蓝」出来，中间到底发生了什么？点「下一步」跟着数据走完全程（数值为示意）。"
      footer={
        <>
          💡 要点：整条流水线里没有任何一步是「理解中文」——只有查表、矩阵乘法、加权平均和掷骰子。但把它重复几十层、乘上千亿参数，「理解」就从纯计算里涌现了出来。最后那个循环箭头值得多看一眼：<b>大模型一次只算一个 token</b>，长回答就是这个循环转了几百圈。
        </>
      }
    >
      {/* 流水线总览 */}
      <div className={styles.svgWrap}>
        <svg viewBox={`0 0 ${W} 74`}>
          {STAGES.map((s, i) => {
            const bx = 4 + i * ((W - 8) / STAGES.length);
            const bw = (W - 8) / STAGES.length - 6;
            const active = i === step;
            return (
              <g key={s} onClick={() => setStep(i)} style={{cursor: 'pointer'}}>
                <rect
                  x={bx} y={18} width={bw} height={34} rx={8}
                  fill={active ? 'var(--ifm-color-primary)' : 'none'}
                  stroke={active ? 'var(--ifm-color-primary)' : 'var(--viz-axis)'}
                  strokeWidth={1.5}
                  opacity={i <= step ? 1 : 0.45}
                />
                <text
                  x={bx + bw / 2} y={39} textAnchor="middle" fontSize={8.5} fontWeight={active ? 700 : 500}
                  fill={active ? '#fff' : 'var(--viz-ink-2)'} opacity={i <= step ? 1 : 0.55}
                >
                  {s}
                </text>
                {i < STAGES.length - 1 && (
                  <text x={bx + bw + 3} y={39} fontSize={9} fill="var(--viz-muted)">→</text>
                )}
              </g>
            );
          })}
          {/* 自回归循环箭头 */}
          <path
            d={`M${W - 40},52 Q${W / 2},86 44,54`}
            fill="none"
            stroke={step === 6 ? 'var(--viz-s6)' : 'var(--viz-grid)'}
            strokeWidth={step === 6 ? 2.5 : 1.5}
            strokeDasharray="6 4"
          />
          {step === 6 && (
            <text x={W / 2} y={70} textAnchor="middle" fontSize={9.5} fill="var(--viz-s6)" fontWeight={700}>
              把新 token 拼回输入，再来一圈（自回归）
            </text>
          )}
        </svg>
      </div>

      {/* 分步详情 */}
      <div className={styles.svgWrap}>
        <svg viewBox={`0 0 ${W} 170`}>
          {step === 0 && (
            <text x={W / 2} y={90} textAnchor="middle" fontSize={30} fontWeight={700} fill="var(--viz-ink-2)">
              「天空是」
            </text>
          )}

          {step === 1 && (
            <g>
              {['天', '空', '是'].map((t, i) => (
                <g key={t}>
                  <rect x={W / 2 - 130 + i * 90} y={55} width={70} height={48} rx={10} fill="none" stroke="var(--viz-s1)" strokeWidth={2} />
                  <text x={W / 2 - 95 + i * 90} y={80} textAnchor="middle" fontSize={17} fontWeight={700} fill="var(--viz-s1)">{t}</text>
                  <text x={W / 2 - 95 + i * 90} y={97} textAnchor="middle" fontSize={10} fill="var(--viz-muted)">id={[372, 891, 25][i]}</text>
                </g>
              ))}
              <text x={W / 2} y={135} textAnchor="middle" fontSize={11} fill="var(--viz-muted)">3 个字 → 3 个 token 编号（示意 id）</text>
            </g>
          )}

          {step === 2 && (
            <g>
              {EMB.map((e, i) => (
                <g key={e.tok}>
                  <text x={W / 2 - 95 + i * 90} y={40} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--viz-ink-2)">{e.tok}</text>
                  {e.v.map((v, k) => (
                    <g key={k}>
                      <rect
                        x={W / 2 - 95 + i * 90 - 26} y={50 + k * 20} width={52} height={16} rx={4}
                        fill={v >= 0 ? 'var(--viz-s1)' : 'var(--viz-s6)'}
                        opacity={0.25 + 0.7 * Math.abs(v)}
                      />
                      <text x={W / 2 - 95 + i * 90} y={62 + k * 20} textAnchor="middle" fontSize={9.5} fill="var(--viz-ink)" fontWeight={600}>
                        {v.toFixed(1)}
                      </text>
                    </g>
                  ))}
                </g>
              ))}
              <text x={W / 2} y={155} textAnchor="middle" fontSize={11} fill="var(--viz-muted)">
                每个 token → 一个向量（这里画 4 维，真实模型几千维）+ 位置信息
              </text>
            </g>
          )}

          {step === 3 && (
            <g>
              <rect x={W / 2 - 150} y={28} width={300} height={110} rx={14} fill="none" stroke="var(--viz-s7)" strokeWidth={2} strokeDasharray="7 4" />
              <text x={W / 2 + 130} y={48} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--viz-s7)">×N 层</text>
              <rect x={W / 2 - 125} y={45} width={250} height={34} rx={8} fill="none" stroke="var(--viz-s1)" strokeWidth={2} />
              <text x={W / 2} y={66} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--viz-s1)">多头注意力：token 之间交换信息</text>
              <text x={W / 2} y={90} textAnchor="middle" fontSize={13} fill="var(--viz-muted)">↓ 残差 + 归一化</text>
              <rect x={W / 2 - 125} y={98} width={250} height={34} rx={8} fill="none" stroke="var(--viz-s2)" strokeWidth={2} />
              <text x={W / 2} y={119} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--viz-s2)">前馈网络：每个位置各自深加工</text>
              <text x={W / 2} y={158} textAnchor="middle" fontSize={11} fill="var(--viz-muted)">第 2 章的神经网络 + 本章的注意力，就这两样，叠 N 遍</text>
            </g>
          )}

          {(step === 4 || step === 5) && (
            <g>
              {LOGITS.map((l, i) => {
                const y = 30 + i * 26;
                const isLogit = step === 4;
                const val = isLogit ? l.logit : l.p;
                const maxW = 240;
                const w = isLogit ? (Math.abs(l.logit) / 3.5) * maxW * 0.5 : l.p * maxW;
                const x0 = isLogit ? W / 2 - 40 : 120;
                return (
                  <g key={l.tok}>
                    <text x={isLogit ? W / 2 - 90 : 90} y={y + 13} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--viz-ink-2)">{l.tok}</text>
                    <rect
                      x={isLogit && l.logit < 0 ? x0 - w : x0} y={y} width={Math.max(2, w)} height={17} rx={4}
                      fill={isLogit ? (l.logit >= 0 ? 'var(--viz-s1)' : 'var(--viz-s8)') : 'var(--viz-s1)'}
                    />
                    <text x={(isLogit && l.logit < 0 ? x0 - w : x0 + w) + (isLogit && l.logit < 0 ? -6 : 6)} y={y + 13}
                      textAnchor={isLogit && l.logit < 0 ? 'end' : 'start'} fontSize={10.5} fontWeight={600} fill="var(--viz-ink-2)">
                      {isLogit ? l.logit.toFixed(1) : `${(l.p * 100).toFixed(0)}%`}
                    </text>
                  </g>
                );
              })}
              <text x={W / 2} y={165} textAnchor="middle" fontSize={11} fill="var(--viz-muted)">
                {step === 4 ? '词表里每个 token 一个原始打分（可正可负），这里只画 5 个' : 'softmax 之后：总和 = 100%，可以掷骰子了'}
              </text>
            </g>
          )}

          {step === 6 && (
            <g>
              <text x={W / 2} y={80} textAnchor="middle" fontSize={28} fontWeight={700} fill="var(--viz-ink-2)">
                「天空是<tspan fill="var(--viz-s6)">蓝</tspan>」
              </text>
              <text x={W / 2} y={120} textAnchor="middle" fontSize={12} fill="var(--viz-muted)">
                抽中「蓝」(77%)，拼回句尾 → 下一圈预测「色」？「天」？……
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className={styles.message}>
        <b>第 {step + 1}/7 步 · {STAGES[step]}：</b>{CAPTIONS[step]}
      </div>

      <BtnRow>
        <Btn onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>← 上一步</Btn>
        <Btn primary onClick={() => setStep((s) => Math.min(6, s + 1))} disabled={step === 6}>下一步 →</Btn>
        <Btn onClick={() => setStep(0)} disabled={step === 0}>↺ 从头再看</Btn>
      </BtnRow>
    </PlaygroundCard>
  );
}
