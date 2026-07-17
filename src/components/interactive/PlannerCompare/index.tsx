import React, {useEffect, useRef, useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message} from '../ui';
import styles from '../playground.module.css';

/**
 * A2：规划器对比。
 * 同一个带约束的任务，三种策略各跑一条（预录的）轨迹：
 * ① 一把梭 ② 先规划后执行 ③ 边走边想 + 反思。
 * 结果对比：约束达成、token 花费、耗时——可靠性与成本的取舍一目了然。
 */

const TASK = '「帮我规划周末两天的北京行程：预算 2000 元以内，必须包含长城，周日 18:00 前回到酒店。」（3 条硬约束）';

interface Step {
  icon: string;
  text: string;
  status: 'ok' | 'warn' | 'fail';
}

interface Strategy {
  key: string;
  name: string;
  motto: string;
  steps: Step[];
  score: {constraints: string; tokens: string; verdict: string; good: boolean};
}

const STRATEGIES: Strategy[] = [
  {
    key: 'oneshot',
    name: '① 一把梭',
    motto: '不规划不检查，一口气生成完整攻略',
    steps: [
      {icon: '✍️', text: '直接开写：周六故宫→簋街→周日长城→三里屯→晚上八点回酒店……一气呵成，读起来很像样', status: 'ok'},
      {icon: '💸', text: '（没人核账）门票+餐饮+打车加起来 2680 元，超预算 34%', status: 'fail'},
      {icon: '⏰', text: '（没人对表）周日行程排到了 20:00，违反「18:00 前回酒店」', status: 'fail'},
    ],
    score: {constraints: '1 / 3', tokens: '约 800', verdict: '快但不可靠：错误要用户自己发现', good: false},
  },
  {
    key: 'plan',
    name: '② 先规划后执行',
    motto: '先列计划再逐步填充，但计划定了就不回头',
    steps: [
      {icon: '📝', text: '先产出计划：[查景点门票] → [排两天路线] → [排交通] → [核预算] → [输出]', status: 'ok'},
      {icon: '🔍', text: '逐步执行：查到长城往返包车 600 元——比计划预想的贵一倍', status: 'warn'},
      {icon: '🚂', text: '计划里没有「预算超了怎么办」这一步 → 硬着头皮按原计划继续排', status: 'warn'},
      {icon: '💸', text: '最后一步核预算：2350 元，超了——但输出环节已到，只在结尾加了句「可能略超预算」', status: 'fail'},
      {icon: '⏰', text: '时间约束在计划里有专门一步，周日 17:30 回酒店 ✓', status: 'ok'},
    ],
    score: {constraints: '2 / 3', tokens: '约 2400', verdict: '结构清晰，但死板：计划赶不上变化时不会拐弯', good: false},
  },
  {
    key: 'reflect',
    name: '③ 边走边想 + 反思',
    motto: '每完成一步就回头对一遍约束，发现问题当场改',
    steps: [
      {icon: '📝', text: '列出草案计划，并把 3 条约束写成「每步必查清单」', status: 'ok'},
      {icon: '🔍', text: '排到长城：包车 600 元 → 反思触发「预算检查」：照这个花法总额会到 2350', status: 'warn'},
      {icon: '🔄', text: '当场改道：包车换成市郊铁路 S2 线往返 24 元/人，省下 550 元', status: 'ok'},
      {icon: '⏰', text: '排周日行程 → 反思触发「时间检查」：S2 线末班车时间倒推，16:50 出发 17:40 回到酒店 ✓', status: 'ok'},
      {icon: '💸', text: '终稿前全面复核：总额 1780 元 ✓、含长城 ✓、周日 17:40 ✓', status: 'ok'},
    ],
    score: {constraints: '3 / 3', tokens: '约 4200', verdict: '最可靠，但花了 5 倍 token 和更长等待', good: true},
  },
];

const STATUS_COLOR = {ok: 'var(--viz-good)', warn: 'var(--viz-s4)', fail: 'var(--viz-bad)'};

