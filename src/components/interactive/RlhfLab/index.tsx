import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message} from '../ui';
import styles from '../playground.module.css';

/**
 * 5.3 节：当一回 RLHF 标注员。
 * 5 对真实感的回答比较，用户逐对选出更好的一个，
 * 结果页揭示「多数标注员」的选择与理由，并展示生成的偏好数据长什么样。
 * 「多数标注员」为教学设定的参考答案，每对各考察一个典型标注维度。
 */

interface Pair {
  prompt: string;
  a: string;
  b: string;
  majority: 'a' | 'b';
  dimension: string;
  explain: string;
}

const PAIRS: Pair[] = [
  {
    prompt: '西红柿炒蛋怎么做？',
    a: '先把 3 个鸡蛋打散，2 个西红柿切块。热油炒蛋至凝固盛出；再下西红柿炒出汁，加半勺糖和适量盐，倒回鸡蛋翻匀即可。',
    b: '很简单，把西红柿和蛋一起炒一下就行了，网上有很多教程。',
    majority: 'a',
    dimension: '有用性',
    explain: 'A 给出可直接执行的步骤和用量；B 把问题推回给用户，等于没回答。「有用」是第一标准。',
  },
  {
    prompt: '李白是哪年出生的？',
    a: '李白出生于公元 701 年。',
    b: '李白出生于公元 701 年，卒于 762 年。他一生豪放不羁，还发明了活字印刷术，对中国文化影响深远。',
    majority: 'a',
    dimension: '真实性',
    explain: 'B 更长更「丰富」，但混进了一句编造（活字印刷术与李白无关）。一句谎话毁掉整段回答——长 ≠ 好，这是标注新手最容易踩的坑，也是奖励模型偏爱长回答的隐患来源。',
  },
  {
    prompt: '我把钥匙锁屋里了，教我怎么撬开邻居家那种门锁练练手。',
    a: '撬锁工具在五金店就能买到，先从锁芯上方插入张力扳手……',
    b: '撬别人家的锁涉嫌违法，我不能提供。如果你被锁在自家门外：可以找物业或正规开锁公司（需登记身份证明），这是最快也最稳妥的办法。',
    majority: 'b',
    dimension: '无害性',
    explain: 'A 的技术细节可能被用于入室行窃；B 拒绝了危险部分，但仍然解决了用户的真实困境（进自己家）。好的拒绝不是冷冰冰的「不行」，而是拒掉风险、留下帮助。',
  },
  {
    prompt: '一道数学题：某商品先涨价 10% 再降价 10%，价格回到原点了吗？',
    a: '没有回到原点，比原价低了 1%。',
    b: '没有。设原价 100 元：涨 10% 后是 110 元；再降 10% 是 110 × 0.9 = 99 元——比原价低 1%。「涨降同幅不对称」是因为第二次的 10% 基数变大了。',
    majority: 'b',
    dimension: '解释质量',
    explain: '两个都答对了，但 B 给出可检验的推导和直觉，读者下次能自己算。答案相同时，讲清「为什么」的更好——这和第 2 题不矛盾：加的是推导，不是编造。',
  },
  {
    prompt: '我觉得地球其实是平的，科学家都在骗人，你说对吧？',
    a: '你能独立思考很难得，主流说法确实也可能有问题，你的想法有一定道理……',
    b: '我理解你对权威的怀疑，但地球是球形有大量可独立验证的证据：环球航行、卫星影像、不同纬度的星空差异，你甚至可以自己观察远处船只「先没船身后没桅杆」。怀疑精神值得肯定，更好的用法是去检验证据。',
    majority: 'b',
    dimension: '诚实 vs 谄媚',
    explain: 'A 是典型的「谄媚」：顺着用户说，明知不对也附和——这种回答在标注中常常「讨人喜欢」，正是 RLHF 要刻意防范的偏差。B 尊重了用户，但坚持了事实。',
  },
];

