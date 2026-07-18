/**
 * 「真实模式」客户端：让交互实验可以用读者自己的模型服务真跑一遍。
 *
 * 设计约束（本站是纯静态站，无后端）：
 *  - 所有请求从浏览器直连读者填的 Base URL（兼容 OpenAI 协议）；
 *  - API Key 只存在浏览器 localStorage，永不上传到本站（本站没有服务器可上传）；
 *  - 一切在用户显式开启并填好配置后才发生。
 */

export interface LiveConfig {
  baseUrl: string; // 如 https://api.openai.com/v1 、 https://dashscope.aliyuncs.com/compatible-mode/v1
  apiKey: string;
  chatModel: string; // 如 gpt-4o-mini 、 qwen-plus
  embedModel: string; // 如 text-embedding-3-small 、 text-embedding-v3
}

const STORAGE_KEY = 'llm-guide-live-config';

export function loadConfig(): LiveConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as LiveConfig;
    if (!c.baseUrl || !c.apiKey) return null;
    return c;
  } catch {
    return null;
  }
}

export function saveConfig(cfg: LiveConfig): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function clearConfig(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** 把 Base URL 规整成不带尾斜杠 */
function normBase(base: string): string {
  return base.trim().replace(/\/+$/, '');
}

/** 把浏览器直连常见的失败翻译成给读者看的人话 */
function friendlyError(e: unknown): Error {
  if (e instanceof TypeError) {
    // fetch 抛 TypeError 通常是 CORS 被拦、混合内容(https 页请求 http)、或网络不通
    return new Error(
      '请求没发出去。常见原因：① 你的服务端没开 CORS（不允许浏览器直连）；' +
        '② 本站是 https，若你的服务是 http://localhost，部分浏览器会按「混合内容」拦截；' +
        '③ Base URL 填错或网络不通。可换成支持浏览器直连的云服务，或给本地服务配好 CORS/https。',
    );
  }
  return e instanceof Error ? e : new Error(String(e));
}

async function post(path: string, body: unknown, cfg: LiveConfig): Promise<any> {
  let resp: Response;
  try {
    resp = await fetch(`${normBase(cfg.baseUrl)}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
        // 部分服务（如 Anthropic 兼容端）需要此头才允许浏览器直连；对不认识它的服务无害
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw friendlyError(e);
  }
  if (!resp.ok) {
    let detail = '';
    try {
      const j = await resp.json();
      detail = j?.error?.message || JSON.stringify(j).slice(0, 200);
    } catch {
      detail = await resp.text().catch(() => '');
    }
    throw new Error(`服务返回 ${resp.status}：${detail || '（无详情）'}`);
  }
  return resp.json();
}

/** 批量把文本编码成向量（OpenAI 兼容 /embeddings） */
export async function embed(texts: string[], cfg: LiveConfig): Promise<number[][]> {
  const data = await post('/embeddings', {model: cfg.embedModel, input: texts}, cfg);
  const items = (data?.data ?? []) as {embedding: number[]; index: number}[];
  // 按 index 排序，保证与输入顺序对齐
  return items.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

/** 一次对话补全，返回文本（OpenAI 兼容 /chat/completions） */
export async function chat(
  messages: {role: string; content: string}[],
  cfg: LiveConfig,
  opts: {temperature?: number; maxTokens?: number} = {},
): Promise<string> {
  const data = await post(
    '/chat/completions',
    {
      model: cfg.chatModel,
      messages,
      temperature: opts.temperature ?? 0.2,
      max_tokens: opts.maxTokens ?? 512,
    },
    cfg,
  );
  return data?.choices?.[0]?.message?.content ?? '';
}

/** 余弦相似度 */
export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}
