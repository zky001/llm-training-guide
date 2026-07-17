import React, {useEffect, useRef, useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message, SliderRow, Stat, StatRow} from '../ui';
import styles from '../playground.module.css';

/**
 * 2.4 节：二维损失面下山。
 * f(w1,w2) = 0.3(w1²−1)² + 1.5·w2²：沿 w1 有两个谷底（±1），
 * w2 方向很陡——学习率一大就先在陡方向震荡（之字形），是真实训练的经典病灶。
 * 热力图用 canvas 逐像素绘制（颜色分带制造等高线效果）。
 */

const f = (x: number, y: number) => 0.3 * (x * x - 1) ** 2 + 1.5 * y * y;
const gx = (x: number) => 1.2 * x * (x * x - 1);
const gy = (y: number) => 3 * y;

const R = 2.2; // 坐标范围 [-R, R]
const SIZE = 340; // canvas 像素

const toPix = (v: number) => ((v + R) / (2 * R)) * SIZE;
const toData = (p: number) => (p / SIZE) * 2 * R - R;

// 浅→深蓝色渐变（顺序色带），分 12 带模拟等高线
const RAMP: [number, number, number][] = [
  [205, 226, 251], [183, 211, 246], [158, 197, 244], [134, 182, 239],
  [109, 167, 236], [85, 152, 231], [57, 135, 229], [42, 120, 214],
  [37, 106, 191], [28, 92, 171], [24, 79, 149], [13, 54, 107],
];

const MAX_LOSS = f(R, R); // 角落处最大

