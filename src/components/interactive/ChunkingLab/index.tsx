import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message} from '../ui';
import styles from '../playground.module.css';

/**
 * K2：切块对比器。
 * 同一篇「会员退货说明」用三种策略切块，看同一个查询检索到的块，
 * 以及答案是否完整。核心教学点：切块边界会切断完整语义。
 * 检索结果与判定为教学构造（重在演示「边界」的影响）。
 */

// 文档的 5 句话（含 1 个「跨句才完整」的事实：15天时长 + 例外）
const SENTENCES = [
  '【会员退货说明】',
  '本店黑卡会员享有专属退货政策，普通商品支持 15 天无理由退货，比非会员多 8 天。',
  '但需注意：定制类商品、生鲜食品和已拆封的数码配件，不在无理由退货范围内。',
  '退货运费方面，会员退货免运费由本店承担，非会员需自付 10 元退货运费。',
  '如需退货，请在「我的订单」中选择对应订单，点击「申请退货」并上传凭证。',
];

interface Chunk {
  text: string;
  sentences: number[]; // 覆盖哪几句
}

interface Strategy {
  key: string;
  name: string;
  desc: string;
  chunks: Chunk[];
}

const STRATEGIES: Strategy[] = [
  {
    key: 'huge',
    name: '① 整篇一大块',
    desc: '不切，整个文档当一个块',
    chunks: [{text: SENTENCES.join(''), sentences: [0, 1, 2, 3, 4]}],
  },
  {
    key: 'tiny',
    name: '② 每句一小块',
    desc: '按句号一刀切，每句一个块',
    chunks: SENTENCES.map((s, i) => ({text: s, sentences: [i]})),
  },
  {
    key: 'semantic',
    name: '③ 按语义切（刚好）',
    desc: '把「讲同一件事」的句子并到一块',
    chunks: [
      {text: SENTENCES[0], sentences: [0]},
      {text: SENTENCES[1] + SENTENCES[2], sentences: [1, 2]}, // 时长+例外 = 「退货范围」一整块
      {text: SENTENCES[3], sentences: [3]},
      {text: SENTENCES[4], sentences: [4]},
    ],
  },
];

interface Verdict {
  retrieved: number[]; // 命中的 chunk 下标
  quality: 'good' | 'partial' | 'noisy';
  note: string;
}

interface Query {
  q: string;
  need: string; // 需要哪些句子才算完整
  perStrategy: Record<string, Verdict>;
}

const QUERIES: Query[] = [
  {
    q: '会员退货，有什么东西是不能退的？',
    need: '需要「15 天无理由」+「例外清单」两句一起，才算完整',
    perStrategy: {
      huge: {retrieved: [0], quality: 'noisy', note: '整篇都捞回来了：答案在里面，但混着运费、操作等无关内容。文档一大就会严重稀释重点，相似度也被拉平。'},
      tiny: {retrieved: [1], quality: 'partial', note: '💥 只命中了「15 天无理由」这句（它和「会员退货」最像），却把关键的「例外清单」那句漏在了另一个块里——模型会告诉你「都能退」，漏掉生鲜/定制不能退。切太碎，切断了完整语义。'},
      semantic: {retrieved: [1], quality: 'good', note: '✅ 命中的块把「时长 + 例外」放在了一起——答案完整：会员 15 天无理由，但生鲜、定制、拆封数码除外。'},
    },
  },
  {
    q: '退货要自己付运费吗？',
    need: '答案完整地在「运费」那一句里',
    perStrategy: {
      huge: {retrieved: [0], quality: 'noisy', note: '又是整篇捞回：运费信息在里面，但被大量无关内容包围，长文档下容易「找不到重点」。'},
      tiny: {retrieved: [3], quality: 'good', note: '✅ 这次「太碎」反而没事——因为运费这个事实本来就完整地在一句话里，没被边界切断。可见「切太碎」不是永远错，只在事实跨句时才致命。'},
      semantic: {retrieved: [2], quality: 'good', note: '✅ 干净命中「运费」块：会员免运费，非会员自付 10 元。'},
    },
  },
];

const QUALITY = {
  good: {icon: '✅', label: '完整', color: 'var(--viz-good)'},
  partial: {icon: '⚠️', label: '不完整', color: 'var(--viz-s4)'},
  noisy: {icon: '🌀', label: '噪声多', color: 'var(--viz-s6)'},
};

