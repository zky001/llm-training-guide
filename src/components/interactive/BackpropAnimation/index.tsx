import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message, Stat, StatRow} from '../ui';
import styles from '../playground.module.css';

/**
 * 2.5 节：逐步反向传播。
 * 最小可运转网络：x →(×w₁)→ z →ReLU→ a →(×w₂)→ ŷ，损失 L=(ŷ−y)²。
 * 固定 x=2, y=1，初始 w₁=0.4, w₂=0.5, 学习率 0.1。
 * 一步步点出 5 个梯度，应用更新后可再来一轮，亲眼看损失逐轮下降。
 */

const X = 2;
const Y = 1;
const ETA = 0.1;

const fmt = (v: number) => (Object.is(v, -0) ? '0.00' : v.toFixed(2));

export default function BackpropAnimation() {
  const [w1, setW1] = useState(0.4);
  const [w2, setW2] = useState(0.5);
  const [step, setStep] = useState(-1); // -1=还没开始反向；0..4=已完成的步
  const [round, setRound] = useState(1);
  const [history, setHistory] = useState<number[]>([]);

  // 前向
  const z = w1 * X;
  const a = Math.max(0, z);
  const yhat = a * w2;
  const L = (yhat - Y) ** 2;

  // 反向（全部先算好，按 step 逐个揭示）
  const gYhat = 2 * (yhat - Y);
  const gW2 = gYhat * a;
  const gA = gYhat * w2;
  const gZ = z > 0 ? gA : 0;
  const gW1 = gZ * X;

  const FORMULAS = [
    {text: `∂L/∂ŷ = 2 × (ŷ − y) = 2 × (${fmt(yhat)} − 1) = ${fmt(gYhat)}`, hint: '终点站自己的导数，反向传播从这里出发'},
    {text: `∂L/∂w₂ = ∂L/∂ŷ × a = ${fmt(gYhat)} × ${fmt(a)} = ${fmt(gW2)}`, hint: '上游梯度 × 本地导数（ŷ = a·w₂ 对 w₂ 的导数是 a）'},
    {text: `∂L/∂a = ∂L/∂ŷ × w₂ = ${fmt(gYhat)} × ${fmt(w2)} = ${fmt(gA)}`, hint: '上游梯度 × 本地导数（ŷ = a·w₂ 对 a 的导数是 w₂）'},
    {text: `∂L/∂z = ∂L/∂a × ReLU′(z) = ${fmt(gA)} × ${z > 0 ? 1 : 0} = ${fmt(gZ)}`, hint: `上游梯度 × 本地导数（z = ${fmt(z)} ${z > 0 ? '> 0，ReLU 导数为 1' : '≤ 0，ReLU 关闭，导数为 0'}）`},
    {text: `∂L/∂w₁ = ∂L/∂z × x = ${fmt(gZ)} × 2 = ${fmt(gW1)}`, hint: '上游梯度 × 本地导数（z = x·w₁ 对 w₁ 的导数是 x）'},
  ];

  const nodes = [
    {cx: 42, label: 'x', value: fmt(X), grad: null as string | null, gradAt: 99},
    {cx: 145, label: 'z = x·w₁', value: fmt(z), grad: fmt(gZ), gradAt: 3},
    {cx: 248, label: 'a = ReLU(z)', value: fmt(a), grad: fmt(gA), gradAt: 2},
    {cx: 351, label: 'ŷ = a·w₂', value: fmt(yhat), grad: fmt(gYhat), gradAt: 0},
    {cx: 448, label: 'L = (ŷ−y)²', value: fmt(L), grad: '1', gradAt: 99},
  ];

  // 当前步高亮的节点下标（反向从右往左）
  const activeNode = step === 0 ? 3 : step === 2 ? 2 : step === 3 ? 1 : -1;
  const activeEdgeW1 = step === 4;
  const activeEdgeW2 = step === 1;
  const done = step >= 4;

  const nextStep = () => setStep((s) => Math.min(4, s + 1));

  const applyUpdate = () => {
    setHistory((h) => [...h, L]);
    setW1((v) => v - ETA * gW1);
    setW2((v) => v - ETA * gW2);
    setRound((r) => r + 1);
    setStep(-1);
  };

  const resetAll = () => {
    setW1(0.4);
    setW2(0.5);
    setStep(-1);
    setRound(1);
    setHistory([]);
  };

  return (
    <PlaygroundCard
      title="反向传播流水线：梯度从右往左传"
      subtitle="蓝色是前向计算的数值（已算好），点「下一步」看梯度（红色）如何从损失出发、一站一站往回传。走完 5 步后应用更新，再来一轮，看损失一轮比一轮低。"
      footer={
        <>
          💡 要点：每一步都是同一个动作——<b>下游梯度 = 上游梯度 × 本地导数</b>（链式法则）。不管网络多大，反向传播就是把这个动作沿计算图重复亿万次；一次反向扫描就能拿到<b>所有</b>参数的梯度，这是深度学习在计算上可行的根本原因。
        </>
      }
    >
      <div className={styles.svgWrap}>
        <svg viewBox="0 0 490 150">
          {/* 连线与权重标签 */}
          {nodes.slice(0, -1).map((n, i) => {
            const next = nodes[i + 1];
            const isW1 = i === 0;
            const isW2 = i === 2;
            const hot = (isW1 && activeEdgeW1) || (isW2 && activeEdgeW2);
            return (
              <g key={i}>
                <line
                  x1={n.cx + 40} y1={62} x2={next.cx - 40} y2={62}
                  stroke={hot ? 'var(--viz-s8)' : 'var(--viz-axis)'}
                  strokeWidth={hot ? 3 : 2}
                />
                {isW1 && (
                  <text x={(n.cx + next.cx) / 2} y={52} textAnchor="middle" fontSize={11} fontWeight={700} fill={hot ? 'var(--viz-s8)' : 'var(--viz-ink-2)'}>
                    w₁ = {fmt(w1)}
                  </text>
                )}
                {isW2 && (
                  <text x={(n.cx + next.cx) / 2} y={52} textAnchor="middle" fontSize={11} fontWeight={700} fill={hot ? 'var(--viz-s8)' : 'var(--viz-ink-2)'}>
                    w₂ = {fmt(w2)}
                  </text>
                )}
                {/* 梯度对 w 的标注 */}
                {isW1 && step >= 4 && (
                  <text x={(n.cx + next.cx) / 2} y={80} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--viz-s8)">
                    ∂L/∂w₁={fmt(gW1)}
                  </text>
                )}
                {isW2 && step >= 1 && (
                  <text x={(n.cx + next.cx) / 2} y={80} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--viz-s8)">
                    ∂L/∂w₂={fmt(gW2)}
                  </text>
                )}
              </g>
            );
          })}

          {/* 节点 */}
          {nodes.map((n, i) => (
            <g key={n.label}>
              <rect
                x={n.cx - 42} y={38} width={84} height={48} rx={10}
                fill="none"
                stroke={i === activeNode ? 'var(--viz-s8)' : 'var(--viz-s1)'}
                strokeWidth={i === activeNode ? 3 : 2}
              />
              <text x={n.cx} y={55} textAnchor="middle" fontSize={10} fill="var(--viz-ink-2)">{n.label}</text>
              <text x={n.cx} y={74} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--viz-s1)">{n.value}</text>
              {n.grad !== null && step >= n.gradAt && n.gradAt !== 99 && (
                <text x={n.cx} y={104} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--viz-s8)">
                  ∂L/∂{['', 'z', 'a', 'ŷ', ''][i]}={n.grad}
                </text>
              )}
            </g>
          ))}
          <text x={448} y={24} textAnchor="middle" fontSize={10.5} fill="var(--viz-muted)">目标 y = 1</text>
          <text x={42} y={120} fontSize={10.5} fill="var(--viz-muted)">← 梯度流动方向（反向）</text>
        </svg>
      </div>

      {step >= 0 && (
        <div
          style={{
            padding: '10px 14px',
            border: '1.5px solid var(--viz-s8)',
            borderRadius: 10,
            fontFamily: 'var(--ifm-font-family-monospace)',
            fontSize: '0.92rem',
            margin: '8px 0',
          }}
        >
          <b>第 {step + 1}/5 步：</b>{FORMULAS[step].text}
          <div style={{fontFamily: 'var(--ifm-font-family-base)', fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-600)', marginTop: 4}}>
            {FORMULAS[step].hint}
          </div>
        </div>
      )}

      <StatRow>
        <Stat label="当前轮次" value={`第 ${round} 轮`} />
        <Stat label="当前损失 L" value={<span style={{color: L < 0.05 ? 'var(--viz-good)' : 'inherit'}}>{L.toFixed(3)}</span>} />
      </StatRow>

      <BtnRow>
        <Btn primary onClick={nextStep} disabled={done}>
          {step === -1 ? '▶ 开始反向传播' : done ? '5 步已走完' : '👣 下一步'}
        </Btn>
        <Btn primary onClick={applyUpdate} disabled={!done}>
          ⚙️ 应用更新：w ← w − 0.1 × 梯度
        </Btn>
        <Btn onClick={resetAll}>↺ 全部重置</Btn>
      </BtnRow>

      {history.length > 0 && (
        <div style={{fontSize: '0.88rem', lineHeight: 2}}>
          损失变化：
          {[...history, L].map((l, i) => (
            <span key={i} className={styles.chip} style={{borderColor: 'var(--viz-s1)'}}>
              第{i + 1}轮 {l.toFixed(3)}
            </span>
          ))}
          {history.length >= 2 && <b style={{color: 'var(--viz-good)'}}> ↓ 一轮比一轮低</b>}
        </div>
      )}
      {L < 0.02 && (
        <Message>
          🎉 损失已接近 0：模型的输出 ŷ = {fmt(yhat)} 几乎等于目标 y = 1。你刚刚手动完成了{round - 1} 轮「前向 → 反向 → 更新」——真实训练就是把这个循环跑几百万次。
        </Message>
      )}
    </PlaygroundCard>
  );
}
