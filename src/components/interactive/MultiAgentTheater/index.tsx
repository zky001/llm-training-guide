import React, {useEffect, useRef, useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message, Stat, StatRow} from '../ui';
import styles from '../playground.module.css';

/**
 * A5.2：多智能体剧场。
 * 一个编排者 + 三个子智能体协作完成调研任务的预录消息流。
 * 每个智能体有自己的上下文条——直观展示「上下文隔离」：
 * 工人的中间过程各自消化，只有结论回到编排者。
 */

type AgentKey = 'orch' | 'perf' | 'price' | 'risk';

const AGENTS: {key: AgentKey; name: string; icon: string; color: string}[] = [
  {key: 'orch', name: '编排者', icon: '🎯', color: 'var(--viz-s6)'},
  {key: 'perf', name: '性能调研员', icon: '⚡', color: 'var(--viz-s1)'},
  {key: 'price', name: '价格调研员', icon: '💰', color: 'var(--viz-s2)'},
  {key: 'risk', name: '风险审查员', icon: '🛡️', color: 'var(--viz-s7)'},
];

interface Event {
  from: AgentKey;
  to?: AgentKey; // 无 to = 内部工作
  text: string;
  parallel?: boolean; // 属于并行阶段
  ctxDelta: Partial<Record<AgentKey, number>>; // 各智能体上下文增量（token 示意）
}

const EVENTS: Event[] = [
  {
    from: 'orch',
    text: '收到任务：「学校机房要换 20 台训练用显卡，预算 15 万元，给出采购建议。」拆成三个子任务，同时派出三名子智能体。',
    ctxDelta: {orch: 900},
  },
  {from: 'orch', to: 'perf', text: '子任务①：调研当前性价比最高的训练卡型号与性能数据。', parallel: true, ctxDelta: {orch: 200, perf: 400}},
  {from: 'orch', to: 'price', text: '子任务②：调研候选型号的市场价格与供货情况。', parallel: true, ctxDelta: {orch: 200, price: 400}},
  {from: 'orch', to: 'risk', text: '子任务③：审查功耗、机房供电与保修条款的坑。', parallel: true, ctxDelta: {orch: 200, risk: 400}},
  {
    from: 'perf',
    text: '（独立工作：搜索评测 ×3、对比表格 ×1，中间过程 6000 token 全部留在自己肚子里）',
    parallel: true,
    ctxDelta: {perf: 6000},
  },
  {
    from: 'price',
    text: '（独立工作：查询电商与渠道报价 ×4，比价过程自己消化）',
    parallel: true,
    ctxDelta: {price: 5000},
  },
  {
    from: 'risk',
    text: '（独立工作：核对功耗参数、翻保修条款，笔记自己留着）',
    parallel: true,
    ctxDelta: {risk: 4000},
  },
  {from: 'perf', to: 'orch', text: '结论：训练场景首选 X4090-class，单卡性能分 100；次选 X4070-class，性能分 62。', ctxDelta: {orch: 500}},
  {from: 'price', to: 'orch', text: '结论：X4090-class 现货约 1.3 万/张；X4070-class 约 5500/张，供货充足。', ctxDelta: {orch: 500}},
  {from: 'risk', to: 'orch', text: '结论：X4090-class 单卡 450W，20 张需机房扩容供电（追加成本约 4 万）；保修均 3 年。', ctxDelta: {orch: 500}},
  {
    from: 'orch',
    text: '汇总时发现冲突：首选型号 20 张 = 26 万，叠加供电扩容远超 15 万预算——需要追加一轮调研。',
    ctxDelta: {orch: 400},
  },
  {from: 'orch', to: 'price', text: '追问：预算 15 万内、无需扩容供电，最优的 20 张配置是什么？', ctxDelta: {orch: 200, price: 400}},
  {from: 'price', to: 'orch', text: '补充：X4070-class ×20 = 11 万，单卡 220W 无需扩容，剩余预算可上大内存版本。', ctxDelta: {price: 1200, orch: 400}},
  {
    from: 'orch',
    text: '最终建议：采购 X4070-class 大内存版 ×20（约 13.5 万），预算内、免扩容、性能满足教学训练。附三名子智能体的关键依据。✅',
    ctxDelta: {orch: 600},
  },
];

