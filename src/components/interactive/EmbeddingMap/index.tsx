import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Message} from '../ui';
import styles from '../playground.module.css';

/**
 * 1.4 节：词向量地图（示意数据）。
 * 词的坐标为手工构造，用来还原真实词向量空间的两个典型现象：
 * ① 同类词聚成一团；② 成对关系（国家→首都、男→女）方向平行。
 * 真实词向量是几百上千维的，这里是概念上的 2 维缩影。
 */

interface Word {
  w: string;
  x: number;
  y: number;
  cluster: string;
}

const WORDS: Word[] = [
  // 动物
  {w: '猫', x: -6.5, y: 4.2, cluster: '动物'},
  {w: '狗', x: -5.6, y: 4.6, cluster: '动物'},
  {w: '鸟', x: -6.9, y: 3.0, cluster: '动物'},
  {w: '鱼', x: -5.2, y: 3.3, cluster: '动物'},
  {w: '老虎', x: -6.0, y: 5.4, cluster: '动物'},
  // 水果
  {w: '苹果', x: -2.2, y: -4.6, cluster: '水果'},
  {w: '香蕉', x: -1.3, y: -5.2, cluster: '水果'},
  {w: '橘子', x: -2.8, y: -5.4, cluster: '水果'},
  {w: '葡萄', x: -1.8, y: -4.0, cluster: '水果'},
  {w: '西瓜', x: -3.0, y: -4.4, cluster: '水果'},
  // 情绪
  {w: '高兴', x: 5.6, y: -3.4, cluster: '情绪'},
  {w: '快乐', x: 6.3, y: -3.0, cluster: '情绪'},
  {w: '悲伤', x: 4.8, y: -4.4, cluster: '情绪'},
  {w: '愤怒', x: 6.2, y: -5.0, cluster: '情绪'},
  {w: '害怕', x: 5.2, y: -5.6, cluster: '情绪'},
  // 国家（到首都的位移统一为 +2.2, +1.4）
  {w: '中国', x: 2.6, y: 3.0, cluster: '国家'},
  {w: '法国', x: 1.8, y: 4.2, cluster: '国家'},
  {w: '日本', x: 3.4, y: 2.2, cluster: '国家'},
  {w: '英国', x: 1.0, y: 3.2, cluster: '国家'},
  // 首都
  {w: '北京', x: 4.8, y: 4.4, cluster: '首都'},
  {w: '巴黎', x: 4.0, y: 5.6, cluster: '首都'},
  {w: '东京', x: 5.6, y: 3.6, cluster: '首都'},
  {w: '伦敦', x: 3.2, y: 4.6, cluster: '首都'},
  // 人物
  {w: '男人', x: -0.6, y: -1.2, cluster: '人物'},
  {w: '女人', x: 0.6, y: -1.4, cluster: '人物'},
  {w: '国王', x: -0.2, y: 1.4, cluster: '人物'},
  {w: '王后', x: 1.0, y: 1.2, cluster: '人物'},
];

const CLUSTER_COLORS: Record<string, string> = {
  动物: 'var(--viz-s1)',
  水果: 'var(--viz-s2)',
  情绪: 'var(--viz-s3)',
  国家: 'var(--viz-s6)',
  首都: 'var(--viz-s7)',
  人物: 'var(--viz-s5)',
};

interface Analogy {
  label: string;
  a: string; // A − B + C ≈ ?
  b: string;
  c: string;
}

const ANALOGIES: Analogy[] = [
  {label: '国王 − 男人 + 女人 ≈ ?', a: '国王', b: '男人', c: '女人'},
  {label: '北京 − 中国 + 法国 ≈ ?', a: '北京', b: '中国', c: '法国'},
  {label: '北京 − 中国 + 日本 ≈ ?', a: '北京', b: '中国', c: '日本'},
];

const W = 480;
const H = 420;
const sx = (x: number) => ((x + 8) / 16) * W;
const sy = (y: number) => ((7 - y) / 14) * H;

const find = (w: string) => WORDS.find((it) => it.w === w)!;
const dist = (a: {x: number; y: number}, b: {x: number; y: number}) =>
  Math.hypot(a.x - b.x, a.y - b.y);

function ArrowLine({
  x1, y1, x2, y2, color, dash,
}: {x1: number; y1: number; x2: number; y2: number; color: string; dash?: string}) {
  const ang = Math.atan2(sy(y2) - sy(y1), sx(x2) - sx(x1));
  const hs = 8;
  return (
    <g>
      <line x1={sx(x1)} y1={sy(y1)} x2={sx(x2)} y2={sy(y2)} stroke={color} strokeWidth={2} strokeDasharray={dash} />
      <polygon
        points={`${sx(x2)},${sy(y2)} ${sx(x2) - hs * Math.cos(ang - 0.45)},${sy(y2) - hs * Math.sin(ang - 0.45)} ${sx(x2) - hs * Math.cos(ang + 0.45)},${sy(y2) - hs * Math.sin(ang + 0.45)}`}
        fill={color}
      />
    </g>
  );
}

