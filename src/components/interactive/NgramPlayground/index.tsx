import React, {useMemo, useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message, weightedSample} from '../ui';
import {TINY_CORPUS} from '@site/src/data/tinyCorpus';
import styles from '../playground.module.css';

/**
 * 1.1 节：一个真的能跑的迷你语言模型（字符级 n-gram）。
 * 在共享的小语料上统计「上文 → 下一个字」的频率，
 * 让读者亲眼看到「预测下一个词」是怎么回事，以及上文长度的影响。
 */

const CORPUS = TINY_CORPUS;

type CountTable = Map<string, Map<string, number>>;

function buildTable(order: number): CountTable {
  const table: CountTable = new Map();
  for (let i = 0; i + order < CORPUS.length; i++) {
    const ctx = CORPUS.slice(i, i + order);
    const next = CORPUS[i + order];
    if (!table.has(ctx)) table.set(ctx, new Map());
    const m = table.get(ctx)!;
    m.set(next, (m.get(next) ?? 0) + 1);
  }
  return table;
}

interface Candidates {
  items: {ch: string; p: number; count: number}[];
  usedOrder: number;
}

function getCandidates(text: string, order: number, tables: CountTable[]): Candidates | null {
  // 从设定的上文长度开始，找不到就退回更短的上文（教「数据稀疏」）
  for (let k = order; k >= 1; k--) {
    if (text.length < k) continue;
    const ctx = text.slice(-k);
    const m = tables[k - 1].get(ctx);
    if (m && m.size > 0) {
      const total = [...m.values()].reduce((a, b) => a + b, 0);
      const items = [...m.entries()]
        .map(([ch, count]) => ({ch, count, p: count / total}))
        .sort((a, b) => b.p - a.p)
        .slice(0, 8);
      return {items, usedOrder: k};
    }
  }
  return null;
}

export default function NgramPlayground() {
  const [order, setOrder] = useState(2);
  const [text, setText] = useState('今天');
  const tables = useMemo(() => [buildTable(1), buildTable(2)], []);

  const cands = getCandidates(text, order, tables);
  const fellBack = cands !== null && cands.usedOrder < Math.min(order, text.length);

  const append = (ch: string) => setText((t) => t + ch);

  const sampleOne = () => {
    if (!cands) return;
    const i = weightedSample(cands.items.map((c) => c.p));
    append(cands.items[i].ch);
  };

  const greedyOne = () => {
    if (!cands) return;
    append(cands.items[0].ch);
  };

  const autoWrite = () => {
    let t = text;
    for (let i = 0; i < 20; i++) {
      const c = getCandidates(t, order, tables);
      if (!c) break;
      const j = weightedSample(c.items.map((it) => it.p));
      t += c.items[j].ch;
    }
    setText(t);
  };

  return (
    <PlaygroundCard
      title="迷你语言模型：它真的在预测下一个字"
      subtitle="这个模型刚刚「读」完下面那份 40 句话的小语料，学到的全部本事就是一张「上文 → 下一个字」的频率表。点击候选字帮它写下去，或让它自动写。"
      footer={
        <>
          💡 要点：这个只会数数的小模型和 GPT 干的是<b>同一件事</b>——根据上文给下一个字（token）分配概率。差别在于：它靠死记硬背查表，看 1~2 个字的上文；GPT 用几千亿参数的神经网络「理解」几万字的上文。把「上文长度」从 1 调到 2，再对比生成质量，你就能体会为什么「看得远」如此重要。
        </>
      }
    >
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 10}}>
        <span style={{fontSize: '0.9rem', fontWeight: 600}}>模型看多长的上文：</span>
        {[1, 2].map((k) => (
          <label key={k} style={{fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 4}}>
            <input type="radio" name="ngram-order" checked={order === k} onChange={() => setOrder(k)} />
            {k} 个字
          </label>
        ))}
      </div>

      <div
        style={{
          padding: '10px 14px',
          border: '1px solid var(--ifm-color-emphasis-300)',
          borderRadius: 10,
          minHeight: 56,
          fontSize: '1.02rem',
          lineHeight: 1.8,
          background: 'var(--ifm-color-emphasis-100)',
          marginBottom: 10,
        }}
      >
        {text}
        <span style={{opacity: 0.5}}>▌</span>
      </div>

      <div style={{fontSize: '0.88rem', fontWeight: 600, marginBottom: 4}}>
        模型说：「{text.slice(-(cands?.usedOrder ?? 1))}」后面出现过这些字 ↓（点击可选用）
      </div>
      {fellBack && (
        <Message>
          ⚠️ 语料里从没出现过「{text.slice(-order)}」这个 {order} 字上文——模型只好退回用更短的上文来猜。上文越长组合越多、越容易「没见过」，这就是老式 n-gram 模型的<b>数据稀疏</b>难题。
        </Message>
      )}
      {cands ? (
        cands.items.map((c) => (
          <div key={c.ch} className={styles.hbarRow} onClick={() => append(c.ch)} role="button" title={`选用「${c.ch}」`}>
            <span className={styles.hbarLabel}>{c.ch}</span>
            <div className={styles.hbarTrack}>
              <div className={styles.hbarFill} style={{width: `${c.p * 100}%`}} />
            </div>
            <span className={styles.hbarValue}>{(c.p * 100).toFixed(0)}% ·{c.count}次</span>
          </div>
        ))
      ) : (
        <Message>😵 连退回 1 个字的上文都没见过，模型彻底没辙了。点「重置」换个开头吧。</Message>
      )}

      <BtnRow>
        <Btn primary onClick={sampleOne} disabled={!cands}>🎲 按概率抽一个字</Btn>
        <Btn primary onClick={greedyOne} disabled={!cands}>⭐ 总选概率最大的</Btn>
        <Btn primary onClick={autoWrite} disabled={!cands}>✍️ 自动续写 20 字</Btn>
        <Btn onClick={() => setText('今天')}>↺ 重置</Btn>
        <Btn onClick={() => setText('我喜欢')}>换开头「我喜欢」</Btn>
      </BtnRow>

      <details style={{marginTop: 8}}>
        <summary style={{cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600}}>
          📚 查看它读过的全部语料（这就是它的整个世界）
        </summary>
        <p style={{fontSize: '0.85rem', lineHeight: 1.9, marginTop: 8, color: 'var(--ifm-color-emphasis-700)'}}>{CORPUS}</p>
      </details>
    </PlaygroundCard>
  );
}
