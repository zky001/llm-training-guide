/**
 * 全站术语表：正文中用 <Term id="xxx">显示文字</Term> 引用，
 * 附录术语表页面也由这份数据渲染。
 * 新增术语时保持 def 是「一句人话」，专业展开放到对应章节里。
 */
export interface GlossaryEntry {
  /** 唯一 id，小写英文/连字符 */
  id: string;
  /** 中文名 */
  zh: string;
  /** 英文名 */
  en: string;
  /** 一句话人话解释 */
  def: string;
  /** 首次出现的章（用于术语表分组），如 "0" "1" "4" */
  chapter?: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  // ---- 第 0 章 ----
  {id: 'machine-learning', zh: '机器学习', en: 'Machine Learning', def: '不靠人手写规则，而是让程序从大量数据里自动找规律（调参数）的方法。', chapter: '0'},
  {id: 'model', zh: '模型', en: 'Model', def: '一个带很多可调参数的数学函数：输入进去、答案出来。「训练」就是调这些参数。', chapter: '0'},
  {id: 'parameter', zh: '参数', en: 'Parameter', def: '模型内部可以调节的数字旋钮。大模型的「70 亿参数」就是 70 亿个这样的旋钮。', chapter: '0'},
  {id: 'vector', zh: '向量', en: 'Vector', def: '一串排好队的数字，可以看成高维空间中的一个点或一支箭头。', chapter: '0'},
  {id: 'matrix', zh: '矩阵', en: 'Matrix', def: '按行列排好的一表数字；乘一个向量相当于对空间做旋转、拉伸等变换。', chapter: '0'},
  {id: 'probability-distribution', zh: '概率分布', en: 'Probability Distribution', def: '给每种可能的结果各分配一个概率、加起来等于 1 的清单。', chapter: '0'},
  {id: 'loss', zh: '损失函数', en: 'Loss Function', def: '给模型「错得有多离谱」打分的函数：分数越低模型越好，训练就是让它变低。', chapter: '0'},
  {id: 'gradient', zh: '梯度', en: 'Gradient', def: '损失对每个参数的「坡度」：告诉你把参数往哪边调、调多少能让损失下降最快。', chapter: '0'},
  {id: 'gradient-descent', zh: '梯度下降', en: 'Gradient Descent', def: '沿着坡度反方向一小步一小步往下走、不断降低损失的训练算法，像蒙着眼下山。', chapter: '0'},
  {id: 'learning-rate', zh: '学习率', en: 'Learning Rate', def: '每一步往下走多大步。太小走不动，太大会直接飞出山谷。', chapter: '0'},
  {id: 'local-minimum', zh: '局部最低点', en: 'Local Minimum', def: '周围都比它高、但不一定是全场最低的「小山谷」；下山有可能困在这里。', chapter: '0'},

  // ---- 第 1 章 ----
  {id: 'language-model', zh: '语言模型', en: 'Language Model', def: '给定前文、预测下一个词（的概率分布）的模型。大模型本质上就是它的放大版。', chapter: '1'},
  {id: 'llm', zh: '大语言模型', en: 'Large Language Model (LLM)', def: '参数量达到数十亿以上、用海量文本训练出来的语言模型，如 GPT、Claude、Qwen。', chapter: '1'},
  {id: 'token', zh: '词元', en: 'Token', def: '模型处理文本的最小单位，可能是一个字、半个词或一个词组。文本先切成 token 再进模型。', chapter: '1'},
  {id: 'tokenization', zh: '分词', en: 'Tokenization', def: '把一段文本切成一串 token 的过程。', chapter: '1'},
  {id: 'bpe', zh: '字节对编码', en: 'Byte Pair Encoding (BPE)', def: '一种造 token 词表的算法：不断把语料里最常一起出现的相邻组合合并成新 token。', chapter: '1'},
  {id: 'vocabulary', zh: '词表', en: 'Vocabulary', def: '模型认识的全部 token 的清单，常见规模是几万到二十几万个。', chapter: '1'},
  {id: 'embedding', zh: '词向量 / 嵌入', en: 'Embedding', def: '把每个 token 变成一串数字（向量），让「意思相近」的词在空间里离得近。', chapter: '1'},
  {id: 'n-gram', zh: 'n 元语法', en: 'n-gram', def: '只看前 n−1 个词来统计下一个词概率的老式语言模型，简单但看不远。', chapter: '1'},
  {id: 'oov', zh: '未登录词', en: 'Out-of-Vocabulary (OOV)', def: '词表里没有的词。BPE 类分词法能把它拆成更小的碎片，避免模型完全不认识。', chapter: '1'},
  {id: 'perplexity', zh: '困惑度', en: 'Perplexity', def: '衡量语言模型好坏的指标：模型对真实文本有多「惊讶」，越低越好。', chapter: '1'},

