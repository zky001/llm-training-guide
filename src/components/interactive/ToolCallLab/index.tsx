import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message} from '../ui';
import styles from '../playground.module.css';

/**
 * A1：工具调用 Playground。
 * 给「模型」配 5 个工具，选一个问题，分三步看它：选工具 → 填参数 → 用结果回答。
 * 决策与结果为规则模拟（真实模型的选择是训练出来的，不是规则匹配——正文会强调）。
 * 「含糊描述」开关演示：工具描述写得烂，模型就会选错。
 */

interface Tool {
  name: string;
  desc: string;
  vagueDesc: string;
  params: string;
}

const TOOLS: Tool[] = [
  {name: 'calculator', desc: '计算数学表达式，支持四则运算和括号', vagueDesc: '一个有用的工具', params: '{"expression": "字符串"}'},
  {name: 'get_weather', desc: '查询指定城市未来 3 天的天气预报', vagueDesc: '获取信息', params: '{"city": "字符串", "date": "字符串"}'},
  {name: 'exchange_rate', desc: '按实时汇率换算两种货币的金额', vagueDesc: '处理数字', params: '{"amount": "数字", "from": "币种", "to": "币种"}'},
  {name: 'web_search', desc: '搜索互联网，获取最新的公开信息', vagueDesc: '查询东西', params: '{"query": "字符串"}'},
  {name: 'calendar_list', desc: '查看用户自己的日程安排', vagueDesc: '列出内容', params: '{"date": "字符串"}'},
];

interface Question {
  q: string;
  tool: string | null; // null = 不需要工具
  reason: string;
  call?: string;
  result?: string;
  answer: string;
  /** 含糊描述模式下的错误行为 */
  vagueTool: string | null;
  vagueOutcome: string;
}

const QUESTIONS: Question[] = [
  {
    q: '37 × 48 + 129 等于多少？',
    tool: 'calculator',
    reason: '这是确定性的算术题。我心算容易错（上篇 5.6 讲过我并不擅长精确计算），交给计算器最稳。',
    call: 'calculator({"expression": "37*48+129"})',
    result: '{"value": 1905}',
    answer: '37 × 48 + 129 = 1905。',
    vagueTool: null,
    vagueOutcome: '五个工具的描述都看不出哪个能算数，模型索性自己心算，答了 1885——错的。',
  },
  {
    q: '明天去上海出差，需要带厚外套吗？',
    tool: 'get_weather',
    reason: '「带不带厚外套」取决于明天上海的气温——这是我训练数据里没有的实时信息，必须查天气。',
    call: 'get_weather({"city": "上海", "date": "明天"})',
    result: '{"condition": "晴", "low": "9°C", "high": "16°C"}',
    answer: '明天上海晴，9~16°C，早晚偏凉，建议带一件厚外套。',
    vagueTool: 'web_search',
    vagueOutcome: '描述含糊时模型退而选了「查询东西」（web_search），搜到的是上周的旧闻气温，给出了过时建议。',
  },
  {
    q: '899 美元大概是多少人民币？',
    tool: 'exchange_rate',
    reason: '汇率每天在变，我记忆里的数字是过时的——要用实时汇率工具。',
    call: 'exchange_rate({"amount": 899, "from": "USD", "to": "CNY"})',
    result: '{"value": 6421.6, "rate": 7.14}',
    answer: '按当前汇率（1 美元 ≈ 7.14 元），899 美元约合 6422 元人民币。',
    vagueTool: 'calculator',
    vagueOutcome: '模型选了「处理数字」听起来最像的 calculator，但它不知道汇率，只好用记忆里的旧汇率 6.9 硬算——差了 200 多块。',
  },
  {
    q: '今天下午三点我有空吗？',
    tool: 'calendar_list',
    reason: '用户的私人日程不在我的训练数据里，也搜不到——只有日历工具能看到。',
    call: 'calendar_list({"date": "今天"})',
    result: '[{"time": "14:00-15:30", "title": "产品评审会"}]',
    answer: '恐怕没空：你 14:00-15:30 有一场产品评审会，和三点冲突了。',
    vagueTool: 'web_search',
    vagueOutcome: '模型拿着「今天下午三点我有空吗」去搜索了互联网……当然一无所获，只能反问用户。私人数据配错工具，任务直接失败。',
  },
  {
    q: '你好呀，今天心情不错！',
    tool: null,
    reason: '这只是寒暄——不缺任何信息，不需要动用任何工具，直接回应就好。工具不是越多用越好。',
    answer: '你好！听起来今天是个好日子 😄 有什么我能帮上忙的吗？',
    vagueTool: null,
    vagueOutcome: '这题不受影响：寒暄本来就不需要工具。',
  },
];

