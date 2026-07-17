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

  // ---- 第 5 章 ----
  {id: 'sft', zh: '监督微调', en: 'Supervised Fine-Tuning (SFT)', def: '用人工写好的「问题 → 优质回答」示范数据继续训练，教会模型按指令对话。', chapter: '5'},
  {id: 'rlhf', zh: '基于人类反馈的强化学习', en: 'RLHF', def: '让人类比较模型的多个回答、训练一个奖励模型，再用强化学习让模型往高分方向改进。', chapter: '5'},
  {id: 'reward-model', zh: '奖励模型', en: 'Reward Model', def: '从大量人类偏好比较中学会「给回答打分」的模型，充当 RLHF 里的裁判。', chapter: '5'},
  {id: 'alignment', zh: '对齐', en: 'Alignment', def: '让模型的行为符合人类意图和价值观（有用、诚实、无害）的一系列技术。', chapter: '5'},
  {id: 'hallucination', zh: '幻觉', en: 'Hallucination', def: '模型一本正经地编造不真实内容的现象，源于它本质上是在「接最像的话」。', chapter: '5'},

  // ---- 第 6 章 ----
  {id: 'inference', zh: '推理', en: 'Inference', def: '训练完成后实际使用模型生成结果的阶段（跟「逻辑推理」不是一个意思）。', chapter: '6'},
  {id: 'kv-cache', zh: 'KV 缓存', en: 'KV Cache', def: '把已算过的注意力中间结果存起来复用，让逐词生成不用每次从头重算。', chapter: '6'},
  {id: 'quantization', zh: '量化', en: 'Quantization', def: '把模型参数用更少的比特存储（如 16 位压到 4 位），牺牲一点精度换显存和速度。', chapter: '6'},
  {id: 'distillation', zh: '蒸馏', en: 'Distillation', def: '让小模型学习模仿大模型的输出，用小得多的体积保住大部分能力。', chapter: '6'},
];
