import { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../api.js';
import { useAuth } from '../auth.jsx';
import { payAndVerify } from '../payments.js';
import { c, font, s, rupees } from '../theme.js';
import { Spinner, Toast } from '../components/ui.jsx';
import PhoneInput from '../components/PhoneInput.jsx';
import { toE164, isValidIndianMobile } from '../utils/phone.js';

function nextDays(n = 7) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push({ id: d.toISOString().slice(0, 10), text: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) });
  }
  return out;
}

export default function AdminNewBooking() {
  const { can } = useAuth();
  const days = useMemo(() => nextDays(7), []);

  const [services, setServices] = useState([]);
  const [mode, setMode] = useState('existing'); // existing | new
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [patient, setPatient] = useState(null);
  const [newPatient, setNewPatient] = useState({ name: '', phone: '', age: '' });

  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(days[0].id);
  const [slots, setSlots] = useState([]);
  const [startTime, setStartTime] = useState('');

  const [payMode, setPayMode] = useState('atWalkIn');
  const [deposit, setDeposit] = useState('');
  const [disc, setDisc] = useState({ type: 'none', value: '' });

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [created, setCreated] = useState(null);

  const service = services.find((s2) => s2._id === serviceId);

  useEffect(() => {
    api.get('/services').then((d) => { setServices(d.services); if (d.services[0]) setServiceId(d.services[0]._id); });
  }, []);

  // Patient typeahead.
  useEffect(() => {
    if (mode !== 'existing') return;
    const t = setTimeout(() => {
      api.get(`/admin/patients?q=${encodeURIComponent(query)}`).then((d) => setPatients(d.patients)).catch(() => setPatients([]));
    }, 200);
    return () => clearTimeout(t);
  }, [query, mode]);

  // Availability.
  useEffect(() => {
    if (!serviceId) return;
    setSlots([]);
    setStartTime('');
    api.get(`/services/${serviceId}/availability?date=${date}`).then((d) => setSlots(d.slots)).catch(() => setSlots([]));
  }, [serviceId, date]);

  const subtotal = service?.priceInPaise || 0;
  const discountInPaise = disc.type === 'percent' ? Math.round((subtotal * Math.min(Number(disc.value) || 0, 100)) / 100) : disc.type === 'flat' ? Math.min(subtotal, Math.round((Number(disc.value) || 0) * 100)) : 0;
  const total = subtotal - discountInPaise;

  const patientName = mode === 'existing' ? patient?.name : newPatient.name;
  const ready =
    serviceId &&
    startTime &&
    (mode === 'existing' ? patient : newPatient.name && isValidIndianMobile(newPatient.phone));

  const payMethods = [
    { id: 'atWalkIn', label: 'Settle on arrival', sub: 'Confirmed now, pays at desk.' },
    { id: 'cash', label: 'Cash (paid now)', sub: 'Marks invoice paid.', need: 'payments.collect' },
    { id: 'now', label: 'Card / UPI now', sub: 'Opens desk checkout.' },
    { id: 'link', label: 'Send payment link', sub: 'Email + SMS, slot held.', need: 'payments.link' },
    { id: 'deposit', label: 'Take a deposit', sub: 'Partial now, balance later.', need: 'payments.collect' },
  ].filter((m) => !m.need || can(m.need));

  async function submit() {
    setBusy(true);
    setToast(null);
    try {
      const body = {
        serviceId,
        date,
        startTime,
        paymentMode: payMode,
        discount: disc.type === 'none' ? { type: 'none', value: 0 } : { type: disc.type, value: disc.type === 'flat' ? Math.round((Number(disc.value) || 0) * 100) : Number(disc.value) || 0 },
        source: 'frontDesk',
      };
      if (mode === 'existing') body.patientId = patient._id;
      else body.newPatient = { name: newPatient.name, phone: toE164(newPatient.phone), age: Number(newPatient.age) || undefined };
      if (payMode === 'deposit') body.depositInPaise = Math.round((Number(deposit) || 0) * 100);

      const res = await api.post('/admin/bookings', body);

      if (payMode === 'now' && res.payment) {
        await payAndVerify({ booking: res.booking, payment: res.payment, prefill: { name: patientName } });
      }
      setCreated({ booking: res.booking, paymentLink: res.paymentLink, payMode });
    } catch (e) {
      if (e instanceof ApiError && e.code === 'slot_unavailable') setToast({ tone: 'amber', msg: 'That slot just filled up.' });
      else if (e.code === 'forbidden_module') setToast({ tone: 'error', msg: `You lack the ${e.details?.module} permission for this.` });
      else setToast({ tone: 'error', msg: e.message });
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setCreated(null);
    setPatient(null);
    setNewPatient({ name: '', phone: '', age: '' });
    setStartTime('');
    setPayMode('atWalkIn');
    setDisc({ type: 'none', value: '' });
  }

  if (created) {
    const b = created.booking;
    const payLabel = { atWalkIn: 'Settle on arrival', cash: 'Cash — paid', now: 'Card / UPI — paid', link: 'Payment link sent', deposit: 'Deposit taken' }[created.payMode];
    return (
      <div style={s.page}>
        <div className="ah-rise" style={{ maxWidth: 520, margin: '0 auto', background: '#fff', border: '1px solid #E6EDE4', borderRadius: 16, padding: '34px 30px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F3F7F4', border: `1px solid ${c.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: c.teal, fontSize: 24 }}>✓</div>
          <div style={{ fontFamily: font.serif, fontSize: 23, marginBottom: 6 }}>Booking created</div>
          <div style={{ fontSize: 13.5, color: c.muted, lineHeight: 1.5, marginBottom: 20 }}>
            {created.paymentLink ? 'A secure Razorpay link has been sent by email & SMS. The slot is held and confirms on payment.' : 'The booking is on the calendar.'}
          </div>
          <div style={{ textAlign: 'left', background: c.cardTint, border: `1px solid ${c.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
            <KV label="Reference" value={b.reference} />
            <KV label="Patient" value={b.patientSnapshot?.name} />
            <KV label="Service" value={b.serviceSnapshot?.name} />
            <KV label="When" value={`${b.date} · ${b.startTime}`} />
            <KV label="Payment" value={payLabel} />
            <KV label="Total" value={`₹${rupees(b.amounts?.totalInPaise)}`} strong />
            {created.paymentLink && <KV label="Link" value={created.paymentLink.url} />}
          </div>
          <button onClick={reset} style={s.btnPrimary}>Create another</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page} className="ah-fade">
      {toast && <Toast tone={toast.tone} onClose={() => setToast(null)}>{toast.msg}</Toast>}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Who */}
          <div style={s.cardBox}>
            <div style={{ fontFamily: font.serif, fontSize: 18, marginBottom: 2 }}>Who is this for?</div>
            <div style={{ fontSize: 12.5, color: c.muted, marginBottom: 16 }}>Search an existing patient or add a new one.</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['existing', 'new'].map((m) => (
                <div key={m} onClick={() => setMode(m)} style={{ padding: '8px 14px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600, background: mode === m ? c.teal : '#fff', color: mode === m ? c.ivory : c.bodyText, border: `1px solid ${mode === m ? c.teal : c.line}` }}>
                  {m === 'existing' ? 'Existing patient' : 'New patient'}
                </div>
              ))}
            </div>

            {mode === 'existing' ? (
              <>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or phone…" style={{ ...s.input, marginTop: 0, marginBottom: 12 }} />
                <div style={{ fontSize: 10.5, letterSpacing: '.12em', fontWeight: 700, color: c.mutedWarm, marginBottom: 8 }}>{query ? 'RESULTS' : 'RECENT & FREQUENT'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {patients.map((p) => {
                    const active = patient?._id === p._id;
                    return (
                      <div key={p._id} onClick={() => setPatient(p)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: active ? c.greenSoft : c.cardTint, border: `1px solid ${active ? c.teal : c.border}` }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: c.teal, color: c.ivory, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                          {p.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: c.muted }}>{p.phone}</div>
                        </div>
                        <div style={{ fontSize: 11, color: c.mutedWarm }}>{p.visitCount} visits</div>
                      </div>
                    );
                  })}
                  {patients.length === 0 && <div style={{ fontSize: 12.5, color: c.mutedWarm }}>No matches.</div>}
                </div>
              </>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
                <label style={{ ...s.label, gridColumn: '1 / -1' }}>Patient name<input value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} placeholder="Full name" style={s.input} /></label>
                <label style={s.label}>Mobile number
                  <PhoneInput
                    value={newPatient.phone}
                    onChange={(digits) => setNewPatient({ ...newPatient, phone: digits })}
                  />
                </label>
                <label style={s.label}>Age<input value={newPatient.age} onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })} placeholder="Optional" style={s.input} /></label>
              </div>
            )}
          </div>

          {/* Session */}
          <div style={s.cardBox}>
            <div style={{ fontFamily: font.serif, fontSize: 18, marginBottom: 16 }}>Session</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
              <label style={{ ...s.label, gridColumn: '1 / -1' }}>Service
                <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} style={s.input}>
                  {services.map((o) => <option key={o._id} value={o._id}>{o.name} — ₹{rupees(o.priceInPaise)}</option>)}
                </select>
              </label>
              <label style={s.label}>Date
                <select value={date} onChange={(e) => setDate(e.target.value)} style={s.input}>
                  {days.map((d) => <option key={d.id} value={d.id}>{d.text}</option>)}
                </select>
              </label>
              <label style={s.label}>Time slot
                <select value={startTime} onChange={(e) => setStartTime(e.target.value)} style={s.input}>
                  <option value="">Select a time…</option>
                  {slots.map((sl) => <option key={sl.startTime} value={sl.startTime} disabled={sl.remaining <= 0}>{sl.startTime} {sl.remaining <= 0 ? '· full' : `· ${sl.remaining} left`}</option>)}
                </select>
              </label>
            </div>
          </div>

          {/* Payment */}
          <div style={s.cardBox}>
            <div style={{ fontFamily: font.serif, fontSize: 18, marginBottom: 4 }}>Payment</div>
            <div style={{ fontSize: 12.5, color: c.muted, marginBottom: 16 }}>How is this patient paying?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              {payMethods.map((m) => {
                const active = payMode === m.id;
                return (
                  <div key={m.id} onClick={() => setPayMode(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 10, cursor: 'pointer', background: active ? c.greenSoft : '#fff', border: `1px solid ${active ? c.teal : c.line}` }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${active ? c.teal : c.line}`, background: active ? c.teal : 'transparent', boxShadow: active ? 'inset 0 0 0 2.5px #fff' : 'none', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.label}</div>
                      <div style={{ fontSize: 11, color: c.muted }}>{m.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {payMode === 'deposit' && (
              <label style={{ ...s.label, display: 'block', marginTop: 14 }}>Deposit taken now (₹)
                <input value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="e.g. 500" style={{ ...s.input, width: 180 }} />
              </label>
            )}
            {payMode === 'link' && (
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12, color: c.amberText, background: c.amberBg, border: `1px solid ${c.amberBorder}`, borderRadius: 9, padding: '11px 13px' }}>
                <span>✉</span><span>A secure Razorpay link is emailed &amp; texted to the patient. The slot is held for 24 hours and confirms automatically on payment.</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <aside style={{ background: c.teal, color: '#EAF1EC', borderRadius: 14, padding: 22, position: 'sticky', top: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: '.14em', color: c.sage, fontWeight: 700, marginBottom: 14 }}>BOOKING SUMMARY</div>
          <div style={{ fontFamily: font.serif, fontSize: 20, color: c.ivory, lineHeight: 1.2 }}>{service?.name || '—'}</div>
          <div style={{ fontSize: 12.5, color: '#A9C4B7', marginTop: 6 }}>{startTime ? `${date} · ${startTime}` : 'Pick a time'} · {patientName || 'Pick a patient'}</div>
          <div style={{ height: 1, background: 'rgba(255,255,255,.12)', margin: '16px 0' }} />

          {can('payments.collect') && (
            <>
              <div style={{ fontSize: 11, letterSpacing: '.1em', fontWeight: 700, color: c.sage, marginBottom: 10 }}>DISCOUNT</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {[{ id: 'none', label: 'None' }, { id: 'percent', label: '%' }, { id: 'flat', label: '₹ flat' }].map((o) => (
                  <div key={o.id} onClick={() => setDisc({ type: o.id, value: '' })} style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, background: disc.type === o.id ? c.gold : 'rgba(255,255,255,.1)', color: disc.type === o.id ? c.charcoal : '#EAF1EC' }}>{o.label}</div>
                ))}
              </div>
              {disc.type !== 'none' && (
                <input value={disc.value} onChange={(e) => setDisc({ ...disc, value: e.target.value })} placeholder={disc.type === 'percent' ? 'e.g. 10' : 'e.g. 200'} style={{ width: '100%', padding: '9px 11px', border: 'none', borderRadius: 8, fontSize: 13, background: 'rgba(255,255,255,.1)', color: c.ivory, marginBottom: 14, boxSizing: 'border-box' }} />
              )}
              <div style={{ height: 1, background: 'rgba(255,255,255,.12)', margin: '4px 0 16px' }} />
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: '#A9C4B7' }}><span>Subtotal</span><span>₹{rupees(subtotal)}</span></div>
          {discountInPaise > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: '#A9C4B7' }}><span>Discount</span><span>− ₹{rupees(discountInPaise)}</span></div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
            <span style={{ fontSize: 13, color: '#A9C4B7' }}>Total</span>
            <span style={{ fontFamily: font.serif, fontSize: 26, color: c.gold }}>₹{rupees(total)}</span>
          </div>

          <button onClick={submit} disabled={!ready || busy} style={{ width: '100%', marginTop: 18, padding: 13, borderRadius: 10, border: 'none', background: ready && !busy ? c.gold : 'rgba(255,255,255,.18)', color: ready && !busy ? c.charcoal : '#A9C4B7', fontWeight: 700, fontSize: 14.5, cursor: ready && !busy ? 'pointer' : 'not-allowed' }}>
            {busy ? 'Creating…' : 'Create booking'}
          </button>
        </aside>
      </div>
    </div>
  );
}

const KV = ({ label, value, strong }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, padding: '5px 0', fontSize: 13 }}>
    <span style={{ color: c.muted }}>{label}</span>
    <span style={{ fontWeight: strong ? 700 : 600, color: strong ? c.teal : c.charcoal, wordBreak: 'break-all', textAlign: 'right' }}>{value}</span>
  </div>
);
