# CLAUDE.md — llm-training-guide

中文交互式大模型训练教程。Docusaurus 3 + React + TypeScript，部署在 GitHub Pages。

## 命令

```bash
npm start          # 开发服务器
npm run build      # 构建（提交前必须跑通）
npm run typecheck  # tsc 类型检查
```

## 目录结构

```
docs/                       # 上篇《大模型是怎么炼成的》（MDX），按章节分目录，NN- 前缀决定顺序
agents/                     # 下篇《智能体是怎么工作的》——独立文档实例（routeBasePath /agents，
                            #   侧边栏 sidebarsAgents.ts，导航栏单独入口）
src/components/             # DeepDive / Quiz / Term / GlossaryTable 等内容组件
src/components/interactive/ # 交互实验组件，每个一个目录，统一用 PlaygroundCard 包裹
src/data/glossary.ts        # 全站术语表（Term 组件和附录页的数据源；下篇词条 chapter 用 A0~A8）
src/theme/MDXComponents.tsx # MDX 全局组件注册（新交互组件要在这里登记，两篇通用）
src/theme/Root.tsx          # 学习模式（直觉/深入）Provider + 右下角悬浮切换按钮
```

## 上下篇互链规则（重要）

- 上、下篇是两个独立的 docs 插件实例，**相对路径跨不过去**。
- 篇内链接：带扩展名的文件相对路径（如 `./02-sft.mdx`、`../01-tool-use/index.md`）。
- 跨篇链接：绝对 URL 路径、无扩展名（如 `/docs/post-training/sft`、`/agents/tool-use`）。
- 下篇风格样板：`agents/00-from-chat-to-action/01-what-is-agent.mdx`（比上篇更强调工程取舍，年份标注更密集，实验轨迹一律注明「教学构造」）。

## 内容写作规范（人和 AI 都要遵守）

1. **双轨结构**：正文是直觉层，高中生（初中代数水平）必须能读懂；一切数学推导、代码、严格定义放进 `<DeepDive title="...">` 折叠块。
2. **直觉层禁止**出现矩阵符号、求和号之外的数学记号；每节直觉层最多 1 个核心公式。
3. **术语规则**：每个新术语首次出现必须「中文 + 英文 + 一句话人话解释」，并在 `src/data/glossary.ts` 登记，正文用 `<Term id="xxx">词</Term>` 标注（仅首次出现处）。
4. **类比规则**：每个重要类比后面必须紧跟一段「这个类比在哪里不准确」（用 `:::caution` 块），防止读者形成错误心智模型。
5. **数字规则**：所有会过时的数字（参数量、成本、上下文长度）必须标注年份，如「2025 年的旗舰级」。
6. **每节结尾**：`:::tip 本节要点`（≤4 条）→ `<Quiz questions={[...]} />`（3 题左右，解析要讲清为什么错）→ 延伸阅读。
7. **风格样板**：`docs/00-prerequisites/01-what-is-ml.mdx` 是标准范例，写新内容前先读它。

## MDX 常见坑（写错会导致 build 失败）

- 正文里的 `<`、`{`、`}` 必须转义（`&lt;` / `\{`）或放进代码块、`$...$` 数学环境。
- 数学公式：行内 `$x$`，块级 `$$...$$`（KaTeX）。
- 全局组件（无需 import）：`DeepDive`、`Quiz`、`Term`、`GlossaryTable`、`LinearFit`、`MatrixPlayground`、`ProbabilityLab`、`GradientPlayground`、`NgramPlayground`、`BpePlayground`、`EmbeddingMap`。
- 交互组件都是零参数用法：`<LinearFit />`。Quiz 的 props 见 `src/components/Quiz/index.tsx`。

## 交互组件开发约定

- 必须 SSR 安全：不在模块顶层碰 `window`/`localStorage`；初始 state 不能用随机数（会导致 hydration 不一致），随机性只能来自用户交互之后。
- 统一用 `PlaygroundCard` 包裹（title / subtitle / footer 三段式，footer 写「💡 要点」）。
- 取色一律用 `var(--viz-s1..s8)` 等 CSS 变量（定义在 `src/css/custom.css`，深浅色自动切换、色盲安全），禁止写死十六进制。
- 首选 SVG（viewBox 响应式），共用控件在 `src/components/interactive/ui.tsx`。
- 新组件写完要在 `src/theme/MDXComponents.tsx` 注册。

## 禁止行为

- 禁止引入重型前端依赖（图表库、动画库、UI 框架）；可视化一律手写 SVG。
- 禁止添加后端、数据库、用户系统；本站必须保持纯静态。
- 禁止在直觉层堆公式；禁止删除「类比局限」说明。
- 提交前必须 `npm run build` 通过。
