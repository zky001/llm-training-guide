import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message} from '../ui';
import styles from '../playground.module.css';

/**
 * K4：重排前后对比。
 * 第一阶段「粗召回」（双编码器/向量，快但粗）把 8 条候选排个序——
 * 一条「看起来像」的错误答案（产假 vs 陪产假）被排到了前面。
 * 第二阶段「精排」（交叉编码器，慢但准）读懂 query+doc，把真答案顶上来。
 * 分数为教学构造，重在演示两阶段的分工。
 */

const QUERY = '男员工的陪产假有几天？';

interface Cand {
  id: string;
  text: string;
  recall: number; // 粗召回分（向量相似，快而粗）
  rerank: number; // 精排分（交叉编码器，慢而准）
  verdict: 'answer' | 'distractor' | 'related' | 'off';
}

const CANDS: Cand[] = [
  {id: 'c1', text: '产假：女员工生育享 98 天产假，难产、多胎另有增加。', recall: 0.86, rerank: 0.12, verdict: 'distractor'},
  {id: 'c2', text: '陪产假：男员工可享 15 天陪产假，需在配偶生育后 3 个月内休完。', recall: 0.72, rerank: 0.97, verdict: 'answer'},
  {id: 'c3', text: '产假期间，工资与绩效照常发放，不影响晋升。', recall: 0.68, rerank: 0.20, verdict: 'distractor'},
  {id: 'c4', text: '陪产假期间，工资按全额发放。', recall: 0.55, rerank: 0.74, verdict: 'related'},
  {id: 'c5', text: '婚假：员工结婚可享 10 天婚假。', recall: 0.5, rerank: 0.08, verdict: 'off'},
  {id: 'c6', text: '年假：工作满 1 年享 5 天带薪年假。', recall: 0.44, rerank: 0.05, verdict: 'off'},
  {id: 'c7', text: '哺乳假：一岁以下婴儿的母亲每天有 1 小时哺乳时间。', recall: 0.4, rerank: 0.06, verdict: 'off'},
  {id: 'c8', text: '员工请假需提前在系统提交申请并经主管审批。', recall: 0.36, rerank: 0.10, verdict: 'off'},
];

const VERDICT = {
  answer: {icon: '✅', label: '正确答案', color: 'var(--viz-good)'},
  distractor: {icon: '🎭', label: '李鬼（产假≠陪产假）', color: 'var(--viz-s8)'},
  related: {icon: '🔗', label: '相关', color: 'var(--viz-s1)'},
  off: {icon: '·', label: '无关', color: 'var(--viz-muted)'},
};

export default function RerankLab() {
  const [reranked, setReranked] = useState(false);

  const byRecall = [...CANDS].sort((a, b) => b.recall - a.recall);
  const byRerank = [...CANDS].sort((a, b) => b.rerank - a.rerank);
  const recallRank = new Map(byRecall.map((c, i) => [c.id, i]));

  const list = reranked ? byRerank : byRecall;

  const Row = ({c, i}: {c: Cand; i: number}) => {
    const v = VERDICT[c.verdict];
    const prev = recallRank.get(c.id)!;
    const delta = reranked ? prev - i : 0; // 正=上升
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 10px',
          margin: '4px 0',
          borderRadius: 8,
          border: `1.5px solid ${(reranked && i < 2 && c.verdict === 'answer') || (reranked && i < 3 && (c.verdict === 'answer' || c.verdict === 'related')) ? 'var(--viz-good)' : 'var(--ifm-color-emphasis-200)'}`,
          background: 'var(--ifm-color-emphasis-100)',
          fontSize: '0.83rem',
        }}
      >
        <span style={{fontWeight: 700, width: '1.4em', textAlign: 'center'}}>{i + 1}</span>
        {reranked && delta !== 0 && (
          <span style={{fontSize: '0.72rem', fontWeight: 700, color: delta > 0 ? 'var(--viz-good)' : 'var(--viz-s8)', width: '2.4em'}}>
            {delta > 0 ? `↑${delta}` : `↓${-delta}`}
          </span>
        )}
        {reranked && delta === 0 && <span style={{width: '2.4em'}} />}
        <span style={{flex: 1, lineHeight: 1.5}}>{c.text}</span>
        <span title={v.label} style={{color: v.color, fontWeight: 700, flexShrink: 0}}>{v.icon}</span>
        <span style={{fontVariantNumeric: 'tabular-nums', color: 'var(--ifm-color-emphasis-500)', width: '3em', textAlign: 'right', flexShrink: 0}}>
          {reranked ? c.rerank.toFixed(2) : c.recall.toFixed(2)}
        </span>
      </div>
    );
  };

  return (
    <PlaygroundCard
      title="重排：把最该看的顶上来"
      subtitle="第一阶段「粗召回」用向量快速捞回一批候选，但它排在最前的，偏偏是个「看起来像」的李鬼。点「精排」，看第二阶段的交叉编码器怎么读懂问题、把真答案顶上来。（分数为教学示意）"
      footer={
        <>
          💡 要点：检索的黄金结构是<b>两阶段</b>——先「召回」快而粗地捞回几十条（向量检索，双编码器：查询和文档分开编码，快但只看个大概），再「精排」慢而准地重新打分（<b>交叉编码器</b>：把查询和文档拼在一起细读，能分清「产假」和「陪产假」这种致命差别）。精排太慢，扛不住在整个知识库上跑；但只对召回的几十条跑，就又快又准。RAG 的检索质量，一大半靠这一步兜底。
        </>
      }
    >
      <div style={{padding: '8px 12px', borderRadius: 10, background: 'var(--ifm-color-emphasis-100)', fontWeight: 600, fontSize: '0.9rem', marginBottom: 10}}>
        🧑‍💻 {QUERY}
      </div>

      <div style={{fontSize: '0.85rem', fontWeight: 700, marginBottom: 4, color: reranked ? 'var(--viz-s2)' : 'var(--viz-s6)'}}>
        {reranked ? '② 精排后（交叉编码器：读懂 query+doc）' : '① 粗召回（向量相似，快而粗）'}
      </div>
      {list.map((c, i) => <Row key={c.id} c={c} i={i} />)}

      <BtnRow>
        <Btn primary onClick={() => setReranked(true)} disabled={reranked}>⚡ 第二阶段：交叉编码器精排</Btn>
        <Btn onClick={() => setReranked(false)}>↺ 看回粗召回</Btn>
      </BtnRow>

      {!reranked && (
        <Message>
          🎭 注意第 1 名——「产假 98 天」被排到了最前面！因为在粗糙的向量眼里，「产假」和「陪产假」长得太像。可用户问的是<b>陪产假</b>，这是个李鬼。真答案「陪产假 15 天」被压在了第 2 位。点上面的「精排」看看会发生什么。
        </Message>
      )}
      {reranked && (
        <Message>
          ✅ 精排把「陪产假 15 天」顶到了第 1 名，「产假 98 天」这个李鬼被打回原形（↓）。交叉编码器把问题和每条候选<b>拼在一起逐字读</b>，才能分清「产假」和「陪产假」一字之差背后的天壤之别——这是粗召回的向量做不到的。如果只信召回的第 1 名，模型就会理直气壮地告诉用户「陪产假 98 天」。
        </Message>
      )}
    </PlaygroundCard>
  );
}
