import React, {useEffect, useRef, useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message, Stat, StatRow} from '../ui';
import styles from '../playground.module.css';

/**
 * A3.1：上下文管理器。
 * 同一个 12 步长任务（重构订单模块），四种上下文策略各有一条预录时间线：
 * ① 硬扛不管理（溢出崩溃）② 截断最旧（关键信息被扔）
 * ③ 定期压缩（摘要保命）④ 外置记忆（记笔记最稳）。
 * 上下文窗口示意为 32k tokens。
 */

const WINDOW = 32000;

interface TimelineStep {
  desc: string;
  ctx: number; // 该步之后的上下文占用
  note?: string;
  status: 'ok' | 'warn' | 'fail' | 'action';
}

interface Strategy {
  key: string;
  name: string;
  motto: string;
  steps: TimelineStep[];
  outcome: {text: string; good: boolean};
}

const STRATEGIES: Strategy[] = [
  {
    key: 'none',
    name: '① 硬扛不管理',
    motto: '什么都不做，任由上下文一路膨胀',
    steps: [
      {desc: '读需求文档', ctx: 800, status: 'ok'},
      {desc: '读代码文件 A（3000 token 进上下文）', ctx: 3800, status: 'ok'},
      {desc: '💡 分析出接口约定：「金额一律用分为单位存储」', ctx: 4200, status: 'ok'},
      {desc: '读代码文件 B', ctx: 8200, status: 'ok'},
      {desc: '修改文件 A', ctx: 10200, status: 'ok'},
      {desc: '跑测试 → 6000 token 的报错日志灌进上下文', ctx: 16200, status: 'warn'},
      {desc: '按日志修复', ctx: 18200, status: 'ok'},
      {desc: '读代码文件 C', ctx: 22200, status: 'ok'},
      {desc: '修改文件 B', ctx: 24200, status: 'ok'},
      {desc: '再跑测试 → 又是 6000 token 日志', ctx: 30200, status: 'warn', note: '占用 94%，接近上限'},
      {desc: '收尾核对接口约定', ctx: 31400, status: 'warn'},
      {desc: '生成提交说明 → 💥 超出 32k 窗口，请求被拒绝', ctx: 33400, status: 'fail'},
    ],
    outcome: {text: '💥 任务在最后一步崩溃：上下文溢出。前面 11 步的工作全部白费——长任务里「不管理」不是一个选项。', good: false},
  },
  {
    key: 'truncate',
    name: '② 截断最旧',
    motto: '快满了就把最早的内容整段扔掉',
    steps: [
      {desc: '读需求文档', ctx: 800, status: 'ok'},
      {desc: '读代码文件 A', ctx: 3800, status: 'ok'},
      {desc: '💡 分析出接口约定：「金额一律用分为单位存储」', ctx: 4200, status: 'ok'},
      {desc: '读代码文件 B', ctx: 8200, status: 'ok'},
      {desc: '修改文件 A', ctx: 10200, status: 'ok'},
      {desc: '跑测试 → 6000 token 报错日志', ctx: 16200, status: 'ok'},
      {desc: '按日志修复', ctx: 18200, status: 'ok'},
      {desc: '读代码文件 C', ctx: 22200, status: 'ok'},
      {desc: '修改文件 B', ctx: 24200, status: 'ok'},
      {desc: '再跑测试 → 超过 28k 阈值，✂️ 自动扔掉最早的 1~4 步（含接口约定！）', ctx: 24000, status: 'action', note: '第 3 步的关键信息被扔了'},
      {desc: '收尾核对接口约定 → 上下文里已经找不到，模型凭感觉用了「元」', ctx: 25000, status: 'fail'},
      {desc: '提交 → 金额单位错误埋进了代码', ctx: 26000, status: 'warn'},
    ],
    outcome: {text: '⚠️ 任务「完成」了，但埋了一个金额差 100 倍的 bug——截断不看内容重要性，扔掉的偏偏是第 3 步的接口约定。省地方不能只按时间先后。', good: false},
  },
  {
    key: 'compact',
    name: '③ 定期压缩',
    motto: '快满了就把旧对话压成摘要，要点保留',
    steps: [
      {desc: '读需求文档', ctx: 800, status: 'ok'},
      {desc: '读代码文件 A', ctx: 3800, status: 'ok'},
      {desc: '💡 分析出接口约定：「金额一律用分为单位存储」', ctx: 4200, status: 'ok'},
      {desc: '读代码文件 B', ctx: 8200, status: 'ok'},
      {desc: '修改文件 A', ctx: 10200, status: 'ok'},
      {desc: '跑测试 → 6000 token 报错日志', ctx: 16200, status: 'ok'},
      {desc: '按日志修复', ctx: 18200, status: 'ok'},
      {desc: '读代码文件 C', ctx: 22200, status: 'ok'},
      {desc: '超过 24k 阈值 → 🗜️ 把 1~7 步压缩成 1500 token 摘要（接口约定写进了摘要）', ctx: 9700, status: 'action', note: '压缩本身也花了一次模型调用'},
      {desc: '修改文件 B', ctx: 11700, status: 'ok'},
      {desc: '再跑测试 → 日志进上下文，空间充足', ctx: 17700, status: 'ok'},
      {desc: '收尾从摘要中核对接口约定 ✓ → 提交成功', ctx: 19000, status: 'ok'},
    ],
    outcome: {text: '✅ 任务完成。摘要保住了关键约定，代价是一次额外的压缩调用，以及一个隐患：摘要必然丢细节（这次丢的是旧测试日志的细节，幸好后面不再需要——但没人能保证每次都幸运）。', good: true},
  },
  {
    key: 'external',
    name: '④ 外置记忆',
    motto: '关键信息主动记笔记，大文件读后即弃',
    steps: [
      {desc: '读需求文档 → 提炼要点后原文即弃', ctx: 600, status: 'ok'},
      {desc: '读代码文件 A → 只保留结论', ctx: 2200, status: 'ok'},
      {desc: '💡 接口约定「金额用分存储」→ 📝 主动写入笔记文件', ctx: 2600, status: 'action', note: '多花一次工具调用，换来永不丢失'},
      {desc: '读代码文件 B → 只保留结论', ctx: 4600, status: 'ok'},
      {desc: '修改文件 A', ctx: 6600, status: 'ok'},
      {desc: '跑测试 → 只把 3 条关键报错留在上下文，完整日志存文件', ctx: 8100, status: 'ok'},
      {desc: '按报错修复', ctx: 10100, status: 'ok'},
      {desc: '读代码文件 C → 只保留结论', ctx: 12100, status: 'ok'},
      {desc: '修改文件 B', ctx: 14100, status: 'ok'},
      {desc: '再跑测试 → 同样只留关键行', ctx: 15600, status: 'ok'},
      {desc: '收尾 → 📖 读回笔记核对接口约定 ✓', ctx: 16400, status: 'ok'},
      {desc: '提交成功，上下文全程未过半', ctx: 17400, status: 'ok'},
    ],
    outcome: {text: '🏆 最稳的一条时间线：上下文全程没超过 55%，关键信息在笔记里永不丢失。代价是纪律——每一步都要判断「什么值得留、什么该外置」，这正是上下文工程的日常。', good: true},
  },
];