export default function PlannerCompare() {
  const [progress, setProgress] = useState<Record<string, number>>({});
  const timers = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(() => () => timers.current.forEach(clearInterval), []);

  const run = (s: Strategy) => {
    setProgress((p) => ({...p, [s.key]: 0}));
    const t = setInterval(() => {
      setProgress((p) => {
        const cur = p[s.key] ?? 0;
        if (cur >= s.steps.length) {
          clearInterval(t);
          return p;
        }
        return {...p, [s.key]: cur + 1};
      });
    }, 650);
    timers.current.push(t);
  };

  const runAll = () => STRATEGIES.forEach(run);
  const allDone = STRATEGIES.every((s) => (progress[s.key] ?? -1) >= s.steps.length);

  return (
    <PlaygroundCard
      title="规划器对比：三种性格，一个任务"
      subtitle={`任务：${TASK}——分别点「运行」，看三种策略的轨迹和结局（轨迹为教学构造）。`}
      footer={
        <>
          💡 要点：没有免费的午餐——<b>可靠性是拿 token 和时间买的</b>。①省钱但靠运气；②有骨架但不会拐弯；③每步反思最稳，代价是 5 倍成本。真实系统按任务风险选档位：写个周报用①就够，订机票扣款这种「错不起」的事必须上③。这也解释了上篇 8.4 的推理模型为什么贵：「多想一会儿」本质上就是把③内化进了模型。
        </>
      }
    >
      <BtnRow>
        <Btn primary onClick={runAll}>▶ 三个一起跑</Btn>
        <Btn onClick={() => setProgress({})}>↺ 清空重来</Btn>
      </BtnRow>

      <div style={{display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8}}>
        {STRATEGIES.map((s) => {
          const shown = progress[s.key] ?? -1;
          const finished = shown >= s.steps.length;
          return (
            <div
              key={s.key}
              style={{
                flex: '1 1 260px',
                border: `1.5px solid ${finished ? (s.score.good ? 'var(--viz-good)' : 'var(--ifm-color-emphasis-300)') : 'var(--ifm-color-emphasis-300)'}`,
                borderRadius: 12,
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{fontWeight: 700, fontSize: '0.92rem'}}>{s.name}</div>
              <div style={{fontSize: '0.78rem', color: 'var(--ifm-color-emphasis-600)'}}>{s.motto}</div>
              {shown < 0 ? (
                <Btn primary onClick={() => run(s)}>▶ 运行</Btn>
              ) : (
                <>
                  {s.steps.slice(0, shown).map((st, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: '0.8rem',
                        lineHeight: 1.55,
                        padding: '5px 8px',
                        borderRadius: 8,
                        borderLeft: `3px solid ${STATUS_COLOR[st.status]}`,
                        background: 'var(--ifm-color-emphasis-100)',
                      }}
                    >
                      {st.icon} {st.text}
                    </div>
                  ))}
                  {!finished && <div style={{fontSize: '0.8rem', color: 'var(--viz-muted)'}}>⏳ 运行中…</div>}
                  {finished && (
                    <div
                      style={{
                        marginTop: 4,
                        padding: '6px 10px',
                        borderRadius: 8,
                        background: s.score.good ? 'rgba(12,163,12,0.10)' : 'rgba(208,59,59,0.07)',
                        fontSize: '0.8rem',
                        lineHeight: 1.7,
                      }}
                    >
                      约束达成：<b>{s.score.constraints}</b> · token：<b>{s.score.tokens}</b>
                      <br />
                      {s.score.good ? '🏆' : '⚠️'} {s.score.verdict}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {allDone && (
        <Message>
          📊 完赛对比：①800 token / 1 条约束；②2400 / 2 条；③4200 / 3 条全中。注意②和③的分水岭不是「有没有计划」，而是<b>发现意外后会不会改计划</b>——反思循环才是可靠性的来源。
        </Message>
      )}
    </PlaygroundCard>
  );
}
