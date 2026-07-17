import React, {useRef, useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message, SliderRow, svgPoint} from '../ui';
import styles from '../playground.module.css';

/**
 * 0.2 节：矩阵 = 空间变换。
 * 拖动蓝色向量 v，调整 2×2 矩阵，观察网格和 Av 如何变化。
 */

const W = 440;
const H = 400;
const CX = W / 2;
const CY = H / 2;
const U = 36; // 1 个单位对应的像素

const sx = (x: number) => CX + x * U;
const sy = (y: number) => CY - y * U;

interface Preset {
  name: string;
  m: [number, number, number, number]; // a b c d，矩阵 [[a,b],[c,d]]
}

const PRESETS: Preset[] = [
  {name: '恒等（什么都不做）', m: [1, 0, 0, 1]},
  {name: '旋转 30°', m: [0.87, -0.5, 0.5, 0.87]},
  {name: '放大 1.5 倍', m: [1.5, 0, 0, 1.5]},
  {name: '水平剪切', m: [1, 0.8, 0, 1]},
  {name: '压扁成一条线', m: [1, 0.5, 2, 1]},
];

function Arrow({
  x,
  y,
  color,
  dash,
  width = 2.5,
  label,
}: {
  x: number;
  y: number;
  color: string;
  dash?: string;
  width?: number;
  label?: string;
}) {
  const len = Math.hypot(x, y);
  if (len < 0.05) return null;
  const tipX = sx(x);
  const tipY = sy(y);
  // 箭头头部：沿向量方向的小三角
  const ang = Math.atan2(sy(0) - tipY, tipX - sx(0));
  const hs = 9;
  const p1 = `${tipX},${tipY}`;
  const p2 = `${tipX - hs * Math.cos(ang - 0.42)},${tipY + hs * Math.sin(ang - 0.42)}`;
  const p3 = `${tipX - hs * Math.cos(ang + 0.42)},${tipY + hs * Math.sin(ang + 0.42)}`;
  return (
    <g>
      <line x1={sx(0)} y1={sy(0)} x2={tipX} y2={tipY} stroke={color} strokeWidth={width} strokeDasharray={dash} />
      <polygon points={`${p1} ${p2} ${p3}`} fill={color} />
      {label && (
        <text x={tipX + (x >= 0 ? 8 : -8)} y={tipY - 6} textAnchor={x >= 0 ? 'start' : 'end'} fontSize={13} fontWeight={700} fill={color}>
          {label}
        </text>
      )}
    </g>
  );
}

