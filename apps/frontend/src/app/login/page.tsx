"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { GoogleLogin } from '@react-oauth/google';
import api, { warmUp, authErrorMessage } from '../../lib/api';

function LoginForm() {
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slow, setSlow] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const referralCode = searchParams.get('ref') || '';

  useEffect(() => {
    const token = Cookies.get('profy_token');
    if (token) {
      router.replace('/dashboard');
    } else {
      setChecking(false);
      // Start the API's cold boot now, while the user is still typing, so the
      // submit below doesn't have to wait for it.
      warmUp();
    }
  }, [router]);

  // A slow submit is almost always the API waking up. Say so rather than
  // leaving the user staring at a spinner wondering if it's broken.
  useEffect(() => {
    if (!loading) {
      setSlow(false);
      return;
    }
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const payload = isLogin
        ? { email, password }
        : { email, password, name: 'User', businessName: 'My Business', referralCode: referralCode || undefined };
      const { data } = await api.post(endpoint, payload);
      Cookies.set('profy_token', data.token, { expires: 7 });
      router.replace('/dashboard');
    } catch (err: any) {
      setError(authErrorMessage(err, 'Authentication failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/google', {
        credential: credentialResponse.credential,
      });
      Cookies.set('profy_token', data.token, { expires: 7 });
      router.replace('/dashboard');
    } catch (err: any) {
      setError(authErrorMessage(err, 'Google sign-in failed'));
    } finally {
      setLoading(false);
    }
  };

  if (checking) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Nav */}
      <nav style={{ padding: '20px 48px', borderBottom: '1px solid var(--border-color)' }}>
        <Link href="/">
          <span style={{ fontSize: '18px', fontWeight: '700', cursor: 'pointer' }} className="gradient-text">
            KP WhatsApp Automation
          </span>
        </Link>
      </nav>

      {/* Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px', textAlign: 'center' }}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>
            {isLogin ? 'Sign in to your KP WhatsApp Automation account' : 'Start automating your WhatsApp business today'}
          </p>

          {error && (
            <div style={{ color: 'var(--error)', fontSize: '14px', marginBottom: '16px', textAlign: 'center', padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          {slow && !error && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px', textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              Waking up the server — this can take up to a minute on the first
              request. Please don&apos;t close this page.
            </div>
          )}

          {/* Google */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in failed. Please try again.')}
              theme="filled_black"
              shape="rectangular"
              size="large"
              width="320"
              text="continue_with"
            />
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>or continue with email</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          {/* Email / Password */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', outline: 'none', fontSize: '14px' }}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', outline: 'none', fontSize: '14px' }}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '11px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-primary)', color: 'white', fontWeight: '600', fontSize: '14px', marginTop: '4px', opacity: loading ? 0.7 : 1, transition: 'var(--transition-fast)' }}
            >
              {loading ? 'Please wait…' : (isLogin ? 'Sign in' : 'Create account')}
            </button>
          </form>

          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              style={{ color: 'var(--accent-primary)', fontWeight: '500' }}
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// useSearchParams() requires a Suspense boundary for static prerendering.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