export default function LossSurface() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heatRef = useRef<ImageData | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragging = useRef(false);

  const [pos, setPos] = useState({x: 1.9, y: 1.8});
  const [path, setPath] = useState<{x: number; y: number}[]>([]);
  const [lr, setLr] = useState(0.1);
  const [noise, setNoise] = useState(false);
  const [running, setRunning] = useState(false);
  const [diverged, setDiverged] = useState(false);
  const [steps, setSteps] = useState(0);

  // 生成一次热力图
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(SIZE, SIZE);
    for (let py = 0; py < SIZE; py++) {
      for (let px = 0; px < SIZE; px++) {
        const l = f(toData(px), toData(py));
        const t = Math.sqrt(Math.min(1, l / MAX_LOSS)); // 开方拉开低值区分辨率
        const band = Math.min(RAMP.length - 1, Math.floor(t * RAMP.length));
        const [r, g, b] = RAMP[band];
        const idx = (py * SIZE + px) * 4;
        img.data[idx] = r;
        img.data[idx + 1] = g;
        img.data[idx + 2] = b;
        img.data[idx + 3] = 255;
      }
    }
    heatRef.current = img;
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 每次状态变化重绘
  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, path]);

  useEffect(() => () => stopAuto(), []);

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !heatRef.current) return;
    ctx.putImageData(heatRef.current, 0, 0);
    // 两个谷底
    for (const mx of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(toPix(mx), toPix(0), 5, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // 足迹
    ctx.strokeStyle = '#eb6834';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    path.forEach((p, i) => {
      const X = toPix(p.x);
      const Y = toPix(p.y);
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    });
    ctx.lineTo(toPix(pos.x), toPix(pos.y));
    ctx.stroke();
    path.forEach((p) => {
      ctx.beginPath();
      ctx.arc(toPix(p.x), toPix(p.y), 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#eb6834';
      ctx.fill();
    });
    // 小球
    ctx.beginPath();
    ctx.arc(toPix(pos.x), toPix(pos.y), 8, 0, Math.PI * 2);
    ctx.fillStyle = '#eb6834';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  };

  const stopAuto = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    setRunning(false);
  };

  const stepOnce = () => {
    setPos((prev) => {
      let dx = gx(prev.x);
      let dy = gy(prev.y);
      if (noise) {
        dx += (Math.random() - 0.5) * 1.2;
        dy += (Math.random() - 0.5) * 1.2;
      }
      const next = {x: prev.x - lr * dx, y: prev.y - lr * dy};
      setPath((t) => [...t.slice(-60), prev]);
      setSteps((s) => s + 1);
      if (Math.abs(next.x) > R * 1.4 || Math.abs(next.y) > R * 1.4) {
        setDiverged(true);
        stopAuto();
        return prev;
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
    timer.current = setInterval(stepOnce, 220);
  };

  const reset = (x: number, y: number) => {
    stopAuto();
    setPos({x, y});
    setPath([]);
    setSteps(0);
    setDiverged(false);
  };

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>, isDown: boolean) => {
    if (isDown) dragging.current = true;
    if (!dragging.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = toData(((e.clientX - rect.left) / rect.width) * SIZE);
    const y = toData(((e.clientY - rect.top) / rect.height) * SIZE);
    stopAuto();
    setPos({x: Math.max(-R, Math.min(R, x)), y: Math.max(-R, Math.min(R, y))});
    setPath([]);
    setSteps(0);
    setDiverged(false);
  };

  const loss = f(pos.x, pos.y);
  const gradNorm = Math.hypot(gx(pos.x), gy(pos.y));
  const converged = gradNorm < 0.03 && steps > 0 && !diverged;

  return (
    <PlaygroundCard
      title="二维损失面：颜色越浅，损失越低"
      subtitle="现在「山」有两个参数（w₁ 横轴、w₂ 纵轴），你从上帝视角俯瞰。白圈是两个谷底。点击或拖动可以空降小球，然后让它下山。"
      footer={
        <>
          💡 要点：注意<b>之字形</b>——纵向（陡）方向反复过冲、横向（缓）方向慢慢挪，这是梯度下降在「沟壑地形」里的经典步态，学习率大一点就先在陡方向爆炸。勾选「随机梯度噪声」模拟 SGD：每步只用一小批数据、梯度带手抖，反而可能抖出局部低谷。真实大模型的损失面有几千亿个维度，这里只是 2 维切片。
        </>
      }
    >
      <div className={styles.svgWrap}>
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          style={{
            display: 'block',
            width: '100%',
            maxWidth: 380,
            margin: '0 auto',
            borderRadius: 10,
            border: '1px solid var(--ifm-color-emphasis-200)',
            touchAction: 'none',
            cursor: 'crosshair',
          }}
          onPointerDown={(e) => onPointer(e, true)}
          onPointerMove={(e) => onPointer(e, false)}
          onPointerUp={() => (dragging.current = false)}
          onPointerLeave={() => (dragging.current = false)}
        />
      </div>

      <SliderRow label="学习率 η" value={lr} min={0.01} max={0.8} step={0.01} onChange={setLr} fmt={(v) => v.toFixed(2)} />

      <StatRow>
        <Stat label="位置 (w₁, w₂)" value={`(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`} />
        <Stat label="损失 f" value={loss.toFixed(3)} />
        <Stat label="梯度大小" value={gradNorm.toFixed(3)} />
        <Stat label="步数" value={steps} />
      </StatRow>

      <BtnRow>
        <Btn primary onClick={stepOnce} disabled={running || diverged}>👣 走一步</Btn>
        <Btn primary onClick={toggleAuto} disabled={diverged}>{running ? '⏸ 暂停' : '▶ 自动下山'}</Btn>
        <Btn onClick={() => reset(1.9, 1.8)}>↺ 重置</Btn>
        <label style={{fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 4}}>
          <input type="checkbox" checked={noise} onChange={(e) => setNoise(e.target.checked)} />
          随机梯度噪声（SGD）
        </label>
      </BtnRow>

      {diverged && (
        <Message>
          💥 发散了！纵向坡太陡，η = {lr.toFixed(2)} 的步子每次都跨过谷底、荡得比上次更高。把学习率调小到 0.3 以下再试。
        </Message>
      )}
      {converged && (
        <Message>
          ✅ 到达谷底 ({pos.x > 0 ? 'w₁ ≈ +1' : 'w₁ ≈ −1'})。这个损失面有两个一样低的谷底——对神经网络来说很正常：不同的参数组合可以同样好，训练只需要找到<b>任意一个</b>足够低的谷。
        </Message>
      )}
    </PlaygroundCard>
  );
}
