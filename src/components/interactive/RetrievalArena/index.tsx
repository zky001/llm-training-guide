import React, {useMemo, useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message} from '../ui';
import {RAG_PASSAGES, simFromPos, keywordScore, type Passage} from '@site/src/data/ragCorpus';
import styles from '../playground.module.css';

/**
 * K3：三路检索擂台。
 * 同一查询，三条检索通道并排跑：关键词（BM25 式）/ 语义 / 混合（RRF 融合）。
 * `needed` 是这条查询「真正该命中」的段落 id——用它诚实地报告每路的覆盖情况，
 * 让教学结论永远和实际排名一致。
 */

interface ArenaQuery {
  q: string;
  pos: [number, number];
  needed: string[];
  lesson: string;
}

const QUERIES: ArenaQuery[] = [
  {
    q: '东西收到不满意，想退掉',
    pos: [-6.6, 5.4],
    needed: ['p1', 'p2'],
    lesson: '换了个说法（「退掉」而不是「退货」），关键词检索一个词都对不上——它这一列几乎全是 0 分，只能瞎排。语义检索靠「意思」稳稳命中退货政策。这是语义检索的主场。',
  },
  {
    q: 'X9 Pro 屏幕和电池参数',
    pos: [2.9, -7.4],
    needed: ['p9'],
    lesson: '「X9 Pro」是精确型号——关键词检索一击命中（型号、专名正是它的强项），语义检索也没跑偏。两路一致时，结果最稳。这是关键词检索的主场。',
  },
  {
    q: '生鲜的运费和退货政策',
    pos: [-6.2, -4],
    needed: ['p1', 'p4'],
    lesson: '这条查询横跨两个话题：运费 + 退货。看仔细了——语义检索被「配送」那一带吸住了，把「退货政策」挤到边缘、还混进了无关的配送时效；关键词检索靠「生鲜」「退货」这些精确词兜住了退货那一半。只有混合检索同时抓住了运费和退货——这就是它存在的理由：一路会漏的，另一路补上。',
  },
];

type LaneKey = 'keyword' | 'semantic' | 'hybrid';
const LANES: {key: LaneKey; name: string; icon: string; color: string}[] = [
  {key: 'keyword', name: '关键词（BM25 式）', icon: '🔤', color: 'var(--viz-s6)'},
  {key: 'semantic', name: '语义（向量）', icon: '🧭', color: 'var(--viz-s1)'},
  {key: 'hybrid', name: '混合（RRF 融合）', icon: '🔀', color: 'var(--viz-s2)'},
];

interface Ranked {
  p: Passage;
  score: number;
}

function rankKeyword(q: ArenaQuery): Ranked[] {
  return RAG_PASSAGES.map((p) => ({p, score: keywordScore(q.q, p)}))
    .sort((a, b) => b.score - a.score || simFromPos(q.pos, b.p.pos) - simFromPos(q.pos, a.p.pos));
}
function rankSemantic(q: ArenaQuery): Ranked[] {
  return RAG_PASSAGES.map((p) => ({p, score: simFromPos(q.pos, p.pos)})).sort((a, b) => b.score - a.score);
}
/** RRF：只看每条在各路里排第几名，名次越靠前加分越多（k=60 是常用常数） */
function rankHybrid(kw: Ranked[], sem: Ranked[]): Ranked[] {
  const K = 60;
  const rrf = new Map<string, number>();
  kw.forEach((r, i) => rrf.set(r.p.id, (rrf.get(r.p.id) ?? 0) + 1 / (K + i + 1)));
  sem.forEach((r, i) => rrf.set(r.p.id, (rrf.get(r.p.id) ?? 0) + 1 / (K + i + 1)));
  return RAG_PASSAGES.map((p) => ({p, score: rrf.get(p.id) ?? 0})).sort((a, b) => b.score - a.score);
}

