"use client";

import { useEffect, useState } from 'react';
import { Copy, Share2, MessageCircle, Link2, Users } from 'lucide-react';
import api from '../../../lib/api';

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://kpwhatsapp.com';

export default function InvitePage() {
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    api.get('/auth/me').then(r => setUser(r.data)).catch(() => {});
  }, []);

  const referralLink = user ? `${BASE_URL}/login?ref=${user.referralCode}` : '';

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(`Hey! I've been using KP WhatsApp Automation to automate my WhatsApp replies with AI. Join me here: ${referralLink}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const shareTelegram = () => {
    const msg = encodeURIComponent(`Automate your WhatsApp with AI: ${referralLink}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${msg}`, '_blank');
  };

  const shareTwitter = () => {
    const msg = encodeURIComponent(`Automate your WhatsApp replies with AI 🤖 — Check out KP WhatsApp Automation! ${referralLink}`);
    window.open(`https://twitter.com/intent/tweet?text=${msg}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'KP WhatsApp Automation', text: 'Automate your WhatsApp with AI!', url: referralLink });
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '6px' }}>Invite Friends</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>Share KP WhatsApp Automation with friends, clients, and on social media.</p>

      {/* Referral count */}
      {user && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
          <div style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--accent-primary)' }}>{user._count?.referrals ?? 0}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Friends Invited</div>
          </div>
          <div style={{ flex: 2, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Users size={16} color="var(--text-secondary)" />
              <span style={{ fontSize: '14px', fontWeight: '600' }}>Your Referral Code</span>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '15px', color: 'var(--accent-primary)', letterSpacing: '1px' }}>{user.referralCode}</div>
          </div>
        </div>
      )}

      {/* Referral Link */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Link2 size={18} color="var(--text-secondary)" />
          <span style={{ fontSize: '15px', fontWeight: '600' }}>Your Invite Link</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, padding: '11px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
            {referralLink || 'Loading...'}
          </div>
          <button onClick={() => copy(referralLink, 'link')} disabled={!referralLink}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '11px 16px', background: copied === 'link' ? 'var(--success)' : 'var(--accent-primary)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' }}>
            <Copy size={14} />
            {copied === 'link' ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Share on platforms */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Share2 size={18} color="var(--text-secondary)" />
          <span style={{ fontSize: '15px', fontWeight: '600' }}>Share On</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <button onClick={shareWhatsApp} disabled={!referralLink}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 'var(--radius-sm)', color: '#25d366', fontWeight: '600', fontSize: '14px' }}>
            <MessageCircle size={18} /> WhatsApp
          </button>
          <button onClick={shareTelegram} disabled={!referralLink}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(0,136,204,0.1)', border: '1px solid rgba(0,136,204,0.2)', borderRadius: 'var(--radius-sm)', color: '#0088cc', fontWeight: '600', fontSize: '14px' }}>
            <span style={{ fontSize: '16px' }}>✈️</span> Telegram
          </button>
          <button onClick={shareTwitter} disabled={!referralLink}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(29,161,242,0.1)', border: '1px solid rgba(29,161,242,0.2)', borderRadius: 'var(--radius-sm)', color: '#1da1f2', fontWeight: '600', fontSize: '14px' }}>
            <span style={{ fontSize: '16px' }}>𝕏</span> Twitter / X
          </button>
          <button onClick={shareFacebook} disabled={!referralLink}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(24,119,242,0.1)', border: '1px solid rgba(24,119,242,0.2)', borderRadius: 'var(--radius-sm)', color: '#1877f2', fontWeight: '600', fontSize: '14px' }}>
            <span style={{ fontSize: '16px' }}>f</span> Facebook
          </button>
        </div>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button onClick={shareNative} disabled={!referralLink}
            style={{ marginTop: '10px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '14px' }}>
            <Share2 size={16} /> More Options...
          </button>
        )}
      </div>

      {/* Share message */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Copy Share Message</div>
        <div style={{ padding: '14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '12px' }}>
          {`Hey! I've been using KP WhatsApp Automation to automate my WhatsApp replies with AI 🤖. You can set up keyword rules, a welcome greeting, and a full AI assistant that replies to customers automatically. Check it out: ${referralLink}`}
        </div>
        <button onClick={() => copy(`Hey! I've been using KP WhatsApp Automation to automate my WhatsApp replies with AI 🤖. You can set up keyword rules, a welcome greeting, and a full AI assistant that replies to customers automatically. Check it out: ${referralLink}`, 'msg')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: copied === 'msg' ? 'var(--success)' : 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: copied === 'msg' ? '#fff' : 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '500' }}>
          <Copy size={14} />
          {copied === 'msg' ? 'Copied!' : 'Copy Message'}
        </button>
      </div>
    </div>
  );
}