  // ---- 第 2 章 ----
  {id: 'neural-network', zh: '神经网络', en: 'Neural Network', def: '由大量简单计算单元（神经元）分层连接而成的函数，能拟合非常复杂的规律。', chapter: '2'},
  {id: 'activation', zh: '激活函数', en: 'Activation Function', def: '神经元里的非线性开关（如 ReLU）；没有它，叠再多层也只是一条直线。', chapter: '2'},
  {id: 'backpropagation', zh: '反向传播', en: 'Backpropagation', def: '从输出端往回逐层计算每个参数梯度的算法，是训练神经网络的核心机制。', chapter: '2'},
  {id: 'sgd', zh: '随机梯度下降', en: 'SGD', def: '每次只用一小批数据估算梯度并更新参数的梯度下降，又快又省内存。', chapter: '2'},
  {id: 'batch', zh: '批 / 批大小', en: 'Batch / Batch Size', def: '一次参数更新所用的那一小撮训练样本及其数量。', chapter: '2'},

  // ---- 第 2 章（补充） ----
  {id: 'relu', zh: 'ReLU', en: 'Rectified Linear Unit', def: '最常用的激活函数：负数归零、正数原样通过。每个 ReLU 神经元给函数贡献一个「折角」。', chapter: '2'},
  {id: 'sigmoid', zh: 'Sigmoid 函数', en: 'Sigmoid', def: '把任意数字压进 0~1 之间的 S 形函数，常用来表示概率或「开关程度」。', chapter: '2'},
  {id: 'hidden-layer', zh: '隐藏层', en: 'Hidden Layer', def: '神经网络中夹在输入和输出之间的中间层，负责逐层加工特征。', chapter: '2'},
  {id: 'cross-entropy', zh: '交叉熵', en: 'Cross-Entropy', def: '分类和语言模型的标准损失：看模型给正确答案分配了多少概率，概率越小罚分越重。', chapter: '2'},
  {id: 'overfitting', zh: '过拟合', en: 'Overfitting', def: '模型把训练数据里的噪声也背了下来，导致在没见过的数据上反而表现变差。', chapter: '2'},
  {id: 'autograd', zh: '自动微分', en: 'Automatic Differentiation', def: '深度学习框架自动帮你算所有参数梯度的机制，反向传播就是它的核心算法。', chapter: '2'},

