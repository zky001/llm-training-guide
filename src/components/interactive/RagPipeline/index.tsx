import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message} from '../ui';
import styles from '../playground.module.css';

/**
 * K5：RAG 全流程动画。
 * 把 K0~K5 串成一条可步进的流水线：提问→检索→重排选 top-k→拼装提示词→带引用生成→核对有据。
 * 用一个「会员+积分」的双来源查询，突出「上下文拼装」和「引用标注」两步。
 * 内容为教学构造，基于中篇共享知识库的两条段落。
 */

const QUERY = '黑卡会员有什么好处？积分能抵多少钱？';

// 检索命中的候选（含一个被重排淘汰的干扰项）
const RETRIEVED = [
  {id: 's1', title: '会员权益', text: '黑卡会员享全场 95 折、专属客服和生日礼券。', score: 0.88, kept: true},
  {id: 's2', title: '积分规则', text: '每消费 1 元累计 1 积分，100 积分可抵 1 元。', score: 0.83, kept: true},
  {id: 's3', title: '支付方式', text: '支持微信、支付宝、银行卡以及货到付款。', score: 0.41, kept: false},
];

const KEPT = RETRIEVED.filter((r) => r.kept);

const PROMPT = `参考资料：
[1] 会员权益：黑卡会员享全场 95 折、专属客服和生日礼券。
[2] 积分规则：每消费 1 元累计 1 积分，100 积分可抵 1 元。

请仅根据以上资料回答，并在每句话后标注来源编号；
资料中没有的信息，回答「资料未提及」。

问题：黑卡会员有什么好处？积分能抵多少钱？`;

const ANSWER = '黑卡会员可享全场 95 折、专属客服和生日礼券〔1〕。积分方面，每消费 1 元累计 1 积分，100 积分可抵 1 元〔2〕。';

const STAGES = [
  {icon: '🧑‍💻', name: '① 提问', color: 'var(--viz-muted)'},
  {icon: '🔎', name: '② 检索', color: 'var(--viz-s1)'},
  {icon: '⚡', name: '③ 重排选 top-k', color: 'var(--viz-s6)'},
  {icon: '🧩', name: '④ 拼装提示词', color: 'var(--viz-s5)'},
  {icon: '✍️', name: '⑤ 带引用生成', color: 'var(--viz-s7)'},
  {icon: '✅', name: '⑥ 核对有据', color: 'var(--viz-s2)'},
];

