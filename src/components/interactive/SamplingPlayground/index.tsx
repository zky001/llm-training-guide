import React, {useMemo, useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message, SliderRow, weightedSample} from '../ui';
import {TINY_CORPUS} from '@site/src/data/tinyCorpus';
import styles from '../playground.module.css';

/**
 * 3.6 节：采样实验台。
 * 概率来自第 1 章同一份语料的字符级 n-gram 统计（上文 2 字，退避到 1 字），
 * 依次应用 temperature → top-k → top-p，直观展示三个旋钮如何重塑分布。
 */

type Table = Map<string, Map<string, number>>;

function buildTable(order: number): Table {
  const t: Table = new Map();
  for (let i = 0; i + order < TINY_CORPUS.length; i++) {
    const ctx = TINY_CORPUS.slice(i, i + order);
    const next = TINY_CORPUS[i + order];
    if (!t.has(ctx)) t.set(ctx, new Map());
    const m = t.get(ctx)!;
    m.set(next, (m.get(next) ?? 0) + 1);
  }
  return t;
}

interface Cand {
  ch: string;
  orig: number; // 原始概率
  final: number; // 三道工序后的概率（被排除 = 0）
  cut: 'none' | 'topk' | 'topp';
}

function getRaw(text: string, tables: Table[]): {ch: string; p: number}[] | null {
  for (let k = Math.min(2, text.length); k >= 1; k--) {
    const m = tables[k - 1].get(text.slice(-k));
    if (m && m.size > 0) {
      const total = [...m.values()].reduce((a, b) => a + b, 0);
      return [...m.entries()]
        .map(([ch, c]) => ({ch, p: c / total}))
        .sort((a, b) => b.p - a.p)
        .slice(0, 10);
    }
  }
  return null;
}

function process(raw: {ch: string; p: number}[], T: number, topK: number, topP: number): Cand[] {
  // ① temperature：p ∝ p^(1/T)
  const powed = raw.map((r) => Math.pow(r.p, 1 / T));
  const psum = powed.reduce((a, b) => a + b, 0);
  const temped = powed.map((v) => v / psum);
  // ② top-k（0 = 关闭）
  const cands: Cand[] = raw.map((r, i) => ({ch: r.ch, orig: r.p, final: temped[i], cut: 'none'}));
  if (topK > 0) {
    cands.forEach((c, i) => {
      if (i >= topK) {
        c.final = 0;
        c.cut = 'topk';
      }
    });
  }
  // ③ top-p：按概率从高到低累加，刚够 p 就截断
  if (topP < 1) {
    const kept = cands.filter((c) => c.final > 0);
    const total = kept.reduce((s, c) => s + c.final, 0);
    let cum = 0;
    let done = false;
    for (const c of kept) {
      if (done) {
        c.final = 0;
        c.cut = 'topp';
      } else {
        cum += c.final / total;
        if (cum >= topP) done = true; // 当前这个保留，之后的全砍
      }
    }
  }
  // 重新归一化
  const fsum = cands.reduce((s, c) => s + c.final, 0);
  cands.forEach((c) => (c.final = fsum > 0 ? c.final / fsum : 0));
  return cands;
}