  // ---- 第 3 章 ----
  {id: 'transformer', zh: 'Transformer', en: 'Transformer', def: '2017 年提出的神经网络架构，靠注意力机制并行处理整段文本，是所有主流大模型的骨架。', chapter: '3'},
  {id: 'attention', zh: '注意力机制', en: 'Attention', def: '让每个词按「相关程度」加权参考句中其他词的机制，是 Transformer 的核心。', chapter: '3'},
  {id: 'multi-head', zh: '多头注意力', en: 'Multi-Head Attention', def: '同时运行多组注意力，每个「头」学会关注一种不同的关系（指代、语法、位置……）。', chapter: '3'},
  {id: 'positional-encoding', zh: '位置编码', en: 'Positional Encoding', def: '给每个位置发的「工牌」：注意力本身不分先后，位置信息要额外注入。', chapter: '3'},
  {id: 'causal-mask', zh: '因果遮罩', en: 'Causal Mask', def: '生成式模型的规则：每个词只准看它前面的词，不许偷看未来。', chapter: '3'},
  {id: 'residual', zh: '残差连接', en: 'Residual Connection', def: '每层的输出 = 输入 + 修正量。给梯度修了一条直达电梯，深层网络才训得动。', chapter: '3'},
  {id: 'layer-norm', zh: '层归一化', en: 'Layer Normalization', def: '每层把数值重新校准到稳定范围，防止信号越传越大或越传越小。', chapter: '3'},
  {id: 'feed-forward', zh: '前馈网络', en: 'Feed-Forward Network (FFN)', def: 'Transformer 块里注意力之后的小型多层网络，逐个位置加工信息，占了大头参数。', chapter: '3'},
  {id: 'logits', zh: '逻辑值', en: 'Logits', def: '模型输出层的原始打分（可正可负），过一次 softmax 才变成概率。', chapter: '3'},
  {id: 'softmax', zh: 'Softmax', en: 'Softmax', def: '把一组任意打分变成总和为 1 的概率分布的函数：分高的占大头，但谁都有份。', chapter: '3'},
  {id: 'context-window', zh: '上下文窗口', en: 'Context Window', def: '模型一次能「看在眼里」的最大 token 数，超出的部分它就不知道了。', chapter: '3'},
  {id: 'temperature', zh: '温度', en: 'Temperature', def: '控制生成随机性的旋钮：调低更保守稳定，调高更天马行空。', chapter: '3'},
  {id: 'top-k', zh: 'Top-k 采样', en: 'Top-k Sampling', def: '只在概率最高的 k 个候选词里抽签，把长尾里的怪词直接排除。', chapter: '3'},
  {id: 'top-p', zh: 'Top-p（核）采样', en: 'Top-p / Nucleus Sampling', def: '按概率从高到低累加，刚够 p（如 90%）就截断，在这批「核心候选」里抽签。', chapter: '3'},
  {id: 'autoregressive', zh: '自回归', en: 'Autoregressive', def: '一次只生成一个词，把它拼回输入再生成下一个——大模型说话的基本循环。', chapter: '3'},

  // ---- 第 4 章 ----
  {id: 'pretraining', zh: '预训练', en: 'Pre-training', def: '用海量普通文本做「预测下一个词」训练，让模型学会语言和世界知识的阶段，占算力大头。', chapter: '4'},
  {id: 'scaling-laws', zh: '缩放定律', en: 'Scaling Laws', def: '模型能力随参数量、数据量、算力按可预测的规律提升的经验法则。', chapter: '4'},
  {id: 'gpu', zh: '图形处理器', en: 'GPU', def: '擅长同时做海量乘加运算的芯片，是训练大模型的主力硬件。', chapter: '4'},
  {id: 'checkpoint', zh: '检查点', en: 'Checkpoint', def: '训练过程中定期保存的模型参数快照，训练崩了可以从这里继续。', chapter: '4'},

  // ---- 第 4 章（补充） ----
  {id: 'mixed-precision', zh: '混合精度训练', en: 'Mixed Precision', def: '用 16 位数字做大部分计算（快、省显存），关键部位保留 32 位副本保精度。', chapter: '4'},
  {id: 'gradient-clipping', zh: '梯度裁剪', en: 'Gradient Clipping', def: '给梯度装限速器：超过阈值就按比例缩小，防止一步大更新把训练带崩。', chapter: '4'},
  {id: 'loss-spike', zh: '损失尖峰', en: 'Loss Spike', def: '训练中损失突然飙升的事故，常见处置是回滚到上个检查点并跳过可疑数据。', chapter: '4'},
  {id: 'data-parallelism', zh: '数据并行', en: 'Data Parallelism (DP)', def: '每张卡放一份完整模型、各吃不同数据，每步结束后大家把梯度求平均。', chapter: '4'},
  {id: 'tensor-parallelism', zh: '张量并行', en: 'Tensor Parallelism (TP)', def: '把每一层的大矩阵切开分给多张卡，算每层时都要卡间通信，需要极快互联。', chapter: '4'},
  {id: 'pipeline-parallelism', zh: '流水线并行', en: 'Pipeline Parallelism (PP)', def: '把模型按层切段，每张卡管几层，数据像流水线一样逐段接力。', chapter: '4'},
  {id: 'zero', zh: 'ZeRO', en: 'ZeRO (Zero Redundancy Optimizer)', def: '数据并行的省显存版：把优化器状态、梯度甚至参数切片分摊到各卡，用时再临时拼装。', chapter: '4'},
  {id: 'mfu', zh: '算力利用率', en: 'MFU (Model FLOPs Utilization)', def: '实际有效算力占 GPU 理论峰值的比例，大规模训练能到四成左右就算优秀（2025 年）。', chapter: '4'},

