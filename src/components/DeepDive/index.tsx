import React, {useEffect, useState, type ReactNode} from 'react';
import clsx from 'clsx';
import {useLearningMode} from '../LearningMode';
import styles from './styles.module.css';

interface Props {
  /** 折叠块标题，如「最小二乘的闭式解」 */
  title?: string;
  children: ReactNode;
}

/**
 * 「深入一层」折叠块：双轨内容的深入层。
 * 直觉模式下默认折叠，可单独点开；切到深入模式时全站自动展开。
 */
export default function DeepDive({title = '数学与细节', children}: Props) {
  const {mode} = useLearningMode();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(mode === 'deep');
  }, [mode]);

  return (
    <div className={clsx(styles.box, open && styles.boxOpen)}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={styles.icon}>🔬</span>
        <span className={styles.title}>深入一层：{title}</span>
        <span className={styles.hint}>{open ? '收起 ▴' : '展开 ▾'}</span>
      </button>
      {open && <div className={styles.body}>{children}</div>}
    </div>
  );
}
