import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { signInWithGoogle } from '../firebase.js';
import PhoneOtpForm from '../components/PhoneOtpForm.jsx';
import { c, font, s } from '../theme.js';
import { Logo, Toast } from '../components/ui.jsx';

export default function Login() {
  const { signInWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dest = location.state?.from || '/dashboard';
  const [tab, setTab] = useState('phone');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  async function afterAuth(me, user) {
    if (me?.type === 'staff') {
      setToast('This number is registered for staff. Use Staff sign in.');
      return;
    }
    if (me?.patient?.needsPhoneLink && user?.email && !user?.phoneNumber) {
      navigate('/link-phone', { state: { from: dest } });
      return;
    }
    navigate(dest);
  }

  async function google() {
    try {
      setBusy(true);
      setToast(null);
      const { token, user } = await signInWithGoogle();
      const me = await signInWithToken(token, { user, asPatient: true });
      await afterAuth(me, user);
    } catch {
      setToast('Google sign-in was cancelled or failed.');
    } finally {
      setBusy(false);
    }
  }

  async function onPhoneSuccess({ token, user }) {
    setToast(null);
    const me = await signInWithToken(token, { user, asPatient: true });
    await afterAuth(me, user);
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 66px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {toast && <Toast tone="error" onClose={() => setToast(null)}>{toast}</Toast>}
      <div className="ah-rise" style={{ ...s.cardBox, maxWidth: 420, width: '100%', padding: 34 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Logo size={64} />
        </div>
        <div style={{ fontSize: 12, letterSpacing: '.14em', color: c.sage, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
          WELCOME BACK
        </div>
        <h1 style={{ fontFamily: font.serif, fontWeight: 500, fontSize: 26, margin: '0 0 6px', textAlign: 'center' }}>
          Sign in to your account
        </h1>
        <p style={{ fontSize: 13.5, color: c.muted, margin: '0 0 22px', textAlign: 'center' }}>
          View bookings, invoices and upcoming sessions.
        </p>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {[
            { id: 'phone', label: 'Mobile OTP' },
            { id: 'google', label: 'Google' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 9,
                border: `1px solid ${tab === t.id ? c.teal : c.line}`,
                background: tab === t.id ? c.greenSoft : '#fff',
                fontWeight: 600,
                fontSize: 13,
                color: tab === t.id ? c.teal : c.bodyText,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'phone' ? (
          <PhoneOtpForm onSuccess={onPhoneSuccess} onError={setToast} submitLabel="Sign in" />
        ) : (
          <button onClick={google} disabled={busy} style={{ ...s.btnGhost, width: '100%', padding: 13 }}>
            <span style={{ fontWeight: 700, color: '#4285F4' }}>G</span> &nbsp;Continue with Google
          </button>
        )}
      </div>
    </div>
  );
}
