"use client";

import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Loader2, Bot, MessageCircle, Zap, Package } from 'lucide-react';
import api from '../../../lib/api';

interface Rule {
  keyword: string;
  reply: string;
}

interface Config {
  prompt: string;
  isActive: boolean;
  rules: Rule[];
  greetingEnabled: boolean;
  greetingMessage: string;
}

const PACKAGES = [
  {
    id: 'WHATSAPP_BOT',
    name: 'WhatsApp Bot',
    desc: 'Keyword auto-replies + welcome greeting. No AI required.',
    color: '#5254f8',
  },
  {
    id: 'AI_AUTOMATION',
    name: 'AI Automation',
    desc: 'Smart AI replies using our platform AI. Responds to any message intelligently.',
    color: '#10b981',
  },
  {
    id: 'FULL',
    name: 'Full Package',
    desc: 'Everything: keyword rules, welcome greeting, and AI automation.',
    color: '#f59e0b',
  },
];

const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
  <div onClick={onChange} style={{ width: '44px', height: '24px', borderRadius: '12px', background: value ? 'var(--accent-primary)' : 'var(--bg-tertiary)', border: `1px solid ${value ? 'var(--accent-primary)' : 'var(--border-color)'}`, position: 'relative', cursor: 'pointer', transition: 'var(--transition-fast)', flexShrink: 0 }}>
    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: value ? '22px' : '2px', transition: 'var(--transition-fast)' }} />
  </div>
);

