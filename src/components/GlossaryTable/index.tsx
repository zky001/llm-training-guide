import React, {useMemo, useState} from 'react';
import {GLOSSARY} from '@site/src/data/glossary';
import styles from './styles.module.css';

const CHAPTER_NAMES: Record<string, string> = {
  '0': '第 0 章 · 预备知识',
  '1': '第 1 章 · 什么是语言模型',
  '2': '第 2 章 · 神经网络与训练三件套',
  '3': '第 3 章 · Transformer 架构',
  '4': '第 4 章 · 预训练',
  '5': '第 5 章 · 后训练与对齐',
  '6': '第 6 章 · 推理与部署',
  '7': '第 7 章 · 评测',
  '8': '第 8 章 · 前沿与全景',
  K0: '中篇 K0 · 为什么需要知识库',
  K1: '中篇 K1 · 语义检索',
  K2: '中篇 K2 · 切块的艺术',
  A0: '下篇 A0 · 从聊天到行动',
  A1: '下篇 A1 · 工具调用',
  A2: '下篇 A2 · 规划与反思',
  A3: '下篇 A3 · 记忆与上下文工程',
  A4: '下篇 A4 · 编排模式',
  A5: '下篇 A5 · 多智能体系统',
  A6: '下篇 A6 · 智能体上电脑',
  A7: '下篇 A7 · 评测与可靠性',
  A8: '下篇 A8 · 安全与未来',
};

/** 附录术语表页面：按章分组 + 即时搜索 */
export default function GlossaryTable() {
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? GLOSSARY.filter(
          (e) =>
            e.zh.toLowerCase().includes(q) ||
            e.en.toLowerCase().includes(q) ||
            e.def.toLowerCase().includes(q),
        )
      : GLOSSARY;
    const byChapter = new Map<string, typeof GLOSSARY>();
    for (const e of filtered) {
      const key = e.chapter ?? '其他';
      if (!byChapter.has(key)) byChapter.set(key, []);
      byChapter.get(key)!.push(e);
    }
    // 阅读顺序：上篇（数字 0~8）→ 中篇（K）→ 下篇（A）
    const rank = (c: string) => {
      if (/^\d/.test(c)) return `0_${c.padStart(2, '0')}`;
      if (c.startsWith('K')) return `1_${c}`;
      if (c.startsWith('A')) return `2_${c}`;
      return `9_${c}`;
    };
    return [...byChapter.entries()].sort(([a], [b]) => rank(a).localeCompare(rank(b)));
  }, [query]);

  return (
    <div>
      <input
        type="search"
        className={styles.search}
        placeholder="🔍 搜索术语（中文 / English / 释义）…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {groups.length === 0 && <p>没有匹配的术语。</p>}
      {groups.map(([chapter, entries]) => (
        <section key={chapter}>
          <h3 className={styles.groupTitle}>
            {CHAPTER_NAMES[chapter] ?? chapter}
          </h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>中文</th>
                <th>English</th>
                <th>一句话解释</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} id={`term-${e.id}`}>
                  <td className={styles.zh}>{e.zh}</td>
                  <td className={styles.en}>{e.en}</td>
                  <td>{e.def}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
