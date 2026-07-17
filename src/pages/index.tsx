import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

const FEATURES: {icon: string; title: string; desc: string}[] = [
  {
    icon: '🧠',
    title: '直觉优先，双轨难度',
    desc: '每一节先用类比和动画把直觉讲透（高中生可读），数学推导折叠在「深入一层」里（大学生展开细看）。右下角一键切换全站模式。',
  },
  {
    icon: '🎮',
    title: '一路动手做实验',
    desc: '不是静态配图：拖动小球体验梯度下降、亲手训练 BPE 分词器、掷「语言骰子」看模型怎么说话——概念在你手里动起来。',
  },
  {
    icon: '🏔️',
    title: '从零到 RLHF 的完整地图',
    desc: '预备数学 → 神经网络 → Transformer → 预训练 → SFT/RLHF → 推理部署 → 评测，一条主线讲完大模型的完整生产流水线。',
  },
];

const CHAPTERS: {n: string; title: string; desc: string; href: string; done: boolean}[] = [
  {n: '第 0 章', title: '预备知识', desc: '机器学习、向量矩阵、概率、梯度——只需初中代数就能上车', href: '/docs/prerequisites', done: true},
  {n: '第 1 章', title: '什么是语言模型', desc: '预测下一个词、分词（BPE）、词向量', href: '/docs/language-models', done: true},
  {n: '第 2 章', title: '神经网络与训练三件套', desc: '损失、梯度下降、反向传播，浏览器里现场训练', href: '/docs/neural-networks', done: true},
  {n: '第 3 章', title: 'Transformer 架构', desc: '注意力机制、QKV、位置编码、采样生成', href: '/docs/transformer', done: true},
  {n: '第 4 章', title: '预训练', desc: '数据工程、Scaling Laws、GPU 集群与并行策略', href: '/docs/pretraining', done: true},
  {n: '第 5 章', title: '后训练与对齐', desc: 'SFT、RLHF、DPO/GRPO、推理强化学习', href: '/docs/post-training', done: true},
  {n: '第 6 章', title: '推理与部署', desc: 'KV Cache、量化、蒸馏、vLLM', href: '/docs/inference', done: true},
  {n: '第 7 章', title: '评测', desc: 'Benchmark、数据污染、LLM 当裁判', href: '/docs/evaluation', done: true},
  {n: '第 8 章', title: '前沿与全景', desc: 'MoE、长上下文、多模态、推理模型', href: '/docs/frontier', done: true},
  {n: '附录', title: '术语表 · 动手路线 · 资料', desc: '全站术语、nanoGPT 实践指南、论文清单', href: '/docs/appendix/glossary', done: true},
];

const AGENT_CHAPTERS: {n: string; title: string; desc: string; href: string; done: boolean}[] = [
  {n: 'A0', title: '从聊天到行动', desc: '智能体 = 模型 + 工具 + 循环；自主性光谱', href: '/agents/from-chat-to-action', done: true},
  {n: 'A1', title: '工具调用', desc: 'Function Calling 全流程；会用工具是训练出来的', href: '/agents/tool-use', done: true},
  {n: 'A2', title: '规划与反思', desc: '把大事拆小、做完回头看', href: '/agents/planning-reflection', done: true},
  {n: 'A3', title: '记忆与上下文工程', desc: '工作记忆、长期记忆与 Agentic RAG', href: '/agents/memory-context', done: true},
  {n: 'A4', title: '编排模式', desc: '五种工作流积木及其组合', href: '/agents/orchestration', done: true},
  {n: 'A5', title: '多智能体系统', desc: '分工协作与 MCP / A2A 协议', href: '/agents/multi-agent', done: true},
  {n: 'A6', title: '智能体上电脑', desc: '代码智能体与计算机使用', href: '/agents/computer-use', done: false},
  {n: 'A7', title: '评测与可靠性', desc: '错误复利、SWE-bench 与评测驱动开发', href: '/agents/agent-evaluation', done: false},
  {n: 'A8', title: '安全与未来', desc: '提示注入、最小权限与 Agentic RL', href: '/agents/safety-frontier', done: false},
  {n: '附录', title: '实战路线', desc: '100 行代码写一个 Agent；框架地图', href: '/agents/appendix', done: false},
];

