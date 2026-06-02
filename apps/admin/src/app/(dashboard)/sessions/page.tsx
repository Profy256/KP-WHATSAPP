"use client";

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/adminApi';

const statusColor = (s: string) => {
  if (s === 'CONNECTED') return { bg: 'rgba(16,185,129,0.15)', color: 'var(--success)' };
  if (s === 'CONNECTING') return { bg: 'rgba(245,158,11,0.15)', color: 'var(--warning)' };
  return { bg: 'rgba(239,68,68,0.1)', color: 'var(--error)' };
};

export default function AdminSessionsPage() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.getSessions(page).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const connected = data?.sessions?.filter((s: any) => s.status === 'CONNECTED').length ?? 0;
  const total = data?.total ?? 0;

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>WhatsApp Sessions</h1>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <span style={{ fontSize: '14px', color: 'var(--success)' }}>● {connected} Connected</span>
        <span style={{ fontSize: '14px', color: 'var(--error)' }}>● {total - connected} Disconnected</span>
        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{total} total</span>
      </div>

      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              {['Business', 'Owner', 'Status', 'WhatsApp ID', 'Signal Keys', 'Last Updated'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</td></tr>
            ) : data?.sessions?.map((s: any) => {
              const sc = statusColor(s.status);
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', fontSize: '14px' }}>{s.business?.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '13px' }}>{s.business?.user?.name || '—'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.business?.user?.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '100px', background: sc.bg, color: sc.color }}>{s.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{s.whatsappId || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text-secondary)' }}>{s._count?.keys ?? 0}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(s.updatedAt).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px' }}>Prev</button>
          <span style={{ padding: '6px 14px', color: 'var(--text-secondary)', fontSize: '13px' }}>Page {page} of {data.pages}</span>
          <button disabled={page === data.pages} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px' }}>Next</button>
        </div>
      )}
    </div>
  );
}
