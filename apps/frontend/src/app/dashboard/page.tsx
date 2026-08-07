"use client";

import { useEffect, useRef, useState } from 'react';
import { Smartphone, CheckCircle, Loader2, AlertTriangle, RefreshCw, QrCode, KeyRound } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Cookies from 'js-cookie';
import api from '../../lib/api';

type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'QR_READY' | 'PAIRING_CODE_READY' | 'CONNECTED' | 'FAILED';
type LinkMethod = 'phone' | 'qr';

// Country dial codes for the "Link with phone number" picker. ISO code drives
// the flag emoji; `dial` is prepended to the national number the user types.
const COUNTRIES: { name: string; iso: string; dial: string }[] = [
  { name: 'Uganda', iso: 'UG', dial: '256' },
  { name: 'Kenya', iso: 'KE', dial: '254' },
  { name: 'Tanzania', iso: 'TZ', dial: '255' },
  { name: 'Rwanda', iso: 'RW', dial: '250' },
  { name: 'Burundi', iso: 'BI', dial: '257' },
  { name: 'South Sudan', iso: 'SS', dial: '211' },
  { name: 'DR Congo', iso: 'CD', dial: '243' },
  { name: 'Nigeria', iso: 'NG', dial: '234' },
  { name: 'Ghana', iso: 'GH', dial: '233' },
  { name: 'South Africa', iso: 'ZA', dial: '27' },
  { name: 'Ethiopia', iso: 'ET', dial: '251' },
  { name: 'Egypt', iso: 'EG', dial: '20' },
  { name: 'Cameroon', iso: 'CM', dial: '237' },
  { name: 'Zambia', iso: 'ZM', dial: '260' },
  { name: 'Zimbabwe', iso: 'ZW', dial: '263' },
  { name: 'United States', iso: 'US', dial: '1' },
  { name: 'United Kingdom', iso: 'GB', dial: '44' },
  { name: 'Canada', iso: 'CA', dial: '1' },
  { name: 'India', iso: 'IN', dial: '91' },
  { name: 'United Arab Emirates', iso: 'AE', dial: '971' },
  { name: 'Saudi Arabia', iso: 'SA', dial: '966' },
  { name: 'Germany', iso: 'DE', dial: '49' },
  { name: 'France', iso: 'FR', dial: '33' },
  { name: 'Netherlands', iso: 'NL', dial: '31' },
  { name: 'Australia', iso: 'AU', dial: '61' },
  { name: 'China', iso: 'CN', dial: '86' },
  { name: 'Brazil', iso: 'BR', dial: '55' },
];

// Turn an ISO-3166 alpha-2 code into its flag emoji (regional indicators).
const flagOf = (iso: string) =>
  iso.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

interface ConnectionState {
  status: ConnectionStatus;
  reason?: string;
  qr?: string | null;
  pairingCode?: string | null;
  method?: LinkMethod;
}