export default function EmbeddingMap() {
  const [hover, setHover] = useState<string | null>(null);
  const [analogyIdx, setAnalogyIdx] = useState<number>(-1);

  const hovered = hover ? find(hover) : null;
  const neighbors = hovered
    ? WORDS.filter((w) => w.w !== hovered.w)
        .sort((p, q) => dist(p, hovered) - dist(q, hovered))
        .slice(0, 3)
    : [];

  const analogy = analogyIdx >= 0 ? ANALOGIES[analogyIdx] : null;
  let target: {x: number; y: number} | null = null;
  let nearest: Word | null = null;
  if (analogy) {
    const A = find(analogy.a);
    const B = find(analogy.b);
    const C = find(analogy.c);
    target = {x: A.x - B.x + C.x, y: A.y - B.y + C.y};
    nearest = WORDS.filter((w) => ![analogy.a, analogy.b, analogy.c].includes(w.w)).sort(
      (p, q) => dist(p, target!) - dist(q, target!),
    )[0];
  }

  return (
    <PlaygroundCard
      title="词向量地图：意思相近的词，住得也近"
      subtitle="每个词是空间中的一个点（这里是概念示意图：坐标为手工构造，真实词向量有几百上千维）。把鼠标放到任意词上看它的近邻；下拉框里还有更神奇的「词向量算术」。"
      footer={
        <>
          💡 要点：模型并不「认识」汉字，它只看见向量。但只要「意思相近 → 向量相近」，模型对「猫」学到的规律就能自动迁移到「狗」上。更妙的是<b>方向也有意义</b>：国家→首都是同一个方向，所以「北京 − 中国 + 法国」会落在巴黎附近。这些向量不是人设计的，全是训练中自己「长」出来的。
        </>
      }
    >
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 8}}>
        <span style={{fontSize: '0.9rem', fontWeight: 600}}>🧮 词向量算术：</span>
        <select
          value={analogyIdx}
          onChange={(e) => setAnalogyIdx(Number(e.target.value))}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid var(--ifm-color-emphasis-300)',
            background: 'var(--ifm-background-surface-color)',
            color: 'var(--ifm-font-color-base)',
            fontSize: '0.88rem',
          }}
        >
          <option value={-1}>（关闭）</option>
          {ANALOGIES.map((a, i) => (
            <option key={a.label} value={i}>{a.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.svgWrap}>
        <svg viewBox={`0 0 ${W} ${H}`}>
          {/* 近邻连线 */}
          {hovered &&
            neighbors.map((n) => (
              <line
                key={n.w}
                x1={sx(hovered.x)} y1={sy(hovered.y)} x2={sx(n.x)} y2={sy(n.y)}
                stroke="var(--viz-muted)" strokeWidth={1.5} strokeDasharray="4 3"
              />
            ))}

          {/* 词向量算术的箭头 */}
          {analogy && target && (
            <g>
              <ArrowLine
                x1={find(analogy.b).x} y1={find(analogy.b).y}
                x2={find(analogy.a).x} y2={find(analogy.a).y}
                color="var(--viz-s8)"
              />
              <ArrowLine
                x1={find(analogy.c).x} y1={find(analogy.c).y}
                x2={target.x} y2={target.y}
                color="var(--viz-s8)" dash="6 4"
              />
              <text x={sx(target.x)} y={sy(target.y) + 5} textAnchor="middle" fontSize={16}>⭐</text>
            </g>
          )}

          {/* 词点 */}
          {WORDS.map((w) => {
            const active = hover === w.w || neighbors.some((n) => n.w === w.w) || (nearest && nearest.w === w.w);
            return (
              <g
                key={w.w}
                onMouseEnter={() => setHover(w.w)}
                onMouseLeave={() => setHover(null)}
                style={{cursor: 'pointer'}}
              >
                <circle
                  cx={sx(w.x)} cy={sy(w.y)}
                  r={active ? 8 : 6}
                  fill={CLUSTER_COLORS[w.cluster]}
                  stroke={nearest && nearest.w === w.w ? 'var(--viz-s8)' : 'var(--viz-surface)'}
                  strokeWidth={nearest && nearest.w === w.w ? 3 : 1.5}
                />
                <text
                  x={sx(w.x)} y={sy(w.y) - 11}
                  textAnchor="middle" fontSize={12}
                  fontWeight={active ? 700 : 500}
                  fill="var(--viz-ink-2)"
                >
                  {w.w}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 图例 */}
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 12, margin: '8px 0', fontSize: '0.84rem'}}>
        {Object.entries(CLUSTER_COLORS).map(([name, color]) => (
          <span key={name} style={{display: 'flex', alignItems: 'center', gap: 5}}>
            <span style={{width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block'}} />
            {name}
          </span>
        ))}
      </div>

      {hovered && (
        <Message>
          「<b>{hovered.w}</b>」的三个最近邻居：
          {neighbors.map((n) => `「${n.w}」（距离 ${dist(n, hovered).toFixed(1)}）`).join('、')}
          —— 距离越近，模型眼里的「意思」越像。
        </Message>
      )}
      {analogy && nearest && (
        <Message>
          🧮 <b>{analogy.label.replace(' ≈ ?', '')}</b> 的落点（⭐）最近的词是「<b>{nearest.w}</b>」！
          实线箭头是「{analogy.b} → {analogy.a}」的方向，把同样的方向从「{analogy.c}」出发再走一遍（虚线），就到了答案附近。
        </Message>
      )}
    </PlaygroundCard>
  );
}
