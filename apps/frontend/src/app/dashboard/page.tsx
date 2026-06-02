"use client";

import { useEffect, useRef, useState } from 'react';
import { Smartphone, CheckCircle, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Cookies from 'js-cookie';
import api from '../../lib/api';

type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'QR_READY' | 'CONNECTED' | 'FAILED';

interface ConnectionState {
  status: ConnectionStatus;
  reason?: string;
  qr?: string | null;
}

export default function Dashboard() {
  const [state, setState] = useState<ConnectionState>({ status: 'CONNECTING' });
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  // Surface a server-unreachable problem to the user instead of swallowing it.
  const [connError, setConnError] = useState(false);
  // Avoid overlapping requests when a poll is still in flight.
  const inFlight = useRef(false);
  // Remember that we showed a QR, so that a later QR-less CONNECTING means the
  // phone scanned and we're linking — not that we're still generating a code.
  const sawQr = useRef(false);

  const apply = (data: ConnectionState) => {
    if (data.status === 'QR_READY' && data.qr) sawQr.current = true;
    if (data.status === 'CONNECTED' || data.status === 'FAILED') sawQr.current = false;
    setState({ status: data.status, reason: data.reason, qr: data.qr ?? null });
    setConnError(false);
    setLoading(false);
  };

  // Single source of truth: /qr returns the full connection state (status,
  // reason and the freshest QR). Polling it keeps the displayed QR valid —
  // Baileys rotates it, and scanning a stale code silently fails.
  const poll = async () => {
    if (!Cookies.get('profy_token') || inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await api.get('/whatsapp/qr');
      apply(res.data);
    } catch (e) {
      console.error(e);
      // Always give feedback: tell the user we lost contact with the server.
      setConnError(true);
      setLoading(false);
    } finally {
      inFlight.current = false;
    }
  };

  const retry = async () => {
    if (!Cookies.get('profy_token')) return;
    setRetrying(true);
    setLoading(true);
    sawQr.current = false;
    try {
      const res = await api.post('/whatsapp/retry');
      apply(res.data);
    } catch (e) {
      console.error(e);
      setConnError(true);
    } finally {
      setRetrying(false);
    }
  };

  useEffect(() => {
    poll();
    // Poll every 4s so the on-screen QR is always close to Baileys' current one.
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { status, reason, qr } = state;
  const isConnected = status === 'CONNECTED';
  const isFailed = status === 'FAILED';
  // Caption for the in-progress (non-QR) states, so the user is never left
  // guessing. After a scan the backend reconnects with no QR — say so.
  const progressCaption = reason || (sawQr.current
    ? 'QR scanned — linking your account…'
    : 'Generating QR code…');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>WhatsApp Connection</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Link your WhatsApp Business account to enable AI automation.</p>
      </div>

      {connError && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--warning, #f59e0b)',
          color: 'var(--warning, #f59e0b)', padding: '12px 16px',
          borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '14px',
        }}>
          <AlertTriangle size={18} />
          Can&apos;t reach the server right now — retrying automatically…
        </div>
      )}

      <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        {isConnected ? (
          <>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
              <CheckCircle size={64} color="var(--success)" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Successfully Connected</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
              Your WhatsApp account is securely connected. KP WhatsApp Automation is ready to handle your incoming messages based on your AI settings.
            </p>
          </>
        ) : isFailed ? (
          <>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
              <AlertTriangle size={64} color="var(--danger, #ef4444)" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Connection Failed</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: '24px' }}>
              {reason || 'Something went wrong while connecting to WhatsApp.'}
            </p>
            <button
              onClick={retry}
              disabled={retrying}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'var(--accent-primary)', color: '#fff', fontWeight: 600,
                padding: '12px 24px', borderRadius: 'var(--radius-md)',
                opacity: retrying ? 0.7 : 1, cursor: retrying ? 'default' : 'pointer',
              }}
            >
              <RefreshCw size={18} className={retrying ? 'animate-spin' : ''} style={retrying ? { animation: 'spin 1s linear infinite' } : undefined} />
              {retrying ? 'Reconnecting...' : 'Try Again'}
            </button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Scan to Connect</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
                Open WhatsApp on your phone, tap Menu &gt; Linked Devices &gt; Link a Device, and point your phone at this screen.
              </p>
            </div>

            <div style={{ background: 'white', padding: '24px', borderRadius: 'var(--radius-md)', display: 'inline-block' }}>
              {loading || (status === 'CONNECTING' && !qr) ? (
                <div style={{ width: '256px', height: '256px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
                  <Loader2 size={48} color="var(--bg-primary)" style={{ animation: 'spin 1.2s linear infinite' }} />
                  <span style={{ color: 'var(--bg-primary)', fontSize: '14px' }}>
                    {progressCaption}
                  </span>
                </div>
              ) : qr ? (
                <QRCodeSVG value={qr} size={256} />
              ) : (
                <div style={{ width: '256px', height: '256px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                  <Smartphone size={48} color="var(--text-muted)" />
                  <span style={{ color: 'var(--text-muted)' }}>QR Code Unavailable</span>
                  <button onClick={retry} style={{ color: 'var(--accent-primary)', fontWeight: '500' }}>Retry</button>
                </div>
              )}
            </div>

            {status === 'QR_READY' && (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '16px' }}>
                The code refreshes automatically — scan it as soon as it appears.
              </p>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
