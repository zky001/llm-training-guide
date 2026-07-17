import React, {useEffect, useRef, useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message, Stat, StatRow} from '../ui';
import styles from '../playground.module.css';

/**
 * A6.1：SWE 智能体重放。
 * 步进一次真实感的「修 bug」轨迹：读 issue → 复现 → 定位 → 改 → 跑测试 → 通过。
 * 中途插入一次失败（改错地方，测试没过），演示「测试反馈驱动的反思」是可验证性带来的红利。
 * 轨迹为教学构造。
 */

type Kind = 'issue' | 'think' | 'tool' | 'result' | 'fail' | 'done';

interface Step {
  kind: Kind;
  text: string;
  code?: string;
}

const STEPS: Step[] = [
  {kind: 'issue', text: '📋 Issue #482：购物车合计金额算错了。加入两件 ¥19.90 的商品，结算显示 ¥39.80——但用了优惠券 -¥5 后，显示的是 ¥34.80，正确应为 ¥34.80……不对，用户说满减是"满40减5"，39.80 没到 40，根本不该减。'},
  {kind: 'think', text: '🤔 先复现：写一个最小测试，两件 19.90 + 满40减5 优惠券，断言最终金额 = 39.80（不满足满减条件）。'},
  {kind: 'tool', text: '🔧 运行测试（复现 bug）', code: '$ pytest tests/test_cart.py::test_coupon_threshold\nFAIL: expected 39.80, got 34.80'},
  {kind: 'result', text: '👀 确认复现：系统错误地减了 5 元。现在去定位判断满减门槛的代码。'},
  {kind: 'tool', text: '🔧 搜索优惠券逻辑', code: '$ grep -rn "threshold" src/\nsrc/coupon.py:23:  if subtotal >= coupon.threshold:'},
  {kind: 'think', text: '🤔 读 coupon.py 第 20~28 行……可疑：subtotal 在这里是「打折前每件价格之和」还是「已经过某种处理的值」？先看它怎么来的。'},
  {kind: 'tool', text: '🔧 查看 subtotal 的计算', code: 'src/cart.py:41:  subtotal = sum(round(i.price) for i in items)  # 逐件四舍五入'},
  {kind: 'fail', text: '💡 找到嫌疑：subtotal 把每件 19.90 先四舍五入成 20，两件 = 40，于是"满40"成立！改法一（先试错的方向）：把满减门槛从 40 改成 41。', code: '- if subtotal >= 40:\n+ if subtotal >= 41:'},
  {kind: 'tool', text: '🔧 跑测试验证改法一', code: '$ pytest tests/test_cart.py\nFAIL: test_coupon_exact_40 —— 正好满 40 的订单不再享受满减了！'},
  {kind: 'result', text: '👀 改法一治标不治本：它误伤了「真的满 40」的订单。测试帮我挡住了一个错误修复——回到根因：不该在金额上做逐件四舍五入。'},
  {kind: 'think', text: '🤔 真正的根因是 cart.py 第 41 行的 round()。金额计算应全程用精确的分为单位，最后才格式化显示。改这里。'},
  {kind: 'tool', text: '🔧 修复根因', code: '- subtotal = sum(round(i.price) for i in items)\n+ subtotal = sum(i.price for i in items)  # 保留精确金额'},
  {kind: 'tool', text: '🔧 跑完整测试套件', code: '$ pytest\n===== 47 passed in 2.3s ====='},
  {kind: 'done', text: '✅ 全部测试通过。根因是金额被逐件四舍五入导致虚增，已改为全程精确计算。附上复现测试与修复 diff，提交 PR。'},
];

const KIND_STYLE: Record<Kind, {color: string}> = {
  issue: {color: 'var(--viz-muted)'},
  think: {color: 'var(--viz-s1)'},
  tool: {color: 'var(--viz-s6)'},
  result: {color: 'var(--viz-s2)'},
  fail: {color: 'var(--viz-s4)'},
  done: {color: 'var(--viz-s7)'},
};

