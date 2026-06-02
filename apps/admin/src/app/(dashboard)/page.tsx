"use client";

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';

const StatCard = ({ label, value, sub, color = 'var(--accent-primary)' }: any) => (
  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px 24px' }}>
    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{label}</div>
    <div style={{ fontSize: '28px', fontWeight: '700', color }}>{value ?? '—'}</div>
    {sub && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{sub}</div>}
  </div>
);

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats().then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>Overview</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '14px' }}>Platform-wide stats at a glance</p>

      {/* Users */}
      <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Users</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <StatCard label="Total Users" value={stats?.users?.total} />
        <StatCard label="New Today" value={stats?.users?.today} color="var(--success)" />
        <StatCard label="Last 7 Days" value={stats?.users?.last7d} color="var(--success)" />
        <StatCard label="Last 30 Days" value={stats?.users?.last30d} />
      </div>

      {/* Messages */}
      <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Messages</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <StatCard label="Total Messages" value={stats?.messages?.total?.toLocaleString()} />
        <StatCard label="Messages Today" value={stats?.messages?.today} color="var(--success)" />
        <StatCard label="Messages (7d)" value={stats?.messages?.last7d} />
      </div>

      {/* Platform */}
      <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Platform</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <StatCard label="Businesses" value={stats?.businesses?.total} />
        <StatCard
          label="WA Sessions"
          value={`${stats?.sessions?.connected ?? 0} / ${stats?.sessions?.total ?? 0}`}
          sub={`${stats?.sessions?.disconnected ?? 0} disconnected`}
          color="var(--success)"
        />
        <StatCard label="Total Contacts" value={stats?.contacts?.total?.toLocaleString()} />
        <StatCard label="Active AI Configs" value={stats?.ai?.activeConfigs} color="var(--accent-primary)" />
      </div>

      {/* Referrals */}
      <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Growth</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        <StatCard label="Total Referrals" value={stats?.referrals?.total} color="var(--warning)" />
        <StatCard
          label="Connection Rate"
          value={stats?.sessions?.total ? `${Math.round((stats.sessions.connected / stats.sessions.total) * 100)}%` : '0%'}
          sub="Connected WhatsApp sessions"
        />
      </div>
    </div>
  );
}
