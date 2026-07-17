import React, {type ReactNode} from 'react';
import styles from './playground.module.css';

interface Props {
  /** 实验名，如「拖点拟合：亲手当一次模型」 */
  title: string;
  /** 一句话说明玩法 */
  subtitle?: string;
  children: ReactNode;
  /** 底部提示，如实验要点 */
  footer?: ReactNode;
}

/** 所有交互实验的统一外壳，保证全站视觉一致 */
export default function PlaygroundCard({title, subtitle, children, footer}: Props) {
  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <span className={styles.badge}>🎮 动手实验</span>
        <div className={styles.headText}>
          <div className={styles.title}>{title}</div>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
      </header>
      <div className={styles.body}>{children}</div>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </section>
  );
}
