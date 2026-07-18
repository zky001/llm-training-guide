import React, {useEffect, useRef, useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message} from '../ui';
import styles from '../playground.module.css';

/**
 * K7：GraphRAG 多跳演示。
 * 一个 3 跳问题「张伟的经理的助理是谁」。
 * 普通 RAG 按相似度检索、捞不全中间跳 → 答不出；
 * GraphRAG 把事实连成图、顺着关系一跳跳走 → 答对。
 * 内容为教学构造。
 */

const QUERY = '张伟的经理的助理是谁？';

interface Fact {
  id: string;
  text: string;
  onPath: boolean; // 是否在答案链条上
  // 普通 RAG 按「和问题的相似度」检索——问题里没提技术部/李娜，中间跳相似度低
  flatScore: number;
}

const FACTS: Fact[] = [
  {id: 'f1', text: '张伟属于技术部。', onPath: true, flatScore: 0.72},
  {id: 'f2', text: '技术部的经理是李娜。', onPath: true, flatScore: 0.38},
  {id: 'f3', text: '李娜的助理是王芳。', onPath: true, flatScore: 0.31},
  {id: 'f4', text: '销售部的经理是赵强。', onPath: false, flatScore: 0.45},
  {id: 'f5', text: '王芳负责会议室预订。', onPath: false, flatScore: 0.4},
];

// 图：节点 + 带标签的有向边
interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
}
const NODES: Node[] = [
  {id: 'zhangwei', label: '张伟', x: 60, y: 60},
  {id: 'tech', label: '技术部', x: 210, y: 40},
  {id: 'lina', label: '李娜', x: 350, y: 75},
  {id: 'wangfang', label: '王芳', x: 470, y: 120},
  {id: 'sales', label: '销售部', x: 150, y: 175},
  {id: 'zhaoqiang', label: '赵强', x: 300, y: 190},
];
interface Edge {
  from: string;
  to: string;
  label: string;
  onPath: boolean;
}
const EDGES: Edge[] = [
  {from: 'zhangwei', to: 'tech', label: '属于', onPath: true},
  {from: 'tech', to: 'lina', label: '经理', onPath: true},
  {from: 'lina', to: 'wangfang', label: '助理', onPath: true},
  {from: 'sales', to: 'zhaoqiang', label: '经理', onPath: false},
];

// 遍历路径（节点顺序）
const PATH = ['zhangwei', 'tech', 'lina', 'wangfang'];
const N = (id: string) => NODES.find((n) => n.id === id)!;

