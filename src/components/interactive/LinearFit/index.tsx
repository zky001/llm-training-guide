import React, {useEffect, useMemo, useRef, useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message, SliderRow, Stat, StatRow, svgPoint} from '../ui';
import styles from '../playground.module.css';

/**
 * 0.1 节：拖点拟合实验。
 * 用户先手动调 w、b 感受「调参数」，再点「让机器自动学」看参数自动收敛。
 * 「自动学」演示为向最小二乘最优解的平滑过渡（求解方法见该节深入层）。
 */

interface Pt {
  x: number; // 学习时间 0~10 小时
  y: number; // 考试分数 0~100
}

const INIT_POINTS: Pt[] = [
  {x: 0.5, y: 29}, {x: 1, y: 33}, {x: 2, y: 35}, {x: 2.5, y: 44},
  {x: 3.5, y: 42}, {x: 4, y: 52}, {x: 5, y: 57}, {x: 6, y: 58},
  {x: 7, y: 70}, {x: 7.5, y: 64}, {x: 8.5, y: 78}, {x: 9.5, y: 80},
];

const W = 480;
const H = 300;
const PAD_L = 46;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 38;

const px = (x: number) => PAD_L + (x / 10) * (W - PAD_L - PAD_R);
const py = (y: number) => H - PAD_B - (y / 100) * (H - PAD_T - PAD_B);
const invX = (p: number) => ((p - PAD_L) / (W - PAD_L - PAD_R)) * 10;
const invY = (p: number) => ((H - PAD_B - p) / (H - PAD_T - PAD_B)) * 100;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function leastSquares(pts: Pt[]): {w: number; b: number} {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  let cov = 0;
  let varx = 0;
  for (const p of pts) {
    cov += (p.x - mx) * (p.y - my);
    varx += (p.x - mx) ** 2;
  }
  const w = varx === 0 ? 0 : cov / varx;
  return {w, b: my - w * mx};
}

function rmse(pts: Pt[], w: number, b: number): number {
  const se = pts.reduce((s, p) => s + (p.y - (w * p.x + b)) ** 2, 0);
  return Math.sqrt(se / pts.length);
}

