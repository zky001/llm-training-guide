import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message} from '../ui';
import styles from '../playground.module.css';

/**
 * A4.1：模式拼装台。
 * 上半部分：五种工作流积木的图解陈列馆（点开看结构图 + 适用信号）。
 * 下半部分：配对小游戏——5 个真实场景，为每个选出最合适的模式。
 * 五模式出自 Anthropic《Building Effective Agents》(2024)。
 */

type PatternKey = 'chain' | 'route' | 'parallel' | 'orchestrator' | 'evaluator';

const box = (x: number, y: number, w: number, label: string, color: string, key?: string) => (
  <g key={key ?? label + x}>
    <rect x={x} y={y} width={w} height={30} rx={8} fill="none" stroke={color} strokeWidth={2} />
    <text x={x + w / 2} y={y + 20} textAnchor="middle" fontSize={11.5} fontWeight={600} fill={color}>{label}</text>
  </g>
);

const arrow = (x1: number, y1: number, x2: number, y2: number, key?: string, dash?: string) => (
  <g key={key ?? `${x1}-${y1}-${x2}`}>
    <line x1={x1} y1={y1} x2={x2 - 7} y2={y2} stroke="var(--viz-muted)" strokeWidth={1.8} strokeDasharray={dash} />
    <polygon
      points={`${x2},${y2} ${x2 - 8},${y2 - 4} ${x2 - 8},${y2 + 4}`}
      fill="var(--viz-muted)"
      transform={y1 !== y2 ? `rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI} ${x2} ${y2})` : undefined}
    />
  </g>
);

