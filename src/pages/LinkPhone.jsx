import { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { startPhoneLink, completePhoneLink, resetRecaptcha } from '../firebase.js';
import PhoneInput from '../components/PhoneInput.jsx';
import { toE164, isValidIndianMobile } from '../utils/phone.js';
import { api, ApiError } from '../api.js';
import { c, font, s } from '../theme.js';
import { Logo, Toast } from '../components/ui.jsx';

export default function LinkPhone() {
  const { signInWithToken, refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dest = location.state?.from || '/dashboard';
  const [digits, setDigits] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [verificationId, setVerificationId] = useState(null);
  const recaptchaId = useRef(`link-recaptcha-${Math.random().toString(36).slice(2)}`);

  async function sendOtp() {
    if (!isValidIndianMobile(digits)) {
      setToast('Enter a valid 10-digit mobile number.');
      return;
    }
    setBusy(true);
    setToast(null);
    try {
      const vid = await startPhoneLink(toE164(digits), recaptchaId.current);
      setVerificationId(vid);
      setStep('otp');
    } catch (e) {
      setToast(e.message || 'Could not send OTP.');
      resetRecaptcha();
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (otp.length < 6) {
      setToast('Enter the 6-digit code.');
      return;
    }
    setBusy(true);
    setToast(null);
    try {
      const { token, user } = await completePhoneLink(verificationId, otp);
      await signInWithToken(token, { user, asPatient: true });
      await api.patch('/auth/link-phone', { phone: toE164(digits) });
      await refresh();
      navigate(dest);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'phone_in_use') {
        setToast('This number is already linked to another account.');
      } else {
        setToast('Incorrect code or link failed. Try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 66px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {toast && <Toast tone="error" onClose={() => setToast(null)}>{toast}</Toast>}
      <div className="ah-rise" style={{ ...s.cardBox, maxWidth: 420, width: '100%', padding: 34 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Logo size={56} />
        </div>
        <h1 style={{ fontFamily: font.serif, fontWeight: 500, fontSize: 24, margin: '0 0 6px', textAlign: 'center' }}>
          Link your mobile
        </h1>
        <p style={{ fontSize: 13.5, color: c.muted, margin: '0 0 22px', textAlign: 'center', lineHeight: 1.5 }}>
          So we can reach you about your bookings and match your visit history.
        </p>
        <div id={recaptchaId.current} />
        {step === 'phone' ? (
          <>
            <label style={s.label}>
              Mobile number
              <PhoneInput value={digits} onChange={setDigits} disabled={busy} />
            </label>
            <button
              type="button"
              onClick={sendOtp}
              disabled={busy || !isValidIndianMobile(digits)}
              style={{ ...s.btnPrimary, width: '100%', marginTop: 18, padding: 13, opacity: busy || !isValidIndianMobile(digits) ? 0.5 : 1 }}
            >
              {busy ? 'Sending…' : 'Send OTP'}
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, color: c.muted, margin: '0 0 14px' }}>
              Code sent to <strong>+91 {digits}</strong>
            </p>
            <label style={s.label}>
              Enter OTP
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                inputMode="numeric"
                style={{ ...s.input, marginTop: 6, letterSpacing: '0.2em', fontSize: 18 }}
              />
            </label>
            <button
              type="button"
              onClick={verify}
              disabled={busy || otp.length < 6}
              style={{ ...s.btnPrimary, width: '100%', marginTop: 16, padding: 13, opacity: busy || otp.length < 6 ? 0.5 : 1 }}
            >
              {busy ? 'Linking…' : 'Link number'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
