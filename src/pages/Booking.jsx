import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../api.js';
import { useAuth } from '../auth.jsx';
import { signInWithGoogle } from '../firebase.js';
import { payAndVerify } from '../payments.js';
import { c, font, s, rupees } from '../theme.js';
import { nextCentreDays } from '../utils/dates.js';
import { Spinner, Toast, Logo } from '../components/ui.jsx';
import PhoneInput from '../components/PhoneInput.jsx';
import { toLocalDigits, toE164, isValidIndianMobile } from '../utils/phone.js';

const STEP_LABELS = ['Therapy', 'Time', 'Details', 'Review & pay'];

export default function Booking() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { isPatient, patient, signInWithToken, refresh } = useAuth();

  const [services, setServices] = useState(null);
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(params.get('service') || '');
  const days = useMemo(() => nextCentreDays(7), []);
  const [date, setDate] = useState(days[0].id);
  const [slots, setSlots] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', age: '', reason: '' });
  const [payMode, setPayMode] = useState('now');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [done, setDone] = useState(null); // { booking, paid }
  const [phoneLookup, setPhoneLookup] = useState(null);

  const service = services?.find((s) => s._id === serviceId);

  useEffect(() => {
    api.get('/services', { auth: false }).then((d) => setServices(d.services)).catch(() => setServices([]));
  }, []);

  useEffect(() => {
    if (isPatient && patient)
      setForm((f) => ({
        ...f,
        name: f.name || patient.name || '',
        phone: f.phone || toLocalDigits(patient.phone || ''),
      }));
  }, [isPatient, patient]);

  useEffect(() => {
    if (!isValidIndianMobile(form.phone) || isPatient) {
      setPhoneLookup(null);
      return;
    }
    const timer = setTimeout(() => {
      api
        .get(`/auth/check-phone?phone=${encodeURIComponent(toE164(form.phone))}`, { auth: false })
        .then(setPhoneLookup)
        .catch(() => setPhoneLookup(null));
    }, 400);
    return () => clearTimeout(timer);
  }, [form.phone, isPatient]);

  // Load availability whenever we land on the Time step / change service or date.
  useEffect(() => {
    if (step !== 1 || !serviceId) return;
    setSlots(null);
    setStartTime('');
    api
      .get(`/services/${serviceId}/availability?date=${date}`, { auth: false })
      .then((d) => setSlots(d.slots))
      .catch(() => setSlots([]));
  }, [step, serviceId, date]);

  const grouped = useMemo(() => {
    if (!services) return [];
    const map = new Map();
    for (const svc of services) {
      if (!map.has(svc.category)) map.set(svc.category, []);
      map.get(svc.category).push(svc);
    }
    return [...map.entries()].map(([cat, items]) => ({ cat, items }));
  }, [services]);

  const canNext =
    (step === 0 && serviceId) ||
    (step === 1 && startTime) ||
    (step === 2 && form.name.trim() && isValidIndianMobile(form.phone));

  async function googleSignIn() {
    try {
      setBusy(true);
      const { token, user } = await signInWithGoogle();
      const me = await signInWithToken(token, { user, asPatient: true });
      if (me?.patient?.needsPhoneLink && user?.email && !user?.phoneNumber) {
        navigate('/link-phone', { state: { from: '/book' } });
        return;
      }
      setForm((f) => ({
        ...f,
        name: f.name || me?.patient?.name || user.displayName || '',
        phone: f.phone || toLocalDigits(me?.patient?.phone || user.phoneNumber || ''),
      }));
    } catch {
      setToast({ tone: 'error', msg: 'Google sign-in was cancelled or is not configured for this domain.' });
    } finally {
      setBusy(false);
    }
  }

  async function confirmBooking() {
    setBusy(true);
    setToast(null);
    try {
      const res = await api.post(
        '/bookings',
        {
          serviceId,
          date,
          startTime,
          patientDetails: { name: form.name, phone: toE164(form.phone), reason: form.reason },
          paymentMode: payMode,
          source: 'web',
        },
        { auth: isPatient }
      );

      if (payMode === 'now' && res.payment) {
        await payAndVerify({ booking: res.booking, payment: res.payment, prefill: { ...form, phone: toE164(form.phone) }, auth: isPatient });
        setDone({ booking: res.booking, paid: true });
      } else {
        setDone({ booking: res.booking, paid: false });
      }
      if (isPatient) refresh();
      setStep(4);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'slot_unavailable') {
        setToast({ tone: 'amber', msg: 'That time just filled up — please pick another slot.' });
        setStep(1);
      } else if (e.message === 'payment_dismissed') {
        setToast({ tone: 'amber', msg: 'Payment window closed. Your slot is still held for a few minutes.' });
      } else {
        setToast({ tone: 'error', msg: e.message || 'Something went wrong. Please try again.' });
      }
    } finally {
      setBusy(false);
    }
  }

  if (!services) return <Spinner center />;

  const heading = ['Choose your therapy', 'Pick a time', 'Your details', 'Review & pay', "You're booked"][step];
  const showSummary = step >= 1 && step <= 3 && service;

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '34px 30px 80px' }} className="ah-fade">
      {toast && <Toast tone={toast.tone} onClose={() => setToast(null)}>{toast.msg}</Toast>}

      {isPatient && step < 4 && (
        <div style={{ marginBottom: 16, fontSize: 13, color: c.greenText, background: c.greenSoft, border: `1px solid ${c.greenBorder}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>✓</span>
          Signed in as {patient?.name} — this booking will be saved to your account.
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 22 }}>
        <div>
          <div style={{ ...s.eyebrow, marginBottom: 6 }}>BOOK A SESSION</div>
          <h1 style={s.h1}>{heading}</h1>
        </div>
        {step < 4 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STEP_LABELS.map((label, i) => (
              <div
                key={label}
                onClick={() => i < step && setStep(i)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '7px 12px',
                  borderRadius: 8,
                  cursor: i < step ? 'pointer' : 'default',
                  color: i === step ? c.teal : i < step ? c.greenText : c.mutedWarm,
                  background: i === step ? c.greenSoft : 'transparent',
                  border: `1px solid ${i === step ? c.greenBorder : 'transparent'}`,
                }}
              >
                <span style={{ opacity: 0.7 }}>{i + 1}</span> {label}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showSummary ? 'minmax(0,1fr) 300px' : '1fr', gap: 24, alignItems: 'start' }}>
        <div style={{ minWidth: 0 }}>
          {step === 0 && (
            <ServiceStep
              grouped={grouped}
              serviceId={serviceId}
              onPick={(id) => {
                setServiceId(id);
                setStep(1);
              }}
            />
          )}

          {step === 1 && (
            <TimeStep service={service} days={days} date={date} setDate={setDate} slots={slots} startTime={startTime} setStartTime={setStartTime} />
          )}

          {step === 2 && (
            <DetailsStep
              form={form}
              setForm={setForm}
              isPatient={isPatient}
              busy={busy}
              phoneLookup={phoneLookup}
              onGoogle={googleSignIn}
              onSignIn={() => navigate('/login', { state: { from: '/book' } })}
            />
          )}

          {step === 3 && (
            <ReviewStep service={service} date={date} startTime={startTime} form={form} payMode={payMode} setPayMode={setPayMode} busy={busy} onConfirm={confirmBooking} />
          )}

          {step === 4 && done && (
            <Confirmed
              done={done}
              service={service}
              date={date}
              startTime={startTime}
              isPatient={isPatient}
              onDashboard={() => navigate(isPatient ? '/dashboard' : '/login', isPatient ? undefined : { state: { from: '/dashboard' } })}
              onAnother={() => {
                setDone(null);
                setStep(0);
                setServiceId('');
                setStartTime('');
              }}
            />
          )}

          {step < 3 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
              {step > 0 ? (
                <button onClick={() => setStep(step - 1)} style={s.btnGhost}>← Back</button>
              ) : (
                <div />
              )}
              <button
                onClick={() => canNext && setStep(step + 1)}
                disabled={!canNext}
                style={{ ...s.btnPrimary, opacity: canNext ? 1 : 0.45, cursor: canNext ? 'pointer' : 'not-allowed', padding: '12px 26px' }}
              >
                Continue →
              </button>
            </div>
          )}

          {step === 3 && (
            <div style={{ marginTop: 20 }}>
              <button onClick={() => setStep(step - 1)} style={s.btnGhost}>← Back</button>
            </div>
          )}
        </div>

        {showSummary && <SummaryCard service={service} date={date} startTime={startTime} />}
      </div>
    </div>
  );
}

/* ─── Step 0: service selection ────────────────────────────────────────── */
function ServiceStep({ grouped, serviceId, onPick }) {
  return (
    <div className="ah-fade">
      {grouped.map((grp) => (
        <div key={grp.cat} style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, letterSpacing: '.14em', fontWeight: 700, color: '#9AA29C', marginBottom: 10 }}>{grp.cat}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(232px,1fr))', gap: 12 }}>
            {grp.items.map((svc) => {
              const active = svc._id === serviceId;
              return (
                <div
                  key={svc._id}
                  onClick={() => onPick(svc._id)}
                  className="ah-card-hover"
                  style={{
                    background: active ? c.greenSoft : '#fff',
                    border: `1px solid ${active ? c.teal : c.border}`,
                    borderRadius: 12,
                    padding: 16,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontFamily: font.serif, fontSize: 17, fontWeight: 500, lineHeight: 1.2 }}>{svc.name}</div>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: `1.5px solid ${active ? c.teal : c.line}`,
                        background: active ? c.teal : 'transparent',
                        color: '#fff',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {active ? '✓' : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: c.muted, margin: '7px 0 14px', lineHeight: 1.4 }}>{svc.blurb}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: c.teal }}>₹{rupees(svc.priceInPaise)}</div>
                    <div style={{ fontSize: 11, color: c.mutedWarm }}>{svc.durationMin} min</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Step 1: time selection ───────────────────────────────────────────── */
function TimeStep({ service, days, date, setDate, slots, startTime, setStartTime }) {
  return (
    <div className="ah-fade" style={{ ...s.cardBox }}>
      <div style={{ fontFamily: font.serif, fontSize: 18, marginBottom: 4 }}>Choose a day</div>
      <div style={{ fontSize: 12, color: c.muted, marginBottom: 14 }}>
        {service?.name} · {service?.durationMin} min · with {service?.therapistName}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
        {days.map((d) => {
          const active = d.id === date;
          return (
            <div
              key={d.id}
              onClick={() => setDate(d.id)}
              style={{
                textAlign: 'center',
                padding: '8px 12px',
                borderRadius: 10,
                cursor: 'pointer',
                minWidth: 54,
                background: active ? c.teal : '#fff',
                color: active ? c.ivory : c.charcoal,
                border: `1px solid ${active ? c.teal : c.line}`,
              }}
            >
              <div style={{ fontSize: 10, letterSpacing: '.08em', opacity: 0.7 }}>{d.dow}</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{d.day}</div>
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1 }}>{d.mon}</div>
            </div>
          );
        })}
      </div>

      <div style={{ fontFamily: font.serif, fontSize: 16, marginBottom: 4 }}>Available times</div>
      <div style={{ fontSize: 11.5, color: c.mutedWarm, marginBottom: 14 }}>
        Only {service?.capacity} {service?.capacityUnit} — availability shown per slot.
      </div>

      {!slots ? (
        <Spinner center />
      ) : slots.length === 0 ? (
        <div style={{ fontSize: 13.5, color: c.muted, padding: '20px 0' }}>The centre is closed / nothing configured for this day.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
          {slots.map((sl) => {
            const full = sl.remaining <= 0;
            const low = sl.remaining === 1;
            const active = startTime === sl.startTime;
            return (
              <div
                key={sl.startTime}
                onClick={() => !full && setStartTime(sl.startTime)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  cursor: full ? 'not-allowed' : 'pointer',
                  background: active ? c.greenSoft : full ? '#F7F4EE' : '#fff',
                  border: `1px solid ${active ? c.teal : full ? c.border : c.line}`,
                  opacity: full ? 0.7 : 1,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 600, color: full ? c.mutedWarm : c.charcoal }}>{sl.startTime}</div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    marginTop: 3,
                    color: full ? c.dangerText : low ? c.amberText : c.greenText,
                  }}
                >
                  {full ? 'Fully booked' : `${sl.remaining} of ${service?.capacity} left`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Step 2: details + optional auth handoff ──────────────────────────── */
function DetailsStep({ form, setForm, isPatient, busy, phoneLookup, onGoogle, onSignIn }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div className="ah-fade">
      {phoneLookup?.exists && !isPatient && (
        <div style={{ marginBottom: 12, fontSize: 13, color: c.bodyText, background: '#FFF9EE', border: '1px solid #F0E4C8', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span>
            Welcome back, <strong>{phoneLookup.firstName}</strong>!
            {phoneLookup.hasAccount ? ' Sign in to attach this booking to your account.' : ' We have your details on file from a previous visit.'}
          </span>
          {phoneLookup.hasAccount && (
            <button type="button" onClick={onSignIn} style={{ ...s.btnGhost, padding: '7px 12px', fontSize: 12.5, whiteSpace: 'nowrap' }}>
              Sign in
            </button>
          )}
        </div>
      )}
      <div style={s.cardBox}>
        <div style={{ fontFamily: font.serif, fontSize: 18, marginBottom: 2 }}>Your details</div>
        <div style={{ fontSize: 12, color: c.muted, marginBottom: 18 }}>So our therapist can prepare for your visit. Nothing here is shared.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
          <label style={{ ...s.label, gridColumn: '1 / -1' }}>Full name
            <input value={form.name} onChange={set('name')} placeholder="e.g. Rajesh Malhotra" style={s.input} />
          </label>
          <label style={s.label}>Mobile number
            <PhoneInput value={form.phone} onChange={(digits) => setForm((f) => ({ ...f, phone: digits }))} />
            {form.phone && !isValidIndianMobile(form.phone) && (
              <span style={{ fontSize: 11, color: c.dangerText, marginTop: 4, display: 'block' }}>
                Enter a valid 10-digit mobile number
              </span>
            )}
          </label>
          <label style={s.label}>Age
            <input value={form.age} onChange={set('age')} placeholder="Optional" style={s.input} />
          </label>
          <label style={{ ...s.label, gridColumn: '1 / -1' }}>
            Reason for visit / condition <span style={{ color: c.mutedWarm, fontWeight: 400 }}>(optional)</span>
            <textarea value={form.reason} onChange={set('reason')} rows={2} placeholder="e.g. chronic lower-back stiffness, managing stress…" style={{ ...s.input, resize: 'vertical' }} />
          </label>
        </div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12, color: c.muted, background: '#F5F7F2', border: '1px solid #E6EDE4', borderRadius: 9, padding: '11px 13px' }}>
          <span style={{ color: c.sage, fontSize: 14 }}>◈</span>
          <span>First-time visitors are asked to arrive 10 minutes early for a brief intake with our naturopath. No rush — we build in the time.</span>
        </div>
      </div>

      {!isPatient && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: `1px solid ${c.border}`, borderRadius: 12, padding: '14px 16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Save your bookings &amp; invoices</div>
            <div style={{ fontSize: 12, color: c.muted }}>Optional — sign in to keep everything in one place.</div>
          </div>
          <button type="button" onClick={onSignIn} style={{ ...s.btnGhost, padding: '9px 14px', fontSize: 13 }}>
            Sign in
          </button>
          <button type="button" onClick={onGoogle} disabled={busy} style={{ ...s.btnGhost, padding: '9px 14px', fontSize: 13 }}>
            <span style={{ fontWeight: 700, color: '#4285F4' }}>G</span> &nbsp;Google
          </button>
        </div>
      )}
      {isPatient && (
        <div style={{ marginTop: 12, fontSize: 12.5, color: c.greenText, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>✓</span> Your account details are pre-filled below.
        </div>
      )}
    </div>
  );
}

/* ─── Step 3: review & pay ─────────────────────────────────────────────── */
function ReviewStep({ service, date, startTime, form, payMode, setPayMode, busy, onConfirm }) {
  const methods = [
    { id: 'now', label: 'Pay now', sub: 'Secure card / UPI via Razorpay — confirms instantly.' },
    { id: 'atVisit', label: 'Pay when you arrive', sub: 'Reserve now, settle at the front desk on the day.' },
  ];
  return (
    <div className="ah-fade" style={s.cardBox}>
      <div style={{ fontFamily: font.serif, fontSize: 18, marginBottom: 14 }}>Review &amp; pay</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 20 }}>
        <Row label="Therapy" value={service?.name} />
        <Row label="When" value={slotLabel(date, startTime)} />
        <Row label="Name" value={form.name} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#59615f', marginBottom: 9 }}>How would you like to pay?</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {methods.map((m) => {
          const active = payMode === m.id;
          return (
            <div
              key={m.id}
              onClick={() => setPayMode(m.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, cursor: 'pointer', background: active ? c.greenSoft : '#fff', border: `1px solid ${active ? c.teal : c.line}` }}
            >
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${active ? c.teal : c.line}`, background: active ? c.teal : 'transparent', boxShadow: active ? 'inset 0 0 0 3px #fff' : 'none' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{m.label}</div>
                <div style={{ fontSize: 11.5, color: c.muted }}>{m.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={onConfirm} disabled={busy} style={{ ...s.btnPrimary, width: '100%', marginTop: 18, padding: 14, fontSize: 15, opacity: busy ? 0.6 : 1 }}>
        {busy ? 'Processing…' : payMode === 'now' ? `Pay ₹${rupees(service?.priceInPaise)} & confirm` : 'Reserve my slot'}
      </button>
      <div style={{ textAlign: 'center', fontSize: 11, color: c.mutedWarm, marginTop: 10 }}>
        Free cancellation up to 12 hours before · secured by Razorpay
      </div>
    </div>
  );
}

/* ─── Step 4: confirmation ─────────────────────────────────────────────── */
function Confirmed({ done, service, date, startTime, isPatient, onDashboard, onAnother }) {
  const paid = done.paid;
  return (
    <div className="ah-rise" style={{ background: '#fff', border: '1px solid #E6EDE4', borderRadius: 16, padding: '40px 30px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 80% at 50% -10%, #F1F6F1 0%, rgba(241,246,241,0) 60%)' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ margin: '0 auto 20px', width: 88, display: 'flex', justifyContent: 'center' }}>
          <Logo size={88} />
        </div>
        <div style={{ fontSize: 12, letterSpacing: '.14em', color: c.sage, fontWeight: 700, marginBottom: 8 }}>
          {paid ? 'PAYMENT CONFIRMED' : 'SLOT RESERVED'}
        </div>
        <h2 style={{ fontFamily: font.serif, fontWeight: 500, fontSize: 28, margin: '0 0 8px' }}>You're booked.</h2>
        <div style={{ fontSize: 14, color: c.muted, maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.5 }}>
          {paid
            ? 'We look forward to caring for you. A confirmation and invoice are in your account.'
            : 'Your slot is held. Please settle payment at the front desk when you arrive.'}
        </div>
        <div style={{ display: 'inline-block', textAlign: 'left', background: c.cardTint, border: `1px solid ${c.border}`, borderRadius: 12, padding: '18px 22px', minWidth: 300 }}>
          <MiniRow label="Service" value={service?.name} first />
          <MiniRow label="When" value={slotLabel(date, startTime)} />
          <MiniRow label="Therapist" value={service?.therapistName} />
          <MiniRow label="Booking ID" value={done.booking.reference} mono />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
          <button onClick={onDashboard} style={{ ...s.btnPrimary }}>
            {isPatient ? 'View my bookings' : 'Sign in to save this booking'}
          </button>
          <button onClick={onAnother} style={s.btnGhost}>Book another</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sticky summary sidebar ───────────────────────────────────────────── */
function SummaryCard({ service, date, startTime }) {
  return (
    <aside style={{ background: c.teal, color: '#EAF1EC', borderRadius: 14, padding: 22, position: 'sticky', top: 20 }}>
      <div style={{ fontSize: 11, letterSpacing: '.14em', color: c.sage, fontWeight: 700, marginBottom: 14 }}>YOUR SESSION</div>
      <div style={{ fontFamily: font.serif, fontSize: 22, color: c.ivory, lineHeight: 1.2 }}>{service?.name}</div>
      <div style={{ fontSize: 12.5, color: '#A9C4B7', marginTop: 6 }}>{service?.blurb}</div>
      <div style={{ height: 1, background: 'rgba(255,255,255,.12)', margin: '18px 0' }} />
      <SumRow label="Duration" value={`${service?.durationMin} min`} />
      <SumRow label="Therapist" value={service?.therapistName} />
      <SumRow label="Slot" value={startTime ? slotLabel(date, startTime) : '—'} />
      <div style={{ height: 1, background: 'rgba(255,255,255,.12)', margin: '18px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 13, color: '#A9C4B7' }}>Total</span>
        <span style={{ fontFamily: font.serif, fontSize: 26, color: c.gold }}>₹{rupees(service?.priceInPaise)}</span>
      </div>
      <div style={{ fontSize: 11, color: c.sage, marginTop: 14, lineHeight: 1.5 }}>Free cancellation up to 12 hours before your session.</div>
    </aside>
  );
}

function slotLabel(date, startTime) {
  if (!startTime) return '—';
  const d = new Date(`${date}T${startTime}:00`);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) + ` · ${to12h(startTime)}`;
}
function to12h(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ap}`;
}

const Row = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
    <span style={{ color: c.muted }}>{label}</span>
    <span style={{ fontWeight: 600 }}>{value}</span>
  </div>
);
const MiniRow = ({ label, value, first, mono }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 30, padding: '6px 0', fontSize: 13, borderTop: first ? 'none' : `1px solid ${c.borderSoft}` }}>
    <span style={{ color: c.muted }}>{label}</span>
    <span style={{ fontWeight: 600, fontVariantNumeric: mono ? 'tabular-nums' : 'normal' }}>{value}</span>
  </div>
);
const SumRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0' }}>
    <span style={{ color: '#A9C4B7' }}>{label}</span>
    <span>{value}</span>
  </div>
);
