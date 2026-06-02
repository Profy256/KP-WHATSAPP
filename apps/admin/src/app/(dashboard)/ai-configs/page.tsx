"use client";

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/adminApi';

const PROVIDERS = ['openai', 'anthropic', 'gemini', 'deepseek', 'openrouter'];
const MODELS: Record<string, string[]> = {
  openai: [
    'gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano',
    'gpt-4-turbo', 'gpt-4', 'o1', 'o1-mini', 'o3', 'o3-mini', 'o4-mini',
    'gpt-3.5-turbo',
  ],
  anthropic: [
    'claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001',
    'claude-3-7-sonnet-latest', 'claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest',
    'claude-3-opus-latest', 'claude-3-haiku-20240307',
  ],
  gemini: [
    'gemini-3.5-flash', 'gemini-3.0-flash',
    'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite',
    'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-8b',
  ],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  openrouter: [
    'openai/gpt-4o', 'openai/gpt-4o-mini', 'openai/gpt-4.1',
    'anthropic/claude-opus-4-8', 'anthropic/claude-sonnet-4-6', 'anthropic/claude-3.5-sonnet',
    'google/gemini-2.5-pro', 'google/gemini-2.0-flash-001',
    'meta-llama/llama-3.3-70b-instruct', 'mistralai/mistral-large',
    'deepseek/deepseek-chat', 'qwen/qwen-2.5-72b-instruct', 'x-ai/grok-2',
  ],
};

const emptyConfig = { provider: 'openai', model: 'gpt-4o-mini', apiKey: '', isDefault: false, isActive: true };

export default function AdminAiConfigsPage() {
  const [configs, setConfigs] = useState<any>(null);
  const [platformConfigs, setPlatformConfigs] = useState<any[]>([]);
  const [aiPage, setAiPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      adminApi.getAiConfigs(aiPage),
      adminApi.getPlatformConfigs(),
    ]).then(([ac, pc]) => {
      setConfigs(ac.data);
      setPlatformConfigs(pc.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [aiPage]);

  useEffect(() => { load(); }, [load]);

  const savePlatformConfig = async () => {
    if (!form) return;
    setSaving(true);
    try {
      if (form.id) {
        await adminApi.updatePlatformConfig(form.id, form);
      } else {
        await adminApi.savePlatformConfig(form);
      }
      setMsg('Saved!');
      setForm(null);
      load();
    } catch { setMsg('Error saving.'); }
    finally { setSaving(false); setTimeout(() => setMsg(''), 3000); }
  };

  const deletePlatformConfig = async (id: string) => {
    await adminApi.deletePlatformConfig(id);
    load();
  };

  const setDefault = async (id: string) => {
    await adminApi.setDefaultPlatformConfig(id);
    load();
  };

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>AI & Platform Config</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '14px' }}>Manage the platform AI keys used by all businesses</p>

      {/* Platform Configs */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Platform AI Keys</h2>
          <button onClick={() => setForm({ ...emptyConfig })} style={{ padding: '8px 16px', background: 'var(--accent-primary)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '600' }}>
            + Add Key
          </button>
        </div>

        {msg && <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', marginBottom: '16px', fontSize: '13px' }}>{msg}</div>}

        {/* Edit/Add form */}
        {form && (
          <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>{form.id ? 'Edit' : 'Add'} Platform Key</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Provider</label>
                <select value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value, model: MODELS[e.target.value]?.[0] ?? '' })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px' }}>
                  {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Model</label>
                <select value={form.model} onChange={e => setForm({ ...form, model: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px' }}>
                  {(MODELS[form.provider] ?? []).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>API Key</label>
                <input type="password" value={form.apiKey} onChange={e => setForm({ ...form, apiKey: e.target.value })} placeholder="sk-..."
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                Active
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} />
                Set as Default
              </label>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={savePlatformConfig} disabled={saving} style={{ padding: '8px 20px', background: 'var(--accent-primary)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '600' }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setForm(null)} style={{ padding: '8px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {platformConfigs.length === 0 && !loading && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              No platform AI keys configured yet. Add one to enable AI for all users.
            </div>
          )}
          {platformConfigs.map((pc: any) => (
            <div key={pc.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 20px', background: 'var(--bg-secondary)', border: `1px solid ${pc.isDefault ? 'var(--accent-primary)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-md)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>{pc.provider}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{pc.model}</span>
                  {pc.isDefault && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '100px', background: 'rgba(37, 211, 102,0.15)', color: 'var(--accent-primary)', fontWeight: '600' }}>Default</span>}
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '100px', background: pc.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: pc.isActive ? 'var(--success)' : 'var(--error)', fontWeight: '600' }}>
                    {pc.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', fontFamily: 'monospace' }}>
                  {pc.apiKey.slice(0, 8)}{'*'.repeat(12)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {!pc.isDefault && (
                  <button onClick={() => setDefault(pc.id)} style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(37, 211, 102,0.1)', color: 'var(--accent-primary)', borderRadius: 'var(--radius-sm)' }}>Set Default</button>
                )}
                <button onClick={() => setForm({ ...pc })} style={{ fontSize: '11px', padding: '4px 10px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>Edit</button>
                <button onClick={() => deletePlatformConfig(pc.id)} style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(239,68,68,0.1)', color: 'var(--error)', borderRadius: 'var(--radius-sm)' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User AI Configs */}
      <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>User AI Configurations</h2>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              {['Business', 'Package', 'AI Status', 'Greeting', 'Rules', 'Updated'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</td></tr>
            ) : configs?.configs?.map((c: any) => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500' }}>{c.business?.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.business?.user?.email}</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>{c.business?.selectedPackage?.replace('_', ' ')}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '100px', background: c.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)', color: c.isActive ? 'var(--success)' : 'var(--text-muted)' }}>
                    {c.isActive ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '11px', color: c.greetingEnabled ? 'var(--success)' : 'var(--text-muted)' }}>{c.greetingEnabled ? '✓ On' : '✗ Off'}</span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text-secondary)' }}>{Array.isArray(c.rules) ? c.rules.length : 0}</td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(c.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {configs && configs.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          <button disabled={aiPage === 1} onClick={() => setAiPage(p => p - 1)} style={{ padding: '6px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px' }}>Prev</button>
          <span style={{ padding: '6px 14px', color: 'var(--text-secondary)', fontSize: '13px' }}>Page {aiPage} of {configs.pages}</span>
          <button disabled={aiPage === configs.pages} onClick={() => setAiPage(p => p + 1)} style={{ padding: '6px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px' }}>Next</button>
        </div>
      )}
    </div>
  );
}
