import React, {useMemo, useRef, useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message} from '../ui';
import {RAG_PASSAGES, RAG_QUERIES, simFromPos, keywordScore} from '@site/src/data/ragCorpus';
import LiveConfigPanel from '../LiveConfig';
import {loadConfig, embed, cosine} from '@site/src/lib/liveClient';
import styles from '../playground.module.css';

/**
 * K1：语义搜索台。
 * 在二维「语义地图」上，查询（星）去找最近的段落（点）。
 * 可切换「语义检索」和「关键词检索」，看两者在同一 query 上的差异。
 */

const TOPIC_COLOR: Record<string, string> = {
  退换货: 'var(--viz-s1)',
  配送: 'var(--viz-s5)',
  支付: 'var(--viz-s6)',
  会员: 'var(--viz-s7)',
  手机: 'var(--viz-s2)',
  水果: 'var(--viz-s3)',
  配件: 'var(--viz-s4)',
};

const W = 460;
const H = 420;
const sx = (x: number) => ((x + 10) / 20) * W;
const sy = (y: number) => ((10 - y) / 20) * H;

export default function SemanticSearchLab() {
  const [qIdx, setQIdx] = useState(0);
  const [mode, setMode] = useState<'semantic' | 'keyword'>('semantic');
  const query = RAG_QUERIES[qIdx];

  const ranked = useMemo(() => {
    const scored = RAG_PASSAGES.map((p) => ({
      p,
      sem: simFromPos(query.pos, p.pos),
      kw: keywordScore(query.q, p),
    }));
    if (mode === 'semantic') {
      return [...scored].sort((a, b) => b.sem - a.sem);
    }
    // 关键词：先按命中词数，再按语义（平手时）——命中 0 的排最后
    return [...scored].sort((a, b) => b.kw - a.kw || b.sem - a.sem);
  }, [query, mode]);

  const top3 = ranked.slice(0, 3);
  const topIds = new Set(top3.map((r) => r.p.id));
  const kwZero = mode === 'keyword' && top3.every((r) => r.kw === 0);

  // ---- 真实模式：用读者自己的 embedding 服务真检索 ----
  const [hasCfg, setHasCfg] = useState(false);
  const [liveQuery, setLiveQuery] = useState('买的东西不想要了怎么办');
  const [liveBusy, setLiveBusy] = useState(false);
  const [liveErr, setLiveErr] = useState('');
  const [liveResults, setLiveResults] = useState<{title: string; text: string; sim: number}[] | null>(null);
  const passageVecs = useRef<number[][] | null>(null); // 缓存段落向量，避免重复编码

  const refreshCfg = () => setHasCfg(!!loadConfig());
  // 首次渲染后检查是否已配置
  React.useEffect(() => {
    refreshCfg();
  }, []);

  const runLive = async () => {
    const cfg = loadConfig();
    if (!cfg) {
      setLiveErr('请先在上方「真实模式设置」里填好你的模型服务并测试连接。');
      return;
    }
    if (!liveQuery.trim()) return;
    setLiveBusy(true);
    setLiveErr('');
    try {
      // 段落向量只算一次，之后缓存复用（真实工程里这是「离线建库」那一步）
      if (!passageVecs.current) {
        passageVecs.current = await embed(RAG_PASSAGES.map((p) => p.text), cfg);
      }
      const [qv] = await embed([liveQuery], cfg);
      const scored = RAG_PASSAGES.map((p, i) => ({
        title: p.title,
        text: p.text,
        sim: cosine(qv, passageVecs.current![i]),
      })).sort((a, b) => b.sim - a.sim);
      setLiveResults(scored.slice(0, 4));
    } catch (e) {
      setLiveErr(e instanceof Error ? e.message : String(e));
      passageVecs.current = null; // 出错时清缓存，下次重算
    } finally {
      setLiveBusy(false);
    }
  };

  return (
    <PlaygroundCard
      title="语义搜索台：按「意思」找，而不是按「字」找"
      subtitle="每个点是知识库里的一段资料（按话题着色）。⭐ 是你的查询——它会去找语义上最近的段落。切换「关键词检索」，对比两种找法的差别。（坐标为概念示意，真实向量有几百上千维）"
      footer={
        <>
          💡 要点：模型不认识汉字，只看向量（回扣上篇 <a href="/docs/language-models/embedding">1.4 词向量</a>）。把查询和每段资料都变成向量后，「按意思找」就变成了「找坐标最近的点」——所以「不想要了」能对上「退货」，哪怕一个字都不一样。这就是<b>语义检索</b>，RAG 的检索引擎。对比一下关键词检索，你会立刻看到它的短板。
        </>
      }
    >
      {/* 查询选择 + 模式 */}
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6}}>
        {RAG_QUERIES.map((x, i) => (
          <Btn key={i} primary={qIdx === i} onClick={() => setQIdx(i)}>{x.q}</Btn>
        ))}
      </div>
      <div style={{display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8}}>
        <span style={{fontSize: '0.88rem', fontWeight: 600}}>检索方式：</span>
        {(['semantic', 'keyword'] as const).map((m) => (
          <label key={m} style={{fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 4}}>
            <input type="radio" name="ss-mode" checked={mode === m} onChange={() => setMode(m)} />
            {m === 'semantic' ? '🧭 语义检索（比坐标）' : '🔤 关键词检索（比字面）'}
          </label>
        ))}
      </div>

      <div className={styles.svgWrap}>
        <svg viewBox={`0 0 ${W} ${H}`}>
          {/* 到 top3 的连线（仅语义模式画距离线） */}
          {mode === 'semantic' &&
            top3.map((r) => (
              <line key={r.p.id} x1={sx(query.pos[0])} y1={sy(query.pos[1])} x2={sx(r.p.pos[0])} y2={sy(r.p.pos[1])} stroke="var(--viz-muted)" strokeWidth={1.5} strokeDasharray="4 3" />
            ))}
          {/* 段落点 */}
          {RAG_PASSAGES.map((p) => {
            const hit = topIds.has(p.id);
            return (
              <g key={p.id}>
                <circle cx={sx(p.pos[0])} cy={sy(p.pos[1])} r={hit ? 9 : 6} fill={TOPIC_COLOR[p.topic]} stroke={hit ? 'var(--viz-ink)' : 'var(--viz-surface)'} strokeWidth={hit ? 2 : 1.5} />
                <text x={sx(p.pos[0])} y={sy(p.pos[1]) - 12} textAnchor="middle" fontSize={10.5} fontWeight={hit ? 700 : 500} fill="var(--viz-ink-2)">{p.title}</text>
              </g>
            );
          })}
          {/* 查询星 */}
          <text x={sx(query.pos[0])} y={sy(query.pos[1]) + 6} textAnchor="middle" fontSize={20}>⭐</text>
        </svg>
      </div>

      {/* 结果列表 */}
      <div style={{fontSize: '0.88rem', fontWeight: 700, margin: '4px 0 6px'}}>检索结果（Top 3）：</div>
      {top3.map((r, i) => (
        <div key={r.p.id} className={styles.hbarRow} style={{cursor: 'default'}}>
          <span className={styles.hbarLabel} style={{width: '2em'}}>{i + 1}</span>
          <div style={{flex: 1, fontSize: '0.84rem'}}>
            <b>{r.p.title}</b>：{r.p.text}
          </div>
          <span className={styles.hbarValue} style={{width: 'auto'}}>
            {mode === 'semantic' ? `相似度 ${(r.sem * 100).toFixed(0)}%` : `命中 ${r.kw} 词`}
          </span>
        </div>
      ))}

      <BtnRow>
        <Btn onClick={() => setMode(mode === 'semantic' ? 'keyword' : 'semantic')}>
          🔀 一键对比：切到{mode === 'semantic' ? '关键词' : '语义'}检索
        </Btn>
      </BtnRow>

      <Message>🧭 这条查询想演示：{query.note}</Message>
      {kwZero && (
        <Message>
          ⚠️ 看到了吗——关键词检索在这条查询上<b>一个词都没命中</b>（「不想要了」和「退货」字面毫无重合），只能瞎排。而语义检索能一眼看出它俩是一个意思。这正是纯关键词检索的死穴，也是语义检索存在的理由。
        </Message>
      )}
      {mode === 'keyword' && qIdx === 2 && (
        <Message>
          🍎 「苹果」有歧义：关键词检索把<b>水果</b>和<b>手机充电线</b>都捞了上来（都含「苹果」二字），分不清你想要哪个。切回语义检索——它能根据「想买」的语境，把冰糖心苹果排到前面。
        </Message>
      )}

      {/* ---- 真实模式 ---- */}
      <hr style={{margin: '18px 0 12px', border: 'none', borderTop: '2px dashed var(--ifm-color-emphasis-300)'}} />
      <div style={{fontSize: '0.95rem', fontWeight: 700, marginBottom: 4}}>🔴 真实模式：用真 embedding 检索这个知识库</div>
      <div style={{fontSize: '0.84rem', color: 'var(--ifm-color-emphasis-700)', marginBottom: 10, lineHeight: 1.6}}>
        上面的地图是二维示意。填入你自己的模型服务，就能用<b>真正的高维向量</b>检索上面那 11 段资料——随便输一句话，看真实的语义检索排名。
      </div>

      <LiveConfigPanel needEmbed onChange={refreshCfg} />

      <div style={{display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap'}}>
        <input
          type="text"
          value={liveQuery}
          onChange={(e) => setLiveQuery(e.target.value)}
          onKeyDown={(e) => {if (e.key === 'Enter') runLive();}}
          placeholder="随便输一句话，比如「手机续航怎么样」"
          style={{flex: 1, minWidth: 180, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--ifm-color-emphasis-300)', background: 'var(--ifm-background-surface-color)', color: 'var(--ifm-font-color-base)', fontSize: '0.9rem'}}
        />
        <Btn primary onClick={runLive} disabled={liveBusy || !hasCfg}>
          {liveBusy ? '检索中…' : '🔎 真检索'}
        </Btn>
      </div>
      {!hasCfg && (
        <div style={{fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-600)', marginTop: 6}}>
          👆 先展开「真实模式设置」填好服务并测试连接，「真检索」按钮就会亮起。
        </div>
      )}
      {liveErr && (
        <div style={{marginTop: 8, padding: '8px 10px', borderRadius: 8, fontSize: '0.82rem', lineHeight: 1.6, background: 'rgba(208,59,59,0.08)', border: '1px solid var(--viz-bad)'}}>
          ❌ {liveErr}
        </div>
      )}
      {liveResults && (
        <div style={{marginTop: 10}}>
          <div style={{fontSize: '0.84rem', fontWeight: 700, marginBottom: 4}}>真实 embedding 检索结果（余弦相似度，Top 4）：</div>
          {liveResults.map((r, i) => (
            <div key={i} className={styles.hbarRow} style={{cursor: 'default'}}>
              <span className={styles.hbarLabel} style={{width: '5em'}}>{r.title}</span>
              <div className={styles.hbarTrack}><div className={styles.hbarFill} style={{width: `${Math.max(0, r.sim) * 100}%`}} /></div>
              <span className={styles.hbarValue}>{(r.sim * 100).toFixed(1)}%</span>
            </div>
          ))}
          <div style={{fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-600)', marginTop: 6, lineHeight: 1.6}}>
            ✅ 这就是真实 RAG 检索的第一步：查询和每段资料都被你的嵌入模型编成了几百上千维的向量，再按余弦相似度排序——和二维地图是同一个道理，只是维度高得多、也准得多。段落向量已缓存，换个查询只需再编码一次查询。
          </div>
        </div>
      )}
    </PlaygroundCard>
  );
}
