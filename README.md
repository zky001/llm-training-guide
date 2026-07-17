# 大模型是怎么炼成的 · LLM Training Guide

> 从「预测下一个词」到 RLHF —— 人人都能看懂的大模型训练交互式图解教程

**在线阅读：<https://zky001.github.io/llm-training-guide/>**

一份中文原创、完全开源的大模型训练教程。目标是让**高中生能读懂直觉，大学生能学到推导，工程师能拿来当演示**。

## ✨ 特色

- **🧠 双轨难度**：每节内容分「直觉层」（类比 + 动画，初中代数即可）和「深入层」（定义 + 推导 + 代码，可折叠）。右下角一键切换全站模式。
- **🎮 交互实验**：拖动小球体验梯度下降与发散、亲手训练 BPE 分词器、掷「语言骰子」看模型怎么生成文字、词向量算术（国王 − 男人 + 女人 ≈ 王后）……全部在浏览器里运行，无需任何环境。
- **🏔️ 完整主线**：预备数学 → 语言模型 → 神经网络 → Transformer → 预训练 → SFT/RLHF → 推理部署 → 评测 → 前沿，一条线讲完大模型的生产流水线。

## 📖 章节（全书完稿 🎉）

| 章节 | 内容 | 状态 |
| --- | --- | --- |
| 第 0 章 · 预备知识 | 机器学习、向量矩阵、概率、梯度（4 个交互实验） | ✅ |
| 第 1 章 · 什么是语言模型 | 下一词预测、BPE 分词、词向量（3 个交互实验） | ✅ |
| 第 2 章 · 神经网络与训练三件套 | 损失、梯度下降、反向传播（5 个交互实验） | ✅ |
| 第 3 章 · Transformer 架构 | 注意力、QKV、采样生成（3 个交互实验） | ✅ |
| 第 4 章 · 预训练 | 数据工程、Scaling Laws、并行训练（3 个交互实验） | ✅ |
| 第 5 章 · 后训练与对齐 | SFT、RLHF、DPO/GRPO（1 个交互实验） | ✅ |
| 第 6 章 · 推理与部署 | KV Cache、量化、蒸馏（2 个交互实验） | ✅ |
| 第 7 章 · 评测 | Benchmark、数据污染、LLM 裁判（1 个交互实验） | ✅ |
| 第 8 章 · 前沿与全景 | MoE、长上下文、多模态、推理模型（1 个交互实验 + 全景海报） | ✅ |
| 附录 | 术语表、动手实践路线、论文清单 | ✅ |

## 🛠️ 本地运行

```bash
git clone https://github.com/zky001/llm-training-guide.git
cd llm-training-guide
npm install
npm start          # 开发服务器 http://localhost:3000
npm run build      # 构建静态站点
npm run typecheck  # TypeScript 类型检查
```

技术栈：Docusaurus 3 + React + TypeScript，数学公式用 KaTeX，可视化为手写 SVG（零重型依赖），支持深色模式与全文搜索。

## 🤝 参与共建

非常欢迎任何形式的贡献：

- **报错 / 提建议**：内容错误、类比不贴切、实验点子 → [Issues](https://github.com/zky001/llm-training-guide/issues)
- **写内容**：🚧 章节都有详细规划（见各章首页表格），可认领小节
- **做实验组件**：交互组件在 `src/components/interactive/`，每个组件自带说明

内容写作规范见 [CLAUDE.md](./CLAUDE.md)（对人类贡献者同样适用）。

## 📄 许可

- 代码：[MIT](./LICENSE)
- 文档内容（`docs/` 目录）：[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.zh)
