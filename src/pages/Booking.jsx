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

function BookingProgress({ step, onStepClick }) {
  return (
    <div className="ah-booking-progress">
      <div className="ah-progress-segments" aria-hidden="true">
        {STEP_LABELS.map((_, i) => (
          <div
            key={i}
            className={`ah-progress-seg${i < step ? ' done' : ''}${i === step ? ' active' : ''}`}
          />
        ))}
      </div>
      <p className="ah-progress-caption">
        Step {step + 1} of {STEP_LABELS.length} · <span>{STEP_LABELS[step]}</span>
      </p>
      <div className="ah-booking-steps ah-booking-steps--desktop">
        {STEP_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => i < step && onStepClick(i)}
            disabled={i > step}
            className={`ah-step-pill${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}
          >
            <span className="ah-step-num">{i + 1}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

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
    <div className="ah-fade ah-booking-page ah-booking-flow">
      {toast && <Toast tone={toast.tone} onClose={() => setToast(null)}>{toast.msg}</Toast>}

      {isPatient && step < 4 && (
        <div className="ah-signed-in-chip">
          <span className="ah-signed-in-dot" />
          Signed in as {patient?.name?.split(' ')[0]}
        </div>
      )}

      <div className="ah-booking-header">
        <div className="ah-booking-title-block">
          <div className="ah-booking-eyebrow">Book a session</div>
          <h1 className="ah-booking-title">{heading}</h1>
        </div>
        {step < 4 && <BookingProgress step={step} onStepClick={setStep} />}
      </div>

      <div className={`ah-booking-layout${showSummary ? ' has-summary' : ''}`}>
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
            <div className="ah-booking-actions">
              {step > 0 ? (
                <button type="button" onClick={() => setStep(step - 1)} className="ah-btn-back">
                  Back
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                className="ah-btn-continue"
                onClick={() => canNext && setStep(step + 1)}
                disabled={!canNext}
              >
                {step === 2 ? 'Review booking' : 'Continue'}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="ah-booking-actions ah-booking-actions--review">
              <button type="button" onClick={() => setStep(step - 1)} className="ah-btn-back">
                Back
              </button>
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
        <div key={grp.cat} className="ah-service-group">
          <div className="ah-service-cat">{grp.cat}</div>
          <div className="ah-service-grid">
            {grp.items.map((svc) => {
              const active = svc._id === serviceId;
              return (
                <button
                  key={svc._id}
                  type="button"
                  onClick={() => onPick(svc._id)}
                  className={`ah-service-card${active ? ' active' : ''}`}
                >
                  <div className="ah-service-card-top">
                    <div className="ah-service-card-name">{svc.name}</div>
                    <div className="ah-service-card-check">{active ? '✓' : ''}</div>
                  </div>
                  <div className="ah-service-card-blurb">{svc.blurb}</div>
                  <div className="ah-service-card-foot">
                    <div className="ah-service-card-price">₹{rupees(svc.priceInPaise)}</div>
                    <div className="ah-service-card-dur">{svc.durationMin} min</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function to12h(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function slotLabel(date, startTime) {
  if (!startTime) return '—';
  const d = new Date(`${date}T${startTime}:00`);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) + ` · ${to12h(startTime)}`;
}

/* ─── Step 1: time selection ───────────────────────────────────────────── */
function TimeStep({ service, days, date, setDate, slots, startTime, setStartTime }) {
  return (
    <div className="ah-fade ah-time-panel">
      <div className="ah-section-head">
        <h2 className="ah-section-title">Choose a day</h2>
        <p className="ah-section-sub">
          {service?.name} · {service?.durationMin} min
        </p>
      </div>
      <div className="ah-day-picker">
        {days.map((d) => {
          const active = d.id === date;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setDate(d.id)}
              className={`ah-day-chip${active ? ' active' : ''}`}
            >
              <span className="ah-day-dow">{d.dow}</span>
              <span className="ah-day-num">{d.day}</span>
              <span className="ah-day-mon">{d.mon}</span>
            </button>
          );
        })}
      </div>

      <div className="ah-section-head" style={{ marginTop: 8 }}>
        <h2 className="ah-section-title">Available times</h2>
        <p className="ah-section-sub">
          {service?.capacity} {service?.capacityUnit} per slot
        </p>
      </div>

      {!slots ? (
        <Spinner center />
      ) : slots.length === 0 ? (
        <div className="ah-empty-hint">Nothing available this day — try another date.</div>
      ) : (
        <div className="ah-slot-grid">
          {slots.map((sl) => {
            const full = sl.remaining <= 0;
            const low = sl.remaining === 1;
            const active = startTime === sl.startTime;
            return (
              <button
                key={sl.startTime}
                type="button"
                disabled={full}
                onClick={() => setStartTime(sl.startTime)}
                className={`ah-slot-chip${active ? ' active' : ''}${full ? ' full' : ''}${low ? ' low' : ''}`}
              >
                <span className="ah-slot-time">{to12h(sl.startTime)}</span>
                <span className="ah-slot-meta">
                  {full ? 'Full' : low ? '1 left' : `${sl.remaining} free`}
                </span>
              </button>
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
    <div className="ah-fade ah-details-panel">
      {phoneLookup?.exists && !isPatient && (
        <div className="ah-welcome-banner">
          <span>
            Welcome back, <strong>{phoneLookup.firstName}</strong>!
            {phoneLookup.hasAccount ? ' Sign in to attach this booking to your account.' : ' We have your details on file from a previous visit.'}
          </span>
          {phoneLookup.hasAccount && (
            <button type="button" onClick={onSignIn} className="ah-btn-inline">
              Sign in
            </button>
          )}
        </div>
      )}
      <div className="ah-form-card">
        <div className="ah-form-card-title">Your details</div>
        <div className="ah-form-card-sub">So our therapist can prepare for your visit. Nothing here is shared.</div>
        <div className="ah-form-grid">
          <label className="ah-field ah-field--full">Full name
            <input value={form.name} onChange={set('name')} placeholder="e.g. Rajesh Malhotra" className="ah-input" />
          </label>
          <label className="ah-field">Mobile number
            <PhoneInput value={form.phone} onChange={(digits) => setForm((f) => ({ ...f, phone: digits }))} />
            {form.phone && !isValidIndianMobile(form.phone) && (
              <span className="ah-field-error">Enter a valid 10-digit mobile number</span>
            )}
          </label>
          <label className="ah-field">Age
            <input value={form.age} onChange={set('age')} placeholder="Optional" className="ah-input" />
          </label>
          <label className="ah-field ah-field--full">
            Reason for visit / condition <span className="ah-field-opt">(optional)</span>
            <textarea value={form.reason} onChange={set('reason')} rows={2} placeholder="e.g. chronic lower-back stiffness, managing stress…" className="ah-input ah-textarea" />
          </label>
        </div>
        <div className="ah-intake-note">
          <span className="ah-intake-icon">◈</span>
          <span>First-time visitors are asked to arrive 10 minutes early for a brief intake with our naturopath. No rush — we build in the time.</span>
        </div>
      </div>

      {!isPatient && (
        <div className="ah-auth-upsell">
          <div>
            <div className="ah-auth-upsell-title">Save your bookings &amp; invoices</div>
            <div className="ah-auth-upsell-sub">Optional — sign in to keep everything in one place.</div>
          </div>
          <button type="button" onClick={onSignIn} className="ah-btn-inline">Sign in</button>
          <button type="button" onClick={onGoogle} disabled={busy} className="ah-btn-inline">
            <span className="ah-google-g">G</span> Google
          </button>
        </div>
      )}
      {isPatient && (
        <div className="ah-prefill-note">
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
    <div className="ah-fade ah-review-panel">
      <div className="ah-review-rows">
        <Row label="Therapy" value={service?.name} />
        <Row label="When" value={slotLabel(date, startTime)} />
        <Row label="Name" value={form.name} />
      </div>
      <div className="ah-pay-label">How would you like to pay?</div>
      <div className="ah-pay-options">
        {methods.map((m) => {
          const active = payMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setPayMode(m.id)}
              className={`ah-pay-option${active ? ' active' : ''}`}
            >
              <span className="ah-pay-radio" />
              <span className="ah-pay-copy">
                <span className="ah-pay-title">{m.label}</span>
                <span className="ah-pay-sub">{m.sub}</span>
              </span>
            </button>
          );
        })}
      </div>
      <button onClick={onConfirm} disabled={busy} className="ah-btn-confirm">
        {busy ? 'Processing…' : payMode === 'now' ? `Pay ₹${rupees(service?.priceInPaise)} & confirm` : 'Reserve my slot'}
      </button>
      <div className="ah-review-foot">
        Free cancellation up to 12 hours before · secured by Razorpay
      </div>
    </div>
  );
}

/* ─── Step 4: confirmation ─────────────────────────────────────────────── */
function Confirmed({ done, service, date, startTime, isPatient, onDashboard, onAnother }) {
  const paid = done.paid;
  return (
    <div className="ah-rise" style={{ background: '#fff', border: '1px solid #E6EDE4', borderRadius: 16, padding: 'clamp(24px, 5vw, 40px) clamp(16px, 4vw, 30px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
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
        <div style={{ display: 'inline-block', textAlign: 'left', background: c.cardTint, border: `1px solid ${c.border}`, borderRadius: 12, padding: '18px 22px', width: '100%', maxWidth: 360 }}>
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
    <aside className="ah-booking-summary">
      <div className="ah-summary-compact">
        <div>
          <div className="ah-summary-compact-label">YOUR SESSION</div>
          <div className="ah-summary-compact-name">{service?.name}</div>
          {startTime && (
            <div style={{ fontSize: 11, color: '#A9C4B7', marginTop: 4 }}>{slotLabel(date, startTime)}</div>
          )}
        </div>
        <div className="ah-summary-compact-price">₹{rupees(service?.priceInPaise)}</div>
      </div>
      <div className="ah-summary-extended">
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
      </div>
    </aside>
  );
}

const Row = ({ label, value }) => (
  <div className="ah-review-row">
    <span className="ah-review-row-label">{label}</span>
    <span className="ah-review-row-value">{value}</span>
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
