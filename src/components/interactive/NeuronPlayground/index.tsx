import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Message, SliderRow} from '../ui';
import styles from '../playground.module.css';

/**
 * 2.1 节：一个神经元 = 加权求和 + 偏置 + 激活函数。
 * 左侧是流水线示意（带实时数值），右侧是整条输入输出曲线。
 */

type Act = 'linear' | 'relu' | 'sigmoid';

const ACTS: {key: Act; name: string; fn: (z: number) => number}[] = [
  {key: 'linear', name: '无（线性）', fn: (z) => z},
  {key: 'relu', name: 'ReLU', fn: (z) => Math.max(0, z)},
  {key: 'sigmoid', name: 'Sigmoid', fn: (z) => 1 / (1 + Math.exp(-z))},
];

const W = 480;
const H = 260;
const PAD = 30;
const X_MIN = -4;
const X_MAX = 4;
const Y_MIN = -4;
const Y_MAX = 4;

const px = (x: number) => PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * (W - 2 * PAD);
const py = (y: number) =>
  H - PAD - ((Math.max(Y_MIN, Math.min(Y_MAX, y)) - Y_MIN) / (Y_MAX - Y_MIN)) * (H - 2 * PAD);

export default function NeuronPlayground() {
  const [w, setW] = useState(1.5);
  const [b, setB] = useState(-1);
  const [act, setAct] = useState<Act>('relu');
  const [x, setX] = useState(1.0);

  const actFn = ACTS.find((a) => a.key === act)!.fn;
  const z = w * x + b;
  const y = actFn(z);

  const curve: string[] = [];
  for (let i = 0; i <= 160; i++) {
    const cx = X_MIN + (i / 160) * (X_MAX - X_MIN);
    curve.push(`${i === 0 ? 'M' : 'L'}${px(cx).toFixed(1)},${py(actFn(w * cx + b)).toFixed(1)}`);
  }

  const fmt = (v: number) => v.toFixed(2);
  const kinkX = act === 'relu' && w !== 0 ? -b / w : null;

  return (
    <PlaygroundCard
      title="一个神经元的全部人生"
      subtitle="它只会三步：输入乘权重 w → 加偏置 b → 过激活函数。调下面三样东西，看右图这条「输入 → 输出」曲线怎么变。"
      footer={
        <>
          💡 要点：没有激活函数时，神经元只能画直线；换上 ReLU，直线上多了一个<b>折角</b>（w 和 b 决定折在哪、坡多陡）。别小看这个折角——下一节你会看到，亿万个折角拼起来能逼近任何曲线。
        </>
      }
    >
      {/* 流水线示意 */}
      <div className={styles.svgWrap}>
        <svg viewBox="0 0 480 86">
          {[
            {cx: 50, label: '输入 x', value: x.toFixed(2), color: 'var(--viz-s1)'},
            {cx: 175, label: `× w + b`, value: z.toFixed(2), color: 'var(--viz-s6)'},
            {cx: 305, label: '激活函数', value: y.toFixed(2), color: 'var(--viz-s7)'},
            {cx: 430, label: '输出 y', value: y.toFixed(2), color: 'var(--viz-s2)'},
          ].map((n, i, arr) => (
            <g key={n.label}>
              {i < arr.length - 1 && (
                <line x1={n.cx + 38} y1={43} x2={arr[i + 1].cx - 38} y2={43} stroke="var(--viz-axis)" strokeWidth={2} markerEnd="" />
              )}
              <rect x={n.cx - 38} y={20} width={76} height={46} rx={10} fill="none" stroke={n.color} strokeWidth={2} />
              <text x={n.cx} y={38} textAnchor="middle" fontSize={11} fill="var(--viz-ink-2)">{n.label}</text>
              <text x={n.cx} y={57} textAnchor="middle" fontSize={13} fontWeight={700} fill={n.color}>{n.value}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* 输入输出曲线 */}
      <div className={styles.svgWrap}>
        <svg viewBox={`0 0 ${W} ${H}`}>
          {[-4, -2, 0, 2, 4].map((v) => (
            <g key={v}>
              <line x1={px(v)} y1={PAD} x2={px(v)} y2={H - PAD} stroke="var(--viz-grid)" strokeWidth={1} />
              <line x1={PAD} y1={py(v)} x2={W - PAD} y2={py(v)} stroke="var(--viz-grid)" strokeWidth={1} />
              <text x={px(v)} y={H - PAD + 14} textAnchor="middle" fontSize={10} fill="var(--viz-muted)">{v}</text>
              <text x={PAD - 8} y={py(v) + 3} textAnchor="end" fontSize={10} fill="var(--viz-muted)">{v}</text>
            </g>
          ))}
          <line x1={PAD} y1={py(0)} x2={W - PAD} y2={py(0)} stroke="var(--viz-axis)" strokeWidth={1.5} />
          <line x1={px(0)} y1={PAD} x2={px(0)} y2={H - PAD} stroke="var(--viz-axis)" strokeWidth={1.5} />
          <path d={curve.join(' ')} fill="none" stroke="var(--viz-s1)" strokeWidth={2.5} />
          {kinkX !== null && kinkX > X_MIN && kinkX < X_MAX && (
            <g>
              <circle cx={px(kinkX)} cy={py(0)} r={5} fill="none" stroke="var(--viz-s8)" strokeWidth={2} />
              <text x={px(kinkX)} y={py(0) + 20} textAnchor="middle" fontSize={10.5} fill="var(--viz-s8)">折角</text>
            </g>
          )}
          <circle cx={px(x)} cy={py(y)} r={7} fill="var(--viz-s6)" stroke="var(--viz-surface)" strokeWidth={2} />
          <text x={W - PAD} y={PAD - 6} textAnchor="end" fontSize={11} fill="var(--viz-ink-2)">y（输出）随 x（输入）的变化</text>
        </svg>
      </div>

      <div style={{display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', margin: '8px 0'}}>
        <span style={{fontSize: '0.9rem', fontWeight: 600}}>激活函数：</span>
        {ACTS.map((a) => (
          <label key={a.key} style={{fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 4}}>
            <input type="radio" name="neuron-act" checked={act === a.key} onChange={() => setAct(a.key)} />
            {a.name}
          </label>
        ))}
      </div>

      <SliderRow label="权重 w" value={w} min={-3} max={3} step={0.05} onChange={setW} fmt={fmt} />
      <SliderRow label="偏置 b" value={b} min={-3} max={3} step={0.05} onChange={setB} fmt={fmt} />
      <SliderRow label="测试输入 x" value={x} min={-4} max={4} step={0.05} onChange={setX} fmt={fmt} />

      {act === 'linear' && (
        <Message>
          📏 现在它只是一条直线：无论 w、b 怎么调，都画不出任何弯曲。这就是为什么<b>激活函数不可或缺</b>——没有它，叠一万层网络也还是一条直线（0.2 节讲过：矩阵连乘还是矩阵）。
        </Message>
      )}
      {act === 'relu' && (
        <Message>
          📐 ReLU：z ≤ 0 时输出一律为 0（神经元「关闭」），z &gt; 0 时原样放行（「开启」）。移动 w 和 b，折角的位置和坡度都归你管。
        </Message>
      )}
      {act === 'sigmoid' && (
        <Message>
          🎚️ Sigmoid 把任何数压进 0 ~ 1，像一个平滑的开关，适合表示「概率」。早年的网络爱用它，现在深层网络更爱 ReLU 一族（原因在本节深入层）。
        </Message>
      )}
    </PlaygroundCard>
  );
}
