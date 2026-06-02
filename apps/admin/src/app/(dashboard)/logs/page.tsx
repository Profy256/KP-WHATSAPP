"use client";

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/adminApi';

const sourceColor: Record<string, string> = {
  CUSTOMER: '#a0a0a5',
  AI: '#5254f8',
  RULE: '#10b981',
  SYSTEM: '#f59e0b',
};

export default function AdminLogsPage() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.getLogs(page, 50, direction ? { direction } : undefined)
      .then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [page, direction]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>Message Logs</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>{data?.total?.toLocaleString() ?? 0} messages across all businesses</p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {['', 'INCOMING', 'OUTGOING'].map(d => (
          <button key={d} onClick={() => { setDirection(d); setPage(1); }} style={{
            padding: '6px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: '500',
            background: direction === d ? 'var(--accent-primary)' : 'var(--bg-secondary)',
            color: direction === d ? '#fff' : 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
          }}>{d || 'All'}</button>
        ))}
      </div>

      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              {['Business', 'Contact', 'Direction', 'Source', 'Message', 'Time'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</td></tr>
            ) : data?.logs?.map((log: any) => (
              <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500' }}>{log.business?.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.business?.user?.email}</div>
                </td>
                <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{log.remoteJid.split('@')[0]}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '100px', background: log.direction === 'INCOMING' ? 'rgba(16,185,129,0.1)' : 'rgba(37, 211, 102,0.1)', color: log.direction === 'INCOMING' ? 'var(--success)' : 'var(--accent-primary)' }}>
                    {log.direction === 'INCOMING' ? '↓ IN' : '↑ OUT'}
                  </span>
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: sourceColor[log.source] ?? '#a0a0a5' }}>{log.source}</span>
                </td>
                <td style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--text-primary)', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.content}</td>
                <td style={{ padding: '10px 16px', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
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
