import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message, Stat, StatRow} from '../ui';
import styles from '../playground.module.css';

/**
 * 4.1 节：数据清洗流水线。
 * 6 篇模拟「原始网页」走过 5 道清洗工序，直观展示每一步谁被淘汰、谁被清洗。
 * 文档内容为教学示意。
 */

const STAGES = [
  '原始网页',
  '① 正文提取（去 HTML）',
  '② 语言识别（本线只收中文）',
  '③ 质量过滤（碎片 / 广告）',
  '④ 去重',
  '⑤ 隐私与毒性处理',
];

interface Doc {
  name: string;
  /** 各阶段的文本快照：取 ≤ 当前阶段的最新版本 */
  versions: Record<number, string>;
  killedAt: number | null;
  killReason?: string;
}

const DOCS: Doc[] = [
  {
    name: '新闻报道',
    versions: {
      0: '<div class="art"><h1>我国科学家发现新型电池材料</h1><p>记者从中科院获悉，研究团队研发出一种新型固态电解质材料，使电池能量密度提升约30%。</p><span class="ad">点击下载APP领红包！</span></div>',
      1: '我国科学家发现新型电池材料　记者从中科院获悉，研究团队研发出一种新型固态电解质材料，使电池能量密度提升约30%。　点击下载APP领红包！',
      3: '我国科学家发现新型电池材料　记者从中科院获悉，研究团队研发出一种新型固态电解质材料，使电池能量密度提升约30%。',
    },
    killedAt: null,
  },
  {
    name: '网站导航页',
    versions: {
      0: '<ul><li>首页</li><li>登录</li><li>注册</li><li>关于我们</li><li>联系客服</li></ul>© 2023 某某网',
      1: '首页　登录　注册　关于我们　联系客服　© 2023 某某网',
    },
    killedAt: 3,
    killReason: '全是菜单碎片，没有一个完整句子——对语言模型毫无营养',
  },
  {
    name: '英文体育新闻',
    versions: {
      0: '<p>Breaking: local team wins the championship after a dramatic overtime victory, fans celebrate downtown...</p>',
      1: 'Breaking: local team wins the championship after a dramatic overtime victory, fans celebrate downtown...',
    },
    killedAt: 2,
    killReason: '非中文——本条流水线的目标是中文语料（英文会走另一条线，不是被扔掉）',
  },
  {
    name: '转载文章',
    versions: {
      0: '<p>【转载】我国科学家发现新型电池材料：记者从中科院获悉，研究团队研发出一种新型固态电解质材料，使电池能量密度提升约30%。</p>',
      1: '【转载】我国科学家发现新型电池材料：记者从中科院获悉，研究团队研发出一种新型固态电解质材料，使电池能量密度提升约30%。',
    },
    killedAt: 4,
    killReason: '与 1 号文档几乎完全相同——重复数据会让模型「背题」，还浪费算力',
  },
  {
    name: '学习经验帖',
    versions: {
      0: '<p>今天分享我的考研数学复习方法：第一轮先过教材，配合习题册巩固基础。有问题可以加我微信 13812345678 交流。</p>',
      1: '今天分享我的考研数学复习方法：第一轮先过教材，配合习题册巩固基础。有问题可以加我微信 13812345678 交流。',
      5: '今天分享我的考研数学复习方法：第一轮先过教材，配合习题册巩固基础。有问题可以加我微信 138****5678 交流。',
    },
    killedAt: null,
  },
  {
    name: '游戏论坛骂战',
    versions: {
      0: '<p>这游戏什么垃圾策划？？全都是骗钱的东西，谁玩谁上当！！！楼下的都是水军！</p>',
      1: '这游戏什么垃圾策划？？全都是骗钱的东西，谁玩谁上当！！！楼下的都是水军！',
    },
    killedAt: 5,
    killReason: '攻击性内容超标——模型读什么学什么，骂战读多了说话就是这个味',
  },
];

function textAt(doc: Doc, stage: number): string {
  let best = doc.versions[0];
  for (let s = 0; s <= stage; s++) {
    if (doc.versions[s] !== undefined) best = doc.versions[s];
  }
  return best;
}

