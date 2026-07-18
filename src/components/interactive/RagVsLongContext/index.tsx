import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message, SliderRow, Stat, StatRow} from '../ui';
import styles from '../playground.module.css';

/**
 * K7.3：RAG vs 长上下文成本权衡计算器。
 * 「把整个知识库塞进上下文」vs「RAG 只塞检索到的几段」vs「混合」，
 * 按知识库大小和查询量，估算每千次查询的 token 成本与延迟/精度取向。
 * 数字为量级估算（2026 行情假设，见 footer）。
 */

// 对数滑块
const logMap = (t: number, min: number, max: number) => min * Math.pow(max / min, t / 100);
const logInv = (v: number, min: number, max: number) => (100 * Math.log(v / min)) / Math.log(max / min);

const KB_MIN = 1e4; // 1 万 token（几页）
const KB_MAX = 1e8; // 1 亿 token（一个大知识库）

const PRICE_PER_MTOK = 3; // 元 / 百万 token（示意，2026 中端模型输入价量级）
const RAG_CHUNK_TOK = 4000; // RAG 每次检索塞进上下文的 token（几段）

function fmtTok(n: number): string {
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)} 亿`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(0)} 万`;
  return `${n.toFixed(0)}`;
}
function fmtMoney(y: number): string {
  if (y >= 1e4) return `${(y / 1e4).toFixed(1)} 万元`;
  if (y >= 1) return `${y.toFixed(0)} 元`;
  return `${y.toFixed(2)} 元`;
}

export default function RagVsLongContext() {
  const [kb, setKb] = useState(2e6); // 知识库 token
  const [queries, setQueries] = useState(1000); // 查询次数

  // 长上下文：每次都把整个知识库塞进去
  const longTokPerQ = kb;
  const longCost = (longTokPerQ / 1e6) * PRICE_PER_MTOK * queries;
  // RAG：每次只塞检索到的几段
  const ragTokPerQ = RAG_CHUNK_TOK;
  const ragCost = (ragTokPerQ / 1e6) * PRICE_PER_MTOK * queries;
  // 混合：检索缩小到一个子集（比如 5 万 token）再让长上下文推理
  const hybridTokPerQ = Math.min(kb, 50000);
  const hybridCost = (hybridTokPerQ / 1e6) * PRICE_PER_MTOK * queries;

  const ratio = longCost / ragCost;
  // 长上下文能不能装下（假设窗口上限 100 万 token，2026 旗舰量级）
  const WINDOW = 1e6;
  const overflow = kb > WINDOW;

  return (
    <PlaygroundCard
      title="RAG vs 长上下文：直接全塞进去，不行吗？"
      subtitle="上下文窗口越来越大，有人问：既然能塞几十万字，何必费劲搞检索，把整个知识库一股脑塞给模型不就行了？拖动滑块算笔账，看看这个想法在什么时候成立、什么时候破产。"
      footer={
        <>
          💡 要点：2026 年的共识不是「长上下文杀死 RAG」，而是<b>两者混用</b>——用检索<b>决定该看哪些资料</b>（把知识库缩小到相关的一小撮），再用长上下文<b>在这一小撮上好好推理</b>。原因就在这笔账里：把整个知识库每次都塞进去，成本随库大小线性爆炸、还会撞上窗口上限、更会「读越多越走神」（回扣上篇长上下文的「标称≠有效」）；RAG 每次只塞几段，又省又快，但受限于检索准不准。混合取两者之长——这也解释了为什么 RAG 没有被长上下文淘汰，反而成了它的最佳搭档。
        </>
      }
    >
      <label className={styles.sliderRow}>
        <span className={styles.sliderLabel}>知识库大小</span>
        <input type="range" min={0} max={100} step={1} value={logInv(kb, KB_MIN, KB_MAX)} onChange={(e) => setKb(logMap(Number(e.target.value), KB_MIN, KB_MAX))} />
        <span className={styles.sliderValue} style={{minWidth: '5em'}}>{fmtTok(kb)} tok</span>
      </label>
      <SliderRow label="查询次数" value={queries} min={100} max={100000} step={100} onChange={setQueries} fmt={(v) => `${fmtTok(v)}次`} />

      <div style={{display: 'flex', flexWrap: 'wrap', gap: 10, margin: '10px 0'}}>
        {[
          {name: '📦 长上下文全塞', tok: longTokPerQ, cost: longCost, color: 'var(--viz-s8)', note: '每次塞整个知识库'},
          {name: '🎯 RAG 只塞几段', tok: ragTokPerQ, cost: ragCost, color: 'var(--viz-s2)', note: '每次只塞检索到的 ~4k'},
          {name: '🔀 混合', tok: hybridTokPerQ, cost: hybridCost, color: 'var(--viz-s1)', note: '检索缩到子集再推理'},
        ].map((x) => (
          <div key={x.name} style={{flex: '1 1 150px', border: `1.5px solid ${x.color}`, borderRadius: 12, padding: '10px 12px'}}>
            <div style={{fontWeight: 700, fontSize: '0.86rem', color: x.color}}>{x.name}</div>
            <div style={{fontSize: '0.74rem', color: 'var(--ifm-color-emphasis-600)', marginBottom: 4}}>{x.note}</div>
            <div style={{fontSize: '0.76rem'}}>每次 {fmtTok(x.tok)} token</div>
            <div style={{fontSize: '1.05rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums'}}>{fmtMoney(x.cost)}</div>
            <div style={{fontSize: '0.72rem', color: 'var(--ifm-color-emphasis-500)'}}>{fmtTok(queries)} 次查询总价</div>
          </div>
        ))}
      </div>

      <StatRow>
        <Stat label="长上下文 / RAG 成本比" value={<span style={{color: ratio > 10 ? 'var(--viz-bad)' : 'inherit'}}>{ratio >= 1 ? `${ratio.toFixed(0)} : 1` : `1 : ${(1 / ratio).toFixed(0)}`}</span>} />
        <Stat label="长上下文能装下吗" value={overflow ? <span style={{color: 'var(--viz-bad)'}}>💥 超窗口</span> : <span style={{color: 'var(--viz-good)'}}>✅ 能</span>} />
      </StatRow>

      {overflow && (
        <Message>
          💥 知识库有 {fmtTok(kb)} token，已经超过了旗舰模型约 100 万 token 的窗口上限（2026）——「全塞进去」这条路直接走不通，必须靠 RAG 先筛。库越大，长上下文越无能为力。
        </Message>
      )}
      {!overflow && ratio > 20 && (
        <Message>
          💸 全塞进去比 RAG 贵 {ratio.toFixed(0)} 倍！知识库越大，这个差距越夸张——因为长上下文<b>每一次查询</b>都要为整个库付费，而 RAG 只为检索到的那几段付费。这还没算延迟（塞得越多越慢）和「读越多越走神」的精度损失。
        </Message>
      )}
      {!overflow && ratio <= 5 && (
        <Message>
          🤔 知识库还小（{fmtTok(kb)} token），全塞和 RAG 成本差不多。<b>这正是长上下文的甜区</b>：库小到能轻松塞下时，直接塞反而更省事——不用维护检索、也不怕检索漏召回。RAG 的价值随知识库变大才凸显出来。
        </Message>
      )}
    </PlaygroundCard>
  );
}
