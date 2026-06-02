"use client";

import Link from 'next/link';
import type { DeveloperProfile } from '@/lib/developer';

export default function ContactClient({ profile }: { profile: DeveloperProfile }) {
  const waLink = (msg: string) => `https://wa.me/${profile.whatsapp}?text=${encodeURIComponent(msg)}`;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Nav */}
      <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
        <Link href="/" style={{ fontSize: '16px', fontWeight: '700' }} className="gradient-text">KP WhatsApp Automation</Link>
        <Link href="/login" style={{ padding: '8px 20px', background: 'var(--accent-primary)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: '600' }}>Get Started</Link>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 40px' }}>

        {/* Hero */}
        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', marginBottom: '56px' }}>
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.name} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: '700', flexShrink: 0 }}>
              {profile.name.charAt(0)}
            </div>
          )}
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>{profile.title}</div>
            <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '12px', lineHeight: '1.1' }}>{profile.name}</h1>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: '1.6', maxWidth: '500px' }}>{profile.bio}</p>
          </div>
        </div>

        {/* Contact Cards */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Get In Touch</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
            Need a custom plan, white-label setup, or enterprise integration? Reach out directly — I&apos;ll respond within 24 hours.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <a href={`mailto:${profile.email}`} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textDecoration: 'none', transition: 'border-color 0.15s' }}
              onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
              onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(37, 211, 102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>✉️</div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>Email</div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>{profile.email}</div>
              </div>
            </a>
            <a href={waLink(`Hi ${profile.name}, I found you via KP WhatsApp Automation and I'd like to discuss a custom offer.`)} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textDecoration: 'none', transition: 'border-color 0.15s' }}
              onMouseOver={e => (e.currentTarget.style.borderColor = '#25d366')}
              onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(37,211,102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>📱</div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>WhatsApp</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#25d366' }}>{profile.phone}</div>
              </div>
            </a>
            <a href={`tel:${profile.phone}`}
              style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textDecoration: 'none', transition: 'border-color 0.15s' }}
              onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--warning)')}
              onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>📞</div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>Phone / Call</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--warning)' }}>{profile.phone}</div>
              </div>
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(37, 211, 102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🌍</div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>Location</div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>{profile.location}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Services */}
        {profile.services.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Custom Services</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {profile.services.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '14px', padding: '16px 20px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '22px', flexShrink: 0 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '3px' }}>{s.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {profile.skills.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Skills & Technologies</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {profile.skills.map((s, i) => (
                <span key={i} style={{ padding: '6px 14px', background: 'rgba(37, 211, 102,0.1)', border: '1px solid rgba(37, 211, 102,0.2)', borderRadius: '100px', fontSize: '13px', color: 'var(--accent-primary)' }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {profile.projects.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Featured Projects</h2>
            {profile.projects.map((p, i) => (
              <div key={i} style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{p.name}</h3>
                  {p.link && <Link href={p.link} style={{ fontSize: '13px', color: 'var(--accent-primary)', padding: '4px 12px', background: 'rgba(37, 211, 102,0.1)', borderRadius: 'var(--radius-sm)' }}>View →</Link>}
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '14px' }}>{p.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {p.tech.map((t, j) => <span key={j} style={{ padding: '3px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '100px', fontSize: '11px', color: 'var(--text-secondary)' }}>{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '10px' }}>Ready to Work Together?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Send a message on WhatsApp for the fastest response.</p>
          <a href={waLink(`Hi ${profile.name}, I'd like to discuss a custom offer for KP WhatsApp Automation.`)} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', background: '#25d366', color: '#fff', borderRadius: 'var(--radius-sm)', fontWeight: '700', fontSize: '15px', textDecoration: 'none' }}>
            💬 Message on WhatsApp
          </a>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', padding: '24px 40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
        © @profy 2026 · {profile.name} · <Link href="/" style={{ color: 'var(--accent-primary)' }}>KP WhatsApp Automation</Link>
      </div>
    </div>
  );
}