export default function ChunkingLab() {
  const [qIdx, setQIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const query = QUERIES[qIdx];

  return (
    <PlaygroundCard
      title="切块对比器：切在哪，决定查得准不准"
      subtitle="下面这篇「会员退货说明」要入库，先得切成块。三种切法各有各的命。选一个查询，点「开始检索」，看每种切法捞回哪一块、答得完不完整。（检索结果为教学示意）"
      footer={
        <>
          💡 要点：切块是 RAG 里最不起眼、却最容易翻车的一步。切太大——一块里塞太多事，重点被稀释、相似度被拉平；切太小——一个完整的事实被边界拦腰截断，检索只捞回半个答案（比如漏掉「例外」）。<b>好的切块让「每一块 = 一个完整的意思」</b>。这也是「语义切块」「滑窗」「late chunking」这些技术想解决的同一个问题。
        </>
      }
    >
      {/* 文档展示 */}
      <div style={{fontSize: '0.85rem', fontWeight: 700, marginBottom: 4}}>📄 待入库文档：</div>
      <div style={{padding: '10px 14px', borderRadius: 10, background: 'var(--ifm-color-emphasis-100)', fontSize: '0.86rem', lineHeight: 1.9, marginBottom: 12}}>
        {SENTENCES.map((s, i) => (
          <span key={i} style={{background: revealed && query.perStrategy.semantic.retrieved.length && STRATEGIES[2].chunks[query.perStrategy.semantic.retrieved[0]].sentences.includes(i) ? 'rgba(12,163,12,0.12)' : 'transparent'}}>
            {s}
          </span>
        ))}
      </div>

      {/* 查询选择 */}
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8}}>
        {QUERIES.map((x, i) => (
          <Btn key={i} primary={qIdx === i} onClick={() => {setQIdx(i); setRevealed(false);}}>{x.q}</Btn>
        ))}
      </div>
      <div style={{padding: '8px 12px', borderRadius: 10, background: 'var(--ifm-color-emphasis-100)', fontWeight: 600, fontSize: '0.9rem', marginBottom: 10}}>
        🧑‍💻 {query.q}
        <div style={{fontWeight: 400, fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-600)'}}>🎯 {query.need}</div>
      </div>

      {/* 三种策略 */}
      <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
        {STRATEGIES.map((st) => {
          const v = query.perStrategy[st.key];
          const q = QUALITY[v.quality];
          return (
            <div key={st.key} style={{border: `1.5px solid ${revealed ? q.color : 'var(--ifm-color-emphasis-300)'}`, borderRadius: 12, padding: '10px 12px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6}}>
                <div>
                  <b style={{fontSize: '0.9rem'}}>{st.name}</b>
                  <span style={{fontSize: '0.78rem', color: 'var(--ifm-color-emphasis-600)', marginLeft: 6}}>{st.desc}</span>
                </div>
                {revealed && <span className="badge-soft" style={{background: 'transparent', color: q.color, fontWeight: 700}}>{q.icon} {q.label}</span>}
              </div>
              {/* 块 */}
              <div style={{display: 'flex', flexWrap: 'wrap', gap: 5}}>
                {st.chunks.map((ch, ci) => {
                  const hit = revealed && v.retrieved.includes(ci);
                  return (
                    <span
                      key={ci}
                      className={styles.chip}
                      style={{
                        fontSize: '0.74rem',
                        maxWidth: 240,
                        whiteSpace: 'normal',
                        borderColor: hit ? q.color : 'var(--ifm-color-emphasis-300)',
                        background: hit ? 'var(--ifm-color-emphasis-100)' : 'transparent',
                        fontWeight: hit ? 700 : 400,
                        opacity: revealed && !hit ? 0.5 : 1,
                      }}
                    >
                      {hit && '🔎 '}{ch.text.length > 30 ? ch.text.slice(0, 29) + '…' : ch.text}
                    </span>
                  );
                })}
              </div>
              {revealed && <div style={{fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-700)', marginTop: 6, lineHeight: 1.6}}>{v.note}</div>}
            </div>
          );
        })}
      </div>

      <BtnRow>
        <Btn primary onClick={() => setRevealed(true)} disabled={revealed}>🔎 开始检索</Btn>
        <Btn onClick={() => setRevealed(false)}>↺ 重来</Btn>
      </BtnRow>

      {revealed && qIdx === 0 && (
        <Message>
          🎯 三种切法，同一个问题，三种结局：整篇一块「找得到但不干净」，每句一块「漏了半个答案」，按语义切「刚刚好」。注意②的坑最隐蔽——它给的答案<b>看起来通顺、其实漏了例外</b>，用户根本发现不了。
        </Message>
      )}
      {revealed && qIdx === 1 && (
        <Message>
          🧩 这次「每句一块」也对了——因为「运费」这个事实本来就在一句话里，没跨边界。对比上一题：<b>切块好不好，取决于它有没有把完整的事实切散</b>，而不是块的大小本身。
        </Message>
      )}
    </PlaygroundCard>
  );
}
