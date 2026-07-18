import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message} from '../ui';
import styles from '../playground.module.css';

/**
 * K0：闭卷 vs 开卷对比。
 * 三个「模型答不出/答错」的问题（私事、最新、易幻觉），
 * 左边闭卷（凭记忆）翻车，右边开卷（先检索知识库）有据。
 * 回答与知识库片段为教学构造。
 */

interface Case {
  q: string;
  flaw: string;
  closed: string;
  retrieved: {source: string; text: string}[];
  open: string;
}

const CASES: Case[] = [
  {
    q: '我们公司的报销上限是多少？出差住宿能报多少一晚？',
    flaw: '私有知识',
    closed:
      '一般公司的报销上限在每月 2000~5000 元不等，住宿通常每晚 300~600 元。具体请咨询贵公司财务部门。（——它根本不知道「我们公司」是哪家，只能泛泛而谈。）',
    retrieved: [
      {source: '员工手册 v3.2 · 第 6 章', text: '差旅报销：一线城市住宿上限 500 元/晚，其他城市 350 元/晚；单次出差总报销不超过 8000 元。'},
    ],
    open:
      '根据《员工手册 v3.2》第 6 章：一线城市住宿上限 500 元/晚，其他城市 350 元/晚；单次出差总报销不超过 8000 元。〔来源：员工手册 v3.2·第6章〕',
  },
  {
    q: '这次产品发布会定在哪天？主推哪款新机型？',
    flaw: '最新信息',
    closed:
      '很抱歉，我的训练数据有截止时间，无法得知贵公司最新的发布会安排和新机型信息。（——发布会是训练之后才定的，它没法「知道」未来。）',
    retrieved: [
      {source: '内部通知 · 2026-07-10', text: '秋季发布会定于 9 月 12 日在深圳举办，主推旗舰机型 X9 Pro 与入门款 X9 Lite。'},
    ],
    open:
      '发布会定于 9 月 12 日在深圳举办，主推旗舰机型 X9 Pro 和入门款 X9 Lite。〔来源：内部通知·2026-07-10〕',
  },
  {
    q: '《劳动合同法》里，试用期最长能约定多久？',
    flaw: '易幻觉',
    closed:
      '试用期一般不超过 3 个月，具体根据合同期限而定，通常为合同期的 10% 左右。（——听起来煞有介事，但数字是它「编」出来的，细则记混了。）',
    retrieved: [
      {source: '劳动合同法 · 第十九条', text: '劳动合同期限三年以上或无固定期限的，试用期不得超过六个月。同一用人单位与同一劳动者只能约定一次试用期。'},
    ],
    open:
      '根据《劳动合同法》第十九条：合同期限三年以上或无固定期限的，试用期不得超过六个月；且同一单位与同一劳动者只能约定一次试用期。〔来源：劳动合同法·第十九条〕',
  },
];

export default function ClosedVsOpenBook() {
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState(0); // 0=只问 1=闭卷已答 2=已检索 3=开卷已答
  const c = CASES[idx];

  const pick = (i: number) => {
    setIdx(i);
    setStage(0);
  };

  return (
    <PlaygroundCard
      title="闭卷 vs 开卷：同一个模型，两种命运"
      subtitle="下面三个问题，模型「凭记忆」都答不好。左边是闭卷（直接问），右边是开卷（先从知识库查资料再答）。选一个问题，一步步看差别。（回答与资料为教学构造）"
      footer={
        <>
          💡 要点：RAG 没有改变模型本身——它只是把「闭卷考试」变成了「开卷考试」。模型的三个先天短板：<b>不知道你的私事</b>（训练数据里没有）、<b>记不住最新的事</b>（训练有截止时间）、<b>会一本正经地编</b>（凭记忆答易出错）。给它接一个可检索的知识库当「外挂大脑」，让它<b>先查再答、答必有据</b>，这三个坑就一起填上了。
        </>
      }
    >
      {/* 选题 */}
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10}}>
        {CASES.map((x, i) => (
          <Btn key={i} primary={idx === i} onClick={() => pick(i)}>
            {['🔒 私事', '📅 最新', '🌀 易错'][i]}：{x.q.slice(0, 10)}…
          </Btn>
        ))}
      </div>

      <div style={{padding: '10px 14px', borderRadius: 10, background: 'var(--ifm-color-emphasis-100)', fontWeight: 600, fontSize: '0.92rem', marginBottom: 12}}>
        🧑‍💻 {c.q}
        <span className="badge-soft" style={{marginLeft: 8}}>模型短板：{c.flaw}</span>
      </div>

      <div style={{display: 'flex', flexWrap: 'wrap', gap: 12}}>
        {/* 闭卷 */}
        <div style={{flex: '1 1 260px', border: '1.5px solid var(--viz-s8)', borderRadius: 12, padding: '10px 12px'}}>
          <div style={{fontWeight: 700, marginBottom: 6, color: 'var(--viz-s8)'}}>🔒 闭卷：直接凭记忆答</div>
          {stage >= 1 ? (
            <div style={{fontSize: '0.86rem', lineHeight: 1.7}}>{c.closed}</div>
          ) : (
            <div style={{fontSize: '0.84rem', color: 'var(--ifm-color-emphasis-500)'}}>（点下面「闭卷作答」）</div>
          )}
        </div>

        {/* 开卷 */}
        <div style={{flex: '1 1 260px', border: '1.5px solid var(--viz-s2)', borderRadius: 12, padding: '10px 12px'}}>
          <div style={{fontWeight: 700, marginBottom: 6, color: 'var(--viz-s2)'}}>📖 开卷：先检索知识库</div>
          {stage >= 2 ? (
            <>
              <div style={{fontSize: '0.8rem', marginBottom: 6}}>
                🔎 检索到的资料：
                {c.retrieved.map((r, i) => (
                  <div key={i} style={{padding: '6px 8px', margin: '4px 0', borderRadius: 6, background: 'var(--ifm-color-emphasis-100)', borderLeft: '3px solid var(--viz-s1)'}}>
                    <b style={{fontSize: '0.72rem', color: 'var(--viz-s1)'}}>{r.source}</b>
                    <div style={{fontSize: '0.8rem', lineHeight: 1.55}}>{r.text}</div>
                  </div>
                ))}
              </div>
              {stage >= 3 && (
                <div style={{fontSize: '0.86rem', lineHeight: 1.7, paddingTop: 6, borderTop: '1px dashed var(--ifm-color-emphasis-300)'}}>
                  ✅ {c.open}
                </div>
              )}
            </>
          ) : (
            <div style={{fontSize: '0.84rem', color: 'var(--ifm-color-emphasis-500)'}}>（点下面「开卷作答」）</div>
          )}
        </div>
      </div>

      <BtnRow>
        <Btn primary onClick={() => setStage(1)} disabled={stage >= 1}>🔒 闭卷作答</Btn>
        <Btn primary onClick={() => setStage(2)} disabled={stage < 1 || stage >= 2}>🔎 检索知识库</Btn>
        <Btn primary onClick={() => setStage(3)} disabled={stage < 2 || stage >= 3}>📖 开卷作答</Btn>
        <Btn onClick={() => setStage(0)}>↺ 重来</Btn>
      </BtnRow>

      {stage >= 3 && (
        <Message>
          🎯 对比很明显：闭卷答案要么泛泛而谈、要么直接编，还没法溯源；开卷答案<b>具体、准确、每句都标了出处</b>。注意——两边用的是<b>同一个模型</b>，唯一的区别是开卷那边在作答前多做了一步「检索」。这一步，就是 RAG 的全部魔法。
        </Message>
      )}
    </PlaygroundCard>
  );
}
