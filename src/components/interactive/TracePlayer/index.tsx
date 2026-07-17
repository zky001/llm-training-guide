import React, {useEffect, useRef, useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message, Stat, StatRow} from '../ui';
import styles from '../playground.module.css';

/**
 * A0：行动循环播放器。
 * 步进播放一条预录的智能体轨迹（思考→行动→观察循环），
 * 并可切换查看「纯聊天模式」对同一请求的无力回答。
 * 轨迹为教学构造，格式参考主流智能体框架的真实日志。
 */

type StepType = 'user' | 'think' | 'act' | 'observe' | 'answer';

interface TraceStep {
  type: StepType;
  loop?: number; // 第几轮循环
  text: string;
  code?: string; // 工具调用/返回的 JSON
}

const TRACE: TraceStep[] = [
  {
    type: 'user',
    text: '明天上午 10 点我约了客户在公司开会。看下明天北京的天气，要是下雨，把会改成线上并通知对方。',
  },
  {
    type: 'think',
    loop: 1,
    text: '要不要改会议取决于天气——我现在不知道明天的天气，先查。',
  },
  {type: 'act', loop: 1, text: '调用天气工具', code: 'get_weather({"city": "北京", "date": "明天"})'},
  {type: 'observe', loop: 1, text: '工具返回', code: '{"condition": "中雨", "temp": "22°C", "rain_prob": 0.9}'},
  {
    type: 'think',
    loop: 2,
    text: '降水概率 90%，符合用户说的「下雨」条件 → 需要改会。先找到那条日程。',
  },
  {type: 'act', loop: 2, text: '调用日历工具', code: 'calendar_list({"date": "明天"})'},
  {
    type: 'observe',
    loop: 2,
    text: '工具返回',
    code: '[{"id": "evt_301", "time": "10:00", "title": "客户会议", "attendees": ["王总"]}]',
  },
  {
    type: 'think',
    loop: 3,
    text: '找到了：evt_301。把地点改为线上，并勾选「通知参会人」。',
  },
  {
    type: 'act',
    loop: 3,
    text: '调用日历修改工具',
    code: 'calendar_update({"id": "evt_301", "location": "线上（视频会议）", "notify": true})',
  },
  {type: 'observe', loop: 3, text: '工具返回', code: '{"ok": true, "notified": ["王总"]}'},
  {
    type: 'answer',
    text: '明天北京有中雨（降水概率 90%）。我已经把上午 10 点的客户会议改成线上，并通知了王总。建议提前 10 分钟测试一下会议链接。',
  },
];

const STYLE: Record<StepType, {icon: string; name: string; color: string}> = {
  user: {icon: '🧑‍💻', name: '用户', color: 'var(--viz-muted)'},
  think: {icon: '🤔', name: '思考', color: 'var(--viz-s1)'},
  act: {icon: '🔧', name: '行动', color: 'var(--viz-s6)'},
  observe: {icon: '👀', name: '观察', color: 'var(--viz-s2)'},
  answer: {icon: '✅', name: '回答', color: 'var(--viz-s7)'},
};

const CHAT_REPLY =
  '好的！建议你明早先查看天气预报。如果预报有雨，你可以打开日历把会议地点改为线上，并记得发消息通知客户。需要我帮你起草一条通知消息吗？';

export default function TracePlayer() {
  const [shown, setShown] = useState(1); // 已展示的步数
  const [running, setRunning] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
  };

  useEffect(() => () => stop(), []);

  const auto = () => {
    if (running) {
      stop();
      return;
    }
    setRunning(true);
    timer.current = setInterval(() => {
      setShown((s) => {
        if (s >= TRACE.length) {
          stop();
          return s;
        }
        return s + 1;
      });
    }, 1100);
  };

  const done = shown >= TRACE.length;
  const loops = Math.max(0, ...TRACE.slice(0, shown).map((s) => s.loop ?? 0));
  const toolCalls = TRACE.slice(0, shown).filter((s) => s.type === 'act').length;

  return (
    <PlaygroundCard
      title="行动循环播放器：智能体的心跳"
      subtitle="下面是一条智能体轨迹（教学构造，格式参考真实框架日志）。点「下一步」，看它怎么用「思考 → 行动 → 观察」的循环把一句话需求真正办完。"
      footer={
        <>
          💡 要点：智能体没有任何新魔法——每一次「思考」都只是上篇讲过的<b>下一个 token 预测</b>。新的只有一件事：模型的输出可以是<b>工具调用</b>，工具的结果又拼回上下文，形成循环。聊天模式一轮就结束；智能体的循环转到任务完成为止。
        </>
      }
    >
      {/* 进度点 */}
      <div style={{display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10}}>
        {TRACE.map((s, i) => (
          <span
            key={i}
            title={STYLE[s.type].name}
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: i < shown ? STYLE[s.type].color : 'var(--ifm-color-emphasis-200)',
              display: 'inline-block',
              cursor: 'pointer',
            }}
            onClick={() => {
              stop();
              setShown(i + 1);
            }}
          />
        ))}
      </div>

      {/* 轨迹步骤 */}
      <div style={{display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto'}}>
        {TRACE.slice(0, shown).map((s, i) => {
          const st = STYLE[s.type];
          return (
            <div
              key={i}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                borderLeft: `4px solid ${st.color}`,
                background: 'var(--ifm-color-emphasis-100)',
                fontSize: '0.88rem',
                lineHeight: 1.65,
              }}
            >
              <b style={{color: st.color}}>
                {st.icon} {st.name}
                {s.loop ? `（第 ${s.loop} 轮循环）` : ''}：
              </b>{' '}
              {s.text}
              {s.code && (
                <pre style={{margin: '6px 0 0', padding: '6px 10px', fontSize: '0.78rem', lineHeight: 1.5}}>
                  {s.code}
                </pre>
              )}
            </div>
          );
        })}
      </div>

      <StatRow>
        <Stat label="已完成循环" value={`${loops} 轮`} />
        <Stat label="工具调用次数" value={toolCalls} />
        <Stat label="任务状态" value={done ? <span style={{color: 'var(--viz-good)'}}>✅ 已办完</span> : '进行中…'} />
      </StatRow>

      <BtnRow>
        <Btn primary onClick={() => setShown((s) => Math.min(TRACE.length, s + 1))} disabled={done || running}>
          ⏭ 下一步
        </Btn>
        <Btn primary onClick={auto} disabled={done}>{running ? '⏸ 暂停' : '▶ 自动播放'}</Btn>
        <Btn onClick={() => {stop(); setShown(1); setShowChat(false);}}>↺ 重放</Btn>
        <Btn onClick={() => setShowChat((v) => !v)}>{showChat ? '收起对比' : '💬 对比：纯聊天模式会怎么回'}</Btn>
      </BtnRow>

      {showChat && (
        <Message>
          💬 <b>同一个模型、没有工具时只能这样回答：</b>「{CHAT_REPLY}」——它说得头头是道，但天气没查、会议没改、通知没发，<b>所有事还是你自己做</b>。给模型一双手（工具）和一个循环，「建议」才变成「办完」。
        </Message>
      )}
    </PlaygroundCard>
  );
}
