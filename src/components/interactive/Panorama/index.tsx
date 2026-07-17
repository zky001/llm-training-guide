import React, {useRef} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow} from '../ui';
import styles from '../playground.module.css';

/**
 * 8.5 节：全书全景大图（可下载 SVG 海报）。
 * 注意：为了让下载的文件脱离网站也能正常显示，这里使用固定十六进制颜色
 * （浅色海报样式），不用 CSS 变量。
 */

const C = {
  bg: '#ffffff',
  ink: '#0b0b0b',
  muted: '#52514e',
  faint: '#898781',
  blue: '#2a78d6',
  green: '#008300',
  orange: '#eb6834',
  violet: '#4a3aa7',
  aqua: '#1baf7a',
  red: '#d03b3b',
  fill: '#f4f6fb',
};

function Box({
  x, y, w, h, title, sub, color, tag,
}: {
  x: number; y: number; w: number; h: number;
  title: string; sub?: string; color: string; tag?: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={C.fill} stroke={color} strokeWidth={2} />
      <text x={x + w / 2} y={y + (sub ? 22 : h / 2 + 5)} textAnchor="middle" fontSize={13.5} fontWeight={700} fill={C.ink}>
        {title}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + 40} textAnchor="middle" fontSize={10} fill={C.muted}>
          {sub}
        </text>
      )}
      {tag && (
        <g>
          <rect x={x + w - 52} y={y - 9} width={50} height={18} rx={9} fill={color} />
          <text x={x + w - 27} y={y + 4} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#ffffff">
            {tag}
          </text>
        </g>
      )}
    </g>
  );
}

function HArrow({x1, x2, y, label}: {x1: number; x2: number; y: number; label?: string}) {
  return (
    <g>
      <line x1={x1} y1={y} x2={x2 - 8} y2={y} stroke={C.faint} strokeWidth={2} />
      <polygon points={`${x2},${y} ${x2 - 9},${y - 4.5} ${x2 - 9},${y + 4.5}`} fill={C.faint} />
      {label && (
        <text x={(x1 + x2) / 2} y={y - 7} textAnchor="middle" fontSize={9.5} fill={C.muted}>{label}</text>
      )}
    </g>
  );
}

function VArrow({x, y1, y2, label}: {x: number; y1: number; y2: number; label?: string}) {
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2 - 8} stroke={C.faint} strokeWidth={2} />
      <polygon points={`${x},${y2} ${x - 4.5},${y2 - 9} ${x + 4.5},${y2 - 9}`} fill={C.faint} />
      {label && (
        <text x={x + 8} y={(y1 + y2) / 2 + 3} fontSize={9.5} fill={C.muted}>{label}</text>
      )}
    </g>
  );
}

