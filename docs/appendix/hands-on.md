---
sidebar_position: 2
title: 动手实践路线
description: 从跑通 nanoGPT 到微调自己的模型——把书本知识变成手上功夫
---

# 动手实践路线

读懂了原理，下一步是亲手训练。按难度递增排列（预计投入从半天到数周）：

## 🥉 入门：浏览器 / 免费资源就能做

1. **玩转本站所有交互实验**——特别是亲手训练 BPE 分词器、把梯度下降玩到发散。
2. **[Tokenizer 在线对比](https://tiktokenizer.vercel.app/)**：看看同一句话在 GPT-4、Llama 等不同分词器下切出多少 token，中英文差异有多大。
3. **[TensorFlow Playground](https://playground.tensorflow.org/)**：在浏览器里训练小神经网络，直观感受隐层、学习率、激活函数的作用。

## 🥈 进阶：需要一点 Python（可用免费 Colab GPU）

4. **跟 Karpathy 从零写 GPT**：[《Let's build GPT》](https://www.youtube.com/watch?v=kCc8FmEb1nY)，两小时从空文件写出一个能生成莎士比亚文本的 mini-GPT。B 站有中文字幕搬运。
5. **跑通 [nanoGPT](https://github.com/karpathy/nanoGPT)**：最干净的 GPT 训练代码库（约 600 行核心代码），在 Colab 上用字符级数据集训一个小模型。
6. **[llm.c](https://github.com/karpathy/llm.c) / [nanochat](https://github.com/karpathy/nanochat)**：想知道去掉所有框架之后训练长什么样，看这两个。

## 🥇 硬核：需要消费级 GPU 或云算力

7. **微调一个开源模型**：用 [LLaMA-Factory](https://github.com/hiyouga/LLaMA-Factory) 或 [unsloth](https://github.com/unslothai/unsloth) 对 Qwen / Llama 的小尺寸版本做 LoRA 微调，亲历 SFT 全流程。
8. **本地部署推理**：用 [vLLM](https://github.com/vllm-project/vllm) 或 [Ollama](https://ollama.com/) 把模型跑起来，观察显存占用与吞吐，印证第 6 章的公式。
9. **复现一次小规模 RLHF/DPO**：[TRL 库](https://github.com/huggingface/trl)的官方示例可以在单卡上跑通 DPO 训练。

:::caution 提醒
以上第三方项目更新很快（本清单整理于 2026 年），命令细节以各项目 README 为准。
:::
