import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Message, Stat, StatRow} from '../ui';
import styles from '../playground.module.css';

/**
 * 8.1 节：MoE 路由演示。
 * 点击句子里的 token，路由器把它分发给 8 个专家中的 2 个。
 * 分发结果为教学示意（真实 MoE 的专家分工是训练涌现的，且大多不可解释）。
 */

const TOKENS = ['我', '喜欢', '用', 'Python', '写', '代码', '，', '也', '爱', '读', '唐诗', '。'];

// 每个 token 的 top-2 专家与权重（示意，稳定可复现）
function route(i: number): {experts: [number, number]; weights: [number, number]} {
  const h = (i * 2654435761) >>> 0;
  const e1 = h % 8;
  const e2 = (e1 + 1 + ((h >> 8) % 7)) % 8;
  const w1 = 0.55 + ((h >> 16) % 30) / 100;
  return {experts: [e1, e2], weights: [w1, Math.round((1 - w1) * 100) / 100]};
}

const EXPERT_B = 7; // 每个专家 7B（示意）
const SHARED_B = 3; // 注意力等共享部分 3B（示意）
const TOTAL = SHARED_B + 8 * EXPERT_B; // 59B
const ACTIVE = SHARED_B + 2 * EXPERT_B; // 17B

export default function MoeDemo() {
  const [sel, setSel] = useState(3); // 默认选中 Python

  const {experts, weights} = route(sel);

  return (
    <PlaygroundCard
      title="MoE：一栋楼的专家，每次只叫两位"
      subtitle="点击句子里的任意 token：路由器（一个小网络）当场决定把它交给 8 位「专家」（各自是一个前馈网络）中的哪 2 位处理。（分发结果为教学示意）"
      footer={
        <>
          💡 要点：MoE 把 Transformer 里的前馈网络换成一群专家 + 一个路由器。参数总量可以堆得巨大（提升「知识容量」），但每个 token 只激活其中一小部分（计算量不涨）——「万亿参数、百亿计算」就是这么来的。代价：显存仍要装下<b>全部</b>专家，且专家分工是训练涌现的，大多并不对应人类概念（别指望有个「Python 专家」）。
        </>
      }
    >
      {/* token 行 */}
      <div style={{lineHeight: 2.4, marginBottom: 8, textAlign: 'center'}}>
        {TOKENS.map((t, i) => (
          <button
            key={i}
            type="button"
            className={styles.chip}
            style={{
              cursor: 'pointer',
              fontSize: '0.95rem',
              ...(i === sel
                ? {background: 'var(--ifm-color-primary)', color: '#fff', borderColor: 'var(--ifm-color-primary)', fontWeight: 700}
                : {background: 'var(--ifm-background-surface-color)'}),
            }}
            onClick={() => setSel(i)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 路由器 */}
      <div style={{textAlign: 'center', margin: '4px 0 10px'}}>
        <span
          style={{
            display: 'inline-block',
            padding: '6px 18px',
            borderRadius: 999,
            border: '2px solid var(--viz-s6)',
            fontWeight: 700,
            fontSize: '0.9rem',
          }}
        >
          🚦 路由器：「{TOKENS[sel]}」→ 专家 {experts[0] + 1}（{(weights[0] * 100).toFixed(0)}%）+ 专家 {experts[1] + 1}（{(weights[1] * 100).toFixed(0)}%）
        </span>
      </div>

      {/* 专家网格 */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, maxWidth: 460, margin: '0 auto'}}>
        {Array.from({length: 8}, (_, e) => {
          const on = e === experts[0] || e === experts[1];
          const w = e === experts[0] ? weights[0] : e === experts[1] ? weights[1] : 0;
          return (
            <div
              key={e}
              style={{
                padding: '12px 8px',
                borderRadius: 12,
                textAlign: 'center',
                border: `2px solid ${on ? 'var(--viz-s6)' : 'var(--ifm-color-emphasis-300)'}`,
                background: on ? 'rgba(235, 104, 52, 0.10)' : 'var(--ifm-background-surface-color)',
                opacity: on ? 1 : 0.55,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{fontSize: '1.3rem'}}>{on ? '🧑‍🔬' : '😴'}</div>
              <div style={{fontWeight: 700, fontSize: '0.85rem'}}>专家 {e + 1}</div>
              <div style={{fontSize: '0.75rem', color: 'var(--ifm-color-emphasis-600)'}}>
                {on ? `权重 ${(w * 100).toFixed(0)}%` : '休息中'}
              </div>
            </div>
          );
        })}
      </div>

      <StatRow>
        <Stat label="参数总量（示意）" value={`${TOTAL}B`} />
        <Stat label="每 token 实际激活" value={<span style={{color: 'var(--viz-good)'}}>{ACTIVE}B</span>} />
        <Stat label="计算量相当于" value={`一个 ${ACTIVE}B 稠密模型`} />
      </StatRow>

      <Message>
        🧮 账本：8 位专家各 {EXPERT_B}B + 共享部分（注意力等）{SHARED_B}B = 总参数 {TOTAL}B；但每个 token 只经过 2 位专家，激活 {ACTIVE}B——<b>知识容量按 {TOTAL}B 算，算力账单按 {ACTIVE}B 付</b>。多点几个 token，注意不同 token 会被派给不同的专家组合。
      </Message>
    </PlaygroundCard>
  );
}