export default function AutomationSettings() {
  const [config, setConfig] = useState<Config>({ prompt: '', isActive: false, rules: [], greetingEnabled: false, greetingMessage: 'Thanks for contacting us! We will get back to you shortly.' });
  const [selectedPackage, setSelectedPackage] = useState('WHATSAPP_BOT');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusOk, setStatusOk] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/ai/config'),
      api.get('/auth/me'),
    ]).then(([cfg, me]) => {
      const d = cfg.data;
      setConfig({ prompt: d.prompt || '', isActive: d.isActive || false, rules: Array.isArray(d.rules) ? d.rules : [], greetingEnabled: d.greetingEnabled || false, greetingMessage: d.greetingMessage || 'Thanks for contacting us! We will get back to you shortly.' });
      setSelectedPackage(me.data.businesses?.[0]?.selectedPackage || 'WHATSAPP_BOT');
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const saveConfig = async () => {
    setSaving(true);
    setStatusMsg('');
    try {
      await Promise.all([
        api.post('/ai/config', config),
        api.patch('/auth/package', { selectedPackage }),
      ]);
      setStatusMsg('Settings saved!');
      setStatusOk(true);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch {
      setStatusMsg('Failed to save settings.');
      setStatusOk(false);
    } finally {
      setSaving(false);
    }
  };

  const addRule = () => setConfig({ ...config, rules: [...config.rules, { keyword: '', reply: '' }] });
  const removeRule = (i: number) => { const r = [...config.rules]; r.splice(i, 1); setConfig({ ...config, rules: r }); };
  const updateRule = (i: number, key: keyof Rule, val: string) => { const r = [...config.rules]; r[i][key] = val; setConfig({ ...config, rules: r }); };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>;

  const aiEnabled = selectedPackage === 'AI_AUTOMATION' || selectedPackage === 'FULL';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '6px' }}>Automation</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Configure your WhatsApp automation settings.</p>
        </div>
        <button onClick={saveConfig} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-primary)', color: 'white', fontWeight: '600', opacity: saving ? 0.7 : 1, flexShrink: 0 }}>
          {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {statusMsg && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '24px', background: statusOk ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: statusOk ? 'var(--success)' : 'var(--error)', border: `1px solid ${statusOk ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
          {statusMsg}
        </div>
      )}

      {/* ─── Package Selection ─── */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(245,158,11,0.1)', padding: '8px', borderRadius: 'var(--radius-sm)' }}><Package size={20} color="var(--warning)" /></div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Package</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Choose the features you want to use.</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {PACKAGES.map(pkg => (
            <button key={pkg.id} onClick={() => setSelectedPackage(pkg.id)} style={{ textAlign: 'left', padding: '16px', borderRadius: 'var(--radius-md)', border: `2px solid ${selectedPackage === pkg.id ? pkg.color : 'var(--border-color)'}`, background: selectedPackage === pkg.id ? `${pkg.color}11` : 'var(--bg-tertiary)', transition: 'var(--transition-fast)' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: selectedPackage === pkg.id ? pkg.color : 'var(--text-primary)', marginBottom: '6px' }}>{pkg.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{pkg.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Welcome Greeting ─── */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(16,185,129,0.1)', padding: '8px', borderRadius: 'var(--radius-sm)' }}><MessageCircle size={20} color="var(--success)" /></div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Welcome Greeting</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sent automatically when someone messages you for the first time.</p>
          </div>
          <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }}>
            <span style={{ fontSize: '13px', color: config.greetingEnabled ? 'var(--success)' : 'var(--text-muted)' }}>{config.greetingEnabled ? 'Enabled' : 'Disabled'}</span>
            <Toggle value={config.greetingEnabled} onChange={() => setConfig({ ...config, greetingEnabled: !config.greetingEnabled })} />
          </label>
        </div>
        <textarea value={config.greetingMessage} onChange={e => setConfig({ ...config, greetingMessage: e.target.value })} rows={3} disabled={!config.greetingEnabled}
          style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: config.greetingEnabled ? 'var(--bg-tertiary)' : 'rgba(255,255,255,0.02)', color: config.greetingEnabled ? 'var(--text-primary)' : 'var(--text-muted)', outline: 'none', resize: 'vertical', opacity: config.greetingEnabled ? 1 : 0.5 }}
          placeholder="Thanks for contacting us! We'll get back to you shortly." />
      </div>

      {/* ─── AI Assistant ─── */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px', opacity: aiEnabled ? 1 : 0.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(37, 211, 102,0.1)', padding: '8px', borderRadius: 'var(--radius-sm)' }}><Bot size={20} color="var(--accent-primary)" /></div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '600' }}>AI Assistant</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {aiEnabled ? 'Powered by our platform AI — no API key needed.' : 'Upgrade to AI Automation or Full Package to enable.'}
            </p>
          </div>
          {aiEnabled && (
            <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }}>
              <span style={{ fontSize: '13px', color: config.isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}>{config.isActive ? 'Active' : 'Off'}</span>
              <Toggle value={config.isActive} onChange={() => setConfig({ ...config, isActive: !config.isActive })} />
            </label>
          )}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>System Prompt</label>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Tell the AI who it is, what you offer, and how to behave.</p>
          <textarea value={config.prompt} onChange={e => setConfig({ ...config, prompt: e.target.value })} rows={7} disabled={!aiEnabled}
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
            placeholder="You are a helpful sales assistant. We sell..." />
        </div>
      </div>

      {/* ─── Keyword Rules ─── */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(245,158,11,0.1)', padding: '8px', borderRadius: 'var(--radius-sm)' }}><Zap size={20} color="var(--warning)" /></div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Keyword Auto-Replies</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>When a message contains a keyword, send an instant fixed reply.</p>
          </div>
          <button onClick={addRule} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'white', fontWeight: '500', fontSize: '13px', flexShrink: 0 }}>
            <Plus size={14} /> Add Rule
          </button>
        </div>

        {config.rules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '14px' }}>No keyword rules yet. Add one above.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {config.rules.map((rule, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input value={rule.keyword} onChange={e => updateRule(idx, 'keyword', e.target.value)} placeholder="Keyword (e.g. PRICE)"
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }} />
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', flexShrink: 0 }}>→</div>
                <input value={rule.reply} onChange={e => updateRule(idx, 'reply', e.target.value)} placeholder="Reply message"
                  style={{ flex: 2, padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }} />
                <button onClick={() => removeRule(idx)} style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.1)', color: 'var(--error)', flexShrink: 0 }}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
