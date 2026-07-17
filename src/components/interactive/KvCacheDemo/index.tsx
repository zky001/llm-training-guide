import React, {useEffect, useRef, useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message, Stat, StatRow} from '../ui';
import styles from '../playground.module.css';

/**
 * 6.2 节：KV Cache 对比。
 * 左右两个面板生成同一句话：左边每步把整个注意力矩阵重算一遍，
 * 右边缓存历史 K/V、每步只算最后一行。格子数直观对应计算量。
 */

const PROMPT = ['天', '空', '是'];
const GEN = ['蓝', '色', '的', '，', '很', '美', '。'];
const MAX_N = PROMPT.length + GEN.length;

const CELL = 17;
const GAP = 2;

function Grid({n, cached}: {n: number; cached: boolean}) {
  const size = MAX_N * (CELL + GAP);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{width: '100%', maxWidth: 210}}>
      {Array.from({length: n}, (_, i) =>
        Array.from({length: i + 1}, (_, j) => {
          const hot = !cached || i === n - 1; // 无缓存全重算；有缓存只算最后一行
          return (
            <rect
              key={`${i}-${j}`}
              x={j * (CELL + GAP)}
              y={i * (CELL + GAP)}
              width={CELL}
              height={CELL}
              rx={3}
              fill={hot ? 'var(--viz-s6)' : 'var(--viz-s1)'}
              opacity={hot ? 0.95 : 0.4}
            />
          );
        }),
      )}
    </svg>
  );
}

export default function KvCacheDemo() {
  const [step, setStep] = useState(0); // 已生成 token 数
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const n = PROMPT.length + step;

  // 累计计算量（格子数）：无缓存 = Σ 三角形面积；有缓存 = Σ 行长
  let slowTotal = 0;
  let fastTotal = 0;
  for (let s = 1; s <= step; s++) {
    const len = PROMPT.length + s;
    slowTotal += (len * (len + 1)) / 2;
    fastTotal += len;
  }

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
  };

  useEffect(() => () => stop(), []);

  const next = () => setStep((s) => Math.min(GEN.length, s + 1));

  const auto = () => {
    if (running) {
      stop();
      return;
    }
    setRunning(true);
    timer.current = setInterval(() => {
      setStep((s) => {
        if (s >= GEN.length) {
          stop();
          return s;
        }
        return s + 1;
      });
    }, 700);
  };

  const done = step >= GEN.length;
  const text = PROMPT.join('') + GEN.slice(0, step).join('');

  return (
    <PlaygroundCard
      title="KV Cache：不重算昨天的作业"
      subtitle="两边在生成同一句话。每个格子 = 一次注意力计算：🟧 本步新算，🟦 直接取缓存。点「生成下一个 token」，看两边的计算量差距怎么拉开。"
      footer={
        <>
          💡 要点：注意力需要每个新 token 和<b>全部</b>历史 token 打交道，但历史 token 的 K、V 向量根本没变——存起来（KV Cache）就不用每步重算，计算量从「三角形」变成「一行」。代价是显存：缓存随上下文长度线性膨胀，长对话里 KV Cache 常比模型本身还占显存——这正是 6.4 节推理框架要优化的头号对象。
        </>
      }
    >
      <div
        style={{
          padding: '8px 14px',
          borderRadius: 10,
          background: 'var(--ifm-color-emphasis-100)',
          fontSize: '1rem',
          marginBottom: 10,
        }}
      >
        {text}
        <span style={{opacity: 0.5}}>▌</span>
        <span style={{fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-600)', marginLeft: 8}}>
          （提示词 3 个 token + 已生成 {step} 个）
        </span>
      </div>

      <div style={{display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center'}}>
        <div style={{textAlign: 'center', flex: '1 1 200px', maxWidth: 240}}>
          <div style={{fontWeight: 700, fontSize: '0.9rem', marginBottom: 6}}>❌ 无缓存：每步全部重算</div>
          <Grid n={n} cached={false} />
          <div style={{fontSize: '0.84rem', color: 'var(--viz-s6)', fontWeight: 700}}>累计 {slowTotal} 格</div>
        </div>
        <div style={{textAlign: 'center', flex: '1 1 200px', maxWidth: 240}}>
          <div style={{fontWeight: 700, fontSize: '0.9rem', marginBottom: 6}}>✅ 有缓存：只算最后一行</div>
          <Grid n={n} cached />
          <div style={{fontSize: '0.84rem', color: 'var(--viz-s1)', fontWeight: 700}}>
            累计 {fastTotal} 格 · 缓存占用 {n} 行
          </div>
        </div>
      </div>

      <StatRow>
        <Stat label="当前序列长度" value={`${n} tokens`} />
        <Stat label="计算量之比" value={step > 0 ? `${(slowTotal / fastTotal).toFixed(1)} : 1` : '—'} />
        <Stat label="KV 缓存显存" value={<span>随长度<b>线性</b>增长</span>} />
      </StatRow>

      <BtnRow>
        <Btn primary onClick={next} disabled={done || running}>⏭ 生成下一个 token</Btn>
        <Btn primary onClick={auto} disabled={done}>{running ? '⏸ 暂停' : '▶ 自动生成'}</Btn>
        <Btn onClick={() => {stop(); setStep(0);}}>↺ 重置</Btn>
      </BtnRow>

      {done && (
        <Message>
          🏁 这句 10 个 token 的短句，缓存已经省了 {(slowTotal / fastTotal).toFixed(1)} 倍计算。真实对话动辄几千上万 token：n = 10000 时，无缓存每生成一个字要重算约 5000 万格——<b>没有 KV Cache 就没有可用的对话产品</b>。
        </Message>
      )}
    </PlaygroundCard>
  );
}
