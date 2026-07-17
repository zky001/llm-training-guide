import React, {useMemo, useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Message, SliderRow, Stat, StatRow} from '../ui';
import styles from '../playground.module.css';

/**
 * 2.2 节：ReLU 积木——k 个 ReLU 神经元叠加逼近一条弯曲的目标函数。
 * 输出层权重用最小二乘闭式解（岭回归）求出，即时、确定、无需训练动画，
 * 专注传达「一个神经元 = 一个折角，折角越多越贴合」。
 */

const target = (x: number) => Math.sin(1.5 * x) + 0.3 * x;

const X_MIN = -4;
const X_MAX = 4;
const N_SAMPLE = 81;

/** 解线性方程组 Ax = b（高斯消元 + 部分主元），矩阵规模 ≤ 17，性能无忧 */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    }
    [M[col], M[piv]] = [M[piv], M[col]];
    const d = M[col][col] || 1e-12;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / d;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map((row, i) => row[n] / (row[i] || 1e-12));
}

interface Fit {
  knots: number[];
  coef: number[]; // [b0, v_1..v_k]
  mse: number;
}

function fitWithK(k: number): Fit {
  const knots = Array.from({length: k}, (_, i) => X_MIN + ((i + 0.5) / k) * (X_MAX - X_MIN));
  const xs = Array.from({length: N_SAMPLE}, (_, i) => X_MIN + (i / (N_SAMPLE - 1)) * (X_MAX - X_MIN));
  const ys = xs.map(target);
  // 设计矩阵：常数项 + k 个 ReLU(x - c_i)
  const phi = (x: number) => [1, ...knots.map((c) => Math.max(0, x - c))];
  const dim = k + 1;
  const AtA = Array.from({length: dim}, () => new Array(dim).fill(0));
  const Atb = new Array(dim).fill(0);
  xs.forEach((x, i) => {
    const row = phi(x);
    for (let a = 0; a < dim; a++) {
      Atb[a] += row[a] * ys[i];
      for (let b2 = 0; b2 < dim; b2++) AtA[a][b2] += row[a] * row[b2];
    }
  });
  for (let a = 0; a < dim; a++) AtA[a][a] += 1e-6; // 岭正则，防奇异
  const coef = solve(AtA, Atb);
  const pred = (x: number) => phi(x).reduce((s, v, i) => s + v * coef[i], 0);
  const mse = xs.reduce((s, x, i) => s + (pred(x) - ys[i]) ** 2, 0) / xs.length;
  return {knots, coef, mse};
}

const W = 480;
const H = 300;
const PAD = 30;
const Y_MIN = -2.6;
const Y_MAX = 2.6;
const px = (x: number) => PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * (W - 2 * PAD);
const py = (y: number) =>
  H - PAD - ((Math.max(Y_MIN, Math.min(Y_MAX, y)) - Y_MIN) / (Y_MAX - Y_MIN)) * (H - 2 * PAD);

function pathOf(fn: (x: number) => number): string {
  const pts: string[] = [];
  for (let i = 0; i <= 160; i++) {
    const x = X_MIN + (i / 160) * (X_MAX - X_MIN);
    pts.push(`${i === 0 ? 'M' : 'L'}${px(x).toFixed(1)},${py(fn(x)).toFixed(1)}`);
  }
  return pts.join(' ');
}

export default function ReluStack() {
  const [k, setK] = useState(2);
  const [showParts, setShowParts] = useState(false);

  const fit = useMemo(() => fitWithK(k), [k]);
  const predict = (x: number) =>
    fit.coef[0] + fit.knots.reduce((s, c, i) => s + fit.coef[i + 1] * Math.max(0, x - c), 0);

  return (
    <PlaygroundCard
      title="ReLU 积木：折角多了，直线就成了曲线"
      subtitle="灰色虚线是我们想逼近的目标曲线。每个 ReLU 神经元贡献一个折角，输出层负责给它们分配权重再加总。拖动滑块增加神经元数量，看折线一步步贴上曲线。"
      footer={
        <>
          💡 要点：一个神经元 = 一个折角；神经元够多，折线可以贴合<b>任何</b>连续曲线——这就是「万能逼近」的直觉。大模型拟合的不是这条 1 维小曲线，而是「上文 → 下一个词概率」这个高维大函数，用的是同一套积木。
        </>
      }
    >
      <div className={styles.svgWrap}>
        <svg viewBox={`0 0 ${W} ${H}`}>
          {[-4, -2, 0, 2, 4].map((v) => (
            <g key={v}>
              <line x1={px(v)} y1={PAD} x2={px(v)} y2={H - PAD} stroke="var(--viz-grid)" strokeWidth={1} />
              <text x={px(v)} y={H - PAD + 14} textAnchor="middle" fontSize={10} fill="var(--viz-muted)">{v}</text>
            </g>
          ))}
          {[-2, -1, 0, 1, 2].map((v) => (
            <line key={`h${v}`} x1={PAD} y1={py(v)} x2={W - PAD} y2={py(v)} stroke="var(--viz-grid)" strokeWidth={1} />
          ))}
          <line x1={PAD} y1={py(0)} x2={W - PAD} y2={py(0)} stroke="var(--viz-axis)" strokeWidth={1.5} />

          {/* 每个神经元的单独贡献 */}
          {showParts &&
            fit.knots.map((c, i) => (
              <path
                key={i}
                d={pathOf((x) => fit.coef[i + 1] * Math.max(0, x - c))}
                fill="none"
                stroke="var(--viz-s5)"
                strokeWidth={1}
                opacity={0.55}
              />
            ))}

          {/* 目标曲线与拟合折线 */}
          <path d={pathOf(target)} fill="none" stroke="var(--viz-muted)" strokeWidth={2} strokeDasharray="6 4" />
          <path d={pathOf(predict)} fill="none" stroke="var(--viz-s6)" strokeWidth={2.5} />

          {/* 折角位置标记 */}
          {fit.knots.map((c, i) => (
            <circle key={`k${i}`} cx={px(c)} cy={py(predict(c))} r={4} fill="var(--viz-s6)" stroke="var(--viz-surface)" strokeWidth={1.5} />
          ))}
        </svg>
      </div>

      <SliderRow label="ReLU 神经元数" value={k} min={1} max={16} step={1} onChange={setK} fmt={(v) => `${v} 个`} />

      <StatRow>
        <Stat label="折角数量" value={k} />
        <Stat
          label="平均误差（MSE）"
          value={
            <span style={{color: fit.mse < 0.01 ? 'var(--viz-good)' : 'inherit'}}>{fit.mse.toFixed(4)}</span>
          }
        />
      </StatRow>

      <label style={{fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6}}>
        <input type="checkbox" checked={showParts} onChange={(e) => setShowParts(e.target.checked)} />
        显示每个神经元的单独贡献（浅绿细线）
      </label>

      {k <= 2 && (
        <Message>
          🧱 只有 {k} 个折角，折线怎么摆都贴不住波浪——模型「容量」不够，这叫<b>欠拟合</b>。往右拖，给它更多积木。
        </Message>
      )}
      {k >= 12 && (
        <Message>
          ✨ {k} 个折角已经几乎完美贴合。GPT 级别的网络里有<b>数以亿计</b>的这种折角单元（2025 年的旗舰模型是千亿量级参数），拼出的是几千维空间里的超级折面。
        </Message>
      )}
    </PlaygroundCard>
  );
}