export default function MultiAgentTheater() {
  const [shown, setShown] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => () => stop(), []);

  const done = shown >= EVENTS.length;

  // 累计各智能体上下文
  const ctx: Record<AgentKey, number> = {orch: 0, perf: 0, price: 0, risk: 0};
  EVENTS.slice(0, shown).forEach((e) => {
    (Object.keys(e.ctxDelta) as AgentKey[]).forEach((k) => {
      ctx[k] += e.ctxDelta[k] ?? 0;
    });
  });
  const totalTokens = Object.values(ctx).reduce((a, b) => a + b, 0);
  const maxCtx = Math.max(...Object.values(ctx), 1);
  const inParallel = shown > 0 && EVENTS[shown - 1].parallel;

  const auto = () => {
    stop();
    timer.current = setInterval(() => {
      setShown((s) => {
        if (s >= EVENTS.length) {
          stop();
          return s;
        }
        return s + 1;
      });
    }, 900);
  };

  const agentOf = (k: AgentKey) => AGENTS.find((a) => a.key === k)!;

  return (
    <PlaygroundCard
      title="多智能体剧场：一台调研任务的四人剧"
      subtitle="编排者拆任务 → 三名子智能体并行调研（各用各的上下文）→ 汇总发现冲突 → 追加一轮 → 定稿。重点盯右侧每个智能体自己的「上下文条」。（剧本为教学构造）"
      footer={
        <>
          💡 要点：多智能体最实在的两笔收益都在上下文条里——<b>并行</b>（三个调研同时进行，墙钟时间 ≈ 最慢的那个而不是三者之和）和<b>上下文隔离</b>（每个工人 4~6k 的调研过程自己消化，编排者只收到三条 500 token 的结论；若单智能体全干，一条上下文要装下全部 15k+ 过程）。代价同样明显：消息传递会丢细节、总 token 反而更多、还多了「工人之间打架谁来裁决」的协调问题——所以 A0 的老规矩依然成立：单智能体够用就别上多智能体。
        </>
      }
    >
      {/* 智能体面板 + 上下文条 */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 10}}>
        {AGENTS.map((a) => {
          const active =
            shown > 0 &&
            (EVENTS[shown - 1].from === a.key || EVENTS[shown - 1].to === a.key);
          return (
            <div
              key={a.key}
              style={{
                padding: '8px 10px',
                borderRadius: 10,
                border: `2px solid ${active ? a.color : 'var(--ifm-color-emphasis-300)'}`,
                background: active ? 'var(--ifm-color-emphasis-100)' : 'var(--ifm-background-surface-color)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{fontWeight: 700, fontSize: '0.85rem'}}>
                {a.icon} {a.name}
              </div>
              <div style={{height: 10, borderRadius: 5, background: 'var(--ifm-color-emphasis-100)', overflow: 'hidden', margin: '5px 0 3px', border: '1px solid var(--ifm-color-emphasis-200)'}}>
                <div style={{height: '100%', width: `${(ctx[a.key] / Math.max(maxCtx, 8000)) * 100}%`, background: a.color, transition: 'width 0.3s ease'}} />
              </div>
              <div style={{fontSize: '0.72rem', color: 'var(--ifm-color-emphasis-600)', fontVariantNumeric: 'tabular-nums'}}>
                自己的上下文：{ctx[a.key].toLocaleString()} tk
              </div>
            </div>
          );
        })}
      </div>

      {inParallel && (
        <div style={{fontSize: '0.8rem', color: 'var(--viz-s2)', fontWeight: 700, marginBottom: 6}}>
          ⚡ 并行阶段：三名子智能体正在同时工作（墙钟时间只算最慢的那个）
        </div>
      )}

      {/* 消息流 */}
      <div style={{display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto', marginBottom: 8}}>
        {EVENTS.slice(0, shown).map((e, i) => {
          const from = agentOf(e.from);
          const to = e.to ? agentOf(e.to) : null;
          return (
            <div
              key={i}
              style={{
                padding: '6px 10px',
                borderRadius: 10,
                borderLeft: `4px solid ${from.color}`,
                background: 'var(--ifm-color-emphasis-100)',
                fontSize: '0.83rem',
                lineHeight: 1.6,
                opacity: e.text.startsWith('（独立工作') ? 0.75 : 1,
              }}
            >
              <b style={{color: from.color}}>
                {from.icon} {from.name}
                {to ? ` → ${to.icon} ${to.name}` : ''}：
              </b>{' '}
              {e.text}
            </div>
          );
        })}
      </div>

      <StatRow>
        <Stat label="消息数" value={shown} />
        <Stat label="全系统总 token" value={totalTokens.toLocaleString()} />
        <Stat label="编排者上下文" value={`仅 ${ctx.orch.toLocaleString()} tk`} />
        <Stat label="状态" value={done ? <span style={{color: 'var(--viz-good)'}}>✅ 定稿</span> : '演出中…'} />
      </StatRow>

      <BtnRow>
        <Btn primary onClick={() => setShown((s) => Math.min(EVENTS.length, s + 1))} disabled={done}>⏭ 下一幕</Btn>
        <Btn primary onClick={auto} disabled={done}>▶ 连续播放</Btn>
        <Btn onClick={() => {stop(); setShown(0);}}>↺ 重演</Btn>
      </BtnRow>

      {done && (
        <Message>
          🎭 落幕。注意两个细节：①三名工人合计吃掉约 1.7 万 token 的中间过程，但编排者的上下文始终只有 5k 左右——它只看结论，这就是<b>上下文隔离</b>；②第 11 幕的「冲突仲裁」只能由编排者做——没有中枢的多智能体系统，冲突会变成无休止的拉扯。
        </Message>
      )}
    </PlaygroundCard>
  );
}
