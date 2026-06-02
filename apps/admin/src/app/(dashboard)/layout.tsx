"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import api from '@/lib/api';

const NAV = [
  { href: '/', label: 'Overview', icon: '⬛' },
  { href: '/analytics', label: 'Analytics', icon: '📈' },
  { href: '/users', label: 'Users', icon: '👥' },
  { href: '/businesses', label: 'Businesses', icon: '🏢' },
  { href: '/sessions', label: 'WA Sessions', icon: '📱' },
  { href: '/logs', label: 'Message Logs', icon: '💬' },
  { href: '/contacts', label: 'Contacts', icon: '📋' },
  { href: '/ai-configs', label: 'AI & Platform', icon: '🤖' },
  { href: '/referrals', label: 'Referrals', icon: '🔗' },
  { href: '/developer-profile', label: 'Developer Profile', icon: '👤' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = Cookies.get('admin_token');
    if (!token) { router.push('/login'); return; }

    api.get('/auth/me').then(res => {
      if (!res.data.isAdmin) {
        Cookies.remove('admin_token');
        router.push('/login');
      } else {
        setReady(true);
      }
    }).catch(() => router.push('/login'));
  }, [router]);

  if (!ready) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '240px', borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '20px 0', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Admin Panel</div>
          <div style={{ fontSize: '15px', fontWeight: '700' }} className="gradient-text">KP WhatsApp</div>
        </div>

        <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV.map(item => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: active ? '600' : '400',
                  background: active ? 'rgba(37, 211, 102,0.15)' : 'transparent',
                  color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  transition: 'var(--transition-fast)',
                  borderLeft: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
                }}>
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={() => { Cookies.remove('admin_token'); router.push('/login'); }}
            style={{ width: '100%', textAlign: 'left', padding: '9px 12px', color: 'var(--error)', fontSize: '13px', borderRadius: 'var(--radius-sm)' }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ marginLeft: '240px', flex: 1, padding: '32px', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}