  // ---- 第 5 章 ----
  {id: 'base-model', zh: '基座模型', en: 'Base Model', def: '只做过预训练的模型：最强「接话茬选手」，会续写但不会好好回答问题。', chapter: '5'},
  {id: 'sft', zh: '监督微调', en: 'Supervised Fine-Tuning (SFT)', def: '用人工写好的「问题 → 优质回答」示范数据继续训练，教会模型按指令对话。', chapter: '5'},
  {id: 'rlhf', zh: '基于人类反馈的强化学习', en: 'RLHF', def: '让人类比较模型的多个回答、训练一个奖励模型，再用强化学习让模型往高分方向改进。', chapter: '5'},
  {id: 'reward-model', zh: '奖励模型', en: 'Reward Model', def: '从大量人类偏好比较中学会「给回答打分」的模型，充当 RLHF 里的裁判。', chapter: '5'},
  {id: 'alignment', zh: '对齐', en: 'Alignment', def: '让模型的行为符合人类意图和价值观（有用、诚实、无害）的一系列技术。', chapter: '5'},
  {id: 'hallucination', zh: '幻觉', en: 'Hallucination', def: '模型一本正经地编造不真实内容的现象，源于它本质上是在「接最像的话」。', chapter: '5'},
  {id: 'preference-data', zh: '偏好数据', en: 'Preference Data', def: '「同一问题的两个回答，人类选了哪个」的记录，是训练奖励模型的原料。', chapter: '5'},
  {id: 'ppo', zh: '近端策略优化', en: 'PPO', def: 'RLHF 常用的强化学习算法：追求高奖励，但每步更新都被夹在安全范围内。', chapter: '5'},
  {id: 'kl-penalty', zh: 'KL 惩罚', en: 'KL Penalty', def: '拴在模型身上的橡皮筋：离原始模型的说话方式偏得越远，扣分越多。', chapter: '5'},
  {id: 'reward-hacking', zh: '奖励钻空子', en: 'Reward Hacking', def: '模型发现裁判的漏洞并疯狂利用（比如灌水凑长度），得了高分却没变好。', chapter: '5'},
  {id: 'dpo', zh: '直接偏好优化', en: 'DPO', def: '跳过奖励模型和强化学习，直接用偏好数据调整模型的简化对齐方法。', chapter: '5'},
  {id: 'grpo', zh: '组相对策略优化', en: 'GRPO', def: '让同一道题的一组回答互相比较当基线的强化学习算法，省掉价值模型。', chapter: '5'},
  {id: 'rlvr', zh: '可验证奖励强化学习', en: 'RLVR', def: '用能自动判对错的任务（数学、代码）当奖励来源做强化学习，不需要人类打分。', chapter: '5'},
  {id: 'sycophancy', zh: '谄媚', en: 'Sycophancy', def: '模型顺着用户说、明知不对也附和的倾向——讨好式回答在人类标注中常拿高分。', chapter: '5'},
  {id: 'chain-of-thought', zh: '思维链', en: 'Chain-of-Thought (CoT)', def: '让模型先写出推理过程再给答案；推理模型的「多想一会儿」就是加长版思维链。', chapter: '5'},

