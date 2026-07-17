import React, {useMemo, useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Message} from '../ui';
import styles from '../playground.module.css';

/**
 * 3.2 / 3.3 节：注意力实验台。
 * 例句上的 4 个「注意力头」，权重为示意数据——模式参考了真实模型中
 * 被反复观察到的注意力头行为（指代消解头、前一词头、句法/主语头、平滑头），
 * 真实权重由 Q·K 相似度计算得出（见 3.2 深入层）。
 */

const TOKENS = ['小猫', '追着', '蝴蝶', '跑', '，', '它', '累了', '就', '趴下', '休息', '。'];
const N = TOKENS.length;

interface Head {
  name: string;
  desc: string;
  /** 返回 query=i 对 key=j 的原始打分 */
  score: (i: number, j: number) => number;
}

const VERBS_EARLY = [1, 3]; // 追着、跑 → 主语是小猫
const VERBS_LATE = [6, 8, 9]; // 累了、趴下、休息 → 主语是「它」

const HEADS: Head[] = [
  {
    name: '指代头',
    desc: '专管「这个代词指谁」：选中「它」，看它把注意力砸向哪里。',
    score: (i, j) => {
      if (i === 5) return j === 0 ? 10 : j === 2 ? 2.5 : j === i ? 1 : 0; // 它 → 小猫（蝴蝶是干扰项）
      return j === i ? 3 : j === i - 1 ? 1 : 0;
    },
  },
  {
    name: '邻居头',
    desc: '几乎只看前一个词——真实模型里最常见的头之一，负责局部搭配。',
    score: (i, j) => (i === 0 ? (j === 0 ? 8 : 0) : j === i - 1 ? 8 : j === i ? 2 : 0),
  },
  {
    name: '动作头',
    desc: '每个动词都在找「谁在做这个动作」：动词们集体盯着主语看。',
    score: (i, j) => {
      if (VERBS_EARLY.includes(i)) return j === 0 ? 8 : j === i ? 2 : 0;
      if (VERBS_LATE.includes(i)) return j === 5 ? 7 : j === 0 ? 4 : j === i ? 2 : 0;
      return j === i ? 4 : j === i - 1 ? 1 : 0;
    },
  },
  {
    name: '平滑头',
    desc: '雨露均沾，把整句话的信息搅拌均匀——看起来没个性，但汇总全局也很重要。',
    score: (i, j) => (j === i ? 2 : 1),
  },
];

function buildMatrix(head: Head, causal: boolean): number[][] {
  return Array.from({length: N}, (_, i) => {
    const raw = Array.from({length: N}, (_, j) => (causal && j > i ? -Infinity : head.score(i, j)));
    const mx = Math.max(...raw);
    const exps = raw.map((s) => (s === -Infinity ? 0 : Math.exp(s - mx)));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((e) => e / sum);
  });
}