export default function RetrievalArena() {
  const [qIdx, setQIdx] = useState(0);
  const [run, setRun] = useState(false);
  const q = QUERIES[qIdx];

  const lanes = useMemo(() => {
    const kw = rankKeyword(q);
    const sem = rankSemantic(q);
    const hyb = rankHybrid(kw, sem);
    return {keyword: kw, semantic: sem, hybrid: hyb};
  }, [q]);

  // 每路 top3 覆盖了几条「该命中」的段落
  const coverage = (lane: Ranked[]) => lane.slice(0, 3).filter((r) => q.needed.includes(r.p.id)).length;

  const pick = (i: number) => {
    setQIdx(i);
    setRun(false);
  };

  const kwAllZero = lanes.keyword.slice(0, 3).every((r) => r.score === 0);

  return (
    <PlaygroundCard
      title="三路检索擂台：关键词 vs 向量 vs 混合"
      subtitle="同一个查询，三条检索通道并排跑。绿框 = 这条查询「真正该命中」的资料。看哪一路捞得全、哪一路会漏。（基于中篇共享知识库，命中为真实计算）"
      footer={
        <>
          💡 要点：没有一路检索是全能的。<b>关键词</b>擅长精确匹配（型号、专名、术语），但换个说法就抓瞎；<b>语义</b>擅长「懂意思」，却对精确词不敏感、还会被强势话题带偏。所以生产 RAG 几乎都用<b>混合检索</b>：两路一起上、各补盲区，再用 RRF 把两个排名融合（RRF 只看名次、不看分数，绕开了「两路分数没法直接比」的难题）。混合不是更花哨，是更少漏。
        </>
      }
    >
      {/* 查询选择 */}
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8}}>
        {QUERIES.map((x, i) => (
          <Btn key={i} primary={qIdx === i} onClick={() => pick(i)}>{x.q}</Btn>
        ))}
      </div>
      <div style={{padding: '8px 12px', borderRadius: 10, background: 'var(--ifm-color-emphasis-100)', fontWeight: 600, fontSize: '0.9rem', marginBottom: 10}}>
        🧑‍💻 {q.q}
        <span style={{fontWeight: 400, fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-600)', marginLeft: 6}}>
          （该命中：{q.needed.map((id) => RAG_PASSAGES.find((p) => p.id === id)!.title).join('、')}）
        </span>
      </div>

      <BtnRow>
        <Btn primary onClick={() => setRun(true)} disabled={run}>🏁 三路开跑</Btn>
        <Btn onClick={() => setRun(false)}>↺ 重来</Btn>
      </BtnRow>

      {run && (
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8}}>
          {LANES.map((lane) => {
            const ranked = lanes[lane.key];
            const cov = coverage(ranked);
            const full = cov === q.needed.length;
            return (
              <div key={lane.key} style={{flex: '1 1 200px', border: `1.5px solid ${full ? 'var(--viz-good)' : lane.color}`, borderRadius: 12, padding: '8px 10px'}}>
                <div style={{fontWeight: 700, fontSize: '0.86rem', marginBottom: 6, color: lane.color}}>
                  {lane.icon} {lane.name}
                </div>
                {ranked.slice(0, 3).map((r, i) => {
                  const isNeeded = q.needed.includes(r.p.id);
                  return (
                    <div
                      key={r.p.id}
                      style={{
                        fontSize: '0.78rem',
                        padding: '5px 8px',
                        margin: '3px 0',
                        borderRadius: 8,
                        border: `1.5px solid ${isNeeded ? 'var(--viz-good)' : 'var(--ifm-color-emphasis-200)'}`,
                        background: isNeeded ? 'rgba(12,163,12,0.08)' : 'var(--ifm-color-emphasis-100)',
                        lineHeight: 1.5,
                      }}
                    >
                      <b>{i + 1}. {r.p.title}</b> {isNeeded && '✅'}
                      <span style={{color: 'var(--ifm-color-emphasis-500)', marginLeft: 4}}>
                        {lane.key === 'keyword' ? `命中 ${r.score} 词` : lane.key === 'semantic' ? `相似 ${(r.score * 100).toFixed(0)}%` : `RRF ${r.score.toFixed(3)}`}
                      </span>
                    </div>
                  );
                })}
                <div style={{fontSize: '0.76rem', fontWeight: 700, marginTop: 4, color: full ? 'var(--viz-good)' : 'var(--viz-s4)'}}>
                  {full ? '✅ 全部命中' : `⚠️ 只命中 ${cov}/${q.needed.length}`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {run && (
        <Message>
          {kwAllZero && qIdx === 0 && '🔤➡️0 '}
          {q.lesson}
        </Message>
      )}
    </PlaygroundCard>
  );
}
