"use client";

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/adminApi';

const PKG_COLORS: Record<string, string> = {
  WHATSAPP_BOT: '#5254f8',
  AI_AUTOMATION: '#10b981',
  FULL: '#f59e0b',
};

export default function AdminUsersPage() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.getUsers(page, 20, search || undefined)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const toggleAdmin = async (userId: string, current: boolean) => {
    await adminApi.updateUser(userId, { isAdmin: !current });
    load();
  };

  const deleteUser = async (userId: string) => {
    await adminApi.deleteUser(userId);
    setConfirm(null);
    load();
  };

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>Users</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
        {data?.total ?? 0} total users
      </p>

      {/* Search */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input
          placeholder="Search by email or name..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: 1, padding: '9px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
        />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              {['User', 'Package', 'Session', 'Referrals', 'Joined', 'Admin', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</td></tr>
            ) : data?.users?.map((u: any) => {
              const biz = u.businesses?.[0];
              const pkg = biz?.selectedPackage ?? 'WHATSAPP_BOT';
              const sessionStatus = biz?.session?.status;
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '500', fontSize: '14px' }}>{u.name || '—'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '100px', background: `${PKG_COLORS[pkg]}22`, color: PKG_COLORS[pkg] }}>{pkg.replace('_', ' ')}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {sessionStatus ? (
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '100px', background: sessionStatus === 'CONNECTED' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)', color: sessionStatus === 'CONNECTED' ? 'var(--success)' : 'var(--error)' }}>
                        {sessionStatus}
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No session</span>}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>{u._count?.referrals ?? 0}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => toggleAdmin(u.id, u.isAdmin)} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '100px', background: u.isAdmin ? 'rgba(82,84,248,0.15)' : 'var(--bg-tertiary)', color: u.isAdmin ? 'var(--accent-primary)' : 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                      {u.isAdmin ? 'Admin' : 'User'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {confirm === u.id ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => deleteUser(u.id)} style={{ fontSize: '12px', padding: '4px 10px', background: 'var(--error)', color: '#fff', borderRadius: 'var(--radius-sm)' }}>Confirm</button>
                        <button onClick={() => setConfirm(null)} style={{ fontSize: '12px', padding: '4px 10px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirm(u.id)} style={{ fontSize: '12px', padding: '4px 10px', background: 'rgba(239,68,68,0.1)', color: 'var(--error)', borderRadius: 'var(--radius-sm)' }}>Delete</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
