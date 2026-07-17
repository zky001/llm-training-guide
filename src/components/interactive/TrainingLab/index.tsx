import React, {useEffect, useRef, useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message, SliderRow, Stat, StatRow} from '../ui';
import styles from '../playground.module.css';

/**
 * 2.6 节：浏览器内真实训练。
 * 一个 1-h-1 的 tanh 小网络，在 40 个带噪数据点上做全批量梯度下降。
 * 数据与参数初始化都用固定种子的 LCG 生成，保证服务端/客户端渲染一致。
 */

// ---- 确定性随机数（固定种子，保证可复现与 SSR 一致） ----
function makeLcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const truth = (x: number) => Math.sin(1.5 * x) + 0.3 * x;

// 训练数据（模块级一次生成，确定性）
const DATA: {x: number; y: number}[] = (() => {
  const rnd = makeLcg(42);
  return Array.from({length: 40}, (_, i) => {
    const x = -4 + (i / 39) * 8;
    return {x, y: truth(x) + (rnd() * 2 - 1) * 0.25};
  });
})();

interface Net {
  h: number;
  W1: number[];
  b1: number[];
  W2: number[];
  b2: number;
}

function initNet(h: number): Net {
  const rnd = makeLcg(7 + h);
  return {
    h,
    W1: Array.from({length: h}, () => (rnd() * 2 - 1) * 1.5),
    b1: Array.from({length: h}, () => (rnd() * 2 - 1) * 2),
    W2: Array.from({length: h}, () => (rnd() * 2 - 1) * 0.5),
    b2: 0,
  };
}

function predict(net: Net, x: number): number {
  let y = net.b2;
  for (let i = 0; i < net.h; i++) {
    y += net.W2[i] * Math.tanh(net.W1[i] * x + net.b1[i]);
  }
  return y;
}

/** 一次全批量梯度下降，返回更新前的损失 */
function trainStep(net: Net, lr: number): number {
  const n = DATA.length;
  const gW1 = new Array(net.h).fill(0);
  const gb1 = new Array(net.h).fill(0);
  const gW2 = new Array(net.h).fill(0);
  let gb2 = 0;
  let loss = 0;
  for (const {x, y} of DATA) {
    const hs = net.W1.map((w, i) => Math.tanh(w * x + net.b1[i]));
    const pred = hs.reduce((s, hv, i) => s + net.W2[i] * hv, net.b2);
    const err = pred - y;
    loss += err * err;
    const gPred = (2 * err) / n;
    for (let i = 0; i < net.h; i++) {
      gW2[i] += gPred * hs[i];
      const gh = gPred * net.W2[i] * (1 - hs[i] * hs[i]);
      gW1[i] += gh * x;
      gb1[i] += gh;
    }
    gb2 += gPred;
  }
  for (let i = 0; i < net.h; i++) {
    net.W1[i] -= lr * gW1[i];
    net.b1[i] -= lr * gb1[i];
    net.W2[i] -= lr * gW2[i];
  }
  net.b2 -= lr * gb2;
  return loss / n;
}

// ---- 绘图 ----
const W = 480;
const H = 250;
const PAD = 30;
const X_MIN = -4;
const X_MAX = 4;
const Y_MIN = -2.4;
const Y_MAX = 2.4;
const px = (x: number) => PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * (W - 2 * PAD);
const py = (y: number) =>
  H - PAD - ((Math.max(Y_MIN, Math.min(Y_MAX, y)) - Y_MIN) / (Y_MAX - Y_MIN)) * (H - 2 * PAD);

