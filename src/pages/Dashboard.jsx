import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api.js';
import { useAuth } from '../auth.jsx';
import { c, font, s, rupees } from '../theme.js';
import { Spinner, StatusPill, EmptyState, Toast, Modal } from '../components/ui.jsx';

export default function Dashboard() {
  const navigate = useNavigate();
  const { patient } = useAuth();
  const [upcoming, setUpcoming] = useState(null);
  const [past, setPast] = useState(null);
  const [toast, setToast] = useState(null);
  const [reschedule, setReschedule] = useState(null); // booking being rescheduled

  const load = useCallback(() => {
    api.get('/me/bookings?scope=upcoming').then((d) => setUpcoming(d.bookings)).catch(() => setUpcoming([]));
    api.get('/me/bookings?scope=past').then((d) => setPast(d.bookings)).catch(() => setPast([]));
  }, []);

  useEffect(load, [load]);

  async function cancel(b) {
    if (!confirm(`Cancel your ${b.serviceName} booking?`)) return;
    try {
      const res = await api.post(`/me/bookings/${b._id}/cancel`);
      setToast({ tone: 'info', msg: res.refundInPaise > 0 ? `Booking cancelled — full refund of ₹${rupees(res.refundInPaise)} in 3–5 days.` : 'Booking cancelled.' });
      load();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'cancellation_window_closed') {
        setToast({ tone: 'amber', msg: 'The free cancellation window (12h before) has closed. Please contact the front desk.' });
      } else {
        setToast({ tone: 'error', msg: e.message });
      }
    }
  }

  if (!upcoming || !past) return <Spinner center />;

  return (
    <div className="ah-page ah-fade">
      {toast && <Toast tone={toast.tone} onClose={() => setToast(null)}>{toast.msg}</Toast>}
      {reschedule && (
        <RescheduleModal
          booking={reschedule}
          onClose={() => setReschedule(null)}
          onDone={(msg) => { setReschedule(null); setToast({ tone: 'info', msg }); load(); }}
          onError={(msg) => setToast({ tone: 'amber', msg })}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
        <div>
          <h1 style={{ ...s.h1, marginBottom: 4 }}>Namaste, {patient?.name?.split(' ')[0] || 'there'}</h1>
          <div style={{ fontSize: 13, color: c.muted }}>Your care at Ahimsa, all in one place.</div>
        </div>
        <button onClick={() => navigate('/book')} style={{ ...s.btnPrimary, padding: '11px 20px' }}>＋ Book a session</button>
      </div>

      <div style={{ ...s.sectionLabel, marginBottom: 12 }}>UPCOMING</div>
      {upcoming.length === 0 ? (
        <EmptyState
          title="Your journey starts here"
          sub="No sessions booked yet. When you're ready, we're here."
          action={<button onClick={() => navigate('/book')} style={s.btnPrimary}>Explore therapies</button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30 }}>
          {upcoming.map((b) => {
            const canManage = new Date() < new Date(b.cancellableUntil);
            const pending = b.status === 'pendingPayment';
            return (
              <div key={b._id} className="ah-dashboard-card" style={{ ...s.cardBox, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ fontFamily: font.serif, fontSize: 19 }}>{b.serviceName}</div>
                    <StatusPill status={b.status} />
                  </div>
                  <div style={{ fontSize: 13, color: c.bodyText }}>{whenLabel(b.when)} · with {b.therapistName}</div>
                  <div style={{ fontSize: 11.5, color: c.mutedWarm, marginTop: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: c.sage }}>◷</span>
                    {pending ? 'Complete payment to secure this slot' : canManage ? `Free cancellation until ${whenLabel(b.cancellableUntil)}` : 'Cancellation window closed'}
                  </div>
                </div>
                <div className="ah-dashboard-actions" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => setReschedule(b)} disabled={!canManage} style={{ ...s.btnGhost, padding: '9px 15px', fontSize: 13, opacity: canManage ? 1 : 0.4, cursor: canManage ? 'pointer' : 'not-allowed' }}>Reschedule</button>
                  <button onClick={() => cancel(b)} disabled={!canManage} style={{ padding: '9px 15px', borderRadius: 9, border: `1px solid ${c.dangerBorder}`, background: '#fff', fontSize: 13, fontWeight: 600, color: c.dangerText, cursor: canManage ? 'pointer' : 'not-allowed', opacity: canManage ? 1 : 0.4 }}>Cancel</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ ...s.sectionLabel, marginBottom: 12 }}>PAST VISITS</div>
      {past.length === 0 ? (
        <div style={{ ...s.cardBox, fontSize: 13.5, color: c.muted }}>No past visits yet.</div>
      ) : (
        <div style={{ ...s.cardBox, padding: 0, overflow: 'hidden' }}>
          {past.map((b) => (
            <div key={b._id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '15px 20px', borderBottom: `1px solid ${c.borderSoft}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{b.serviceName}</div>
                <div style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>{whenLabel(b.when)} · {b.therapistName}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: c.bodyText, fontVariantNumeric: 'tabular-nums' }}>₹{rupees(b.priceInPaise)}</div>
              {b.invoiceId ? (
                <button onClick={() => navigate(`/invoice/${b.invoiceId}`)} style={{ padding: '8px 14px', borderRadius: 9, border: `1px solid ${c.line}`, background: c.cardTint, fontSize: 12.5, fontWeight: 600, color: c.teal, cursor: 'pointer' }}>Invoice ↓</button>
              ) : (
                <span style={{ fontSize: 12, color: c.mutedWarm }}>—</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RescheduleModal({ booking, onClose, onDone, onError }) {
  const [days] = useState(() => {
    const out = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      out.push({ id: d.toISOString().slice(0, 10), dow: d.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase(), day: d.getDate(), mon: d.toLocaleDateString('en-IN', { month: 'short' }) });
    }
    return out;
  });
  const [date, setDate] = useState(days[0].id);
  const [slots, setSlots] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [busy, setBusy] = useState(false);

  // Availability requires the service id; fetch it via the booking's service through availability call.
  useEffect(() => {
    setSlots(null);
    setStartTime('');
    // We need the serviceId; look it up from services list matching name.
    api.get('/services', { auth: false }).then((d) => {
      const svc = d.services.find((s2) => s2.name === booking.serviceName);
      if (!svc) return setSlots([]);
      api.get(`/services/${svc._id}/availability?date=${date}`, { auth: false }).then((a) => setSlots(a.slots)).catch(() => setSlots([]));
    });
  }, [date, booking.serviceName]);

  async function submit() {
    try {
      setBusy(true);
      await api.post(`/me/bookings/${booking._id}/reschedule`, { date, startTime });
      onDone('Booking rescheduled.');
    } catch (e) {
      if (e.code === 'slot_unavailable') onError('That slot just filled up — pick another.');
      else if (e.code === 'cancellation_window_closed') onError('Too close to the session to reschedule.');
      else onError(e.message);
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ fontFamily: font.serif, fontSize: 20, marginBottom: 4 }}>Reschedule {booking.serviceName}</div>
      <div style={{ fontSize: 12.5, color: c.muted, marginBottom: 16 }}>Choose a new day and time.</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {days.map((d) => (
          <div key={d.id} onClick={() => setDate(d.id)} style={{ textAlign: 'center', padding: '8px 12px', borderRadius: 10, cursor: 'pointer', minWidth: 52, background: d.id === date ? c.teal : '#fff', color: d.id === date ? c.ivory : c.charcoal, border: `1px solid ${d.id === date ? c.teal : c.line}` }}>
            <div style={{ fontSize: 10, opacity: 0.7 }}>{d.dow}</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{d.day}</div>
          </div>
        ))}
      </div>
      {!slots ? <Spinner center /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 8, marginBottom: 18 }}>
          {slots.map((sl) => {
            const full = sl.remaining <= 0;
            return (
              <div key={sl.startTime} onClick={() => !full && setStartTime(sl.startTime)} style={{ padding: '10px', borderRadius: 9, textAlign: 'center', cursor: full ? 'not-allowed' : 'pointer', background: startTime === sl.startTime ? c.greenSoft : '#fff', border: `1px solid ${startTime === sl.startTime ? c.teal : c.line}`, opacity: full ? 0.5 : 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{sl.startTime}</div>
                <div style={{ fontSize: 10.5, color: full ? c.dangerText : c.greenText }}>{full ? 'Full' : `${sl.remaining} left`}</div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button onClick={onClose} style={s.btnGhost}>Cancel</button>
        <button onClick={submit} disabled={!startTime || busy} style={{ ...s.btnPrimary, opacity: !startTime || busy ? 0.5 : 1 }}>Confirm new time</button>
      </div>
    </Modal>
  );
}

function whenLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}