export default function GraphRagDemo() {
  const [mode, setMode] = useState<'flat' | 'graph'>('flat');
  const [hop, setHop] = useState(0); // graph 模式已点亮到第几个节点
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => () => stop(), []);

  const walk = () => {
    stop();
    setHop(1);
    timer.current = setInterval(() => {
      setHop((h) => {
        if (h >= PATH.length) {
          stop();
          return h;
        }
        return h + 1;
      });
    }, 800);
  };

  const flatTop = [...FACTS].sort((a, b) => b.flatScore - a.flatScore).slice(0, 3);
  const flatGotAll = flatTop.filter((f) => f.onPath).length === 3;

  const activeNodes = new Set(PATH.slice(0, hop));
  const done = hop >= PATH.length;

  return (
    <PlaygroundCard
      title="GraphRAG：顺着关系跳，回答「拼不出来」的问题"
      subtitle="问题「张伟的经理的助理是谁」的答案，没有任何一段资料直接写着——它藏在三段资料的关系链里。看普通 RAG 怎么卡壳，GraphRAG 怎么一跳跳走出来。（内容为教学构造）"
      footer={
        <>
          💡 要点：普通 RAG 按「和问题像不像」检索单段资料——可有些问题的答案要<b>串起好几段</b>才能推出来（张伟→技术部→李娜→王芳）。问题里压根没提「技术部」「李娜」，中间那两跳相似度很低、根本捞不回来，于是普通 RAG 卡在半路。<b>GraphRAG</b> 换了个存法：先把资料抽成「实体+关系」的图谱，检索时顺着关系一跳跳走，多跳问题就迎刃而解。代价是要先花力气把图谱建出来——它不是取代普通 RAG，而是专治「关系型、多跳」的硬骨头。
        </>
      }
    >
      <div style={{padding: '8px 12px', borderRadius: 10, background: 'var(--ifm-color-emphasis-100)', fontWeight: 600, fontSize: '0.9rem', marginBottom: 10}}>
        🧑‍💻 {QUERY}
      </div>

      {/* 资料 */}
      <div style={{fontSize: '0.82rem', fontWeight: 700, marginBottom: 4}}>📄 知识库里的 5 段资料：</div>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10}}>
        {FACTS.map((f) => (
          <span key={f.id} className={styles.chip} style={{fontSize: '0.76rem', borderColor: f.onPath ? 'var(--viz-s2)' : 'var(--ifm-color-emphasis-300)'}}>
            {f.onPath ? '🔗 ' : ''}{f.text}
          </span>
        ))}
        <span style={{fontSize: '0.74rem', color: 'var(--ifm-color-emphasis-500)'}}>（🔗 = 答案链条上的三段）</span>
      </div>

      {/* 模式切换 */}
      <div style={{display: 'flex', gap: 12, marginBottom: 8}}>
        {(['flat', 'graph'] as const).map((m) => (
          <label key={m} style={{fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 4}}>
            <input type="radio" name="gr-mode" checked={mode === m} onChange={() => {setMode(m); stop(); setHop(0);}} />
            {m === 'flat' ? '📄 普通 RAG（按相似度检索单段）' : '🕸️ GraphRAG（顺关系跳）'}
          </label>
        ))}
      </div>

      {mode === 'flat' ? (
        <div>
          <div style={{fontSize: '0.82rem', fontWeight: 700, marginBottom: 4}}>按「和问题的相似度」检索 Top 3：</div>
          {flatTop.map((f, i) => (
            <div key={f.id} className={styles.hbarRow} style={{cursor: 'default'}}>
              <span className={styles.hbarLabel} style={{width: '1.6em'}}>{i + 1}</span>
              <div style={{flex: 1, fontSize: '0.82rem'}}>{f.text} {f.onPath ? '🔗' : ''}</div>
              <span className={styles.hbarValue}>{(f.flatScore * 100).toFixed(0)}%</span>
            </div>
          ))}
          <Message>
            😵 卡壳了：问题里没提「技术部」「李娜」，所以「技术部的经理是李娜」「李娜的助理是王芳」这两段中间跳<b>相似度太低、没被检索到</b>。
            {!flatGotAll && '普通 RAG 只捞回了链条的头（张伟属于技术部）和一些无关段，'}
            拿着残缺的资料，模型要么答「资料不足」，要么瞎猜。<b>单段相似检索，跨不过多跳的坎。</b>
          </Message>
        </div>
      ) : (
        <div>
          <div className={styles.svgWrap}>
            <svg viewBox="0 0 540 230">
              {/* 边 */}
              {EDGES.map((e, i) => {
                const a = N(e.from);
                const b = N(e.to);
                const active = e.onPath && activeNodes.has(e.from) && activeNodes.has(e.to);
                const ang = Math.atan2(b.y - a.y, b.x - a.x);
                const r = 26;
                const x1 = a.x + r * Math.cos(ang);
                const y1 = a.y + r * Math.sin(ang);
                const x2 = b.x - r * Math.cos(ang);
                const y2 = b.y - r * Math.sin(ang);
                return (
                  <g key={i}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={active ? 'var(--viz-s6)' : 'var(--viz-axis)'} strokeWidth={active ? 3 : 1.5} />
                    <polygon points={`${x2},${y2} ${x2 - 8 * Math.cos(ang - 0.4)},${y2 - 8 * Math.sin(ang - 0.4)} ${x2 - 8 * Math.cos(ang + 0.4)},${y2 - 8 * Math.sin(ang + 0.4)}`} fill={active ? 'var(--viz-s6)' : 'var(--viz-axis)'} />
                    <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 4} textAnchor="middle" fontSize={10.5} fontWeight={600} fill={active ? 'var(--viz-s6)' : 'var(--viz-muted)'}>{e.label}</text>
                  </g>
                );
              })}
              {/* 节点 */}
              {NODES.map((n) => {
                const active = activeNodes.has(n.id);
                const isAnswer = n.id === 'wangfang' && done;
                return (
                  <g key={n.id}>
                    <circle cx={n.x} cy={n.y} r={26} fill={isAnswer ? 'var(--viz-s2)' : active ? 'var(--viz-s1)' : 'var(--ifm-background-surface-color)'} stroke={active ? 'var(--viz-s1)' : 'var(--viz-axis)'} strokeWidth={2} />
                    <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill={active || isAnswer ? '#fff' : 'var(--viz-ink-2)'}>{n.label}</text>
                  </g>
                );
              })}
            </svg>
          </div>
          <BtnRow>
            <Btn primary onClick={walk}>▶ 顺着关系走一遍</Btn>
            <Btn onClick={() => {stop(); setHop(0);}}>↺ 重来</Btn>
          </BtnRow>
          {done && (
            <Message>
              ✅ 三跳到位：<b>张伟</b> —属于→ <b>技术部</b> —经理→ <b>李娜</b> —助理→ <b>王芳</b>。答案是<b>王芳</b>。图谱把散落在三段资料里的关系连了起来，顺着走就到了——这是单段相似检索永远做不到的。
            </Message>
          )}
        </div>
      )}
    </PlaygroundCard>
  );
}
