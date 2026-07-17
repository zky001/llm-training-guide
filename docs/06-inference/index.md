---
title: 第 6 章 · 推理与部署
description: KV Cache、量化、蒸馏、vLLM——让模型跑得又快又省（编写中）
---

# 第 6 章 · 推理与部署

:::caution 🚧 本章编写中
以下是本章的完整规划，欢迎到 [GitHub](https://github.com/zky001/llm-training-guide/issues) 认领或提建议。
:::

本章目标：训练完的模型怎么用起来——为什么逐词生成那么慢、显存都花在哪、量化为什么能压到 4 bit 还能用。

## 规划中的小节

| 小节 | 内容 | 交互实验 |
| --- | --- | --- |
| 6.1 训练 vs 推理 | 自回归生成为什么天生慢 | — |
| 6.2 KV Cache | 用空间换时间 | 🎮 开关 KV Cache 对比 |
| 6.3 量化 | fp16 → int8/fp8/int4，精度换显存 | 🎮 数值精度演示 |
| 6.4 推理框架 | vLLM 的 PagedAttention、continuous batching | — |
| 6.5 蒸馏与小模型 | 小体积保住大部分能力 | — |