// 权重 → 蓝色系颜色（浅→深）
function cellColor(w: number): string {
  const t = Math.min(1, w * 1.6);
  const from = [235, 243, 252];
  const to = [13, 54, 107];
  const c = from.map((f, i) => Math.round(f + (to[i] - f) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const AW = 500;
const AH = 150;
const tokX = (i: number) => 30 + i * ((AW - 60) / (N - 1));

export default function AttentionPlayground() {
  const [headIdx, setHeadIdx] = useState(0);
  const [selected, setSelected] = useState(5);
  const [causal, setCausal] = useState(false);
  const [view, setView] = useState<'arcs' | 'grid'>('arcs');

  const head = HEADS[headIdx];
  const M = useMemo(() => buildMatrix(head, causal), [head, causal]);

  const row = M[selected];
  const top3 = row
    .map((w, j) => ({j, w}))
    .sort((a, b) => b.w - a.w)
    .slice(0, 3)
    .filter((t) => t.w > 0.01);

  return (
    <PlaygroundCard
      title="注意力实验台：每个词都在看谁？"
      subtitle="点击任意一个词，弧线粗细 = 它分给其他词的注意力权重。换不同的「头」，同一句话会被用完全不同的方式扫视。（权重为示意数据，模式参考真实模型中观察到的头行为）"
      footer={
        <>
          💡 要点：注意力权重每行加起来恰好是 100%——每个词把「关注预算」分配给全句。<b>不同的头 = 不同的关注模式</b>：有的管指代、有的管邻居、有的管「谁在做动作」。真实大模型每层有几十个头、共几十层，这些分工全是训练中自己涌现的，没人手工指定。
        </>
      }
    >
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8}}>
        {HEADS.map((h, i) => (
          <button
            key={h.name}
            type="button"
            className={styles.btn}
            style={
              i === headIdx
                ? {background: 'var(--ifm-color-primary)', color: '#fff', borderColor: 'var(--ifm-color-primary)'}
                : {}
            }
            onClick={() => setHeadIdx(i)}
          >
            {h.name}
          </button>
        ))}
        <span style={{flex: 1}} />
        <button type="button" className={styles.btn} onClick={() => setView(view === 'arcs' ? 'grid' : 'arcs')}>
          {view === 'arcs' ? '🔢 切换热力图' : '🌈 切换弧线图'}
        </button>
      </div>

      <Message>🧭 {head.desc}</Message>

      {view === 'arcs' ? (
        <div className={styles.svgWrap}>
          <svg viewBox={`0 0 ${AW} ${AH}`}>
            {/* 注意力弧线：从选中词出发 */}
            {row.map((w, j) => {
              if (j === selected || w < 0.02) return null;
              const x1 = tokX(selected);
              const x2 = tokX(j);
              const mid = (x1 + x2) / 2;
              const lift = Math.min(90, Math.abs(x2 - x1) * 0.45 + 18);
              return (
                <path
                  key={j}
                  d={`M${x1},${AH - 42} Q${mid},${AH - 42 - lift} ${x2},${AH - 42}`}
                  fill="none"
                  stroke="var(--viz-s1)"
                  strokeWidth={1 + 6 * w}
                  opacity={0.25 + 0.7 * w}
                />
              );
            })}
            {/* 自注意力（指向自己）用圆点表示 */}
            {row[selected] > 0.02 && (
              <circle cx={tokX(selected)} cy={AH - 62} r={4 + 8 * row[selected]} fill="var(--viz-s1)" opacity={0.4} />
            )}
            {/* token 序列 */}
            {TOKENS.map((t, i) => (
              <g key={i} onClick={() => setSelected(i)} style={{cursor: 'pointer'}}>
                <rect
                  x={tokX(i) - 20} y={AH - 40} width={40} height={26} rx={7}
                  fill={i === selected ? 'var(--viz-s6)' : 'none'}
                  stroke={i === selected ? 'var(--viz-s6)' : 'var(--viz-axis)'}
                  strokeWidth={1.5}
                />
                <text
                  x={tokX(i)} y={AH - 22} textAnchor="middle" fontSize={12.5} fontWeight={i === selected ? 700 : 500}
                  fill={i === selected ? '#fff' : 'var(--viz-ink-2)'}
                >
                  {t}
                </text>
                {row[i] > 0.02 && i !== selected && (
                  <text x={tokX(i)} y={AH - 4} textAnchor="middle" fontSize={9.5} fill="var(--viz-s1)" fontWeight={700}>
                    {(row[i] * 100).toFixed(0)}%
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>
      ) : (
        <div className={styles.svgWrap}>
          <svg viewBox={`0 0 ${46 + N * 34} ${50 + N * 26}`}>
            {TOKENS.map((t, j) => (
              <text
                key={`c${j}`} x={46 + j * 34 + 17} y={40} textAnchor="start" fontSize={10.5} fill="var(--viz-ink-2)"
                transform={`rotate(-45 ${46 + j * 34 + 17} 40)`}
              >
                {t}
              </text>
            ))}
            {M.map((r, i) => (
              <g key={`r${i}`} onClick={() => setSelected(i)} style={{cursor: 'pointer'}}>
                <text
                  x={40} y={50 + i * 26 + 16} textAnchor="end" fontSize={10.5}
                  fontWeight={i === selected ? 700 : 500}
                  fill={i === selected ? 'var(--viz-s6)' : 'var(--viz-ink-2)'}
                >
                  {TOKENS[i]}
                </text>
                {r.map((w, j) => (
                  <rect
                    key={j} x={46 + j * 34} y={50 + i * 26} width={32} height={24} rx={4}
                    fill={cellColor(w)}
                    stroke={i === selected ? 'var(--viz-s6)' : 'transparent'}
                    strokeWidth={1}
                  >
                    <title>{`${TOKENS[i]} → ${TOKENS[j]}：${(w * 100).toFixed(1)}%`}</title>
                  </rect>
                ))}
              </g>
            ))}
            <text x={46} y={20} fontSize={10} fill="var(--viz-muted)">行 = 谁在看（query）　列 = 看谁（key）　颜色越深权重越大</text>
          </svg>
        </div>
      )}

      <div style={{display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', margin: '8px 0'}}>
        <label style={{fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 5}}>
          <input type="checkbox" checked={causal} onChange={(e) => setCausal(e.target.checked)} />
          因果遮罩（只许看前文，GPT 的规则）
        </label>
      </div>

      <Message>
        「<b>{TOKENS[selected]}</b>」的注意力去向：
        {top3.map((t) => ` ${TOKENS[t.j]} ${(t.w * 100).toFixed(0)}%`).join(' ·')}
        {causal && selected < N - 1 && ' —— 开着遮罩，它右边的词一概看不见（权重被重新分配给前文）。'}
      </Message>
    </PlaygroundCard>
  );
}