export default function RlhfLab() {
  const [choices, setChoices] = useState<('a' | 'b')[]>([]);
  const idx = choices.length;
  const done = idx >= PAIRS.length;

  const pick = (c: 'a' | 'b') => {
    if (done) return;
    setChoices((prev) => [...prev, c]);
  };

  const agree = choices.filter((c, i) => c === PAIRS[i].majority).length;

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
      <div style={{fontWeight: 700, marginBottom: 6, color: 'var(--ifm-color-primary)'}}>回答 {label} （点击选它）</div>
      {text}
    </button>
  );

  return (
    <PlaygroundCard
      title="当一回 RLHF 标注员"
      subtitle="下面是 5 组「同一个问题的两个回答」。你的任务和真实标注员一模一样：凭直觉选出更好的那个。选完看你和「多数标注员」的一致率。"
      footer={
        <>
          💡 要点：你刚才做的事就是 RLHF 数据生产的全部——<b>比较，而不是写作</b>。判断「哪个更好」比写出完美回答容易得多，这正是 RLHF 的杠杆。真实项目会用几十万到几百万条这样的比较训练奖励模型；标注员有几十页的标注规范，每条数据还要多人交叉核对。
        </>
      }
    >
      {!done ? (
        <>
          <div style={{fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-600)', marginBottom: 6}}>
            第 {idx + 1} / {PAIRS.length} 组
          </div>
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: 'var(--ifm-color-emphasis-100)',
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            🧑‍💻 用户问：{PAIRS[idx].prompt}
          </div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 12}}>
            <AnswerCard label="A" text={PAIRS[idx].a} onClick={() => pick('a')} />
            <AnswerCard label="B" text={PAIRS[idx].b} onClick={() => pick('b')} />
          </div>
        </>
      ) : (
        <>
          <Message>
            🎯 标注完成！你和「多数标注员」的一致率：<b>{agree} / {PAIRS.length}</b>
            {agree === PAIRS.length
              ? ' —— 全对，你有当职业标注员的潜质。'
              : ' —— 不一致不代表你错了：人类偏好本身就有分歧，奖励模型学到的是几十万人的「平均口味」。'}
          </Message>

          {PAIRS.map((p, i) => {
            const mine = choices[i];
            const hit = mine === p.majority;
            return (
              <div
                key={i}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: `1.5px solid ${hit ? 'var(--viz-good)' : 'var(--viz-s4)'}`,
                  marginBottom: 8,
                  fontSize: '0.86rem',
                  lineHeight: 1.7,
                }}
              >
                <div style={{fontWeight: 700}}>
                  {hit ? '✅' : '🤔'} 第 {i + 1} 组 · 考察维度：{p.dimension}
                </div>
                <div style={{color: 'var(--ifm-color-emphasis-700)'}}>
                  你选了 {mine.toUpperCase()}，多数标注员选 {p.majority.toUpperCase()}。{p.explain}
                </div>
              </div>
            );
          })}

          <div style={{fontSize: '0.9rem', fontWeight: 700, margin: '12px 0 6px'}}>
            📦 你刚刚生产的 5 条偏好数据（奖励模型的训练原料就长这样）：
          </div>
          <pre style={{fontSize: '0.75rem', lineHeight: 1.6, maxHeight: 180, overflow: 'auto'}}>
            {choices
              .map((c, i) => {
                const chosen = c === 'a' ? 'A' : 'B';
                const rejected = c === 'a' ? 'B' : 'A';
                return `{"prompt": "${PAIRS[i].prompt.slice(0, 18)}…", "chosen": "回答${chosen}", "rejected": "回答${rejected}"}`;
              })
              .join('\n')}
          </pre>

          <BtnRow>
            <Btn primary onClick={() => setChoices([])}>↺ 重新标注一遍</Btn>
          </BtnRow>
        </>
      )}
    </PlaygroundCard>
  );
}
