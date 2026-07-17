import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message} from '../ui';
import styles from '../playground.module.css';

/**
 * A7.3：轨迹排错游戏。
 * 给一条最终失败的智能体轨迹，让读者找出「第一处出错的步骤」（根因步）。
 * 教学点：智能体排错的关键是定位「第一张倒下的多米诺」，而非最后崩溃的那一步。
 * 轨迹为教学构造。
 */

interface TraceStep {
  n: number;
  kind: string;
  text: string;
  isRootCause?: boolean;
  isSymptom?: boolean; // 由根因导致的连锁错误
}

interface Puzzle {
  task: string;
  steps: TraceStep[];
  rootStep: number;
  explain: string;
  fix: string;
}

const PUZZLES: Puzzle[] = [
  {
    task: '任务：帮用户订一张 7 月 20 日北京飞上海的机票，预算 1000 元以内。',
    steps: [
      {n: 1, kind: '🤔 思考', text: '需要查航班。调用航班搜索工具。'},
      {n: 2, kind: '🔧 行动', text: 'search_flights(from="北京", to="上海", date="2026-07-02")', isRootCause: true},
      {n: 3, kind: '👀 观察', text: '返回 7 月 2 日的航班列表，最低 780 元。'},
      {n: 4, kind: '🤔 思考', text: '780 元在预算内，选这班。'},
      {n: 5, kind: '🔧 行动', text: 'book_flight(flight_id="MU5102", date="2026-07-02")', isSymptom: true},
      {n: 6, kind: '✅ 回答', text: '已为你订好 7 月 2 日北京飞上海的机票，780 元。', isSymptom: true},
    ],
    rootStep: 2,
    explain: '第 2 步把日期填成了 07-02 而不是 07-20——一个参数打错。后面每一步（查到的航班、下的单、给用户的答复）都是"正确地"基于这个错日期展开的，所以第 5、6 步看起来毫无破绽，实则全错。',
    fix: '根因是工具参数错误。防线：调用前校验参数（日期是否等于用户所说）、下单这类高危动作执行前向用户确认（A8 的 human-in-the-loop）。',
  },
  {
    task: '任务：统计 sales.csv 里 3 月份的总销售额。',
    steps: [
      {n: 1, kind: '🤔 思考', text: '先读取文件看看结构。'},
      {n: 2, kind: '🔧 行动', text: 'read_file("sales.csv") → 前 5 行，含列：date, product, amount'},
      {n: 3, kind: '🤔 思考', text: '筛选 date 以 "2026-03" 开头的行，把 amount 加起来。写代码。'},
      {n: 4, kind: '🔧 行动', text: 'df[df.date.str.startswith("2026-3")].amount.sum()', isRootCause: true},
      {n: 5, kind: '👀 观察', text: '结果：0 元。', isSymptom: true},
      {n: 6, kind: '🤔 思考', text: '3 月销售额是 0？可能这个月没数据。', isSymptom: true},
      {n: 7, kind: '✅ 回答', text: '经统计，3 月份总销售额为 0 元。', isSymptom: true},
    ],
    rootStep: 4,
    explain: '第 4 步的筛选前缀写成了 "2026-3"，但文件里的日期格式是 "2026-03"（补零）。前缀对不上，筛出 0 行，自然求和为 0。第 6 步模型没有质疑这个可疑的 0，反而给它编了个合理解释——这比报错更危险。',
    fix: '根因是格式假设错误。防线：对"可疑的干净结果"（0、空、极端值）保持警惕并加一步自查（回扣 A2 反思）；先打印几行确认格式再写筛选。',
  },
];

export default function TraceDebugger() {
  const [pIdx, setPIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const puzzle = PUZZLES[pIdx];
  const correct = picked === puzzle.rootStep;

  const next = () => {
    setPIdx((i) => (i + 1) % PUZZLES.length);
    setPicked(null);
  };

  return (
    <PlaygroundCard
      title="轨迹排错游戏：找出第一张倒下的多米诺"
      subtitle="下面是一条最终失败的智能体轨迹。你的任务：点出「第一处真正出错的步骤」——不是最后崩溃的那步，而是让后面全盘皆错的根因步。（轨迹为教学构造）"
      footer={
        <>
          💡 要点：智能体排错的核心手艺是<b>定位根因步</b>，而不是盯着最后的错误结果。因为一旦某步错了，后面每一步都会"正确地"基于错误前提继续推进——错误会被后续步骤伪装得天衣无缝。这就是为什么<b>完整的轨迹日志</b>是智能体工程的命根子（A4 组合系统那节也强调过）：没有轨迹，你只能看到"订错了票"，有轨迹，你才能看到"第 2 步日期填错了"。
        </>
      }
    >
      <div style={{padding: '10px 14px', borderRadius: 10, background: 'var(--ifm-color-emphasis-100)', fontWeight: 600, fontSize: '0.9rem', marginBottom: 10}}>
        {puzzle.task}
        <div style={{fontWeight: 400, fontSize: '0.82rem', color: 'var(--viz-bad)', marginTop: 2}}>❌ 最终结果是错的。第一处出错的是哪一步？</div>
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
        {puzzle.steps.map((s) => {
          const isPicked = picked === s.n;
          const revealed = picked !== null;
          const showRoot = revealed && s.isRootCause;
          const showSymptom = revealed && s.isSymptom;
          return (
            <button
              key={s.n}
              type="button"
              disabled={revealed}
              onClick={() => setPicked(s.n)}
              style={{
                textAlign: 'left',
                padding: '8px 12px',
                borderRadius: 10,
                border: `1.5px solid ${
                  showRoot ? 'var(--viz-good)' : isPicked && !correct ? 'var(--viz-bad)' : 'var(--ifm-color-emphasis-300)'
                }`,
                background: showRoot
                  ? 'rgba(12,163,12,0.08)'
                  : showSymptom
                    ? 'rgba(208,59,59,0.05)'
                    : 'var(--ifm-background-surface-color)',
                color: 'var(--ifm-font-color-base)',
                cursor: revealed ? 'default' : 'pointer',
                fontSize: '0.85rem',
                lineHeight: 1.6,
              }}
            >
              <b>第 {s.n} 步 · {s.kind}</b>
              {showRoot && <span style={{color: 'var(--viz-good)', fontWeight: 700}}> ← 🎯 根因就在这</span>}
              {showSymptom && <span style={{color: 'var(--viz-bad)'}}> （连锁错误：基于错误前提的"正确"操作）</span>}
              <div style={{fontFamily: s.kind.includes('行动') ? 'var(--ifm-font-family-monospace)' : 'inherit', fontSize: s.kind.includes('行动') ? '0.78rem' : '0.85rem'}}>{s.text}</div>
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <Message>
          {correct ? '✅ 找对了！' : `🤔 你选了第 ${picked} 步，但真正的根因是第 ${puzzle.rootStep} 步。`}
          {puzzle.explain}
          <div style={{marginTop: 6}}>🛠️ <b>怎么防：</b>{puzzle.fix}</div>
        </Message>
      )}

      <BtnRow>
        {picked !== null && <Btn primary onClick={next}>下一道 →</Btn>}
        {picked !== null && <Btn onClick={() => setPicked(null)}>↺ 重做本题</Btn>}
      </BtnRow>
    </PlaygroundCard>
  );
}