export default function SamplingPlayground() {
  const tables = useMemo(() => [buildTable(1), buildTable(2)], []);
  const [text, setText] = useState('今天天');
  const [T, setT] = useState(1.0);
  const [topK, setTopK] = useState(0);
  const [topP, setTopP] = useState(1.0);

  const raw = getRaw(text, tables);
  const cands = raw ? process(raw, T, topK, topP) : null;

  const sampleOne = () => {
    if (!cands) return;
    const alive = cands.filter((c) => c.final > 0);
    const i = weightedSample(alive.map((c) => c.final));
    setText((t) => t + alive[i].ch);
  };

  const autoWrite = () => {
    let t = text;
    for (let i = 0; i < 15; i++) {
      const r = getRaw(t, tables);
      if (!r) break;
      const cs = process(r, T, topK, topP).filter((c) => c.final > 0);
      const j = weightedSample(cs.map((c) => c.final));
      t += cs[j].ch;
    }
    setText(t);
  };

  const excluded = cands ? cands.filter((c) => c.cut !== 'none').length : 0;

  return (
    <PlaygroundCard
      title="采样实验台：温度、top-k、top-p 三个旋钮"
      subtitle="灰色空心条 = 模型给出的原始概率（来自第 1 章那个迷你语言模型）；蓝色实心条 = 三道工序处理后的最终概率。被砍掉的候选会划掉。调旋钮，看分布怎么变形。"
      footer={
        <>
          💡 要点：模型给的概率只是「原材料」，真正抽签前还要过三道工序——<b>温度</b>把分布调尖（保守）或调平（狂野），<b>top-k</b> 只留前 k 名，<b>top-p</b> 留下概率累计刚够 p 的「核心圈」。ChatGPT 界面里的 temperature 参数就是这里的 T。工序顺序：温度 → top-k → top-p → 重新归一化 → 掷骰子。
        </>
      }
    >
      <div
        style={{
          padding: '10px 14px',
          border: '1px solid var(--ifm-color-emphasis-300)',
          borderRadius: 10,
          minHeight: 52,
          fontSize: '1.02rem',
          lineHeight: 1.8,
          background: 'var(--ifm-color-emphasis-100)',
          marginBottom: 10,
        }}
      >
        {text}
        <span style={{opacity: 0.5}}>▌</span>
      </div>

      <SliderRow label="温度 T" value={T} min={0.1} max={2.5} step={0.05} onChange={setT} fmt={(v) => v.toFixed(2)} />
      <SliderRow label="top-p" value={topP} min={0.3} max={1} step={0.05} onChange={setTopP} fmt={(v) => (v >= 1 ? '关闭' : v.toFixed(2))} />
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', margin: '6px 0'}}>
        <span style={{fontSize: '0.9rem', fontWeight: 600}}>top-k：</span>
        {[0, 1, 3, 5].map((k) => (
          <label key={k} style={{fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 4}}>
            <input type="radio" name="sp-topk" checked={topK === k} onChange={() => setTopK(k)} />
            {k === 0 ? '关闭' : `前 ${k} 名`}
          </label>
        ))}
      </div>

      {cands ? (
        <div style={{margin: '10px 0'}}>
          {cands.map((c) => (
            <div key={c.ch} className={styles.hbarRow}>
              <span
                className={styles.hbarLabel}
                style={c.cut !== 'none' ? {textDecoration: 'line-through', opacity: 0.45} : {}}
              >
                {c.ch}
              </span>
              <div className={styles.hbarTrack} style={{position: 'relative', cursor: 'default'}}>
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    width: `${c.orig * 100}%`,
                    border: '1.5px dashed var(--viz-muted)',
                    borderRadius: 4,
                    boxSizing: 'border-box',
                  }}
                />
                <div className={styles.hbarFill} style={{width: `${c.final * 100}%`, opacity: c.cut !== 'none' ? 0 : 1}} />
              </div>
              <span className={styles.hbarValue}>
                {c.cut !== 'none' ? '✂️ 出局' : `${(c.final * 100).toFixed(0)}%`}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <Message>😵 这个上文在语料里没出现过，换个开头试试（点重置）。</Message>
      )}

      <BtnRow>
        <Btn primary onClick={sampleOne} disabled={!cands}>🎲 采样一个字</Btn>
        <Btn primary onClick={autoWrite} disabled={!cands}>✍️ 自动写 15 字</Btn>
        <Btn onClick={() => setText('今天天')}>↺ 重置</Btn>
        <Btn onClick={() => setText('我喜欢')}>换开头「我喜欢」</Btn>
      </BtnRow>

      {T <= 0.2 && (
        <Message>
          🧊 T = {T.toFixed(2)}：分布被削得极尖，几乎每次都选第一名——输出稳定但容易翻来覆去说车轱辘话。T → 0 就是「贪心解码」。
        </Message>
      )}
      {T >= 1.8 && (
        <Message>
          🔥 T = {T.toFixed(2)}：分布被抹平，冷门字的机会大增——自动写几句看看，很快就语无伦次。高温 = 创造力和胡说八道一起来。
        </Message>
      )}
      {excluded > 0 && T > 0.2 && T < 1.8 && (
        <Message>
          ✂️ 当前有 {excluded} 个候选被 {topK > 0 && topP < 1 ? 'top-k 和 top-p' : topK > 0 ? 'top-k' : 'top-p'} 砍掉，剩下的重新归一化后再抽签——长尾里的怪词从源头上出局。
        </Message>
      )}
    </PlaygroundCard>
  );
}
