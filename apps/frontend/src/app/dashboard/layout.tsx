"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = Cookies.get('profy_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  if (!mounted) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '260px', borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '40px' }} className="gradient-text">KP WhatsApp Automation</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '10px 16px', background: pathname === '/dashboard' ? 'rgba(37, 211, 102, 0.1)' : 'transparent', color: pathname === '/dashboard' ? 'var(--accent-primary)' : 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', fontWeight: '500', transition: 'var(--transition-fast)' }}>
              Connect WhatsApp
            </div>
          </Link>
          <Link href="/dashboard/settings" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '10px 16px', background: pathname === '/dashboard/settings' ? 'rgba(37, 211, 102, 0.1)' : 'transparent', color: pathname === '/dashboard/settings' ? 'var(--accent-primary)' : 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', fontWeight: '500', transition: 'var(--transition-fast)' }}>
              Automation
            </div>
          </Link>
          <Link href="/dashboard/logs" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '10px 16px', background: pathname === '/dashboard/logs' ? 'rgba(37, 211, 102, 0.1)' : 'transparent', color: pathname === '/dashboard/logs' ? 'var(--accent-primary)' : 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', fontWeight: '500', transition: 'var(--transition-fast)' }}>
              Inbox
            </div>
          </Link>
          <Link href="/dashboard/invite" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '10px 16px', background: pathname === '/dashboard/invite' ? 'rgba(37, 211, 102, 0.1)' : 'transparent', color: pathname === '/dashboard/invite' ? 'var(--accent-primary)' : 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', fontWeight: '500', transition: 'var(--transition-fast)' }}>
              Invite Friends
            </div>
          </Link>
        </nav>
        <div style={{ position: 'absolute', bottom: '24px' }}>
          <button onClick={() => { Cookies.remove('profy_token'); router.push('/'); }} style={{ color: 'var(--error)', padding: '10px 16px', cursor: 'pointer', fontWeight: '500' }}>
            Logout
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}
