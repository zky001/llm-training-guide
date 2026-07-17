import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Message, SliderRow, Stat, StatRow} from '../ui';
import styles from '../playground.module.css';

/**
 * A7.1：错误复利计算器。
 * 单步成功率 × 步数 → 整体成功率（p^n），并对比「加一层每步纠错」后的效果。
 * 用一排方块可视化「一条 n 步链，每块按单步成功率概率性通过」。
 */

const W = 520;

export default function ErrorCompounding() {
  const [p, setP] = useState(95); // 单步成功率 %
  const [n, setN] = useState(20); // 步数
  const [recovery, setRecovery] = useState(0); // 每步失败后被纠错挽回的概率 %

  const pp = p / 100;
  const rr = recovery / 100;
  // 每步「有效成功率」= 直接成功 + 失败但被纠回
  const effective = pp + (1 - pp) * rr;
  const overall = Math.pow(pp, n);
  const overallFixed = Math.pow(effective, n);

  // 需要多少单步成功率才能让 n 步达到 90%？
  const neededStep = Math.pow(0.9, 1 / n);

  const blockW = Math.min(20, (W - 20) / n - 2);

  return (
    <PlaygroundCard
      title="错误复利计算器：为什么「单步很准」还是会失败"
      subtitle="智能体一个任务要走很多步，每步都可能出错。拖动滑块，看单步成功率经过 n 步连乘后，整体成功率崩到什么程度。"
      footer={
        <>
          💡 要点：这是智能体可靠性的第一性原理——<b>成功率是连乘的，不是平均的</b>。单步 95% 听着很高，20 步下来只剩 36%。这解释了三件事：为什么 demo 惊艳、上线拉胯（demo 步数少）；为什么缩短任务链、给每步加纠错（反思、测试）如此关键；以及为什么 A2 的「有依据的反思」值那么多 token——它把每一步的有效成功率往上抬，而连乘对这点提升极其敏感。
        </>
      }
    >
      <SliderRow label="单步成功率" value={p} min={50} max={99.9} step={0.1} onChange={setP} fmt={(v) => `${v.toFixed(1)}%`} />
      <SliderRow label="任务步数 n" value={n} min={1} max={50} step={1} onChange={setN} fmt={(v) => `${v} 步`} />
      <SliderRow label="每步失败的挽回率（纠错层）" value={recovery} min={0} max={95} step={5} onChange={setRecovery} fmt={(v) => (v === 0 ? '无纠错' : `${v}%`)} />

      {/* 链条可视化 */}
      <div className={styles.svgWrap}>
        <svg viewBox={`0 0 ${W} 60`}>
          {Array.from({length: n}, (_, i) => {
            // 累计到第 i 步仍存活的概率，用透明度表示
            const alive = Math.pow(recovery > 0 ? effective : pp, i + 1);
            return (
              <rect
                key={i}
                x={10 + i * (blockW + 2)}
                y={18}
                width={blockW}
                height={24}
                rx={3}
                fill={alive > 0.7 ? 'var(--viz-s2)' : alive > 0.4 ? 'var(--viz-s4)' : 'var(--viz-s8)'}
                opacity={Math.max(0.15, alive)}
              />
            );
          })}
          <text x={10} y={54} fontSize={9.5} fill="var(--viz-muted)">每个方块 = 一步；颜色越淡/越红 = 走到这一步还没出错的概率越低</text>
        </svg>
      </div>

      <StatRow>
        <Stat label="单步成功率" value={`${p.toFixed(1)}%`} />
        <Stat
          label={recovery > 0 ? '整体成功率（无纠错）' : '整体成功率'}
          value={<span style={{color: overall < 0.5 ? 'var(--viz-bad)' : overall < 0.8 ? 'var(--viz-s4)' : 'var(--viz-good)'}}>{(overall * 100).toFixed(1)}%</span>}
        />
        {recovery > 0 && (
          <Stat label="加纠错层后" value={<span style={{color: overallFixed < 0.5 ? 'var(--viz-bad)' : overallFixed < 0.8 ? 'var(--viz-s4)' : 'var(--viz-good)'}}>{(overallFixed * 100).toFixed(1)}%</span>} />
        )}
      </StatRow>

      <Message>
        📉 单步 {p.toFixed(1)}% × {n} 步 = 整体 <b>{(overall * 100).toFixed(1)}%</b>。
        {recovery > 0 && (
          <> 加上「失败挽回 {recovery}%」的纠错层，每步有效成功率升到 {(effective * 100).toFixed(1)}%，整体回到 <b style={{color: 'var(--viz-good)'}}>{(overallFixed * 100).toFixed(1)}%</b>——注意每步只升了一点点，连乘却放大成巨大差距。</>
        )}
        {recovery === 0 && (
          <> 想让这条 {n} 步的任务达到 90% 整体成功率，单步得高达 <b>{(neededStep * 100).toFixed(2)}%</b>——几乎不可能光靠模型本身做到，必须靠纠错（把上面的挽回率往右拖试试）。</>
        )}
      </Message>
    </PlaygroundCard>
  );
}
