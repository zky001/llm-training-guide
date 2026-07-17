import React, {useState} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

export interface QuizQuestion {
  /** 题干 */
  q: string;
  /** 选项（2~5 个） */
  options: string[];
  /** 正确选项下标（从 0 开始） */
  answer: number;
  /** 答后显示的解析 */
  explanation: string;
}

/**
 * 自测小题组件：点选后立即反馈对错并显示解析，全部为前端判分。
 * 用法：<Quiz questions={[{q, options, answer, explanation}, ...]} />
 */
export default function Quiz({questions}: {questions: QuizQuestion[]}) {
  const [picked, setPicked] = useState<(number | null)[]>(() =>
    questions.map(() => null),
  );

  const answered = picked.filter((p) => p !== null).length;
  const correct = picked.filter((p, i) => p === questions[i].answer).length;
  const done = answered === questions.length;

  const pick = (qi: number, oi: number) => {
    if (picked[qi] !== null) return;
    setPicked((prev) => prev.map((p, i) => (i === qi ? oi : p)));
  };

  const reset = () => setPicked(questions.map(() => null));

  return (
    <div className={styles.quiz}>
      <div className={styles.quizHeader}>
        <span>📝 动手自测</span>
        <span className={styles.progress}>
          {answered}/{questions.length}
        </span>
      </div>
      {questions.map((q, qi) => {
        const chosen = picked[qi];
        return (
          <div key={qi} className={styles.question}>
            <div className={styles.stem}>
              {qi + 1}. {q.q}
            </div>
            <div className={styles.options}>
              {q.options.map((opt, oi) => {
                const isAnswer = oi === q.answer;
                const isChosen = chosen === oi;
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={chosen !== null}
                    onClick={() => pick(qi, oi)}
                    className={clsx(
                      styles.option,
                      chosen !== null && isAnswer && styles.optionCorrect,
                      isChosen && !isAnswer && styles.optionWrong,
                    )}
                  >
                    <span className={styles.optionLetter}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span>{opt}</span>
                    {chosen !== null && isAnswer && <span> ✅</span>}
                    {isChosen && !isAnswer && <span> ❌</span>}
                  </button>
                );
              })}
            </div>
            {chosen !== null && (
              <div
                className={clsx(
                  styles.explanation,
                  chosen === q.answer ? styles.explainGood : styles.explainBad,
                )}
              >
                {chosen === q.answer ? '答对了！' : '不对哦。'}
                {q.explanation}
              </div>
            )}
          </div>
        );
      })}
      {done && (
        <div className={styles.summary}>
          <span>
            🎯 全部完成：答对 {correct} / {questions.length}
            {correct === questions.length ? '，太棒了！' : '，看看上面的解析再战一次？'}
          </span>
          <button type="button" className={styles.resetBtn} onClick={reset}>
            ↺ 重做
          </button>
        </div>
      )}
    </div>
  );
}
