"use client";

import Link from 'next/link';
import { MessageCircle, Zap, Bot, BarChart3, Shield, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'AI-Powered Replies',
    desc: 'Let AI handle customer questions 24/7 with intelligent, context-aware responses.',
  },
  {
    icon: Zap,
    title: 'Instant Automation',
    desc: 'Set keyword rules to trigger instant replies — no coding required.',
  },
  {
    icon: MessageCircle,
    title: 'Unified Inbox',
    desc: 'Monitor every conversation in one place and jump in when needed.',
  },
  {
    icon: BarChart3,
    title: 'Message Logs',
    desc: 'Full history of every AI and manual reply for audit and improvement.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    desc: 'Your WhatsApp session and credentials are encrypted and stored safely.',
  },
  {
    icon: CheckCircle,
    title: 'Multi-Provider AI',
    desc: 'Choose from OpenAI, Anthropic, Gemini, DeepSeek, or OpenRouter.',
  },
];

const steps = [
  { num: '01', title: 'Create an account', desc: 'Sign up in seconds — no credit card required.' },
  { num: '02', title: 'Connect WhatsApp', desc: 'Scan a QR code to link your WhatsApp Business number.' },
  { num: '03', title: 'Configure your AI', desc: 'Add your AI API key, write a prompt, and set automation rules.' },
  { num: '04', title: 'Go live', desc: 'Your AI starts responding to customers automatically.' },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'rgba(10,10,11,0.85)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <span style={{ fontSize: '20px', fontWeight: '700' }} className="gradient-text">KP WhatsApp Automation</span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/contact">
            <button style={{ padding: '8px 20px', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '14px' }}>
              Contact Developer
            </button>
          </Link>
          <Link href="/login">
            <button style={{ padding: '8px 20px', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '14px' }}>
              Sign in
            </button>
          </Link>
          <Link href="/login?mode=signup">
            <button style={{ padding: '8px 20px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-primary)', color: '#fff', fontWeight: '600', fontSize: '14px' }}>
              Get started free
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '100px 24px 80px', maxWidth: '760px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '100px', border: '1px solid rgba(37, 211, 102,0.4)', background: 'rgba(37, 211, 102,0.08)', fontSize: '13px', color: 'var(--accent-primary)', marginBottom: '32px' }}>
          <Zap size={13} />
          AI-powered WhatsApp automation
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: '800', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '24px' }}>
          Turn WhatsApp into your{' '}
          <span className="gradient-text">24/7 sales agent</span>
        </h1>
        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '40px', maxWidth: '560px', margin: '0 auto 40px' }}>
          Connect your WhatsApp Business number, configure AI responses, and let your business reply to customers automatically — even while you sleep.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login?mode=signup">
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-primary)', color: '#fff', fontWeight: '600', fontSize: '15px' }}>
              Start for free <ArrowRight size={16} />
            </button>
          </Link>
          <Link href="#how-it-works">
            <button style={{ padding: '14px 28px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '15px' }}>
              See how it works
            </button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 48px', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: '700', marginBottom: '12px' }}>Everything you need</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '56px' }}>
          One platform to automate, monitor, and grow your WhatsApp business.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(37, 211, 102,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Icon size={20} color="var(--accent-primary)" />
              </div>
              <h3 style={{ fontWeight: '600', marginBottom: '8px', fontSize: '16px' }}>{title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding: '80px 48px', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: '700', marginBottom: '12px' }}>Up and running in minutes</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '56px' }}>No technical setup. No coding. Just connect and go.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {steps.map((step, i) => (
            <div key={step.num} style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
              <div style={{ minWidth: '48px', height: '48px', borderRadius: '50%', background: 'rgba(37, 211, 102,0.1)', border: '1px solid rgba(37, 211, 102,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', fontWeight: '700', fontSize: '14px' }}>
                {step.num}
              </div>
              <div style={{ paddingTop: '8px' }}>
                <h3 style={{ fontWeight: '600', marginBottom: '4px' }}>{step.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div style={{ position: 'absolute', left: '71px', marginTop: '56px', width: '1px', height: '24px', background: 'var(--border-color)' }} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '16px' }}>Ready to automate?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Join businesses that never miss a WhatsApp lead again.
          </p>
          <Link href="/login?mode=signup">
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-primary)', color: '#fff', fontWeight: '600', fontSize: '15px' }}>
              Create your free account <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '24px 48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
        © @profy 2026 · KP WhatsApp Automation. All rights reserved.
      </footer>
    </div>
  );
}
