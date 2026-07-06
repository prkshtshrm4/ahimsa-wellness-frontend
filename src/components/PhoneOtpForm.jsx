import { useEffect, useRef, useState } from 'react';
import { sendPhoneOtp, confirmPhoneOtp, resetRecaptcha } from '../firebase.js';
import { toE164 } from '../utils/phone.js';
import PhoneInput from './PhoneInput.jsx';
import { c, s } from '../theme.js';

/**
 * Phone OTP sign-in (or link) flow.
 * onSuccess({ token, user }) after OTP verified.
 */
export default function PhoneOtpForm({ onSuccess, onError, submitLabel = 'Verify & continue', linkMode = false }) {
  const [digits, setDigits] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // phone | otp
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const recaptchaId = useRef(`recaptcha-${Math.random().toString(36).slice(2)}`);

  useEffect(() => () => resetRecaptcha(), []);

  async function sendOtp() {
    const phone = toE164(digits);
    if (phone.length < 13) {
      onError?.('Enter a valid 10-digit mobile number.');
      return;
    }
    setBusy(true);
    try {
      resetRecaptcha();
      const conf = await sendPhoneOtp(phone, recaptchaId.current);
      setConfirmation(conf);
      setStep('otp');
    } catch (e) {
      onError?.(e.message || 'Could not send OTP. Check the number and try again.');
      resetRecaptcha();
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    if (!otp || otp.length < 6) {
      onError?.('Enter the 6-digit code.');
      return;
    }
    setBusy(true);
    try {
      const result = await confirmPhoneOtp(confirmation, otp);
      onSuccess(result);
    } catch (e) {
      onError?.('Incorrect code. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div id={recaptchaId.current} />
      {step === 'phone' ? (
        <>
          <label style={s.label}>
            Mobile number
            <PhoneInput value={digits} onChange={setDigits} disabled={busy} />
          </label>
          <p style={{ fontSize: 12, color: c.muted, margin: '10px 0 16px', lineHeight: 1.5 }}>
            {linkMode
              ? 'We will send a one-time code to link this number to your account.'
              : 'We will send a one-time code to verify your number.'}
          </p>
          <button
            type="button"
            onClick={sendOtp}
            disabled={busy || digits.length < 10}
            style={{ ...s.btnPrimary, width: '100%', padding: 13, opacity: busy || digits.length < 10 ? 0.5 : 1 }}
          >
            {busy ? 'Sending…' : 'Send OTP'}
          </button>
        </>
      ) : (
        <>
          <p style={{ fontSize: 13, color: c.muted, margin: '0 0 14px' }}>
            Code sent to <strong>+91 {digits}</strong>.{' '}
            <span onClick={() => { setStep('phone'); setOtp(''); resetRecaptcha(); }} style={{ color: c.teal, cursor: 'pointer', fontWeight: 600 }}>
              Change
            </span>
          </p>
          <label style={s.label}>
            Enter OTP
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              style={{ ...s.input, marginTop: 6, letterSpacing: '0.2em', fontSize: 18 }}
            />
          </label>
          <button
            type="button"
            onClick={verifyOtp}
            disabled={busy || otp.length < 6}
            style={{ ...s.btnPrimary, width: '100%', padding: 13, marginTop: 16, opacity: busy || otp.length < 6 ? 0.5 : 1 }}
          >
            {busy ? 'Verifying…' : submitLabel}
          </button>
        </>
      )}
    </div>
  );
}