export default function SweAgentReplay() {
  const [shown, setShown] = useState(1);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
  };
  useEffect(() => () => stop(), []);

  const done = shown >= STEPS.length;
  const toolRuns = STEPS.slice(0, shown).filter((s) => s.kind === 'tool').length;
  const testRuns = STEPS.slice(0, shown).filter((s) => s.code?.includes('pytest') || s.code?.includes('PASS') || s.code?.includes('passed')).length;

  const auto = () => {
    if (running) return stop();
    setRunning(true);
    timer.current = setInterval(() => {
      setShown((s) => {
        if (s >= STEPS.length) {
          stop();
          return s;
        }
        return s + 1;
      });
    }, 1300);
  };

  return (
    <PlaygroundCard
      title="SWE 智能体重放：看它修一个真 bug"
      subtitle="步进一次代码智能体修复购物车金额 bug 的完整轨迹（教学构造）。注意中途它试错了一次——是「测试」把它拉了回来。"
      footer={
        <>
          💡 要点：代码智能体是所有智能体里最成熟的一类，秘密不在模型更聪明，而在环境<b>能自动判对错</b>——测试跑没跑过是客观的、即时的、无需人评的反馈。这让 A2 的「反思」有了坚实依据（回扣「有依据的反思 vs 空想的反思」），也让 A2 讲的训练能用可验证奖励（上篇 RLVR）。可验证性，是代码领域一路领跑的根本原因。
        </>
      }
    >
      {/* 进度点 */}
      <div style={{display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10}}>
        {STEPS.map((s, i) => (
          <span
            key={i}
            title={s.kind}
            style={{
              width: 13, height: 13, borderRadius: 3,
              background: i < shown ? KIND_STYLE[s.kind].color : 'var(--ifm-color-emphasis-200)',
              display: 'inline-block', cursor: 'pointer',
            }}
            onClick={() => {stop(); setShown(i + 1);}}
          />
        ))}
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 400, overflowY: 'auto'}}>
        {STEPS.slice(0, shown).map((s, i) => (
          <div
            key={i}
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              borderLeft: `4px solid ${KIND_STYLE[s.kind].color}`,
              background: s.kind === 'fail' ? 'rgba(250,178,25,0.08)' : 'var(--ifm-color-emphasis-100)',
              fontSize: '0.85rem',
              lineHeight: 1.65,
            }}
          >
            {s.text}
            {s.code && <pre style={{margin: '6px 0 0', padding: '6px 10px', fontSize: '0.76rem', lineHeight: 1.5}}>{s.code}</pre>}
          </div>
        ))}
      </div>

      <StatRow>
        <Stat label="工具调用" value={toolRuns} />
        <Stat label="其中跑测试" value={testRuns} />
        <Stat label="试错纠正" value={shown > 9 ? '1 次（被测试拦下）' : shown > 8 ? '进行中…' : '0'} />
        <Stat label="状态" value={done ? <span style={{color: 'var(--viz-good)'}}>✅ PR 就绪</span> : '修复中…'} />
      </StatRow>

      <BtnRow>
        <Btn primary onClick={() => setShown((s) => Math.min(STEPS.length, s + 1))} disabled={done || running}>⏭ 下一步</Btn>
        <Btn primary onClick={auto} disabled={done}>{running ? '⏸ 暂停' : '▶ 自动重放'}</Btn>
        <Btn onClick={() => {stop(); setShown(1);}}>↺ 重放</Btn>
      </BtnRow>

      {shown > 9 && shown < 13 && (
        <Message>
          🛡️ 关键一幕：智能体第一次改错了方向（把门槛 40 改成 41），但完整测试套件里另一条用例立刻失败，把它拦了下来。<b>没有测试，这个「治标不治本」的改动就会被当成成功提交</b>——这就是可验证环境的价值。
        </Message>
      )}
      {done && (
        <Message>
          🏁 修复完成。回看整条轨迹：复现 → 定位 → 试错 → 被测试纠正 → 找到根因 → 验证。它和人类工程师的调试流程几乎一样——因为它就是在人类的代码、issue、提交记录上训练出来的（上篇第 4~5 章）。
        </Message>
      )}
    </PlaygroundCard>
  );
}
