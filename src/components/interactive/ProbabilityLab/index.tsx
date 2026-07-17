import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message, weightedSample} from '../ui';
import styles from '../playground.module.css';

/**
 * 0.3 节：概率实验室。
 * A：灌铅骰子——掷得越多，频率越接近真实概率（大数定律）。
 * B：语言骰子——同一个开头，每次采样结果不同，预演语言模型的生成方式。
 */

const TRUE_P = [0.25, 0.1, 0.1, 0.15, 0.1, 0.3];
const FACES = ['⚀ 1', '⚁ 2', '⚂ 3', '⚃ 4', '⚄ 5', '⚅ 6'];

const PREFIX = '今天天气真';
const NEXT_WORDS = [
  {w: '好', p: 0.5},
  {w: '不错', p: 0.18},
  {w: '冷', p: 0.12},
  {w: '差', p: 0.08},
  {w: '热', p: 0.07},
  {w: '蓝', p: 0.05},
];

export default function ProbabilityLab() {
  // ---- A：骰子 ----
  const [counts, setCounts] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [showTruth, setShowTruth] = useState(false);
  const total = counts.reduce((a, b) => a + b, 0);

  const roll = (n: number) => {
    setCounts((prev) => {
      const next = [...prev];
      for (let i = 0; i < n; i++) next[weightedSample(TRUE_P)]++;
      return next;
    });
  };

  // ---- B：语言骰子 ----
  const [history, setHistory] = useState<string[]>([]);
  const wordCounts = NEXT_WORDS.map((nw) => history.filter((h) => h === nw.w).length);

  const sampleWord = () => {
    const i = weightedSample(NEXT_WORDS.map((nw) => nw.p));
    setHistory((prev) => [...prev, NEXT_WORDS[i].w].slice(-24));
  };

  const BAR_H = 120;

  return (
    <PlaygroundCard
      title="概率实验室：从骰子到「语言骰子」"
      subtitle="第一步：掷一枚被灌了铅的骰子，猜猜每一面的真实概率；第二步：掷一枚「语言骰子」，看语言模型是怎么说话的。"
      footer={
        <>
          💡 要点：掷得越多，频率越接近真实概率——所以模型要用<b>海量</b>数据才能把概率估准。而语言模型生成文字，本质就是不断掷「下一个词」的特制骰子：这就是为什么同一个问题，大模型每次的回答可能不一样。
        </>
      }
    >
      <h4 style={{marginBottom: 4}}>🎲 实验 A：这枚骰子被动了手脚</h4>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 8, height: BAR_H + 40, padding: '0 4px'}}>
        {counts.map((cnt, i) => {
          const freq = total > 0 ? cnt / total : 0;
          return (
            <div key={i} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2}}>
              <div style={{fontSize: '0.72rem', color: 'var(--ifm-color-emphasis-600)', fontVariantNumeric: 'tabular-nums'}}>
                {total > 0 ? `${(freq * 100).toFixed(1)}%` : '—'}
              </div>
              <div style={{position: 'relative', width: '100%', maxWidth: 52, height: BAR_H, background: 'var(--ifm-color-emphasis-100)', borderRadius: 6, overflow: 'hidden'}}>
                <div
                  style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: `${freq * 100 * (BAR_H / 40) > BAR_H ? 100 : freq * 100 * (100 / 40)}%`,
                    background: 'var(--viz-s1)', borderRadius: '4px 4px 0 0',
                    transition: 'height 0.25s ease',
                  }}
                />
                {showTruth && (
                  <div
                    style={{
                      position: 'absolute', left: 0, right: 0,
                      bottom: `${TRUE_P[i] * 100 * (100 / 40)}%`,
                      borderTop: '2.5px dashed var(--viz-s6)',
                    }}
                    title={`真实概率 ${(TRUE_P[i] * 100).toFixed(0)}%`}
                  />
                )}
              </div>
              <div style={{fontSize: '0.85rem', fontWeight: 600}}>{FACES[i]}</div>
            </div>
          );
        })}
      </div>
      <BtnRow>
        <Btn primary onClick={() => roll(1)}>掷 1 次</Btn>
        <Btn primary onClick={() => roll(100)}>掷 100 次</Btn>
        <Btn primary onClick={() => roll(10000)}>掷 10000 次</Btn>
        <Btn onClick={() => setCounts([0, 0, 0, 0, 0, 0])}>清零</Btn>
        <label style={{fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 4}}>
          <input type="checkbox" checked={showTruth} onChange={(e) => setShowTruth(e.target.checked)} />
          显示真实概率（橙色虚线）
        </label>
      </BtnRow>
      <div style={{fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-700)'}}>已掷 {total} 次</div>
      {total >= 5000 && (
        <Message>
          📈 掷了几千次之后，蓝色频率条几乎贴住了橙色虚线——<b>数据越多，估计的概率越准</b>。这就是大模型需要「海量文本」的根本原因。
        </Message>
      )}

      <hr style={{margin: '18px 0 14px', border: 'none', borderTop: '1px dashed var(--ifm-color-emphasis-300)'}} />

      <h4 style={{marginBottom: 4}}>🗣️ 实验 B：掷一枚「语言骰子」</h4>
      <p style={{fontSize: '0.9rem', marginBottom: 8}}>
        给定开头「<b>{PREFIX}</b>」，语言模型给每个候选词分配了概率——这就是它的骰子：
      </p>
      {NEXT_WORDS.map((nw, i) => (
        <div key={nw.w} className={styles.hbarRow}>
          <span className={styles.hbarLabel}>{nw.w}</span>
          <div className={styles.hbarTrack} style={{cursor: 'default'}}>
            <div className={styles.hbarFill} style={{width: `${nw.p * 100}%`}} />
          </div>
          <span className={styles.hbarValue}>
            {(nw.p * 100).toFixed(0)}%{wordCounts[i] > 0 ? ` ·中${wordCounts[i]}次` : ''}
          </span>
        </div>
      ))}
      <BtnRow>
        <Btn primary onClick={sampleWord}>🎲 掷一次，生成一个词</Btn>
        <Btn onClick={() => setHistory([])}>清空</Btn>
      </BtnRow>
      {history.length > 0 && (
        <div style={{lineHeight: 2}}>
          {history.map((h, i) => (
            <span key={i} className={styles.chip} style={{borderColor: 'var(--viz-s1)'}}>
              {PREFIX}
              <b>{h}</b>
            </span>
          ))}
        </div>
      )}
      {history.length >= 8 && (
        <Message>
          🎯 同一个开头，结果却不总相同：概率大的「好」出现最多，但小概率的词偶尔也会中。ChatGPT 每次回答不一样，原因就在这里。
        </Message>
      )}
    </PlaygroundCard>
  );
}