export default function ToolCallLab() {
  const [qIdx, setQIdx] = useState<number | null>(null);
  const [stage, setStage] = useState(0); // 0=未开始 1=已选工具 2=已调用 3=已回答
  const [vague, setVague] = useState(false);

  const q = qIdx !== null ? QUESTIONS[qIdx] : null;
  const pickQuestion = (i: number) => {
    setQIdx(i);
    setStage(1);
  };

  const effectiveTool = q ? (vague ? q.vagueTool : q.tool) : null;

  return (
    <PlaygroundCard
      title="工具调用 Playground：模型是怎么「伸手」的"
      subtitle="左边是模型的工具箱（每个工具带一份「说明书」）。选一个问题，分步看模型：读说明书选工具 → 按参数格式填调用 → 拿结果组织回答。再试试「含糊描述」开关，看说明书写烂了会发生什么。"
      footer={
        <>
          💡 要点：模型全程只做了它唯一会做的事——<b>生成文本</b>（这次生成的是 JSON 格式的调用请求），真正「执行」的是外面的普通程序。所以工具描述就是<b>接口文档</b>：模型选没选对工具、参数填没填对，很大程度取决于你的描述写得清不清楚。本演示的决策为规则模拟；真实模型的工具选择是训练出来的直觉，没有如此整齐的规则。
        </>
      }
    >
      {/* 工具箱 */}
      <div style={{fontSize: '0.88rem', fontWeight: 700, marginBottom: 6}}>🧰 工具箱（模型能看到的说明书）：</div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 10}}>
        {TOOLS.map((t) => {
          const active = q && effectiveTool === t.name && stage >= 1;
          return (
            <div
              key={t.name}
              style={{
                padding: '8px 10px',
                borderRadius: 10,
                border: `1.5px solid ${active ? 'var(--viz-s6)' : 'var(--ifm-color-emphasis-300)'}`,
                background: active ? 'rgba(235,104,52,0.08)' : 'var(--ifm-background-surface-color)',
                fontSize: '0.8rem',
                lineHeight: 1.55,
              }}
            >
              <code style={{fontWeight: 700}}>{t.name}</code>
              <div style={{color: vague ? 'var(--viz-bad)' : 'var(--ifm-color-emphasis-700)'}}>
                {vague ? t.vagueDesc : t.desc}
              </div>
              <div style={{color: 'var(--ifm-color-emphasis-500)', fontSize: '0.72rem'}}>参数：{t.params}</div>
            </div>
          );
        })}
      </div>

      <label style={{fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10}}>
        <input type="checkbox" checked={vague} onChange={(e) => {setVague(e.target.checked); setStage(qIdx !== null ? 1 : 0);}} />
        ⚠️ 把工具描述换成含糊版（体验烂文档的后果）
      </label>

      {/* 问题选择 */}
      <div style={{fontSize: '0.88rem', fontWeight: 700, marginBottom: 6}}>选一个问题扔给模型：</div>
      <BtnRow>
        {QUESTIONS.map((question, i) => (
          <Btn key={i} primary={qIdx === i} onClick={() => pickQuestion(i)}>
            {question.q.length > 16 ? question.q.slice(0, 15) + '…' : question.q}
          </Btn>
        ))}
      </BtnRow>

      {q && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8}}>
          <div style={{padding: '8px 12px', borderRadius: 10, background: 'var(--ifm-color-emphasis-100)', fontWeight: 600, fontSize: '0.9rem'}}>
            🧑‍💻 {q.q}
          </div>

          {/* 第 1 步：决策 */}
          {stage >= 1 && (
            <div style={{padding: '8px 12px', borderRadius: 10, borderLeft: '4px solid var(--viz-s1)', background: 'var(--ifm-color-emphasis-100)', fontSize: '0.86rem', lineHeight: 1.65}}>
              <b style={{color: 'var(--viz-s1)'}}>🤔 第 1 步 · 模型决策：</b>{' '}
              {vague && q.vagueTool !== q.tool ? (
                <>{q.vagueOutcome.split('，')[0]}…（说明书没写清楚，只能瞎猜）</>
              ) : (
                q.reason
              )}
              {effectiveTool ? (
                <div style={{marginTop: 4}}>→ 选择工具：<code style={{fontWeight: 700}}>{effectiveTool}</code></div>
              ) : (
                <div style={{marginTop: 4}}>→ 结论：<b>不需要工具</b>，直接回答。</div>
              )}
            </div>
          )}

          {/* 第 2 步：调用与结果 */}
          {stage >= 2 && !vague && q.call && (
            <div style={{padding: '8px 12px', borderRadius: 10, borderLeft: '4px solid var(--viz-s6)', background: 'var(--ifm-color-emphasis-100)', fontSize: '0.86rem'}}>
              <b style={{color: 'var(--viz-s6)'}}>🔧 第 2 步 · 生成调用（这也是「生成文本」！）：</b>
              <pre style={{margin: '6px 0', padding: '6px 10px', fontSize: '0.78rem'}}>{q.call}</pre>
              <b style={{color: 'var(--viz-s2)'}}>👀 外部程序执行后返回：</b>
              <pre style={{margin: '6px 0 0', padding: '6px 10px', fontSize: '0.78rem'}}>{q.result}</pre>
            </div>
          )}

          {/* 第 3 步：回答 */}
          {stage >= (q.call && !vague ? 3 : 2) && (
            <div style={{padding: '8px 12px', borderRadius: 10, borderLeft: '4px solid var(--viz-s7)', background: 'var(--ifm-color-emphasis-100)', fontSize: '0.86rem', lineHeight: 1.65}}>
              <b style={{color: 'var(--viz-s7)'}}>✅ 最终回答：</b>{' '}
              {vague ? q.vagueOutcome : q.answer}
            </div>
          )}

          {stage < (q.call && !vague ? 3 : 2) && (
            <BtnRow>
              <Btn primary onClick={() => setStage((s) => s + 1)}>⏭ 下一步</Btn>
            </BtnRow>
          )}
        </div>
      )}

      {q && vague && stage >= 2 && q.vagueTool !== q.tool && (
        <Message>
          🪤 看到了吗：同一个模型、同一个问题，只是把说明书写含糊，任务就砸了。<b>工具描述是给模型看的接口文档</b>——写工具时最值得花时间的地方，往往不是代码，而是那一句描述。
        </Message>
      )}
      {!q && (
        <Message>👆 先从上面选一个问题。建议顺序体验：算术 → 天气 → 汇率 → 日程 → 寒暄（最后一个会教你「不用工具」也是一种正确决策）。</Message>
      )}
    </PlaygroundCard>
  );
}