  // ---- 第 6 章 ----
  {id: 'inference', zh: '推理', en: 'Inference', def: '训练完成后实际使用模型生成结果的阶段（跟「逻辑推理」不是一个意思）。', chapter: '6'},
  {id: 'kv-cache', zh: 'KV 缓存', en: 'KV Cache', def: '把已算过的注意力中间结果存起来复用，让逐词生成不用每次从头重算。', chapter: '6'},
  {id: 'quantization', zh: '量化', en: 'Quantization', def: '把模型参数用更少的比特存储（如 16 位压到 4 位），牺牲一点精度换显存和速度。', chapter: '6'},
  {id: 'distillation', zh: '蒸馏', en: 'Distillation', def: '让小模型学习模仿大模型的输出，用小得多的体积保住大部分能力。', chapter: '6'},
  {id: 'prefill', zh: '预填充', en: 'Prefill', def: '推理的第一阶段：把整段提示词一次性并行算完——算力密集，决定「首字延迟」。', chapter: '6'},
  {id: 'decode', zh: '解码', en: 'Decode', def: '推理的第二阶段：一个 token 一个 token 往外蹦——受限于显存带宽，决定「出字速度」。', chapter: '6'},
  {id: 'latency', zh: '延迟', en: 'Latency', def: '从发出请求到看到回复的等待时间；聊天场景最在乎首字延迟。', chapter: '6'},
  {id: 'throughput', zh: '吞吐量', en: 'Throughput', def: '一套服务每秒能产出的总 token 数；面向大量用户时的核心指标，常与延迟互相牺牲。', chapter: '6'},
  {id: 'continuous-batching', zh: '连续批处理', en: 'Continuous Batching', def: '谁的请求生成完就立刻腾位置给新请求，不等整批一起结束——推理服务的关键提速技术。', chapter: '6'},
  {id: 'paged-attention', zh: '分页注意力', en: 'PagedAttention', def: 'vLLM 的核心技术：像操作系统管理内存一样按小块管理 KV 缓存，几乎消灭显存浪费。', chapter: '6'},

  // ---- 第 7 章 ----
  {id: 'benchmark', zh: '基准测试', en: 'Benchmark', def: '一套固定的考题加打分标准，用来横向比较不同模型的能力。', chapter: '7'},
  {id: 'data-contamination', zh: '数据污染', en: 'Data Contamination', def: '评测考题混进了训练数据——模型是「背过原题」而不是「会做」，分数就失真了。', chapter: '7'},
  {id: 'llm-as-judge', zh: '模型当裁判', en: 'LLM-as-Judge', def: '用一个强模型给其他模型的回答打分，便宜快速，但自带长度、自信、文风等偏差。', chapter: '7'},

  // ---- 第 8 章 ----
  {id: 'moe', zh: '专家混合', en: 'Mixture of Experts (MoE)', def: '把前馈网络换成一群「专家」，每个 token 只激活其中几个——参数可以巨大，计算量却不涨。', chapter: '8'},
  {id: 'multimodal', zh: '多模态', en: 'Multimodal', def: '让同一个模型看图、听声、读文字——把不同形式的信息都变成 token 序列处理。', chapter: '8'},
  {id: 'reasoning-model', zh: '推理模型', en: 'Reasoning Model', def: 'o1 / R1 一类先「多想一会儿」（生成长思维链）再作答的模型，用强化学习训练出来。', chapter: '8'},
  {id: 'agent', zh: '智能体', en: 'Agent', def: '会自己规划步骤、调用工具（搜索、写代码、操作软件）来完成任务的大模型应用形态。', chapter: '8'},

  // ---- 下篇 A0 ----
  {id: 'agent-loop', zh: '行动循环', en: 'Agent Loop', def: '智能体的心跳：思考 → 行动（调工具）→ 观察结果 → 再思考，循环直到任务完成。', chapter: 'A0'},
  {id: 'trace', zh: '轨迹', en: 'Trace', def: '智能体完成一次任务的全过程记录（每一步的思考、工具调用和结果），排错和评测都靠它。', chapter: 'A0'},
  {id: 'workflow', zh: '工作流', en: 'Workflow', def: '由人预先编排好步骤、LLM 只负责各步内容的系统；与「模型自己决定下一步」的智能体相对。', chapter: 'A0'},
  {id: 'react', zh: 'ReAct', en: 'ReAct (Reason + Act)', def: '「思考一句、行动一步、看看结果」交替进行的经典智能体范式（2022 年提出）。', chapter: 'A0'},

