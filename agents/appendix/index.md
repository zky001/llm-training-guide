---
title: 附录 · 实战路线
description: 不到 100 行从零写一个不依赖框架的智能体，一页看懂框架地图，MCP 上手，以及外部课程索引
---

# 附录 · 实战路线

读懂原理之后，最好的巩固方式是**亲手写一个**。这个附录给你三样东西：一段能跑的最小智能体代码、一张框架选型地图、一份外部资源索引。

## 一、不到 100 行写一个智能体（不用任何框架）

下篇反复强调：智能体 = 模型 + 工具 + 循环，框架只是把这三样包了层糖。下面这段代码把糖全撕掉，让你看清骨头。它实现的正是 [A0 的行动循环](../00-from-chat-to-action/01-what-is-agent.mdx)和 [A1 的工具调用](../01-tool-use/index.md)。

:::tip 运行前提
需要 Python 3.10+ 和任意一家兼容 OpenAI 接口的模型服务（把 `base_url` 和 `api_key` 换成你的即可——各家云服务、本地 Ollama/vLLM 都行）。这段代码用于教学，省略了生产必需的错误处理、超时、[安全防护](../08-safety-frontier/02-defense.mdx)。
:::

```python
"""一个不依赖任何 Agent 框架的最小智能体：模型 + 工具 + 循环。"""
import json
from openai import OpenAI

client = OpenAI(base_url="https://your-endpoint/v1", api_key="YOUR_KEY")
MODEL = "your-model-name"

# ---- 1. 定义工具：一个普通 Python 函数 + 一份给模型看的「说明书」(A1) ----
def calculator(expression: str) -> str:
    try:
        return str(eval(expression, {"__builtins__": {}}, {}))  # 教学用；生产别 eval
    except Exception as e:
        return f"计算出错：{e}"

def get_weather(city: str) -> str:
    fake = {"北京": "晴 22°C", "上海": "多云 25°C"}   # 示意：真实场景这里调天气 API
    return fake.get(city, f"暂无 {city} 的天气数据")

TOOLS = {"calculator": calculator, "get_weather": get_weather}

# 工具描述（Tool Schema）——写清楚，模型才会用对（A1.1「描述即接口」）
TOOL_SCHEMAS = [
    {"type": "function", "function": {
        "name": "calculator", "description": "计算一个数学表达式，支持四则运算和括号",
        "parameters": {"type": "object",
            "properties": {"expression": {"type": "string", "description": "如 (3+5)*2"}},
            "required": ["expression"]}}},
    {"type": "function", "function": {
        "name": "get_weather", "description": "查询某个城市当前天气",
        "parameters": {"type": "object",
            "properties": {"city": {"type": "string", "description": "城市名，如 北京"}},
            "required": ["city"]}}},
]

# ---- 2. 行动循环：思考 → 行动 → 观察，转到没有工具调用为止 (A0) ----
def run_agent(user_request: str, max_steps: int = 10) -> str:
    messages = [
        {"role": "system", "content": "你是一个有用的助手，可以调用工具来完成任务。"},
        {"role": "user", "content": user_request},
    ]
    for step in range(max_steps):                       # max_steps = 防死循环的围栏 (A0.2)
        resp = client.chat.completions.create(
            model=MODEL, messages=messages, tools=TOOL_SCHEMAS,
        )
        msg = resp.choices[0].message
        messages.append(msg)                            # 把模型这一轮的输出拼回上下文

        if not msg.tool_calls:                          # 模型不再调工具 → 循环结束
            return msg.content

        for call in msg.tool_calls:                     # 「行动」：执行模型请求的每个工具
            fn = TOOLS[call.function.name]
            args = json.loads(call.function.arguments)
            result = fn(**args)
            print(f"  🔧 {call.function.name}({args}) → {result}")
            messages.append({                           # 「观察」：结果拼回上下文
                "role": "tool", "tool_call_id": call.id, "content": str(result),
            })
    return "（达到最大步数，未完成）"                     # 围栏兜底

if __name__ == "__main__":
    print(run_agent("北京今天适合穿短袖吗？顺便算一下 (128 + 72) * 3 是多少。"))
```