export default function Panorama() {
  const svgRef = useRef<SVGSVGElement>(null);

  const download = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const src = `<?xml version="1.0" encoding="UTF-8"?>\n${svg.outerHTML}`;
    const blob = new Blob([src], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'llm-panorama.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PlaygroundCard
      title="全景大图：从网页到助手的完整流水线"
      subtitle="全书九章，一张图收。每个方块角上的标签是对应章节——哪里模糊了就回哪里复习。海报可下载（SVG 矢量图，打印无损）。"
      footer={
        <>
          💡 用法建议：把这张图存下来。以后每读一篇大模型论文，先在图上找到它的位置——是数据环节的改进？训练目标的变体？还是对齐或推理的新招？<b>有地图的人不会迷路</b>。
        </>
      }
    >
      <div className={styles.svgWrap}>
        <svg ref={svgRef} viewBox="0 0 1000 640" xmlns="http://www.w3.org/2000/svg" style={{maxWidth: 1000}}>
          <rect x={0} y={0} width={1000} height={640} fill={C.bg} />
          <text x={500} y={34} textAnchor="middle" fontSize={22} fontWeight={800} fill={C.ink}>
            大模型是怎么炼成的 · 全景图
          </text>

          {/* ===== 第 1 排：数据 ===== */}
          <text x={40} y={76} fontSize={13} fontWeight={800} fill={C.green}>📦 原料：数据工程</text>
          <Box x={40} y={88} w={180} h={52} color={C.green} title="互联网 · 书 · 代码" sub="Common Crawl 等原始来源" tag="第4章" />
          <HArrow x1={220} x2={258} y={114} />
          <Box x={258} y={88} w={180} h={52} color={C.green} title="清洗流水线" sub="提取·滤质·去重·脱敏" />
          <HArrow x1={438} x2={476} y={114} />
          <Box x={476} y={88} w={180} h={52} color={C.green} title="万亿 token 语料" sub="按配比混合" />
          {/* 分词支线 */}
          <Box x={730} y={88} w={230} h={52} color={C.blue} title="分词器 BPE · 词向量" sub="文字 → token → 向量" tag="第1章" />
          <VArrow x={566} y1={140} y2={172} />

          {/* ===== 第 2 排：预训练 ===== */}
          <text x={40} y={188} fontSize={13} fontWeight={800} fill={C.blue}>🏭 预训练：下一个词预测</text>
          <Box x={40} y={200} w={180} h={52} color={C.blue} title="Transformer 骨架" sub="注意力 + 前馈 ×N 层" tag="第3章" />
          <Box x={258} y={200} w={180} h={52} color={C.blue} title="训练三件套" sub="损失·梯度下降·反向传播" tag="第2章" />
          <Box x={476} y={200} w={180} h={52} color={C.blue} title="工业化训练" sub="Scaling Laws·3D并行·容灾" tag="第4章" />
          <HArrow x1={656} x2={700} y={226} />
          <Box x={700} y={200} w={160} h={52} color={C.violet} title="基座模型" sub="最强接话茬选手" />
          <VArrow x={780} y1={252} y2={286} />

          {/* ===== 第 3 排：后训练 ===== */}
          <text x={40} y={302} fontSize={13} fontWeight={800} fill={C.violet}>🎓 后训练：对齐人类</text>
          <Box x={40} y={314} w={150} h={52} color={C.violet} title="SFT 示范课" sub="学会对话格式" tag="第5章" />
          <HArrow x1={190} x2={224} y={340} />
          <Box x={224} y={314} w={160} h={52} color={C.violet} title="偏好数据 → 奖励模型" sub="判断比创作容易" />
          <HArrow x1={384} x2={418} y={340} />
          <Box x={418} y={314} w={200} h={52} color={C.violet} title="强化学习" sub="PPO · DPO · GRPO · RLVR" />
          <HArrow x1={618} x2={660} y={340} />
          <Box x={660} y={314} w={200} h={52} color={C.orange} title="Chat / 推理模型" sub="会说人话 · 会深想" />
          <VArrow x={760} y1={366} y2={400} />

          {/* ===== 第 4 排：落地 ===== */}
          <text x={40} y={416} fontSize={13} fontWeight={800} fill={C.orange}>🚀 落地与检验</text>
          <Box x={40} y={428} w={220} h={52} color={C.orange} title="推理优化" sub="KV Cache·量化·vLLM·蒸馏" tag="第6章" />
          <HArrow x1={260} x2={300} y={454} />
          <Box x={300} y={428} w={180} h={52} color={C.orange} title="产品与应用" sub="对话 · 编程 · Agent" />
          <Box x={540} y={428} w={200} h={52} color={C.red} title="评测" sub="Benchmark·盲评·防污染" tag="第7章" />
          <HArrow x1={480} x2={540} y={454} label="接受检验" />
          <path d="M 640 480 Q 640 520 500 520 Q 380 520 379 484" fill="none" stroke={C.faint} strokeWidth={2} strokeDasharray="6 4" />
          <polygon points="379,480 374.5,489 383.5,489" fill={C.faint} />
          <text x={505} y={534} textAnchor="middle" fontSize={9.5} fill={C.muted}>评测结果反馈改进（数据、对齐、推理都要改）</text>

          {/* ===== 前沿侧栏 ===== */}
          <Box x={790} y={428} w={170} h={80} color={C.aqua} title="前沿方向" sub="MoE · 长上下文" tag="第8章" />
          <text x={875} y={488} textAnchor="middle" fontSize={10} fill={C.muted}>多模态 · 推理模型 · Agent</text>

          {/* 底部 */}
          <line x1={40} y1={568} x2={960} y2={568} stroke="#e1e0d9" strokeWidth={1} />
          <text x={40} y={592} fontSize={10.5} fill={C.muted}>
            交互式教程（含 23 个动手实验）：zky001.github.io/llm-training-guide
          </text>
          <text x={960} y={592} textAnchor="end" fontSize={10.5} fill={C.muted}>
            内容许可 CC BY-SA 4.0 · 2026
          </text>
          <text x={40} y={614} fontSize={10.5} fill={C.faint}>
            数据(第4章) → 预训练(第2·3·4章) → 后训练(第5章) → 推理(第6章) → 评测(第7章)，循环往复——这就是大模型的一生。
          </text>
        </svg>
      </div>

      <BtnRow>
        <Btn primary onClick={download}>⬇️ 下载海报（SVG 矢量图）</Btn>
      </BtnRow>
    </PlaygroundCard>
  );
}