export default function LinearFit() {
  const [points, setPoints] = useState<Pt[]>(INIT_POINTS);
  const [w, setW] = useState(1.5);
  const [b, setB] = useState(5);
  const [showRes, setShowRes] = useState(true);
  const [learned, setLearned] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragIdx = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => stopAnim(), []);

  const stopAnim = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  const err = useMemo(() => rmse(points, w, b), [points, w, b]);

  const autoLearn = () => {
    stopAnim();
    const target = leastSquares(points);
    const w0 = w;
    const b0 = b;
    let t = 0;
    timer.current = setInterval(() => {
      t += 1;
      const raw = t / 50;
      const k = 1 - (1 - raw) ** 2; // 先快后慢，模拟损失快速下降再收敛
      setW(w0 + (target.w - w0) * k);
      setB(b0 + (target.b - b0) * k);
      if (t >= 50) {
        stopAnim();
        setLearned(true);
      }
    }, 24);
  };

  const reset = () => {
    stopAnim();
    setPoints(INIT_POINTS);
    setW(1.5);
    setB(5);
    setLearned(false);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragIdx.current === null || !svgRef.current) return;
    const {x, y} = svgPoint(svgRef.current, e);
    const dx = clamp(invX(x), 0, 10);
    const dy = clamp(invY(y), 0, 100);
    setPoints((prev) =>
      prev.map((p, i) => (i === dragIdx.current ? {x: dx, y: dy} : p)),
    );
  };

  const manualSet = (setter: (v: number) => void) => (v: number) => {
    stopAnim();
    setLearned(false);
    setter(v);
  };

  const goodFit = err < 6;

  return (
    <PlaygroundCard
      title="拖点拟合：亲手当一次「模型」"
      subtitle="蓝点是 12 名学生的（每天学习时间 → 考试分数）数据。拖动滑块调整直线，让平均偏差尽量小；也可以直接拖动蓝点改数据。"
      footer={
        <>
          💡 要点：这条直线就是一个只有 2 个参数（w 和 b）的「模型」。你刚才手动调参数，而<b>机器学习就是让程序自动完成这个调参过程</b>。大模型的原理相同——只是参数从 2 个变成了几千亿个。
        </>
      }
    >
      <div className={styles.svgWrap}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          onPointerMove={onPointerMove}
          onPointerUp={() => (dragIdx.current = null)}
          onPointerLeave={() => (dragIdx.current = null)}
        >
          {/* 网格与坐标轴 */}
          {[0, 20, 40, 60, 80, 100].map((v) => (
            <g key={`gy${v}`}>
              <line x1={PAD_L} y1={py(v)} x2={W - PAD_R} y2={py(v)} stroke="var(--viz-grid)" strokeWidth={1} />
              <text x={PAD_L - 6} y={py(v) + 4} textAnchor="end" fontSize={10} fill="var(--viz-muted)">{v}</text>
            </g>
          ))}
          {[0, 2, 4, 6, 8, 10].map((v) => (
            <text key={`gx${v}`} x={px(v)} y={H - PAD_B + 16} textAnchor="middle" fontSize={10} fill="var(--viz-muted)">{v}</text>
          ))}
          <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} stroke="var(--viz-axis)" strokeWidth={1.5} />
          <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} stroke="var(--viz-axis)" strokeWidth={1.5} />
          <text x={(PAD_L + W - PAD_R) / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--viz-ink-2)">每天学习时间（小时）</text>
          <text x={14} y={(PAD_T + H - PAD_B) / 2} textAnchor="middle" fontSize={11} fill="var(--viz-ink-2)" transform={`rotate(-90 14 ${(PAD_T + H - PAD_B) / 2})`}>考试分数</text>

          {/* 误差线 */}
          {showRes &&
            points.map((p, i) => (
              <line
                key={`r${i}`}
                x1={px(p.x)}
                y1={py(p.y)}
                x2={px(p.x)}
                y2={py(clamp(w * p.x + b, 0, 100))}
                stroke="var(--viz-s8)"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                opacity={0.7}
              />
            ))}

          {/* 当前直线 */}
          <line x1={px(0)} y1={py(b)} x2={px(10)} y2={py(10 * w + b)} stroke="var(--viz-s6)" strokeWidth={2.5} />

          {/* 数据点 */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={px(p.x)}
              cy={py(p.y)}
              r={7}
              fill="var(--viz-s1)"
              stroke="var(--viz-surface)"
              strokeWidth={2}
              style={{cursor: 'grab'}}
              onPointerDown={(e) => {
                dragIdx.current = i;
                (e.target as Element).releasePointerCapture?.(e.pointerId);
              }}
            />
          ))}
        </svg>
      </div>

      <SliderRow label="斜率 w" value={w} min={0} max={12} step={0.1} onChange={manualSet(setW)} fmt={(v) => v.toFixed(1)} />
      <SliderRow label="截距 b" value={b} min={0} max={50} step={0.5} onChange={manualSet(setB)} fmt={(v) => v.toFixed(1)} />

      <StatRow>
        <Stat label="当前模型" value={`分数 ≈ ${w.toFixed(1)} × 时间 + ${b.toFixed(1)}`} />
        <Stat
          label="平均偏差（RMSE）"
          value={
            <span style={{color: goodFit ? 'var(--viz-good)' : 'var(--viz-bad)'}}>
              {err.toFixed(1)} 分
            </span>
          }
        />
      </StatRow>

      <BtnRow>
        <Btn primary onClick={autoLearn}>🤖 让机器自动学</Btn>
        <Btn onClick={reset}>↺ 重置</Btn>
        <label style={{fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 4}}>
          <input type="checkbox" checked={showRes} onChange={(e) => setShowRes(e.target.checked)} />
          显示误差线
        </label>
      </BtnRow>

      {learned && (
        <Message>
          ✅ 机器学完了！它找到的参数让红色误差线的总长度几乎最小。这个「自动找最优参数」的过程，就是<b>训练</b>。
        </Message>
      )}
    </PlaygroundCard>
  );
}