const PATHS: {icon: string; who: string; how: string}[] = [
  {
    icon: '🎒',
    who: '高中生 / 零基础',
    how: '从第 0 章开始按顺序读，保持「直觉模式」，把每个实验都玩一遍，跳过所有「深入一层」。',
  },
  {
    icon: '🎓',
    who: '大学生 / 有数学基础',
    how: '快速过第 0 章，从第 1 章起展开每节的「深入一层」，推导和代码都别放过，配合章末自测。',
  },
  {
    icon: '💼',
    who: '工程师 / 从业者',
    how: '直接跳到感兴趣的章节（预训练、RLHF、推理优化），把交互实验当作给别人讲解时的演示工具。',
  },
];

function Hero() {
  return (
    <header className={styles.hero}>
      <div className={styles.heroInner}>
        <Heading as="h1" className={styles.heroTitle}>
          大模型是怎么<span className={styles.heroAccent}>炼成</span>的
        </Heading>
        <p className={styles.heroSubtitle}>
          上篇讲透大模型怎么炼成（预训练 → RLHF），下篇拆开智能体怎么办事（工具 → 循环 → 多智能体）。
          <br />
          双轨难度 · 29 个动手实验 · 中文原创 · 完全开源
        </p>
        <div className={styles.heroButtons}>
          <Link className="button button--primary button--lg" to="/docs/intro">
            📖 上篇 · 大模型
          </Link>
          <Link className="button button--primary button--lg" to="/agents/intro">
            🤖 下篇 · 智能体
          </Link>
          <Link
            className="button button--secondary button--outline button--lg"
            to="https://github.com/zky001/llm-training-guide"
          >
            GitHub ⭐
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout description="从预测下一个词到 RLHF —— 双轨难度、交互实验、人人都能看懂的大模型训练图解教程">
      <Hero />
      <main>
        <section className={styles.section}>
          <div className="container">
            <div className={styles.featureGrid}>
              {FEATURES.map((f) => (
                <div key={f.title} className={styles.featureCard}>
                  <div className={styles.featureIcon}>{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={clsx(styles.section, styles.sectionAlt)}>
          <div className="container">
            <Heading as="h2" className={styles.sectionTitle}>
              🧭 三条学习路径
            </Heading>
            <div className={styles.pathGrid}>
              {PATHS.map((p) => (
                <div key={p.who} className={styles.pathCard}>
                  <div className={styles.pathWho}>
                    {p.icon} {p.who}
                  </div>
                  <p>{p.how}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <Heading as="h2" className={styles.sectionTitle}>
              📖 上篇 · 大模型是怎么炼成的（已完稿）
            </Heading>
            <div className={styles.chapterGrid}>
              {CHAPTERS.map((c) => (
                <Link key={c.n} to={c.href} className={styles.chapterCard}>
                  <div className={styles.chapterHead}>
                    <span className={styles.chapterNo}>{c.n}</span>
                    <span className={c.done ? styles.badgeDone : styles.badgeWip}>
                      {c.done ? '✅ 可阅读' : '🚧 规划中'}
                    </span>
                  </div>
                  <div className={styles.chapterTitle}>{c.title}</div>
                  <div className={styles.chapterDesc}>{c.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={clsx(styles.section, styles.sectionAlt)}>
          <div className="container">
            <Heading as="h2" className={styles.sectionTitle}>
              🤖 下篇 · 智能体是怎么工作的（连载中）
            </Heading>
            <div className={styles.chapterGrid}>
              {AGENT_CHAPTERS.map((c) => (
                <Link key={c.n} to={c.href} className={styles.chapterCard}>
                  <div className={styles.chapterHead}>
                    <span className={styles.chapterNo}>{c.n}</span>
                    <span className={c.done ? styles.badgeDone : styles.badgeWip}>
                      {c.done ? '✅ 可阅读' : '🚧 规划中'}
                    </span>
                  </div>
                  <div className={styles.chapterTitle}>{c.title}</div>
                  <div className={styles.chapterDesc}>{c.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
