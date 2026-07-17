import React, {useEffect, useMemo, useRef, useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message, SliderRow, Stat, StatRow, svgPoint} from '../ui';
import styles from '../playground.module.css';

/**
 * 0.4 节：梯度下山实验。
 * f(x) = 0.05x⁴ − 0.4x² + 0.1x + 2：有一深一浅两个山谷，
 * 可以体验学习率过大发散、以及掉进局部最低点。
 */

const f = (x: number) => 0.05 * x ** 4 - 0.4 * x ** 2 + 0.1 * x + 2;
const df = (x: number) => 0.2 * x ** 3 - 0.8 * x + 0.1;

const X_MIN = -3.5;
const X_MAX = 3.5;
const Y_MIN = 0;
const Y_MAX = 5.5;

const W = 480;
const H = 300;
const PAD = 20;

const px = (x: number) => PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * (W - 2 * PAD);
const py = (y: number) => H - PAD - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * (H - 2 * PAD);
const invX = (p: number) => X_MIN + ((p - PAD) / (W - 2 * PAD)) * (X_MAX - X_MIN);

// 两个谷底位置（f'(x)=0 的数值解），只用来放文字标注
const GLOBAL_MIN_X = -2.06;
const LOCAL_MIN_X = 1.93;

export default function GradientPlayground() {
  const [x, setX] = useState(3.0);
  const [lr, setLr] = useState(0.1);
  const [trail, setTrail] = useState<number[]>([]);
  const [steps, setSteps] = useState(0);
  const [running, setRunning] = useState(false);
  const [diverged, setDiverged] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const curvePath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 140; i++) {
      const cx = X_MIN + (i / 140) * (X_MAX - X_MIN);
      pts.push(`${i === 0 ? 'M' : 'L'}${px(cx).toFixed(1)},${py(f(cx)).toFixed(1)}`);
    }
    return pts.join(' ');
  }, []);

  const slope = df(x);
  const converged = Math.abs(slope) < 0.02 && steps > 0 && !diverged;
  const inLocalValley = converged && x > 0;

  const stopAuto = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    setRunning(false);
  };

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const doStep = () => {
    setX((prev) => {
      const next = prev - lr * df(prev);
      setTrail((t) => [...t.slice(-40), prev]);
      setSteps((s) => s + 1);
      if (next < X_MIN - 0.3 || next > X_MAX + 0.3) {
        setDiverged(true);
        stopAuto();
        return prev; // 球停在边缘，用提示语说明「飞出去了」
      }
      return next;
    });
  };

  const toggleAuto = () => {
    if (running) {
      stopAuto();
      return;
    }
    setRunning(true);
    timer.current = setInterval(() => {
      setX((prev) => {
        const g = df(prev);
        if (Math.abs(g) < 0.005) {
          stopAuto();
          return prev;
        }
        const next = prev - lr * g;
        setTrail((t) => [...t.slice(-40), prev]);
        setSteps((s) => s + 1);
        if (next < X_MIN - 0.3 || next > X_MAX + 0.3) {
          setDiverged(true);
          stopAuto();
          return prev;
        }
        return next;
      });
    }, 300);
  };

  const reset = (startX: number) => {
    stopAuto();
    setX(startX);
    setTrail([]);
    setSteps(0);
    setDiverged(false);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current || !svgRef.current) return;
    const p = svgPoint(svgRef.current, e);
    const nx = Math.max(X_MIN, Math.min(X_MAX, invX(p.x)));
    setX(nx);
    setTrail([]);
    setSteps(0);
    setDiverged(false);
  };

  // 切线段（以球为中心，向两侧各延伸 0.7 个单位）
  const tx1 = x - 0.7;
  const tx2 = x + 0.7;
  const ty1 = f(x) - 0.7 * slope;
  const ty2 = f(x) + 0.7 * slope;

  return (
    <PlaygroundCard
      title="梯度下山：蒙着眼睛找谷底"
      subtitle="小球只知道脚下的坡度（切线），沿着下坡方向一步步走。拖动小球换起点，调学习率，点「自动下山」。试试：学习率调到 1.0 以上会发生什么？"
      footer={
        <>
          💡 要点：训练大模型时，「山谷高度」就是损失，「小球位置」就是几千亿个参数。模型看不到整座山的形状，只能靠脚下坡度（<b>梯度</b>）一步步挪。学习率太大→飞出山谷（训练崩掉）；太小→挪不动（训练太慢）；起点不好→掉进局部最低点。
        </>
      }
    >
      <div className={styles.svgWrap}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          onPointerMove={onPointerMove}
          onPointerUp={() => (dragging.current = false)}
          onPointerLeave={() => (dragging.current = false)}
        >
          {/* 山体曲线 */}
          <path d={curvePath} fill="none" stroke="var(--viz-s1)" strokeWidth={2.5} />
          {/* 谷底标注 */}
          <text x={px(GLOBAL_MIN_X)} y={py(f(GLOBAL_MIN_X)) + 18} textAnchor="middle" fontSize={10.5} fill="var(--viz-muted)">
            全局最低点
          </text>
          <text x={px(LOCAL_MIN_X)} y={py(f(LOCAL_MIN_X)) + 18} textAnchor="middle" fontSize={10.5} fill="var(--viz-muted)">
            局部最低点
          </text>
          {/* 足迹 */}
          {trail.map((tx, i) => (
            <circle
              key={i}
              cx={px(tx)}
              cy={py(f(tx))}
              r={3.5}
              fill="var(--viz-s6)"
              opacity={0.15 + 0.6 * (i / Math.max(trail.length, 1))}
            />
          ))}
          {/* 切线 */}
          {!diverged && (
            <line
              x1={px(tx1)} y1={py(ty1)} x2={px(tx2)} y2={py(ty2)}
              stroke="var(--viz-s8)" strokeWidth={2} strokeDasharray="5 4"
            />
          )}
          {/* 小球 */}
          <circle
            cx={px(x)} cy={py(f(x))} r={10}
            fill="var(--viz-s6)" stroke="var(--viz-surface)" strokeWidth={2.5}
            style={{cursor: 'grab'}}
            onPointerDown={() => {
              stopAuto();
              dragging.current = true;
            }}
          />
        </svg>
      </div>

      <SliderRow label="学习率 η" value={lr} min={0.01} max={1.5} step={0.01} onChange={setLr} fmt={(v) => v.toFixed(2)} />

      <StatRow>
        <Stat label="当前位置 x" value={x.toFixed(2)} />
        <Stat label="高度 f(x)（损失）" value={f(x).toFixed(3)} />
        <Stat label="坡度 f′(x)（梯度）" value={slope.toFixed(3)} />
        <Stat label="已走步数" value={steps} />
      </StatRow>

      <BtnRow>
        <Btn primary onClick={doStep} disabled={running || diverged}>👣 走一步</Btn>
        <Btn primary onClick={toggleAuto} disabled={diverged}>{running ? '⏸ 暂停' : '▶ 自动下山'}</Btn>
        <Btn onClick={() => reset(3.0)}>↺ 重置（右坡出发）</Btn>
        <Btn onClick={() => reset(-3.2)}>↺ 换左坡出发</Btn>
      </BtnRow>

      {diverged && (
        <Message>
          💥 <b>发散了！</b>学习率 η = {lr.toFixed(2)} 太大：每一步迈得比山谷还宽，小球越荡越高，直接飞出了山谷。真实的大模型训练里这叫「loss 爆炸」，只能调小学习率或回滚到上一个检查点重来。
        </Message>
      )}
      {converged && !inLocalValley && (
        <Message>
          ✅ 到达<b>全局最低点</b>附近，坡度 ≈ 0，走不动了——这正是我们想要的终点：损失最小的参数。
        </Message>
      )}
      {converged && inLocalValley && (
        <Message>
          ⚠️ 小球停在了<b>局部最低点</b>：这里四周都是上坡，但它不是全场最低！只靠「往低处走」是出不去的。试试点「换左坡出发」，或把学习率调大一点冲过小山坡。
        </Message>
      )}
    </PlaygroundCard>
  );
}