const PATTERNS: {key: PatternKey; name: string; oneLiner: string; signal: string; diagram: React.ReactNode}[] = [
  {
    key: 'chain',
    name: '⛓️ 提示链',
    oneLiner: '固定顺序串行：每步的输出是下一步的输入，步间可加检查闸门。',
    signal: '适用信号：任务能拆成固定顺序的几步，且每步都比整体更简单（先提纲 → 再成文 → 后翻译）。',
    diagram: (
      <svg viewBox="0 0 460 60">
        {box(10, 15, 90, '提取要点', 'var(--viz-s1)')}
        {arrow(100, 30, 135, 30)}
        {box(135, 15, 90, '检查闸门', 'var(--viz-s4)')}
        {arrow(225, 30, 260, 30)}
        {box(260, 15, 90, '撰写摘要', 'var(--viz-s1)')}
        {arrow(350, 30, 385, 30)}
        {box(385, 15, 65, '翻译', 'var(--viz-s1)')}
      </svg>
    ),
  },
  {
    key: 'route',
    name: '🔀 路由',
    oneLiner: '先分诊后处理：一次分类决定走哪条专门通道。',
    signal: '适用信号：输入天然分成几类，各类的最佳处理方式差异很大（退款问题和技术故障不该用同一套提示词）。',
    diagram: (
      <svg viewBox="0 0 460 100">
        {box(10, 35, 70, '输入', 'var(--viz-s1)')}
        {arrow(80, 50, 120, 50)}
        {box(120, 35, 80, '分类器', 'var(--viz-s6)')}
        {arrow(200, 45, 250, 20)}
        {arrow(200, 50, 250, 50)}
        {arrow(200, 55, 250, 80)}
        {box(250, 5, 120, '退款流程', 'var(--viz-s2)')}
        {box(250, 35, 120, '技术支持', 'var(--viz-s2)')}
        {box(250, 65, 120, '闲聊安抚', 'var(--viz-s2)')}
      </svg>
    ),
  },
  {
    key: 'parallel',
    name: '⚡ 并行',
    oneLiner: '多路同时跑：分片（各管一段）或投票（同题多做互相校验）。',
    signal: '适用信号：子任务互相独立可同时做；或一个结论值得多个独立视角交叉验证。',
    diagram: (
      <svg viewBox="0 0 460 100">
        {box(10, 35, 70, '任务', 'var(--viz-s1)')}
        {arrow(80, 45, 130, 20)}
        {arrow(80, 50, 130, 50)}
        {arrow(80, 55, 130, 80)}
        {box(130, 5, 110, '查安全漏洞', 'var(--viz-s5)')}
        {box(130, 35, 110, '查性能问题', 'var(--viz-s5)')}
        {box(130, 65, 110, '查代码风格', 'var(--viz-s5)')}
        {arrow(240, 20, 300, 45)}
        {arrow(240, 50, 300, 50)}
        {arrow(240, 80, 300, 55)}
        {box(300, 35, 90, '汇总', 'var(--viz-s7)')}
      </svg>
    ),
  },
  {
    key: 'orchestrator',
    name: '🎯 编排者-工人',
    oneLiner: '中枢现场拆任务、派工人、收成果——子任务是运行时动态决定的。',
    signal: '适用信号：要拆成几块、拆成什么块，事先不知道，得看了任务才能定（和「并行」的关键区别）。',
    diagram: (
      <svg viewBox="0 0 460 108">
        {box(10, 39, 90, '编排者', 'var(--viz-s6)')}
        {arrow(100, 45, 160, 22)}
        {arrow(100, 54, 160, 54)}
        {arrow(100, 63, 160, 86)}
        {box(160, 8, 100, '工人 1', 'var(--viz-s1)')}
        {box(160, 40, 100, '工人 2', 'var(--viz-s1)')}
        {box(160, 72, 100, '工人 …', 'var(--viz-s1)')}
        {arrow(260, 22, 330, 48)}
        {arrow(260, 54, 330, 54)}
        {arrow(260, 86, 330, 60)}
        {box(330, 39, 100, '汇总成品', 'var(--viz-s7)')}
      </svg>
    ),
  },
  {
    key: 'evaluator',
    name: '🔁 评估者-优化者',
    oneLiner: '一个生成、一个挑毛病，循环到达标——A2 反思模式的双角色版。',
    signal: '适用信号：有清晰的评价标准，且迭代确实能变好（翻译润色、代码过测试）。',
    diagram: (
      <svg viewBox="0 0 460 86">
        {box(30, 28, 100, '生成者', 'var(--viz-s1)')}
        {arrow(130, 38, 200, 38)}
        {box(200, 28, 100, '评估者', 'var(--viz-s6)')}
        {arrow(300, 38, 370, 38)}
        {box(370, 28, 70, '达标 ✓', 'var(--viz-s2)')}
        <path d="M 250 58 Q 250 80 165 80 Q 80 80 80 62" fill="none" stroke="var(--viz-muted)" strokeWidth={1.8} strokeDasharray="5 4" />
        <polygon points="80,58 76,67 84,67" fill="var(--viz-muted)" />
        <text x={165} y={76} textAnchor="middle" fontSize={10} fill="var(--viz-muted)">不达标 → 带着意见重来</text>
      </svg>
    ),
  },
];

const GAME: {task: string; answer: PatternKey; explain: string}[] = [
  {
    task: '客服收到一条消息，可能是退款、报障或闲聊，要交给对应的专门话术处理。',
    answer: 'route',
    explain: '输入天然分三类、各类处理方式迥异——先分诊、后处理，标准的路由场景。',
  },
  {
    task: '审一份合同：先提取全部条款，再逐条核对风险，最后生成审阅报告——三步固定不变。',
    answer: 'chain',
    explain: '步骤固定、顺序不变、每步产物是下一步的原料——提示链。不需要任何运行时决策。',
  },
  {
    task: '同一段代码，想让「安全、性能、风格」三个视角同时各查一遍，再合并结论。',
    answer: 'parallel',
    explain: '三个视角互相独立、可同时进行，最后汇总——并行（分片式）。串行做纯属浪费时间。',
  },
  {
    task: '写一份行业调研报告：具体要查哪几个子方向，得先看初步资料才能定，然后分头去查、最后统稿。',
    answer: 'orchestrator',
    explain: '子任务无法预先枚举，要由中枢看情况现拆现派——编排者-工人。若子方向固定不变，那就退化成并行。',
  },
  {
    task: '把一篇中文散文翻译成英文，反复润色，直到「信达雅」评分过 90 分为止。',
    answer: 'evaluator',
    explain: '有明确评价标准 + 迭代能变好——评估者-优化者循环。生成和评审由两个角色分担，比一个模型闷头改更稳。',
  },
];