const STATUS_COLOR = {ok: 'var(--viz-good)', warn: 'var(--viz-s4)', fail: 'var(--viz-bad)', action: 'var(--viz-s1)'};

export default function ContextManager() {
  const [stratIdx, setStratIdx] = useState(0);
  const [shown, setShown] = useState(0);
  const [tried, setTried] = useState<Set<string>>(new Set());
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const strat = STRATEGIES[stratIdx];
  const done = shown >= strat.steps.length;
  const ctx = shown > 0 ? strat.steps[shown - 1].ctx : 0;
  const pct = Math.min(110, (ctx / WINDOW) * 100);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  useEffect(() => () => stop(), []);
  useEffect(() => {
    if (done) setTried((t) => new Set(t).add(strat.key));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const pick = (i: number) => {
    stop();
    setStratIdx(i);
    setShown(0);
  };

  const auto = () => {
    stop();
    timer.current = setInterval(() => {
      setShown((s) => {
        if (s >= strat.steps.length) {
          stop();
          return s;
        }
        return s + 1;
      });
    }, 550);
  };

  return (
    <PlaygroundCard
      title="上下文管理器：同一个长任务，四种活法"
      subtitle="任务：重构订单模块（12 步）。上下文窗口 32k token（示意）。选一种策略跑完时间线，重点盯着上方的「上下文水位条」——四种策略都试完，你就懂上下文工程了。"
      footer={
        <>
          💡 要点：循环每转一圈，上下文只增不减，而窗口是死的——长任务的成败一半取决于<b>上下文管理策略</b>。四条时间线的教训依次是：不管理必死；按时间截断会扔掉要命的信息；压缩是「有损保命」；外置记忆最稳但要纪律。真实智能体（如 2025-2026 年的编码智能体）普遍是 ③+④ 混用：自动压缩兜底，关键信息记笔记。
        </>
      }
    >
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10}}>
        {STRATEGIES.map((s, i) => (
          <button
            key={s.key}
            type="button"
            className={styles.btn}
            style={i === stratIdx ? {background: 'var(--ifm-color-primary)', color: '#fff', borderColor: 'var(--ifm-color-primary)'} : {}}
            onClick={() => pick(i)}
          >
            {tried.has(s.key) ? '✓ ' : ''}{s.name}
          </button>
        ))}
      </div>
      <div style={{fontSize: '0.82rem', color: 'var(--ifm-color-emphasis-600)', marginBottom: 8}}>{strat.motto}</div>

      {/* 水位条 */}
      <div style={{marginBottom: 10}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3}}>
          <span style={{fontWeight: 600}}>上下文水位</span>
          <span style={{fontVariantNumeric: 'tabular-nums', color: pct > 100 ? 'var(--viz-bad)' : pct > 85 ? 'var(--viz-s4)' : 'var(--ifm-color-emphasis-700)'}}>
            {ctx.toLocaleString()} / {WINDOW.toLocaleString()} token（{pct.toFixed(0)}%）
          </span>
        </div>
        <div style={{height: 16, borderRadius: 8, background: 'var(--ifm-color-emphasis-100)', overflow: 'hidden', position: 'relative', border: '1px solid var(--ifm-color-emphasis-300)'}}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, pct)}%`,
              background: pct > 100 ? 'var(--viz-bad)' : pct > 85 ? 'var(--viz-s4)' : 'var(--viz-s1)',
              transition: 'width 0.3s ease, background 0.3s ease',
            }}
          />
          {pct > 100 && (
            <span style={{position: 'absolute', right: 6, top: 0, fontSize: '0.72rem', color: '#fff', fontWeight: 700}}>💥 溢出</span>
          )}
        </div>
      </div>

      {/* 时间线 */}
      <div style={{display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 300, overflowY: 'auto'}}>
        {strat.steps.slice(0, shown).map((s, i) => (
          <div
            key={i}
            style={{
              fontSize: '0.82rem',
              lineHeight: 1.55,
              padding: '5px 10px',
              borderRadius: 8,
              borderLeft: `3px solid ${STATUS_COLOR[s.status]}`,
              background: 'var(--ifm-color-emphasis-100)',
            }}
          >
            <b>第 {i + 1} 步</b> · {s.desc}
            <span style={{color: 'var(--ifm-color-emphasis-500)', marginLeft: 6, fontVariantNumeric: 'tabular-nums'}}>
              → {s.ctx.toLocaleString()}
            </span>
            {s.note && <div style={{color: STATUS_COLOR[s.status], fontSize: '0.78rem'}}>{s.note}</div>}
          </div>
        ))}
      </div>

      <BtnRow>
        <Btn primary onClick={() => setShown((s) => Math.min(strat.steps.length, s + 1))} disabled={done}>⏭ 下一步</Btn>
        <Btn primary onClick={auto} disabled={done}>▶ 自动跑完</Btn>
        <Btn onClick={() => {stop(); setShown(0);}}>↺ 重跑</Btn>
      </BtnRow>

      {done && <Message>{strat.outcome.good ? '✅' : '⚠️'} {strat.outcome.text}</Message>}
      {tried.size === STRATEGIES.length && (
        <Message>
          🎓 四种策略全部体验完毕。注意一个共同点：③ 和 ④ 的「多花一次调用」都花在了<b>信息还在的时候</b>——上下文管理和存钱一样，等到没了再想管就晚了。
        </Message>
      )}
    </PlaygroundCard>
  );
}
