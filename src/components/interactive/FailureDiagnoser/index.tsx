import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message} from '../ui';
import styles from '../playground.module.css';

/**
 * K6：失败模式诊断器。
 * 同一个查询，注入三种典型 RAG 失败模式，看 RAG 三元组（上下文相关性/有据性/答案相关性）
 * 哪一环亮红灯，以及最终的坏答案。内容为教学构造。
 */

const QUERY = '退货运费谁承担？';
const RIGHT_CHUNK = {title: '运费规则', text: '会员退货免运费由本店承担，非会员需自付 10 元退货运费。'};

type Mode = 'healthy' | 'miss' | 'leak' | 'drift';

interface Scenario {
  key: Mode;
  name: string;
  desc: string;
  retrieved: {title: string; text: string; relevant: boolean}[];
  triad: {contextRel: boolean; grounded: boolean; answerRel: boolean};
  answer: string;
  diagnosis: string;
  culprit: string; // 哪一步的锅
}

const SCENARIOS: Scenario[] = [
  {
    key: 'healthy',
    name: '✅ 健康',
    desc: '检索对、照资料答、答到点',
    retrieved: [{...RIGHT_CHUNK, relevant: true}],
    triad: {contextRel: true, grounded: true, answerRel: true},
    answer: '会员退货免运费，由本店承担；非会员需自付 10 元退货运费。〔来源：运费规则〕',
    diagnosis: '三环全绿：检索到了对的资料、答案由原文支撑、也正面回答了问题。这才是 RAG 该有的样子。',
    culprit: '无',
  },
  {
    key: 'miss',
    name: '🔴 检索没召回',
    desc: '对的那段根本没被检索到',
    retrieved: [
      {title: '配送时效', text: '普通快递 3–5 天送达，偏远地区顺延。', relevant: false},
      {title: '支付方式', text: '支持微信、支付宝、银行卡。', relevant: false},
    ],
    triad: {contextRel: false, grounded: false, answerRel: false},
    answer: '抱歉，根据现有资料无法确定退货运费的承担方。（——它压根没拿到那段资料，只能瞎猜或摆手。）',
    diagnosis: '第一环就断了：真正含答案的「运费规则」那段没被检索到，检索回来的全是无关内容。上下文相关性亮红灯——后面两环再努力也回天乏术。这是 RAG 的头号失败模式，锅在检索（K1~K4）。',
    culprit: '检索（K1~K4）',
  },
  {
    key: 'leak',
    name: '🟠 上下文泄漏',
    desc: '资料明明对，模型却用自己的旧记忆',
    retrieved: [{...RIGHT_CHUNK, relevant: true}],
    triad: {contextRel: true, grounded: false, answerRel: true},
    answer: '退货运费一般由买家自己承担。（——资料明明写着会员免运费，它却无视资料、凭训练时的「常识」瞎答。）',
    diagnosis: '检索没问题（第一环绿），但模型无视眼前的资料、掺入了训练时的旧记忆，答案和原文矛盾——有据性亮红灯。这就是「上下文泄漏」：对的资料递到面前了，模型却没照着用。锅在生成（K5 的指令没摁住它）。',
    culprit: '生成（K5）',
  },
  {
    key: 'drift',
    name: '🟡 生成漂移',
    desc: '照着资料答，却把意思答歪了',
    retrieved: [{...RIGHT_CHUNK, relevant: true}],
    triad: {contextRel: true, grounded: false, answerRel: true},
    answer: '退货一律免运费。（——资料是对的，但它漏掉了「非会员要自付 10 元」这个关键条件，把意思答歪了。）',
    diagnosis: '检索对、也确实在用资料，但复述时走了样——把「会员免、非会员自付」压缩成了「一律免」，丢了关键条件。这叫「生成漂移」：忠实度打了折。锅在生成（K5）——尤其是模型对长条件的概括容易失真。',
    culprit: '生成（K5）',
  },
];

const TRIAD_LABELS: {key: keyof Scenario['triad']; name: string; check: string}[] = [
  {key: 'contextRel', name: '上下文相关性', check: '检索回来的资料，和问题相关吗？'},
  {key: 'grounded', name: '有据性', check: '答案的每句话，都由资料支撑吗？'},
  {key: 'answerRel', name: '答案相关性', check: '有正面回答用户的问题吗？'},
];

