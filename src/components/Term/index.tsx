import React, {useState, type ReactNode} from 'react';
import {GLOSSARY} from '@site/src/data/glossary';
import styles from './styles.module.css';

/**
 * 行内术语：悬停 / 点击显示释义气泡。
 * 用法：<Term id="token">token</Term>；不传 children 时显示术语中文名。
 */
export default function Term({id, children}: {id: string; children?: ReactNode}) {
  const [open, setOpen] = useState(false);
  const entry = GLOSSARY.find((e) => e.id === id);

  if (!entry) {
    // 术语表里还没有这个词条：正常显示文字，避免页面报错
    return <span>{children ?? id}</span>;
  }

  return (
    <span
      className={styles.term}
      tabIndex={0}
      role="button"
      aria-label={`术语：${entry.zh}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen((o) => !o)}
    >
      {children ?? entry.zh}
      {open && (
        <span className={styles.tip}>
          <span className={styles.tipTitle}>
            {entry.zh} <i className={styles.tipEn}>{entry.en}</i>
          </span>
          <span className={styles.tipDef}>{entry.def}</span>
        </span>
      )}
    </span>
  );
}
