"use client";

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/adminApi';

const PACKAGES = ['WHATSAPP_BOT', 'AI_AUTOMATION', 'FULL'];
const PKG_COLORS: Record<string, string> = {
  WHATSAPP_BOT: '#5254f8',
  AI_AUTOMATION: '#10b981',
  FULL: '#f59e0b',
};

export default function AdminBusinessesPage() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editPkg, setEditPkg] = useState<{ id: string; value: string } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.getBusinesses(page, 20, search || undefined)
      .then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const savePkg = async () => {
    if (!editPkg) return;
    await adminApi.updateBusiness(editPkg.id, { selectedPackage: editPkg.value });
    setEditPkg(null);
    load();
  };

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>Businesses</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>{data?.total ?? 0} businesses</p>

      <input placeholder="Search business name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
        style={{ width: '320px', padding: '9px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', marginBottom: '20px' }} />

      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              {['Business', 'Owner', 'Package', 'Session', 'Messages', 'Contacts', 'Created'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</td></tr>
            ) : data?.businesses?.map((b: any) => {
              const pkg = b.selectedPackage;
              const isEditing = editPkg?.id === b.id;
              return (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', fontSize: '14px' }}>{b.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '13px' }}>{b.user?.name || '—'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.user?.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <select value={editPkg.value} onChange={e => setEditPkg({ ...editPkg, value: e.target.value })}
                          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', fontSize: '12px' }}>
                          {PACKAGES.map(p => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
                        </select>
                        <button onClick={savePkg} style={{ fontSize: '11px', padding: '4px 10px', background: 'var(--success)', color: '#fff', borderRadius: 'var(--radius-sm)' }}>Save</button>
                        <button onClick={() => setEditPkg(null)} style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-tertiary)', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '100px', background: `${PKG_COLORS[pkg]}22`, color: PKG_COLORS[pkg] }}>{pkg.replace('_', ' ')}</span>
                        <button onClick={() => setEditPkg({ id: b.id, value: pkg })} style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '2px 6px' }}>Edit</button>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {b.session ? (
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '100px', background: b.session.status === 'CONNECTED' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)', color: b.session.status === 'CONNECTED' ? 'var(--success)' : 'var(--error)' }}>
                        {b.session.status}
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>None</span>}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>{b._count?.messageLogs ?? 0}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>{b._count?.contacts ?? 0}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>{new Date(b.createdAt).toLocaleDateString()}</td>
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
