---
title: 第 3 章 · Transformer 架构
description: 注意力机制、QKV、位置编码——现代大模型的骨架（编写中）
---

# 第 3 章 · Transformer 架构

:::caution 🚧 本章编写中
以下是本章的完整规划，欢迎到 [GitHub](https://github.com/zky001/llm-training-guide/issues) 认领或提建议。
:::

本章目标：拆开所有主流大模型共用的骨架——Transformer，重点讲透注意力机制的直觉。

## 规划中的小节

| 小节 | 内容 | 交互实验 |
| --- | --- | --- |
| 3.1 注意力的直觉 | 读句子时你怎么知道「它」指谁——按相关性加权 | — |
| 3.2 Q、K、V | 「拿问题查字典」类比 | 🎮 注意力热力图 |
| 3.3 多头与位置编码 | 不同的头管不同的事；词序信息从哪来 | 🎮 多头切换 |
| 3.4 残差与 LayerNorm | 给梯度修高速公路 | — |
| 3.5 拼装完整的 GPT | 从 token 进到概率出的全流程 | 🎮 数据流动画 |
| 3.6 采样与生成 | temperature、top-k、top-p | 🎮 采样 Playground |
