/**
 * 中篇共享知识库：一个小网店的政策/商品资料。
 * K1（语义检索）、K3（三路检索）、K4（重排）的实验都基于它，互相印证。
 *
 * 每条 passage 带：
 *  - pos: 手工构造的 2 维「语义坐标」（真实向量是几百上千维，这里是概念缩影，
 *         意思相近的段落坐标相近）；
 *  - keywords: 用于关键词（BM25 式）检索对比的词表。
 */
export interface Passage {
  id: string;
  title: string;
  text: string;
  topic: string;
  pos: [number, number];
  keywords: string[];
}

export const RAG_PASSAGES: Passage[] = [
  {id: 'p1', title: '退货政策', topic: '退换货', pos: [-7, 5], text: '商品支持七天无理由退货，需保持包装完好，生鲜类除外。', keywords: ['退货', '七天', '无理由', '包装', '生鲜']},
  {id: 'p2', title: '换货流程', topic: '退换货', pos: [-5.6, 6.2], text: '如需换货，请在订单页点击「申请换货」，我们将安排上门取件。', keywords: ['换货', '取件', '订单', '申请']},
  {id: 'p3', title: '配送时效', topic: '配送', pos: [-7, -5], text: '普通快递 3–5 天送达，偏远地区顺延；付费加急可次日达。', keywords: ['配送', '快递', '送达', '加急', '次日达']},
  {id: 'p4', title: '运费规则', topic: '配送', pos: [-5.6, -6.2], text: '订单满 99 元包邮，未满收取 10 元运费；生鲜一律加收冷链费。', keywords: ['运费', '包邮', '冷链', '生鲜']},
  {id: 'p5', title: '支付方式', topic: '支付', pos: [6, 5], text: '支持微信、支付宝、银行卡以及货到付款。', keywords: ['支付', '微信', '支付宝', '银行卡', '货到付款']},
  {id: 'p6', title: '开发票', topic: '支付', pos: [7.2, 6.2], text: '订单完成后 30 天内可申请电子发票，纸质发票需额外邮寄。', keywords: ['发票', '电子发票', '纸质', '邮寄']},
  {id: 'p7', title: '会员权益', topic: '会员', pos: [6, -5], text: '黑卡会员享全场 95 折、专属客服和生日礼券。', keywords: ['会员', '黑卡', '折扣', '礼券', '客服']},
  {id: 'p8', title: '积分规则', topic: '会员', pos: [7.2, -6.2], text: '每消费 1 元累计 1 积分，100 积分可抵 1 元。', keywords: ['积分', '抵扣', '消费']},
  {id: 'p9', title: 'X9 Pro 参数', topic: '手机', pos: [2.8, -7.6], text: 'X9 Pro 搭载 6.7 英寸屏幕，5000mAh 大电池，支持 100W 快充。', keywords: ['X9', 'Pro', '屏幕', '电池', '快充']},
  {id: 'p10', title: '冰糖心苹果', topic: '水果', pos: [0, 8], text: '阿克苏冰糖心苹果，脆甜多汁，5 斤装，满 99 包邮。', keywords: ['苹果', '水果', '冰糖心', '包邮']},
  {id: 'p11', title: '苹果手机充电线', topic: '配件', pos: [2.2, -8.4], text: '苹果手机原装充电线，支持快充，一年质保。', keywords: ['苹果', '充电线', '快充', '质保']},
];

/** 预设查询：pos 是查询的「语义坐标」，用于和 passage 比距离 */
export interface RagQuery {
  q: string;
  pos: [number, number];
  /** 教学备注：这条查询想演示什么 */
  note: string;
}

export const RAG_QUERIES: RagQuery[] = [
  {q: '买的东西不想要了怎么办', pos: [-6.6, 5.4], note: '和「退货政策」意思几乎一样，却一个关键词都不共享——语义检索能命中，关键词检索会漏。'},
  {q: '大概几天能收到货', pos: [-6.6, -5.4], note: '「收到货」对上「送达」，靠意思匹配。'},
  {q: '我想买苹果', pos: [0.4, 7.4], note: '「苹果」有歧义：关键词检索会把水果和手机配件都捞上来，语义检索能分清你八成想要水果。'},
  {q: '手机电池大不大', pos: [2.9, -7.3], note: '「电池大」对上「5000mAh 大电池」。'},
];

/** 由二维语义坐标算「相似度」：距离越近越相似（真实系统用余弦相似度，见 K1 深入层） */
export function simFromPos(a: [number, number], b: [number, number]): number {
  const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
  return Math.max(0, 1 - d / 24); // 归一到 0~1，24 为坐标空间的对角量级
}

/** 关键词重合度：查询里出现了 passage 的几个关键词（简化版 BM25 直觉） */
export function keywordScore(query: string, p: Passage): number {
  let hit = 0;
  for (const kw of p.keywords) if (query.includes(kw)) hit++;
  return hit;
}