export default function MatrixPlayground() {
  const [m, setM] = useState<[number, number, number, number]>([0.87, -0.5, 0.5, 0.87]);
  const [v, setV] = useState({x: 2, y: 1});
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const [a, b, c, d] = m;
  const det = a * d - b * c;
  const av = {x: a * v.x + b * v.y, y: c * v.x + d * v.y};

  const gridRange = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
  const EXT = 6; // 变换后网格线的绘制延伸范围

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current || !svgRef.current) return;
    const p = svgPoint(svgRef.current, e);
    const x = Math.max(-4.5, Math.min(4.5, (p.x - CX) / U));
    const y = Math.max(-4.5, Math.min(4.5, (CY - p.y) / U));
    setV({x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10});
  };

  const setEntry = (idx: number) => (val: number) => {
    setM((prev) => prev.map((x, i) => (i === idx ? val : x)) as typeof m);
  };

  return (
    <PlaygroundCard
      title="矩阵变换实验室：矩阵就是「空间的变形器」"
      subtitle="拖动蓝色箭头 v，或调整矩阵的 4 个数字，观察整张网格和橙色箭头 Av（变换结果）怎么变。"
      footer={
        <>
          💡 要点：矩阵乘向量 = 对空间做旋转、拉伸、剪切等变形。神经网络里每一层的核心运算就是「矩阵 × 向量」——只不过空间从 2 维变成了几千维。行列式 |det| 是面积的缩放倍数：det = 0 时空间被压扁，信息就丢了。
        </>
      }
    >
      <div className={styles.svgWrap}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          onPointerMove={onPointerMove}
          onPointerUp={() => (dragging.current = false)}
          onPointerLeave={() => (dragging.current = false)}
        >
          {/* 原始网格（浅） */}
          {gridRange.map((k) => (
            <g key={`og${k}`}>
              <line x1={sx(k)} y1={sy(-5)} x2={sx(k)} y2={sy(5)} stroke="var(--viz-grid)" strokeWidth={1} />
              <line x1={sx(-6)} y1={sy(k)} x2={sx(6)} y2={sy(k)} stroke="var(--viz-grid)" strokeWidth={1} />
            </g>
          ))}
          {/* 变换后的网格（主题色细线） */}
          {gridRange.map((k) => (
            <g key={`tg${k}`} opacity={0.5}>
              <line
                x1={sx(a * k + b * -EXT)} y1={sy(c * k + d * -EXT)}
                x2={sx(a * k + b * EXT)} y2={sy(c * k + d * EXT)}
                stroke="var(--viz-s1)" strokeWidth={0.8}
              />
              <line
                x1={sx(a * -EXT + b * k)} y1={sy(c * -EXT + d * k)}
                x2={sx(a * EXT + b * k)} y2={sy(c * EXT + d * k)}
                stroke="var(--viz-s1)" strokeWidth={0.8}
              />
            </g>
          ))}
          {/* 坐标轴 */}
          <line x1={sx(-6)} y1={sy(0)} x2={sx(6)} y2={sy(0)} stroke="var(--viz-axis)" strokeWidth={1.5} />
          <line x1={sx(0)} y1={sy(-5)} x2={sx(0)} y2={sy(5)} stroke="var(--viz-axis)" strokeWidth={1.5} />

          {/* 基向量的像 */}
          <Arrow x={a} y={c} color="var(--viz-s2)" width={2} label="e₁′" />
          <Arrow x={b} y={d} color="var(--viz-s6)" width={2} label="e₂′" />

          {/* v 与 Av */}
          <Arrow x={av.x} y={av.y} color="var(--viz-s7)" dash="6 4" label="Av" />
          <Arrow x={v.x} y={v.y} color="var(--viz-s1)" label="v" />
          {/* v 的拖动手柄 */}
          <circle
            cx={sx(v.x)} cy={sy(v.y)} r={11}
            fill="var(--viz-s1)" opacity={0.25} style={{cursor: 'grab'}}
            onPointerDown={() => (dragging.current = true)}
          />
        </svg>
      </div>

      <div style={{display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center'}}>
        <div style={{fontSize: '1.05rem', fontFamily: 'var(--ifm-font-family-monospace)', fontWeight: 700, whiteSpace: 'nowrap'}}>
          A = [ {a.toFixed(2)}  {b.toFixed(2)} ; {c.toFixed(2)}  {d.toFixed(2)} ]
        </div>
        <div style={{fontSize: '0.9rem'}}>
          det(A) = <b style={{color: Math.abs(det) < 0.05 ? 'var(--viz-bad)' : 'inherit'}}>{det.toFixed(2)}</b>
        </div>
        <div style={{fontSize: '0.9rem'}}>
          v = ({v.x.toFixed(1)}, {v.y.toFixed(1)}) → Av = ({av.x.toFixed(1)}, {av.y.toFixed(1)})
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 20, marginTop: 6}}>
        <SliderRow label="a（左上）" value={a} min={-2} max={2} step={0.01} onChange={setEntry(0)} fmt={(x) => x.toFixed(2)} />
        <SliderRow label="b（右上）" value={b} min={-2} max={2} step={0.01} onChange={setEntry(1)} fmt={(x) => x.toFixed(2)} />
        <SliderRow label="c（左下）" value={c} min={-2} max={2} step={0.01} onChange={setEntry(2)} fmt={(x) => x.toFixed(2)} />
        <SliderRow label="d（右下）" value={d} min={-2} max={2} step={0.01} onChange={setEntry(3)} fmt={(x) => x.toFixed(2)} />
      </div>

      <BtnRow>
        {PRESETS.map((p) => (
          <Btn key={p.name} onClick={() => setM([...p.m])}>{p.name}</Btn>
        ))}
      </BtnRow>

      {Math.abs(det) < 0.05 && (
        <Message>
          ⚠️ det(A) ≈ 0：整个平面被压扁成了一条线！不同的输入向量会被映射到同一个点——<b>信息不可逆地丢失了</b>。这就是为什么神经网络要小心设计每一层，避免把有用信息「压没」。
        </Message>
      )}
    </PlaygroundCard>
  );
}
