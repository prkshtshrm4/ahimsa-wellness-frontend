import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import PhoneOtpForm from '../components/PhoneOtpForm.jsx';
import { c, font, s } from '../theme.js';
import { Logo, Toast } from '../components/ui.jsx';
import { useState } from 'react';

export default function StaffLogin() {
  const { signInWithToken } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  function routeFor(me) {
    if (me?.type !== 'staff') {
      setToast('This number is not registered for staff access.');
      return;
    }
    const mods = me.staff?.grantedModules || [];
    if (mods.includes('bookings.read')) navigate('/admin/today');
    else if (mods.includes('services.manage')) navigate('/admin/services');
    else if (mods.includes('staff.manage')) navigate('/admin/staff');
    else if (mods.includes('schedule.own')) navigate('/admin/schedule');
    else navigate('/');
  }

  async function onSuccess({ token, user }) {
    setToast(null);
    const me = await signInWithToken(token, { user, asPatient: false });
    routeFor(me);
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 66px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {toast && <Toast tone="error" onClose={() => setToast(null)}>{toast}</Toast>}
      <div className="ah-rise" style={{ maxWidth: 420, width: '100%' }}>
        <div style={{ ...s.cardBox, padding: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <Logo size={56} showWord sub="STAFF WORKSPACE" />
          </div>
          <h1 style={{ fontFamily: font.serif, fontWeight: 500, fontSize: 22, margin: '4px 0 4px', textAlign: 'center' }}>
            Staff sign in
          </h1>
          <p style={{ fontSize: 13, color: c.muted, textAlign: 'center', margin: '0 0 22px', lineHeight: 1.5 }}>
            Accounts are invite-only. Sign in with your registered mobile number.
          </p>
          <PhoneOtpForm onSuccess={onSuccess} onError={setToast} submitLabel="Sign in" />
        </div>
      </div>
    </div>
  );
}