export default function Dashboard() {
  const [state, setState] = useState<ConnectionState>({ status: 'DISCONNECTED' });
  const [loading, setLoading] = useState(true);
  // Surface a server-unreachable problem to the user instead of swallowing it.
  const [connError, setConnError] = useState(false);
  // Avoid overlapping requests when a poll is still in flight.
  const inFlight = useRef(false);
  // Remember that we showed a QR, so that a later QR-less CONNECTING means the
  // phone scanned and we're linking — not that we're still generating a code.
  const [sawQr, setSawQr] = useState(false);
  // Same idea for pairing: once the code has been shown, a code-less CONNECTING
  // means the user typed it and WhatsApp is linking — not that we're back at
  // the start. Without this the number form reappeared mid-link.
  // Both are state, not refs: they pick which panel renders.
  const [sawPairingCode, setSawPairingCode] = useState(false);
  // How the user is linking. Phone-number pairing is the default: most users
  // are on a phone, where there's no second screen to scan from, and the code
  // doesn't rotate out from under them the way a QR does.
  const [method, setMethod] = useState<LinkMethod>('phone');
  const [dialCode, setDialCode] = useState('256'); // default Uganda
  const [phoneInput, setPhoneInput] = useState('');
  const [requestingCode, setRequestingCode] = useState(false);
  const [startingQr, setStartingQr] = useState(false);

  // Full international number: country dial code + national number, digits only,
  // with any local trunk "0" prefix dropped (e.g. UG 0700… -> 256700…).
  const fullNumber = `${dialCode}${phoneInput.replace(/\D/g, '').replace(/^0+/, '')}`;

  const apply = (data: ConnectionState) => {
    if (data.status === 'QR_READY' && data.qr) setSawQr(true);
    if (data.status === 'PAIRING_CODE_READY' && data.pairingCode) setSawPairingCode(true);
    if (data.status === 'CONNECTED' || data.status === 'FAILED') {
      setSawQr(false);
      setSawPairingCode(false);
    }
    // Follow the server once it's actually showing something, so the visible tab
    // always matches the attempt that's running. Only these two states are
    // definitive — syncing on CONNECTING would fight the user mid-switch.
    if (data.method && (data.status === 'QR_READY' || data.status === 'PAIRING_CODE_READY')) {
      setMethod(data.method);
    }
    setState({
      status: data.status,
      reason: data.reason,
      qr: data.qr ?? null,
      pairingCode: data.pairingCode ?? null,
      method: data.method,
    });
    setConnError(false);
    setLoading(false);
  };

  // "Link with phone number": ask the backend for an 8-char code to type into
  // WhatsApp. Sidesteps the camera/QR-rotation issues entirely.
  const submitPhone = async () => {
    if (!Cookies.get('profy_token')) return;
    if (fullNumber.length < 8) return;
    setRequestingCode(true);
    try {
      const res = await api.post('/whatsapp/pairing-code', { phoneNumber: fullNumber });
      apply(res.data);
    } catch (e) {
      console.warn('Pairing-code request failed.', e);
      setConnError(true);
    } finally {
      setRequestingCode(false);
    }
  };

  // The QR flow only starts when it's asked for — polling no longer spawns one.
  const startQr = async () => {
    if (!Cookies.get('profy_token')) return;
    setStartingQr(true);
    setSawQr(false);
    setSawPairingCode(false);
    try {
      const res = await api.post('/whatsapp/qr');
      apply(res.data);
    } catch (e) {
      console.warn('QR request failed; will keep polling.', e);
      setConnError(true);
    } finally {
      setStartingQr(false);
    }
  };

  // Switching tabs switches the live attempt too, so the panel on screen is
  // always backed by a socket in the same mode. Picking QR kicks one off;
  // picking phone leaves the form until they submit a number.
  const chooseMethod = (id: LinkMethod) => {
    if (id === method) return;
    setMethod(id);
    if (id === 'qr') startQr();
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
      // A failed poll usually means the server briefly restarted. Use warn (not
      // console.error) so Next's dev overlay doesn't pop a scary error box for a
      // transient blip we already recover from on the next tick.
      console.warn('WhatsApp status poll failed; will retry.', e);
      // Always give feedback: tell the user we lost contact with the server, and
      // drop any QR we were showing — once the server restarts it issues a fresh
      // code, and scanning the old (now-dead) one is exactly what fails silently.
      setConnError(true);
      setSawQr(false);
      setState((prev) => ({ ...prev, qr: null }));
      setLoading(false);
    } finally {
      inFlight.current = false;
    }
  };

  useEffect(() => {
    poll();
    // Poll every 2s so the on-screen QR stays close to Baileys' current one —
    // Baileys rotates the code and scanning a stale one silently fails.
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { status, reason, qr, pairingCode } = state;
  const isConnected = status === 'CONNECTED';
  const isFailed = status === 'FAILED';
  // Caption for the in-progress (no-QR-yet) states, so the user is never left
  // guessing. After a scan the backend reconnects with no QR — say so.
  const progressCaption = (!isFailed && reason) || (sawQr
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
        ) : (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Connect Your WhatsApp</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '420px' }}>
                Enter your WhatsApp number and we&apos;ll give you a code to type into the app. Prefer to scan? Switch to the QR code.
              </p>
            </div>

            {/* A failed attempt is reported inline, never as a takeover screen —
                the method toggle has to stay reachable so the user can switch
                to (or retry) the other flow instead of being stuck. */}
            {isFailed && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px', textAlign: 'left',
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger, #ef4444)',
                color: 'var(--danger, #ef4444)', padding: '12px 16px',
                borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '14px',
                maxWidth: '460px',
              }}>
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{reason || 'Something went wrong while connecting to WhatsApp.'}</span>
              </div>
            )}

            {/* Method toggle */}
            <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '4px', marginBottom: '28px', gap: '4px' }}>
              {([
                { id: 'phone' as const, label: 'Use phone number', Icon: KeyRound },
                { id: 'qr' as const, label: 'Scan QR code', Icon: QrCode },
              ]).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => chooseMethod(id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: 600,
                    background: method === id ? 'var(--accent-primary)' : 'transparent',
                    color: method === id ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>

            {method === 'qr' ? (
              <>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '24px', fontSize: '14px' }}>
                  On your phone: WhatsApp &gt; Linked Devices &gt; Link a Device, then point it at this screen.
                </p>
                <div style={{ background: 'white', padding: '24px', borderRadius: 'var(--radius-md)', display: 'inline-block' }}>
                  {connError ? (
                    <div style={{ width: '256px', height: '256px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
                      <Loader2 size={48} color="var(--bg-primary)" style={{ animation: 'spin 1.2s linear infinite' }} />
                      <span style={{ color: 'var(--bg-primary)', fontSize: '14px' }}>
                        Reconnecting to server… a fresh code will appear shortly.
                      </span>
                    </div>
                  ) : startingQr || loading || (status === 'CONNECTING' && !qr) ? (
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
                      <span style={{ color: 'var(--text-muted)' }}>No QR code right now</span>
                      <button onClick={startQr} style={{ color: 'var(--accent-primary)', fontWeight: '500' }}>
                        Generate one
                      </button>
                    </div>
                  )}
                </div>
                {status === 'QR_READY' && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '16px' }}>
                    The code refreshes automatically — scan it as soon as it appears.
                  </p>
                )}
              </>
            ) : status === 'PAIRING_CODE_READY' && pairingCode ? (
              /* Code is ready — show it big with instructions. */
              <div style={{ maxWidth: '420px' }}>
                <div style={{
                  fontSize: '40px', fontWeight: 700, letterSpacing: '6px',
                  fontFamily: 'monospace', background: 'var(--bg-secondary)',
                  padding: '20px 24px', borderRadius: 'var(--radius-md)', marginBottom: '20px',
                  color: 'var(--text-primary)', userSelect: 'all',
                }}>
                  {pairingCode}
                </div>
                <ol style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, paddingLeft: '20px' }}>
                  <li>Open WhatsApp on your phone.</li>
                  <li>Tap <strong>Linked Devices</strong> &gt; <strong>Link a Device</strong>.</li>
                  <li>Tap <strong>Link with phone number instead</strong>.</li>
                  <li>Enter the code above.</li>
                </ol>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '16px' }}>
                  Waiting for you to enter the code… this updates automatically once linked.
                </p>
              </div>
            ) : sawPairingCode && !isFailed ? (
              /* Code was entered — WhatsApp is linking. Don't drop the user back
                 to an empty form while that happens. */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px 0' }}>
                <Loader2 size={48} color="var(--accent-primary)" style={{ animation: 'spin 1.2s linear infinite' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Code accepted — linking your account…
                </span>
              </div>
            ) : (
              /* Phone-number entry form. */
              <div style={{ maxWidth: '380px', width: '100%' }}>
                <label style={{ display: 'block', textAlign: 'left', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                  WhatsApp phone number
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <select
                    value={dialCode}
                    onChange={(e) => setDialCode(e.target.value)}
                    aria-label="Country"
                    style={{
                      flex: '0 0 auto', maxWidth: '140px', padding: '12px 8px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border, #d1d5db)', background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)', fontSize: '15px', cursor: 'pointer',
                    }}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={`${c.iso}-${c.dial}`} value={c.dial}>
                        {flagOf(c.iso)} {c.name} (+{c.dial})
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') submitPhone(); }}
                    placeholder="700123456"
                    style={{
                      flex: 1, minWidth: 0, padding: '12px 14px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border, #d1d5db)', background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)', fontSize: '15px',
                    }}
                  />
                </div>
                {phoneInput.replace(/\D/g, '') && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px', textAlign: 'left' }}>
                    Will link: <strong>+{fullNumber}</strong>
                  </p>
                )}
                <button
                  onClick={submitPhone}
                  disabled={requestingCode || fullNumber.length < 8}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%',
                    background: 'var(--accent-primary)', color: '#fff', fontWeight: 600,
                    padding: '12px 24px', borderRadius: 'var(--radius-md)',
                    opacity: (requestingCode || fullNumber.length < 8) ? 0.6 : 1,
                    cursor: (requestingCode || fullNumber.length < 8) ? 'default' : 'pointer',
                  }}
                >
                  {requestingCode
                    ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Generating code…</>
                    : isFailed
                      ? <><RefreshCw size={18} /> Try again</>
                      : <>Get pairing code</>}
                </button>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '12px', textAlign: 'left' }}>
                  Pick your country, then type your number without the leading 0.
                </p>
              </div>
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