export default function RagPipeline() {
  const [step, setStep] = useState(0);

  return (
    <PlaygroundCard
      title="RAG 全流程：从提问到「有据的答案」"
      subtitle="把中篇学过的每一步串起来跑一遍。点「下一步」，看一个问题怎么走完「检索 → 重排 → 拼装 → 生成 → 核对」，最后得到一个每句话都标了出处的答案。（内容为教学构造）"
      footer={
        <>
          💡 要点：RAG 的价值，全压在最后两步——<b>拼装</b>和<b>引用</b>。拼装（K5.1）决定了模型看到什么：把检索到的块按清晰格式摆好、并明确要求「只根据资料答、没有就说没有」。引用（K5.2）决定了答案可不可信：逼模型给每句话标出处，答案就从「你信不信我」变成了「你可以自己核对」。前面 K1~K4 的检索做得再好，也要靠这两步把好料变成好答案。
        </>
      }
    >
      {/* 流水线总览 */}
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12}}>
        {STAGES.map((s, i) => (
          <button
            key={i}
            type="button"
            className={styles.btn}
            style={{
              fontSize: '0.76rem',
              padding: '4px 8px',
              ...(i === step
                ? {background: s.color, color: '#fff', borderColor: s.color}
                : {opacity: i < step ? 0.9 : 0.5}),
            }}
            onClick={() => setStep(i)}
          >
            {s.icon} {s.name}
          </button>
        ))}
      </div>

      {/* 当前查询始终显示 */}
      <div style={{padding: '8px 12px', borderRadius: 10, background: 'var(--ifm-color-emphasis-100)', fontWeight: 600, fontSize: '0.9rem', marginBottom: 10}}>
        🧑‍💻 {QUERY}
      </div>

      {/* 分步详情 */}
      <div style={{minHeight: 140}}>
        {step === 0 && (
          <Message>用户的问题里藏着<b>两个</b>子问题：会员好处 + 积分抵扣。它们的答案分散在知识库的不同段落里——正好考验 RAG 把它们凑齐。</Message>
        )}

        {step === 1 && (
          <div>
            <div style={{fontSize: '0.85rem', fontWeight: 700, marginBottom: 6}}>🔎 从知识库检索到的候选（K1~K3）：</div>
            {RETRIEVED.map((r) => (
              <div key={r.id} className={styles.hbarRow} style={{cursor: 'default'}}>
                <span className={styles.hbarLabel} style={{width: '5em'}}>{r.title}</span>
                <div className={styles.hbarTrack}><div className={styles.hbarFill} style={{width: `${r.score * 100}%`}} /></div>
                <span className={styles.hbarValue}>{(r.score * 100).toFixed(0)}%</span>
              </div>
            ))}
            <div style={{fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-600)', marginTop: 4}}>命中 3 条，但「支付方式」明显跑题——交给下一步重排收拾。</div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{fontSize: '0.85rem', fontWeight: 700, marginBottom: 6}}>⚡ 重排后只保留最相关的 top-2（K4）：</div>
            {RETRIEVED.map((r) => (
              <div key={r.id} style={{padding: '7px 10px', margin: '4px 0', borderRadius: 8, border: `1.5px solid ${r.kept ? 'var(--viz-good)' : 'var(--viz-s8)'}`, background: 'var(--ifm-color-emphasis-100)', fontSize: '0.83rem', opacity: r.kept ? 1 : 0.55}}>
                {r.kept ? '✅ 留下' : '❌ 淘汰'} · <b>{r.title}</b>：{r.text}
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{fontSize: '0.85rem', fontWeight: 700, marginBottom: 6}}>🧩 把留下的块拼进提示词（这就是「增强」）：</div>
            <pre style={{fontSize: '0.76rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: 260, overflow: 'auto'}}>{PROMPT}</pre>
            <div style={{fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-600)'}}>注意那两句指令——「只根据资料答」和「标注来源」，正是抑制幻觉、逼出引用的关键。</div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div style={{fontSize: '0.85rem', fontWeight: 700, marginBottom: 6}}>✍️ 模型照着资料作答，每句标出处：</div>
            <div style={{padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--viz-s7)', background: 'var(--ifm-color-emphasis-100)', fontSize: '0.9rem', lineHeight: 1.9}}>
              {ANSWER.split(/(〔\d〕)/).map((seg, i) =>
                /〔\d〕/.test(seg) ? (
                  <span key={i} style={{color: 'var(--viz-s1)', fontWeight: 700}}>{seg}</span>
                ) : (
                  <span key={i}>{seg}</span>
                ),
              )}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <div style={{fontSize: '0.85rem', fontWeight: 700, marginBottom: 6}}>✅ 核对：每句话都能溯源到原文</div>
            {KEPT.map((r, i) => (
              <div key={r.id} style={{padding: '7px 10px', margin: '4px 0', borderRadius: 8, border: '1.5px solid var(--viz-good)', background: 'rgba(12,163,12,0.06)', fontSize: '0.82rem', lineHeight: 1.6}}>
                <b style={{color: 'var(--viz-s1)'}}>〔{i + 1}〕</b> 答案里的这半句 ⟵ <b>{r.title}</b>：{r.text}
              </div>
            ))}
            <Message>🎯 答案的每一句都挂着来源编号，读者点一下就能翻到原文核对。这就是<b>有据回答</b>——RAG 相对「凭记忆瞎答」最硬的底气。回头看 K0 的三个先天缺陷，到这一步全部填平了。</Message>
          </div>
        )}
      </div>

      <BtnRow>
        <Btn onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>← 上一步</Btn>
        <Btn primary onClick={() => setStep((s) => Math.min(5, s + 1))} disabled={step === 5}>下一步 →</Btn>
        <Btn onClick={() => setStep(0)} disabled={step === 0}>↺ 从头看</Btn>
      </BtnRow>
    </PlaygroundCard>
  );
}