  // ---- 下篇 A1 ----
  {id: 'function-calling', zh: '工具调用', en: 'Function Calling / Tool Use', def: '模型按照工具的参数说明书输出一个结构化调用请求，由外部程序真正执行后把结果喂回来。', chapter: 'A1'},
  {id: 'tool-schema', zh: '工具描述', en: 'Tool Schema', def: '告诉模型「这个工具是干嘛的、参数怎么填」的说明书（JSON Schema），写得好坏直接决定模型会不会用。', chapter: 'A1'},

  // ---- 下篇 A2 ----
  {id: 'task-decomposition', zh: '任务分解', en: 'Task Decomposition', def: '把大任务拆成一串可执行的小步骤——规划的第一步，也是智能体可靠性的地基。', chapter: 'A2'},
  {id: 'reflection', zh: '反思', en: 'Reflection', def: '让模型回头检查自己的输出并修正——用额外的计算换可靠性的经典模式。', chapter: 'A2'},

  // ---- 下篇 A3 ----
  {id: 'context-engineering', zh: '上下文工程', en: 'Context Engineering', def: '决定「什么信息进上下文、以什么形式、留多久」的工程学——智能体时代对提示工程的升级。', chapter: 'A3'},
  {id: 'compaction', zh: '上下文压缩', en: 'Compaction', def: '把旧对话压缩成摘要腾出空间，让长任务跑得下去又不至于失忆的常用手段。', chapter: 'A3'},
  {id: 'long-term-memory', zh: '长期记忆', en: 'Long-term Memory', def: '上下文之外的持久存储（文件、数据库、向量库），让智能体跨任务、跨会话记住事实与经验。', chapter: 'A3'},
  {id: 'rag', zh: '检索增强生成', en: 'RAG', def: '先从资料库检索相关内容塞进上下文再回答；Agentic RAG 更进一步——把检索变成模型自主反复使用的工具。', chapter: 'A3'},

  // ---- 下篇 A4 ----
  {id: 'prompt-chaining', zh: '提示链', en: 'Prompt Chaining', def: '固定顺序的多次模型调用，每步输出喂给下一步——最朴素也最常用的工作流积木。', chapter: 'A4'},
  {id: 'routing', zh: '路由', en: 'Routing', def: '先判断输入属于哪一类，再交给对应的专门分支处理——分诊台模式。', chapter: 'A4'},
  {id: 'parallelization', zh: '并行', en: 'Parallelization', def: '同一任务多路同时做：或分片各管一段，或投票互相校验。', chapter: 'A4'},
  {id: 'orchestrator-worker', zh: '编排者-工人', en: 'Orchestrator-Workers', def: '一个中枢动态拆解任务、派发给多个工人、最后汇总成品的模式。', chapter: 'A4'},
  {id: 'evaluator-optimizer', zh: '评估者-优化者', en: 'Evaluator-Optimizer', def: '一个负责生成、一个负责挑毛病，循环到达标为止——反思模式的双角色版。', chapter: 'A4'},

  // ---- 下篇 A5 ----
  {id: 'mcp', zh: 'MCP 协议', en: 'Model Context Protocol', def: '连接模型与工具、数据源的开放标准——「AI 应用的 USB-C 接口」，一次接入处处可用（2024 年提出）。', chapter: 'A5'},
  {id: 'a2a', zh: 'A2A 协议', en: 'Agent2Agent Protocol', def: '让不同家的智能体互相发现、对话与协作的开放协议（2025 年提出）。', chapter: 'A5'},
  {id: 'sub-agent', zh: '子智能体', en: 'Sub-agent', def: '被主智能体派去干专项活的下属：用自己的独立上下文工作，干完只交结论不交过程。', chapter: 'A5'},
  {id: 'context-isolation', zh: '上下文隔离', en: 'Context Isolation', def: '每个子智能体各用各的上下文，中间过程互不污染——多智能体系统的核心收益之一。', chapter: 'A5'},
];
