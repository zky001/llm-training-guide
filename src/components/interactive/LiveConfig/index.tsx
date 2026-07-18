import React, {useEffect, useState} from 'react';
import {loadConfig, saveConfig, clearConfig, embed, type LiveConfig} from '@site/src/lib/liveClient';
import btn from '../playground.module.css';

/**
 * 「真实模式」配置面板：读者填自己的模型服务（兼容 OpenAI 协议）。
 * Key 只存浏览器 localStorage，永不上传。多个实验共用同一份配置。
 */

const PRESETS: {name: string; baseUrl: string; chatModel: string; embedModel: string; hint: string}[] = [
  {name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', chatModel: 'gpt-4o-mini', embedModel: 'text-embedding-3-small', hint: '需要浏览器直连，注意 key 会暴露在浏览器'},
  {name: 'DashScope（通义/Qwen）', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', chatModel: 'qwen-plus', embedModel: 'text-embedding-v3', hint: '阿里云百炼的 OpenAI 兼容端'},
  {name: 'Ollama（本地）', baseUrl: 'http://localhost:11434/v1', chatModel: 'qwen2.5', embedModel: 'nomic-embed-text', hint: '本地服务，注意 http 混合内容拦截'},
  {name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', chatModel: 'openai/gpt-4o-mini', embedModel: '（多数不支持 embedding）', hint: '聚合多家模型'},
];

export default function LiveConfigPanel({onChange, needEmbed}: {onChange?: () => void; needEmbed?: boolean}) {
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState<LiveConfig>({baseUrl: '', apiKey: '', chatModel: '', embedModel: ''});
  const [configured, setConfigured] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ok: boolean; text: string} | null>(null);

  useEffect(() => {
    const c = loadConfig();
    if (c) {
      setCfg(c);
      setConfigured(true);
    }
  }, []);

  const set = (k: keyof LiveConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCfg((prev) => ({...prev, [k]: e.target.value}));

  const applyPreset = (p: (typeof PRESETS)[number]) =>
    setCfg((prev) => ({...prev, baseUrl: p.baseUrl, chatModel: p.chatModel, embedModel: p.embedModel.startsWith('（') ? prev.embedModel : p.embedModel}));

  const save = () => {
    saveConfig(cfg);
    setConfigured(true);
    setTestMsg(null);
    onChange?.();
  };

  const forget = () => {
    clearConfig();
    setCfg({baseUrl: '', apiKey: '', chatModel: '', embedModel: ''});
    setConfigured(false);
    setTestMsg(null);
    onChange?.();
  };

  const test = async () => {
    setTesting(true);
    setTestMsg(null);
    try {
      saveConfig(cfg);
      // 用一次最小 embedding 调用验证连通性（比 chat 更便宜）
      await embed(['连接测试'], cfg);
      setConfigured(true);
      setTestMsg({ok: true, text: '✅ 连接成功！配置已保存，可以开真实模式了。'});
      onChange?.();
    } catch (e) {
      setTestMsg({ok: false, text: '❌ ' + (e instanceof Error ? e.message : String(e))});
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: 10, marginBottom: 12, background: 'var(--ifm-background-surface-color)'}}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', color: 'var(--ifm-font-color-base)', cursor: 'pointer', fontSize: '0.86rem', fontWeight: 600, textAlign: 'left'}}
      >
        <span>🔴 真实模式设置</span>
        <span style={{fontSize: '0.76rem', fontWeight: 500, color: configured ? 'var(--viz-good)' : 'var(--ifm-color-emphasis-600)'}}>
          {configured ? '已配置' : '未配置（点开填自己的模型服务）'}
        </span>
        <span style={{marginLeft: 'auto', fontSize: '0.78rem'}}>{open ? '收起 ▴' : '展开 ▾'}</span>
      </button>

      {open && (
        <div style={{padding: '0 12px 12px', fontSize: '0.84rem'}}>
          <div style={{padding: '8px 10px', borderRadius: 8, background: 'rgba(250,178,25,0.10)', borderLeft: '3px solid var(--viz-s4)', lineHeight: 1.6, marginBottom: 10}}>
            🔒 <b>安全说明</b>：你的 Key <b>只存在这台浏览器的 localStorage</b>，本站没有服务器、不会上传它。请求从你的浏览器<b>直连你填的 Base URL</b>。建议用额度受限的测试 key 或本地服务。不填也能正常玩所有实验——真实模式是可选的。
          </div>

          <div style={{display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8}}>
            <span style={{fontSize: '0.78rem', color: 'var(--ifm-color-emphasis-600)', alignSelf: 'center'}}>快速填入：</span>
            {PRESETS.map((p) => (
              <button key={p.name} type="button" className={btn.btn} style={{fontSize: '0.74rem', padding: '3px 8px'}} onClick={() => applyPreset(p)} title={p.hint}>
                {p.name}
              </button>
            ))}
          </div>

          <div style={{display: 'grid', gap: 6}}>
            {[
              {k: 'baseUrl' as const, label: 'Base URL', ph: 'https://api.openai.com/v1', type: 'text'},
              {k: 'apiKey' as const, label: 'API Key', ph: 'sk-...', type: 'password'},
              {k: 'chatModel' as const, label: '对话模型', ph: 'gpt-4o-mini / qwen-plus', type: 'text'},
              ...(needEmbed ? [{k: 'embedModel' as const, label: '嵌入模型', ph: 'text-embedding-3-small / text-embedding-v3', type: 'text'}] : []),
            ].map((f) => (
              <label key={f.k} style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <span style={{width: '5.5em', flexShrink: 0, fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-700)'}}>{f.label}</span>
                <input
                  type={f.type}
                  value={cfg[f.k]}
                  onChange={set(f.k)}
                  placeholder={f.ph}
                  autoComplete="off"
                  spellCheck={false}
                  style={{flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--ifm-color-emphasis-300)', background: 'var(--ifm-background-color)', color: 'var(--ifm-font-color-base)', fontSize: '0.82rem'}}
                />
              </label>
            ))}
          </div>

          <div style={{display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap'}}>
            <button type="button" className={btn.btnPrimary} onClick={test} disabled={testing || !cfg.baseUrl || !cfg.apiKey}>
              {testing ? '测试中…' : '🔌 测试连接并保存'}
            </button>
            <button type="button" className={btn.btn} onClick={save} disabled={!cfg.baseUrl || !cfg.apiKey}>仅保存</button>
            {configured && <button type="button" className={btn.btn} onClick={forget}>🗑 忘记 Key</button>}
          </div>

          {testMsg && (
            <div style={{marginTop: 8, padding: '8px 10px', borderRadius: 8, fontSize: '0.8rem', lineHeight: 1.6, background: testMsg.ok ? 'rgba(12,163,12,0.08)' : 'rgba(208,59,59,0.08)', border: `1px solid ${testMsg.ok ? 'var(--viz-good)' : 'var(--viz-bad)'}`}}>
              {testMsg.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