**它凭什么算一个智能体？** 因为它有那颗心跳：模型可能先调 `get_weather` 看北京天气、再调 `calculator` 算式子、最后综合成一句回答——每一步都是「预测下一个词」，工具结果拼回上下文驱动下一步。你在 [A0 行动循环播放器](../00-from-chat-to-action/01-what-is-agent.mdx)里看到的一切，就发生在 `run_agent` 那个约 20 行的 `while` 循环里。

**接下来自己动手加东西**，正好对应下篇各章：

- 加一个 `notes.md` 读写工具 → 你就有了 [A3 的长期记忆](../03-memory-context/02-long-term-memory.mdx)；
- 每步之后加一次「检查约束是否满足」的自我提问 → [A2 的反思](../02-planning-reflection/02-reflection.mdx)；
- 把某个工具换成「派一个子智能体去做」→ [A5 的多智能体](../05-multi-agent/index.md)；
- 给危险工具（删文件、发消息）加一行 `input("确认？")` → [A8 的人在环中](../08-safety-frontier/02-defense.mdx)。

## 二、框架地图（一页看懂选型）

自己手写够学习，但生产项目通常会用框架处理重试、并发、可观测性、状态持久化等杂活。2026 年的主流选择：

| 框架 | 一句话定位 | 适合 |
| --- | --- | --- |
| **LangGraph** | 把智能体建成显式的状态图，控制流清晰可控 | 需要复杂、可控编排的生产系统 |
| **smolagents**（Hugging Face） | 极简，主打「让模型写代码来调工具」 | 快速上手、教学、轻量任务 |
| **Claude Agent SDK** | Anthropic 官方，围绕工具使用与 [MCP](../05-multi-agent/03-protocols.mdx) 打磨 | 深度用 Claude、重工具生态 |
| **OpenAI Agents SDK** | OpenAI 官方，轻量的多智能体与 handoff 原语 | OpenAI 生态、多智能体 |
| **AutoGen**（微软） | 主打多智能体对话与协作 | 研究、多智能体实验 |
| **可观测性 / tracing**<br/>（LangSmith、Langfuse、OpenTelemetry-LLM 等） | 记录并回放每一步的调用轨迹（输入输出、token、耗时、父子关系） | 任何要上生产的智能体——排错和评测的命根子（A7） |

:::tip 选型心法
框架换得比原理快。**先用上面这段代码把原理跑通**，再带着「我到底需要框架替我做哪些杂活」的清醒去选——而不是反过来，被某个框架的抽象牵着理解智能体。所有框架的内核，都是你已经读懂的那个循环。（本表整理于 2026 年，各框架仍在快速演化，以官方文档为准。）
:::

## 三、MCP 上手

[A5.3 讲过](../05-multi-agent/03-protocols.mdx) MCP 是「AI 应用的 USB-C」。想让你的智能体接上第一个 MCP 服务器，最快的路径：

1. 找一个现成的 MCP 服务器（文件系统、GitHub、数据库等官方与社区实现很多）；
2. 在支持 MCP 的客户端（主流 AI 编辑器、Claude 桌面端等）里配置它；
3. 你的智能体立刻多出一批工具，无需自己写胶水代码。

想自己写一个 MCP 服务器暴露你的工具，用官方 SDK（Python/TypeScript）十几行就能起一个最小服务——[A5.3 的深入层](../05-multi-agent/03-protocols.mdx)有代码骨架。

## 四、想继续深入？外部课程索引

本教程是「人人能懂」的入门透视镜。想往学术和前沿再走，这些是很好的下一站：

- **[伯克利 LLM Agents 系列](https://rdi.berkeley.edu/)**（Dawn Song 等）——从 LLM Agents 到 Advanced 到 Agentic AI 三季，业界大咖客座，深度一流（你想深入的那门课就在这）；
- **[Anthropic：Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)**——下篇 A0/A4 的框架出处，工程手册；
- **吴恩达 DeepLearning.AI《Agentic AI》**——方法论清晰，尤其评测驱动开发那部分；
- **[Hugging Face Agents Course](https://huggingface.co/learn/agents-course)**——动手写代码，带证书；
- **[微软 AI Agents for Beginners](https://microsoft.github.io/ai-agents-for-beginners/)**——覆盖面全的免费课，含 MCP、计算机使用等。

---

读到这里，你已经既懂原理、又能动手了。回到 [A8.3 结语](../08-safety-frontier/03-future.mdx)看看你的下一步——或者，现在就打开编辑器，把上面那段代码敲出来。🤖