export default function DataPipeline() {
  const [stage, setStage] = useState(0);

  const alive = DOCS.filter((d) => d.killedAt === null || d.killedAt > stage);
  const rawChars = DOCS.reduce((s, d) => s + d.versions[0].length, 0);
  const aliveChars = alive.reduce((s, d) => s + textAt(d, stage).length, 0);

  return (
    <PlaygroundCard
      title="数据清洗流水线：6 篇网页的生死之旅"
      subtitle="下面是 6 篇刚从网上抓回来的「原始网页」（教学示意）。点「下一道工序」，看每一步谁被清洗、谁被淘汰，以及最后还剩多少能进训练集。"
      footer={
        <>
          💡 要点：真实规模下这条流水线更残酷——以公开的大型网页语料为例（2024-2025 年），原始抓取数据里<b>最终只有百分之几</b>能通过全部工序进入训练集。「垃圾进，垃圾出」：数据清洗的质量直接决定模型的上限，所以业内常说数据工程占了预训练一半的工作量。
        </>
      }
    >
      {/* 工序进度条 */}
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10}}>
        {STAGES.map((s, i) => (
          <button
            key={s}
            type="button"
            className={styles.btn}
            style={
              i === stage
                ? {background: 'var(--ifm-color-primary)', color: '#fff', borderColor: 'var(--ifm-color-primary)', fontSize: '0.78rem'}
                : {fontSize: '0.78rem', opacity: i < stage ? 0.9 : 0.55}
            }
            onClick={() => setStage(i)}
          >
            {s}
          </button>
        ))}
      </div>

      <StatRow>
        <Stat label="存活文档" value={`${alive.length} / ${DOCS.length}`} />
        <Stat label="存活字符占比" value={`${((aliveChars / rawChars) * 100).toFixed(0)}%`} />
        <Stat label="当前工序" value={STAGES[stage]} />
      </StatRow>

      <div style={{display: 'flex', flexDirection: 'column', gap: 8, margin: '10px 0'}}>
        {DOCS.map((d) => {
          const killedNow = d.killedAt === stage;
          const killedBefore = d.killedAt !== null && d.killedAt < stage;
          const cleanedNow = stage > 0 && d.versions[stage] !== undefined && !killedNow;
          if (killedBefore) {
            return (
              <div key={d.name} style={{padding: '6px 12px', borderRadius: 8, background: 'var(--ifm-color-emphasis-100)', color: 'var(--ifm-color-emphasis-500)', fontSize: '0.82rem'}}>
                ❌ {d.name} —— 已在「{STAGES[d.killedAt!]}」淘汰
              </div>
            );
          }
          return (
            <div
              key={d.name}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: `1.5px solid ${killedNow ? 'var(--viz-bad)' : cleanedNow ? 'var(--viz-good)' : 'var(--ifm-color-emphasis-300)'}`,
                background: 'var(--ifm-background-surface-color)',
              }}
            >
              <div style={{display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4}}>
                <b style={{fontSize: '0.88rem'}}>{d.name}</b>
                {killedNow && <span className="badge-soft" style={{background: 'rgba(208,59,59,0.12)', color: 'var(--viz-bad)'}}>❌ 本步淘汰</span>}
                {cleanedNow && <span className="badge-soft" style={{background: 'rgba(12,163,12,0.12)', color: 'var(--viz-good)'}}>✨ 本步被清洗</span>}
                {!killedNow && !cleanedNow && <span className="badge-soft">✅ 通过</span>}
              </div>
              <div
                style={{
                  fontSize: '0.84rem',
                  lineHeight: 1.7,
                  fontFamily: stage === 0 ? 'var(--ifm-font-family-monospace)' : 'inherit',
                  color: 'var(--ifm-color-emphasis-800)',
                  textDecoration: killedNow ? 'line-through' : 'none',
                  opacity: killedNow ? 0.65 : 1,
                  wordBreak: 'break-all',
                }}
              >
                {textAt(d, stage)}
              </div>
              {killedNow && (
                <div style={{fontSize: '0.8rem', color: 'var(--viz-bad)', marginTop: 4}}>淘汰原因：{d.killReason}</div>
              )}
            </div>
          );
        })}
      </div>

      <BtnRow>
        <Btn onClick={() => setStage((s) => Math.max(0, s - 1))} disabled={stage === 0}>← 上一道工序</Btn>
        <Btn primary onClick={() => setStage((s) => Math.min(STAGES.length - 1, s + 1))} disabled={stage === STAGES.length - 1}>
          下一道工序 →
        </Btn>
        <Btn onClick={() => setStage(0)} disabled={stage === 0}>↺ 重来</Btn>
      </BtnRow>

      {stage === STAGES.length - 1 && (
        <Message>
          🏁 全部工序走完：6 篇原始网页只剩 {alive.length} 篇「干净」文本可以入库，字符量只剩 {((aliveChars / rawChars) * 100).toFixed(0)}%。注意两篇幸存文档也都动过手术——广告句被删、手机号被打码。真实流水线有几十道工序，其中不少过滤器本身就是小模型。
        </Message>
      )}
    </PlaygroundCard>
  );
}
