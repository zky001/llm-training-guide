import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import styles from './styles.module.css';

export type LearningModeValue = 'intuition' | 'deep';

const STORAGE_KEY = 'llm-guide-learning-mode';

const LearningModeContext = createContext<{
  mode: LearningModeValue;
  setMode: (m: LearningModeValue) => void;
}>({mode: 'intuition', setMode: () => {}});

export function useLearningMode() {
  return useContext(LearningModeContext);
}

export function LearningModeProvider({children}: {children: ReactNode}) {
  const [mode, setModeState] = useState<LearningModeValue>('intuition');

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === 'deep') {
        setModeState('deep');
      }
    } catch {
      // 隐私模式等场景下 localStorage 不可用，忽略即可
    }
  }, []);

  const setMode = useCallback((m: LearningModeValue) => {
    setModeState(m);
    try {
      window.localStorage.setItem(STORAGE_KEY, m);
    } catch {
      // ignore
    }
  }, []);

  return (
    <LearningModeContext.Provider value={{mode, setMode}}>
      {children}
    </LearningModeContext.Provider>
  );
}

/** 右下角悬浮的「直觉 / 深入」模式切换按钮 */
export function LearningModeFab() {
  const {mode, setMode} = useLearningMode();
  const deep = mode === 'deep';
  return (
    <button
      type="button"
      className={styles.fab}
      onClick={() => setMode(deep ? 'intuition' : 'deep')}
      title={
        deep
          ? '当前是深入模式：全部数学推导与细节已展开。点击切回直觉模式。'
          : '当前是直觉模式：数学推导默认折叠。点击一键展开全站深入内容。'
      }
    >
      <span className={styles.fabIcon}>{deep ? '🔬' : '🧠'}</span>
      <span className={styles.fabText}>{deep ? '深入模式' : '直觉模式'}</span>
    </button>
  );
}