export default function PatternStudio() {
  const [openPattern, setOpenPattern] = useState<PatternKey>('chain');
  const [round, setRound] = useState(0);
  const [answers, setAnswers] = useState<(PatternKey | null)[]>(() => GAME.map(() => null));

  const cur = PATTERNS.find((p) => p.key === openPattern)!;
  const gameDone = round >= GAME.length;
  const score = answers.filter((a, i) => a === GAME[i].answer).length;

  const pick = (k: PatternKey) => {
    if (gameDone) return;
    setAnswers((prev) => prev.map((a, i) => (i === round ? k : a)));
    setRound((r) => r + 1);
  };

  return (
    <PlaygroundCard
      title="模式拼装台：五种积木与配对挑战"
      subtitle="先逛陈列馆：点开每种积木看结构图和适用信号。然后做下面的配对挑战——给 5 个真实场景各选一块最合适的积木。（五模式出自 Anthropic《Building Effective Agents》，2024）"
      footer={
        <>
          💡 要点：五种积木没有高低之分，只有<b>合不合适</b>。判断口诀两连问：①步骤能不能提前定死？能 → 提示链/路由/并行（三选一看结构）；不能 → 编排者-工人。②产出有没有清晰的「及格线」且改了会变好？有 → 套一层评估者-优化者。积木还能互相嵌套——A5 章的多智能体系统，本质就是把「工人」也换成完整的智能体。
        </>
      }
    >
      {/* 陈列馆 */}
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8}}>
        {PATTERNS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={styles.btn}
            style={p.key === openPattern ? {background: 'var(--ifm-color-primary)', color: '#fff', borderColor: 'var(--ifm-color-primary)'} : {}}
            onClick={() => setOpenPattern(p.key)}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div style={{border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: 12, padding: '10px 14px', marginBottom: 14}}>
        <div style={{fontWeight: 700, marginBottom: 2}}>{cur.name}</div>
        <div style={{fontSize: '0.86rem', marginBottom: 6}}>{cur.oneLiner}</div>
        <div className={styles.svgWrap}>{cur.diagram}</div>
        <div style={{fontSize: '0.82rem', color: 'var(--ifm-color-emphasis-700)', marginTop: 6}}>🧭 {cur.signal}</div>
      </div>

      {/* 配对挑战 */}
      <div style={{fontSize: '0.92rem', fontWeight: 700, marginBottom: 6}}>
        🎯 配对挑战{gameDone ? `：完成！答对 ${score} / ${GAME.length}` : `（第 ${round + 1} / ${GAME.length} 题）`}
      </div>

      {!gameDone ? (
        <>
          <div style={{padding: '10px 14px', borderRadius: 10, background: 'var(--ifm-color-emphasis-100)', fontSize: '0.9rem', marginBottom: 8}}>
            {GAME[round].task}
          </div>
          <BtnRow>
            {PATTERNS.map((p) => (
              <Btn key={p.key} onClick={() => pick(p.key)}>{p.name}</Btn>
            ))}
          </BtnRow>
        </>
      ) : (
        <>
          {GAME.map((g, i) => {
            const mine = answers[i];
            const hit = mine === g.answer;
            const mineName = PATTERNS.find((p) => p.key === mine)?.name ?? '—';
            const ansName = PATTERNS.find((p) => p.key === g.answer)!.name;
            return (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: `1.5px solid ${hit ? 'var(--viz-good)' : 'var(--viz-s4)'}`,
                  marginBottom: 6,
                  fontSize: '0.84rem',
                  lineHeight: 1.65,
                }}
              >
                <b>{hit ? '✅' : '❌'} 第 {i + 1} 题</b> · {g.task}
                <div style={{color: 'var(--ifm-color-emphasis-700)'}}>
                  你选：{mineName}｜答案：{ansName}。{g.explain}
                </div>
              </div>
            );
          })}
          <BtnRow>
            <Btn primary onClick={() => {setRound(0); setAnswers(GAME.map(() => null));}}>↺ 再来一轮</Btn>
          </BtnRow>
          {score === GAME.length && <Message>🏆 全对！你已经掌握了工作流选型的手感——这五块积木够搭出生产环境里九成的 LLM 系统。</Message>}
        </>
      )}
    </PlaygroundCard>
  );
}
