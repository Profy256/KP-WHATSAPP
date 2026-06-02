"use client";

import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { adminApi } from '@/lib/adminApi';

const COLORS = ['#5254f8', '#10b981', '#f59e0b', '#ef4444', '#8254f8', '#06b6d4'];

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
    <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>{title}</h3>
    {children}
  </div>
);

const tooltipStyle = { background: '#1c1c1f', border: '1px solid #27272a', borderRadius: '8px', color: '#ededef' };

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [signups, setSignups] = useState<any[]>([]);
  const [messages, setMessages] = useState<{ incoming: any[]; outgoing: any[] }>({ incoming: [], outgoing: [] });
  const [sources, setSources] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminApi.getSignupSeries(days),
      adminApi.getMessageSeries(days),
      adminApi.getSourceBreakdown(),
      adminApi.getPackageDistribution(),
      adminApi.getReferralSeries(days),
    ]).then(([s, m, src, pkg, ref]) => {
      setSignups(s.data);
      setMessages(m.data);
      setSources(src.data);
      setPackages(pkg.data);
      setReferrals(ref.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [days]);

  // Merge incoming+outgoing into one series for the chart
  const msgSeries = messages.incoming.map((d: any, i: number) => ({
    date: d.date.slice(5), // MM-DD
    incoming: d.count,
    outgoing: messages.outgoing[i]?.count ?? 0,
  }));

  const signupSeries = signups.map((d: any) => ({ date: d.date.slice(5), signups: d.count }));
  const referralSeries = referrals.map((d: any) => ({ date: d.date.slice(5), referrals: d.count }));

  const DaySelector = () => (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
      {[7, 14, 30, 60].map(d => (
        <button key={d} onClick={() => setDays(d)} style={{
          padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '500',
          background: days === d ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
          color: days === d ? '#fff' : 'var(--text-secondary)',
          border: '1px solid var(--border-color)',
        }}>{d}d</button>
      ))}
    </div>
  );

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Loading analytics...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>Analytics</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '14px' }}>Product metrics and growth trends</p>

      <DaySelector />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* User Signups */}
        <Card title={`User Signups (last ${days} days)`}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={signupSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: '#a0a0a5', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#a0a0a5', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="signups" fill="#5254f8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Message Volume */}
        <Card title={`Message Volume (last ${days} days)`}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={msgSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: '#a0a0a5', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#a0a0a5', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Line type="monotone" dataKey="incoming" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="outgoing" stroke="#5254f8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Referrals */}
        <Card title={`Referrals (last ${days} days)`}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={referralSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: '#a0a0a5', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#a0a0a5', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="referrals" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Package Distribution */}
        <Card title="Package Distribution">
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <ResponsiveContainer width="60%" height={220}>
              <PieChart>
                <Pie data={packages} dataKey="count" nameKey="package" cx="50%" cy="50%" outerRadius={80} label={({ package: pkg, percent }) => `${pkg} ${(percent * 100).toFixed(0)}%`}>
                  {packages.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {packages.map((p: any, i: number) => (
                <div key={p.package} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{p.package}</span>
                  <span style={{ fontWeight: '600' }}>{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Message Source Breakdown */}
      <Card title="Message Source Breakdown">
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {sources.map((s: any, i: number) => (
            <div key={s.source} style={{ flex: 1, minWidth: '120px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS[i % COLORS.length] }}>{s.count.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.source}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
