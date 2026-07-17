import React, {type ReactNode} from 'react';
import styles from './playground.module.css';

export function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  fmt,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  fmt?: (v: number) => string;
}) {
  return (
    <label className={styles.sliderRow}>
      <span className={styles.sliderLabel}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className={styles.sliderValue}>{fmt ? fmt(value) : value}</span>
    </label>
  );
}

export function Btn({
  children,
  onClick,
  primary = false,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={primary ? styles.btnPrimary : styles.btn}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function BtnRow({children}: {children: ReactNode}) {
  return <div className={styles.controls}>{children}</div>;
}

export function Stat({label, value}: {label: string; value: ReactNode}) {
  return (
    <div className={styles.stat}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
    </div>
  );
}

export function StatRow({children}: {children: ReactNode}) {
  return <div className={styles.statRow}>{children}</div>;
}

export function Message({children}: {children: ReactNode}) {
  return <div className={styles.message}>{children}</div>;
}

/** 把指针事件坐标换算成 SVG viewBox 坐标 */
export function svgPoint(
  svg: SVGSVGElement,
  e: {clientX: number; clientY: number},
): {x: number; y: number} {
  const pt = new DOMPoint(e.clientX, e.clientY);
  const ctm = svg.getScreenCTM();
  if (!ctm) return {x: 0, y: 0};
  const p = pt.matrixTransform(ctm.inverse());
  return {x: p.x, y: p.y};
}

/** 按权重随机抽样，返回下标 */
export function weightedSample(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

/** 给 token 字符串分配一个稳定的系列色（多字符 token 用） */
const CHIP_COLORS = [
  'var(--viz-s1)',
  'var(--viz-s5)',
  'var(--viz-s6)',
  'var(--viz-s7)',
  'var(--viz-s3)',
  'var(--viz-s2)',
  'var(--viz-s4)',
  'var(--viz-s8)',
];

export function chipColor(token: string): string {
  let h = 0;
  for (let i = 0; i < token.length; i++) {
    h = (h * 31 + token.charCodeAt(i)) >>> 0;
  }
  return CHIP_COLORS[h % CHIP_COLORS.length];
}