export default function FailureDiagnoser() {
  const [mode, setMode] = useState<Mode>('healthy');
  const s = SCENARIOS.find((x) => x.key === mode)!;

  return (
    <PlaygroundCard
      title="失败模式诊断器：RAG 是在哪一环出的错"
      subtitle="同一个问题，注入三种典型故障，看「RAG 三元组」三盏灯哪盏变红、答案怎么被毁掉。学会看这三盏灯，你就能一眼定位 RAG 的病根。（内容为教学构造）"
      footer={
        <>
          💡 要点：RAG 出错，无非三个地方——<b>没检索到</b>（对的资料没捞回来，上下文相关性红灯，锅在检索 K1~K4）、<b>没照着用</b>（资料对但模型凭旧记忆瞎答，有据性红灯，锅在生成 K5）、<b>照歪了</b>（在用资料但复述失真，有据性红灯，锅还在生成）。RAG 三元组这三盏灯，就是给 RAG 做体检的仪表盘——先看哪盏红，就知道该去修检索还是修生成，而不是瞎调一通。
        </>
      }
    >
      <div style={{padding: '8px 12px', borderRadius: 10, background: 'var(--ifm-color-emphasis-100)', fontWeight: 600, fontSize: '0.9rem', marginBottom: 10}}>
        🧑‍💻 {QUERY}
        <span style={{fontWeight: 400, fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-600)', marginLeft: 6}}>
          （正确答案：会员免运费、非会员自付 10 元）
        </span>
      </div>

      {/* 故障注入 */}
      <div style={{fontSize: '0.85rem', fontWeight: 700, marginBottom: 6}}>注入一种情况：</div>
      <BtnRow>
        {SCENARIOS.map((x) => (
          <Btn key={x.key} primary={mode === x.key} onClick={() => setMode(x.key)}>{x.name}</Btn>
        ))}
      </BtnRow>
      <div style={{fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-600)', margin: '2px 0 10px'}}>{s.desc}</div>

      {/* 检索到的资料 */}
      <div style={{fontSize: '0.82rem', fontWeight: 700, marginBottom: 4}}>🔎 检索回来的资料：</div>
      {s.retrieved.map((r, i) => (
        <div key={i} style={{padding: '6px 10px', margin: '3px 0', borderRadius: 8, borderLeft: `3px solid ${r.relevant ? 'var(--viz-good)' : 'var(--viz-s8)'}`, background: 'var(--ifm-color-emphasis-100)', fontSize: '0.82rem', lineHeight: 1.55}}>
          {r.relevant ? '✅' : '❌'} <b>{r.title}</b>：{r.text}
        </div>
      ))}

      {/* RAG 三元组仪表盘 */}
      <div style={{fontSize: '0.82rem', fontWeight: 700, margin: '10px 0 4px'}}>🩺 RAG 三元组体检：</div>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
        {TRIAD_LABELS.map((t) => {
          const ok = s.triad[t.key];
          return (
            <div key={t.key} style={{flex: '1 1 150px', padding: '8px 10px', borderRadius: 10, border: `1.5px solid ${ok ? 'var(--viz-good)' : 'var(--viz-bad)'}`, background: ok ? 'rgba(12,163,12,0.06)' : 'rgba(208,59,59,0.06)'}}>
              <div style={{fontWeight: 700, fontSize: '0.82rem', color: ok ? 'var(--viz-good)' : 'var(--viz-bad)'}}>
                {ok ? '🟢' : '🔴'} {t.name}
              </div>
              <div style={{fontSize: '0.74rem', color: 'var(--ifm-color-emphasis-600)', lineHeight: 1.5}}>{t.check}</div>
            </div>
          );
        })}
      </div>

      {/* 答案 */}
      <div style={{fontSize: '0.82rem', fontWeight: 700, margin: '10px 0 4px'}}>💬 最终答案：</div>
      <div style={{padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${mode === 'healthy' ? 'var(--viz-good)' : 'var(--viz-bad)'}`, background: 'var(--ifm-color-emphasis-100)', fontSize: '0.88rem', lineHeight: 1.7}}>
        {s.answer}
      </div>

      <Message>
        <b>诊断（病根在：{s.culprit}）：</b>{s.diagnosis}
      </Message>
    </PlaygroundCard>
  );
}
