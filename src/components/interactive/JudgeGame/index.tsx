import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message} from '../ui';
import styles from '../playground.module.css';

/**
 * 7.3 节：盲评小游戏。
 * 3 道题、每题两个匿名回答，用户选出更好的一个；
 * 揭晓页说明每道题暗中考察的评测偏差（长度/自信/文风）。
 * 所有回答为教学构造，不代表任何真实模型。
 */

interface Round {
  q: string;
  a: string;
  b: string;
  bias: string;
  trap: 'a' | 'b'; // 陷阱选项
  reveal: string;
}

const ROUNDS: Round[] = [
  {
    q: '用一句话解释什么是光合作用。',
    a: '光合作用是植物利用光能，把二氧化碳和水转化成养分（葡萄糖）并放出氧气的过程。',
    b: '光合作用是自然界最重要的能量转换过程之一。它发生在植物叶片的叶绿体中，分为光反应和暗反应两个阶段：光反应阶段，叶绿素吸收光能分解水分子……（此处展开约 300 字，内容全部正确，但完全没有理会「一句话」的要求）',
    bias: '长度偏差',
    trap: 'b',
    reveal:
      '乙的内容更「丰富」，但题目明确要求「一句话」——它没有遵循指令。自动评测里，裁判模型（和不少人类）会系统性偏爱更长、更详细的回答，哪怕它答非所问。榜单上的高分，有时只是「更能写」。',
  },
  {
    q: '秦始皇统一六国是哪一年？',
    a: '公元前 221 年。',
    b: '这是一个很棒的历史问题！秦始皇嬴政经过多年征战，最终于公元前 226 年横扫六合、一统天下，建立了中国历史上第一个中央集权王朝，影响极其深远。',
    bias: '自信偏差',
    trap: 'b',
    reveal:
      '乙热情洋溢、引经据典——但年份是错的（正确答案是公元前 221 年，甲对了）。流畅自信的语气会显著提高「看起来正确」的感觉，人类和模型裁判都吃这一套。这也是 5.6 节讲的「RLHF 后模型更自信」危险的另一面：评测时自信同样能骗分。',
  },
  {
    q: '我这次高考没考好，心情很糟糕，随便和我说点什么吧。',
    a: '建议你：1. 给自己 2-3 天平复情绪；2. 客观分析分数与预期的差距；3. 了解复读与志愿填报两条路的利弊；4. 与家人坦诚沟通。理性面对，路还很长。',
    b: '辛苦了。备考这一年你一定付出了很多，此刻的失落说明你真的在乎。先不急着做任何决定，允许自己难过几天——考试衡量的只是那两天的发挥，不是你这个人的全部。等你缓过来，路会一条条清晰起来的。',
    bias: '文风偏好（无标准答案）',
    trap: 'a',
    reveal:
      '这题没有「正确答案」：甲结构化、给行动方案；乙共情、先接住情绪。哪个更好取决于评测标准怎么定——把「有帮助」定义成「可执行建议」则甲赢，定义成「情绪价值」则乙赢。评测「聊天体验」这类主观能力时，<b>换一份评分标准就能换一个冠军</b>，看榜单前先看它的评分标准。',
  },
];

export default function JudgeGame() {
  const [choices, setChoices] = useState<('a' | 'b')[]>([]);
  const idx = choices.length;
  const done = idx >= ROUNDS.length;

  const pick = (c: 'a' | 'b') => {
    if (done) return;
    setChoices((prev) => [...prev, c]);
  };

  const AnswerCard = ({label, text, onClick}: {label: string; text: string; onClick: () => void}) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 220,
        textAlign: 'left',
        padding: '12px 14px',
        border: '1.5px solid var(--ifm-color-emphasis-300)',
        borderRadius: 12,
        background: 'var(--ifm-background-surface-color)',
        color: 'var(--ifm-font-color-base)',
        cursor: 'pointer',
        fontSize: '0.88rem',
        lineHeight: 1.7,
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--ifm-color-primary)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--ifm-color-emphasis-300)')}
    >
      <div style={{fontWeight: 700, marginBottom: 6, color: 'var(--ifm-color-primary)'}}>模型{label}（匿名） · 点击选它</div>
      {text}
    </button>
  );

  return (
    <PlaygroundCard
      title="你来当评委：3 道盲评题"
      subtitle="两个匿名模型回答同一个问题，你来判定谁更好——这就是 Chatbot Arena 等竞技场榜单的玩法。做完 3 题再看揭晓：每道题都藏了一个「评测陷阱」。（回答为教学构造，不代表任何真实模型）"
      footer={
        <>
          💡 要点：你刚踩过（或躲过）的三个坑——<b>长度、自信、文风</b>——对人类评委和「模型当裁判」同样有效。所以解读任何榜单前先问三句：考题是什么？谁打的分？打分标准偏爱什么？评测不是照妖镜，它只是另一面带着自己偏差的镜子。
        </>
      }
    >
      {!done ? (
        <>
          <div style={{fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-600)', marginBottom: 6}}>
            第 {idx + 1} / {ROUNDS.length} 题
          </div>
          <div style={{padding: '10px 14px', borderRadius: 10, background: 'var(--ifm-color-emphasis-100)', fontWeight: 600, marginBottom: 10}}>
            📋 考题：{ROUNDS[idx].q}
          </div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 12}}>
            <AnswerCard label="甲" text={ROUNDS[idx].a} onClick={() => pick('a')} />
            <AnswerCard label="乙" text={ROUNDS[idx].b} onClick={() => pick('b')} />
          </div>
        </>
      ) : (
        <>
          <Message>🕵️ 评审结束，揭晓每道题暗藏的评测陷阱：</Message>
          {ROUNDS.map((r, i) => {
            const mine = choices[i];
            const fell = mine === r.trap && r.bias !== '文风偏好（无标准答案）';
            return (
              <div
                key={i}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: `1.5px solid ${fell ? 'var(--viz-s4)' : 'var(--viz-good)'}`,
                  marginBottom: 8,
                  fontSize: '0.86rem',
                  lineHeight: 1.7,
                }}
              >
                <div style={{fontWeight: 700}}>
                  {r.bias === '文风偏好（无标准答案）' ? '🤝' : fell ? '🪤 你中招了' : '🛡️ 你躲过了'} 第 {i + 1} 题 · 考察：{r.bias}
                </div>
                <div style={{color: 'var(--ifm-color-emphasis-700)'}}>
                  你选了模型{mine === 'a' ? '甲' : '乙'}。{r.reveal}
                </div>
              </div>
            );
          })}
          <BtnRow>
            <Btn primary onClick={() => setChoices([])}>↺ 再评一轮</Btn>
          </BtnRow>
        </>
      )}
    </PlaygroundCard>
  );
}