export default function TrainingLab() {
  const [hidden, setHidden] = useState(8);
  const [lr, setLr] = useState(0.1);
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0); // 触发重渲染
  const [diverged, setDiverged] = useState(false);

  const netRef = useRef<Net>(initNet(8));
  const lossHist = useRef<number[]>([]);
  const iterRef = useRef(0);
  const lrRef = useRef(lr);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  lrRef.current = lr;

  useEffect(() => () => stop(), []);

  const stop = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    setRunning(false);
  };

  const runIters = (n: number) => {
    let last = 0;
    for (let i = 0; i < n; i++) {
      last = trainStep(netRef.current, lrRef.current);
      iterRef.current += 1;
      if (iterRef.current % 10 === 0 || iterRef.current <= 10) {
        lossHist.current.push(last);
        if (lossHist.current.length > 400) lossHist.current.shift();
      }
    }
    if (!Number.isFinite(last) || last > 1e3) {
      setDiverged(true);
      stop();
    }
    setTick((t) => t + 1);
  };

  const toggleRun = () => {
    if (running) {
      stop();
      return;
    }
    setRunning(true);
    timer.current = setInterval(() => runIters(20), 60);
  };

  const reset = (h: number) => {
    stop();
    netRef.current = initNet(h);
    lossHist.current = [];
    iterRef.current = 0;
    setHidden(h);
    setDiverged(false);
    setTick((t) => t + 1);
  };

  const net = netRef.current;
  const curLoss = lossHist.current.length > 0 ? lossHist.current[lossHist.current.length - 1] : NaN;
  const params = net.h * 3 + 1;

  // 拟合曲线
  const fitPath: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const x = X_MIN + (i / 120) * (X_MAX - X_MIN);
    fitPath.push(`${i === 0 ? 'M' : 'L'}${px(x).toFixed(1)},${py(predict(net, x)).toFixed(1)}`);
  }

  // 损失曲线（对数纵轴）
  const LW = 480;
  const LH = 140;
  const hist = lossHist.current;
  const logs = hist.map((l) => Math.log10(Math.max(1e-4, l)));
  const lMax = Math.max(0.5, ...logs);
  const lMin = Math.min(-2.2, ...logs);
  const lossPts = logs
    .map((lv, i) => {
      const X2 = 34 + (i / Math.max(1, logs.length - 1)) * (LW - 44);
      const Y2 = 10 + ((lMax - lv) / (lMax - lMin)) * (LH - 30);
      return `${X2.toFixed(1)},${Y2.toFixed(1)}`;
    })
    .join(' ');

  return (
    <PlaygroundCard
      title="训练实验室：亲眼看损失掉下来"
      subtitle="上图：40 个带噪声的数据点（蓝）和网络当前的拟合曲线（橙）。下图：损失随训练步数的变化（对数轴）——这条曲线是每个「炼丹师」每天盯着看的心电图。"
      footer={
        <>
          💡 要点：这个网络只有 {params} 个参数，在你的浏览器里每秒训练几千步。GPT 级模型的训练循环<b>一模一样</b>——只是参数多了十亿倍、数据多了亿倍，所以要几千张 GPU 跑几个月。试试：学习率拉到 0.5 看 loss 爆炸；隐藏神经元换成 2 看「怎么学都学不像」（欠拟合）。
        </>
      }
    >
      <div className={styles.svgWrap}>
        <svg viewBox={`0 0 ${W} ${H}`}>
          {[-4, -2, 0, 2, 4].map((v) => (
            <line key={v} x1={px(v)} y1={PAD} x2={px(v)} y2={H - PAD} stroke="var(--viz-grid)" strokeWidth={1} />
          ))}
          <line x1={PAD} y1={py(0)} x2={W - PAD} y2={py(0)} stroke="var(--viz-axis)" strokeWidth={1.5} />
          {DATA.map((d, i) => (
            <circle key={i} cx={px(d.x)} cy={py(d.y)} r={3.5} fill="var(--viz-s1)" opacity={0.8} />
          ))}
          <path d={fitPath.join(' ')} fill="none" stroke="var(--viz-s6)" strokeWidth={2.5} />
        </svg>
      </div>

      <div className={styles.svgWrap}>
        <svg viewBox={`0 0 ${LW} ${LH}`}>
          <rect x={34} y={8} width={LW - 44} height={LH - 26} fill="none" stroke="var(--viz-grid)" strokeWidth={1} />
          <text x={30} y={16} textAnchor="end" fontSize={9} fill="var(--viz-muted)">高</text>
          <text x={30} y={LH - 20} textAnchor="end" fontSize={9} fill="var(--viz-muted)">低</text>
          <text x={LW / 2} y={LH - 4} textAnchor="middle" fontSize={10} fill="var(--viz-muted)">
            损失曲线（纵轴为对数刻度）· 已训练 {iterRef.current} 步
          </text>
          {hist.length > 1 && <polyline points={lossPts} fill="none" stroke="var(--viz-s7)" strokeWidth={2} />}
          {hist.length === 0 && (
            <text x={LW / 2} y={LH / 2} textAnchor="middle" fontSize={11} fill="var(--viz-muted)">
              点「▶ 开始训练」，损失曲线会画在这里
            </text>
          )}
        </svg>
      </div>

      <SliderRow label="学习率 η" value={lr} min={0.005} max={0.6} step={0.005} onChange={setLr} fmt={(v) => v.toFixed(3)} />

      <div style={{display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', margin: '6px 0'}}>
        <span style={{fontSize: '0.9rem', fontWeight: 600}}>隐藏神经元：</span>
        {[2, 8, 32].map((h) => (
          <label key={h} style={{fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 4}}>
            <input type="radio" name="tl-hidden" checked={hidden === h} onChange={() => reset(h)} />
            {h} 个
          </label>
        ))}
      </div>

      <StatRow>
        <Stat label="参数总数" value={params} />
        <Stat label="已训练步数" value={iterRef.current} />
        <Stat
          label="当前损失"
          value={
            Number.isNaN(curLoss) ? '—' : (
              <span style={{color: curLoss < 0.08 ? 'var(--viz-good)' : 'inherit'}}>{curLoss.toFixed(4)}</span>
            )
          }
        />
      </StatRow>

      <BtnRow>
        <Btn primary onClick={toggleRun} disabled={diverged}>{running ? '⏸ 暂停' : '▶ 开始训练'}</Btn>
        <Btn onClick={() => runIters(200)} disabled={running || diverged}>+200 步</Btn>
        <Btn onClick={() => reset(hidden)}>↺ 重置</Btn>
      </BtnRow>

      {diverged && (
        <Message>
          💥 损失爆炸了！学习率 η = {lr.toFixed(3)} 太大，参数被甩出了合理范围（0.4 节的老朋友）。点「↺ 重置」，把学习率调到 0.1 附近再训。
        </Message>
      )}
      {!diverged && curLoss < 0.06 && (
        <Message>
          ✅ 损失 ≈ 数据本身的噪声水平，拟合曲线已经穿过点群的中心——再训下去顶多把<b>噪声</b>也背下来（过拟合）。见好就收，也是炼丹功力的一部分。
        </Message>
      )}
      {!diverged && hidden === 2 && iterRef.current > 800 && curLoss > 0.1 && (
        <Message>
          🧱 只有 2 个隐藏神经元（7 个参数），撑死画两个弯——怎么训都贴不住波浪线。这不是训练的问题，是<b>容量</b>不够（2.2 节讲过），换 8 个神经元试试。
        </Message>
      )}
    </PlaygroundCard>
  );
}
