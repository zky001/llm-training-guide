import React, {useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message, Stat, StatRow} from '../ui';
import styles from '../playground.module.css';

/**
 * 4.3 节：训练成本计算器。
 * 经典粗账：总计算量 C ≈ 6·N·D；GPU 按 H100 量级（bf16 峰值 ≈ 989 TFLOPS）
 * × MFU 40% 折算；租价 ¥15/卡时、功耗 0.7kW×PUE 1.3、电价 ¥0.8/度。
 * 全部为 2026 年行情下的量级估算，只求数量级正确。
 */

const FLOPS_PER_GPU = 989e12 * 0.4; // 有效算力
const RENT_PER_HOUR = 15; // 元/卡时
const KW_PER_GPU = 0.7 * 1.3; // 含 PUE
const PRICE_KWH = 0.8; // 元/度

// 对数滑块：t ∈ [0,100] ↔ [min, max]
const logMap = (t: number, min: number, max: number) => min * Math.pow(max / min, t / 100);
const logInv = (v: number, min: number, max: number) => (100 * Math.log(v / min)) / Math.log(max / min);

const N_MIN = 1e8, N_MAX = 2e12;
const D_MIN = 1e10, D_MAX = 4e13;
const G_MIN = 8, G_MAX = 200000;

function fmtB(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  return `${(n / 1e6).toFixed(0)}M`;
}

function fmtMoney(yuan: number): string {
  if (yuan >= 1e8) return `${(yuan / 1e8).toFixed(1)} 亿元`;
  if (yuan >= 1e4) return `${(yuan / 1e4).toFixed(0)} 万元`;
  return `${yuan.toFixed(0)} 元`;
}

function fmtDays(d: number): string {
  if (d < 1 / 24) return `${(d * 24 * 60).toFixed(0)} 分钟`;
  if (d < 1) return `${(d * 24).toFixed(1)} 小时`;
  if (d > 3650) return `${(d / 365).toFixed(0)} 年`;
  if (d > 365) return `${(d / 365).toFixed(1)} 年`;
  return `${d.toFixed(1)} 天`;
}

const PRESETS = [
  {name: 'GPT-2 (2019)', n: 1.5e9, d: 1e10, g: 256},
  {name: 'GPT-3 (2020)', n: 175e9, d: 3e11, g: 4096},
  {name: 'Chinchilla (2022)', n: 70e9, d: 1.4e12, g: 4096},
  {name: 'Llama-3-70B (2024)', n: 70e9, d: 1.5e13, g: 16384},
  {name: '旗舰级 (2025, 示意)', n: 1e12, d: 2e13, g: 100000},
];

export default function ScalingCalculator() {
  const [n, setN] = useState(70e9);
  const [d, setD] = useState(1.5e13);
  const [g, setG] = useState(16384);

  const C = 6 * n * d;
  const seconds = C / (g * FLOPS_PER_GPU);
  const days = seconds / 86400;
  const gpuHours = g * (seconds / 3600);
  const rent = gpuHours * RENT_PER_HOUR;
  const power = gpuHours * KW_PER_GPU * PRICE_KWH;
  const humanYears = C / 8e9 / 3.15e7; // 全人类每人每秒算一次

  const ratio = d / n;
  const ratioBadge =
    ratio < 5
      ? {icon: '🍼', text: `数据/参数 ≈ ${ratio.toFixed(1)} : 1 —— 数据太少，参数没喂饱（Chinchilla 最优约 20 : 1），这么大的模型是浪费。`}
      : ratio <= 60
        ? {icon: '⚖️', text: `数据/参数 ≈ ${ratio.toFixed(0)} : 1 —— 接近 Chinchilla 计算最优区间（≈20 : 1）：给定算力下这个配比的损失最低。`}
        : {icon: '🏋️', text: `数据/参数 ≈ ${ratio.toFixed(0)} : 1 —— 远超 Chinchilla 比例的「过训练」：训练多花钱，换来小模型高能力、推理省钱。2024 年后的主流选择（如 Llama-3）。`};

  const sliderRow = (
    label: string,
    value: number,
    setter: (v: number) => void,
    min: number,
    max: number,
    fmt: (v: number) => string,
  ) => (
    <label className={styles.sliderRow}>
      <span className={styles.sliderLabel}>{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        step={0.5}
        value={logInv(value, min, max)}
        onChange={(e) => setter(logMap(Number(e.target.value), min, max))}
      />
      <span className={styles.sliderValue} style={{minWidth: '5.5em'}}>{fmt(value)}</span>
    </label>
  );

  return (
    <PlaygroundCard
      title="训练成本计算器：为什么训练大模型要烧几亿"
      subtitle="三个滑块都是对数刻度（拖一点，翻一倍）。经典粗账：总计算量 ≈ 6 × 参数量 × 训练 token 数。试试各个预设，感受十年间成本翻了多少个数量级。"
      footer={
        <>
          💡 要点：成本公式里没有魔法——就是「算多少题 ÷ 每秒能算多少」。所有数字都是<b>量级估算</b>（2026 年行情：H100 级 GPU 有效算力按峰值 989 TFLOPS × MFU 40% 折算，租价 ¥15/卡时，功耗 0.7kW × PUE 1.3，电价 ¥0.8/度），真实项目还有实验试错、失败重训、人力等隐藏成本，通常还要再翻几倍。
        </>
      }
    >
      {sliderRow('参数量 N', n, setN, N_MIN, N_MAX, fmtB)}
      {sliderRow('训练数据 D', d, setD, D_MIN, D_MAX, (v) => `${fmtB(v)} tokens`)}
      {sliderRow('GPU 数量', g, setG, G_MIN, G_MAX, (v) => `${Math.round(v).toLocaleString()} 张`)}

      <BtnRow>
        {PRESETS.map((p) => (
          <Btn key={p.name} onClick={() => {setN(p.n); setD(p.d); setG(p.g);}}>{p.name}</Btn>
        ))}
      </BtnRow>

      <StatRow>
        <Stat label="总计算量 C = 6·N·D" value={`${(C / Math.pow(10, Math.floor(Math.log10(C)))).toFixed(1)}×10${String(Math.floor(Math.log10(C))).replace(/\d/g, (ch) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(ch)])} FLOPs`} />
        <Stat label="训练时长" value={<span style={{color: days > 180 ? 'var(--viz-bad)' : 'inherit'}}>{fmtDays(days)}</span>} />
        <Stat label="租卡成本" value={fmtMoney(rent)} />
        <Stat label="电费" value={fmtMoney(power)} />
      </StatRow>

      <Message>{ratioBadge.icon} {ratioBadge.text}</Message>

      {days > 365 && (
        <Message>
          ⏳ 要训 {fmtDays(days)}——没人等得起。现实的选择：加卡（拖 GPU 滑块），或者接受更小的 N、D。这就是 Scaling Laws 的价值：<b>不用真的训一遍</b>，就能算出哪些配置根本不可行。
        </Message>
      )}
      {humanYears > 1 && (
        <div style={{fontSize: '0.84rem', color: 'var(--ifm-color-emphasis-600)', marginTop: 6}}>
          🌍 换个感受方式：让全人类 80 亿人每人每秒算一次乘加，要连续算 <b>{humanYears > 1e4 ? `${(humanYears / 1e4).toFixed(0)} 万` : humanYears.toFixed(0)} 年</b>才能完成这次训练的计算量。
        </div>
      )}
    </PlaygroundCard>
  );
}
