import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { s } from '../theme.js';

const afterFirstVisit = p => { const day = new Date(`${p.firstVisitDate}T12:00:00Z`); day.setUTCDate(day.getUTCDate() + 1); return day.toISOString().slice(0, 10); };
const earliest = p => [tomorrow(), afterFirstVisit(p)].sort().at(-1);
const tomorrow = () => { const d = new Date(Date.now() + 86400000); return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); };
export default function MyPackages({ refreshKey, onBooked }) {
  const [packages, setPackages] = useState([]);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [date, setDate] = useState(tomorrow);
  const [slots, setSlots] = useState(null);
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const dialog = useRef(null);
  const load = async () => {
    try { setError(''); const d = await api.get('/me/packages'); setPackages(d.packages); }
    catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, [refreshKey]);
  useEffect(() => { if (selected) dialog.current.showModal(); else dialog.current?.close(); }, [selected]);
  useEffect(() => {
    if (!selected) return;
    let current = true;
    setSlots(null); setTime(''); setNotice('');
    api.get(`/me/packages/${selected._id}/availability?date=${date}`).then(d => { if (current) setSlots(d.slots); }).catch(e => { if (current) { setSlots([]); setNotice(e.message); } });
    return () => { current = false; };
  }, [selected, date]);
  async function book(e) {
    e.preventDefault(); setBusy(true);
    try {
      const d = await api.post(`/me/packages/${selected._id}/visits`, { date, startTime: time });
      setSelected(null); setNotice(`Visit confirmed (${d.booking.reference}). ${d.remainingVisits} visits remaining.`);
      await load(); onBooked();
    } catch (e) { setNotice(e.message); }
    finally { setBusy(false); }
  }
  return <section className="my-packages" aria-label="My packages">
    <h2>My packages</h2>
    {error ? <p role="alert">{error} <button onClick={load}>Try again</button></p> : packages.length === 0 ? <p>No packages purchased yet.</p> : <div className="package-admin-grid">{packages.map(p => <article className="package-admin-card" key={p._id}><h3>{p.name}</h3><p><strong>{p.remainingVisits}</strong> of {p.visitCount} visits still to book.</p>{p.paid ? <button style={s.btnPrimary} disabled={!p.remainingVisits || busy} onClick={() => { setDate(earliest(p)); setSelected(p); }}>Book next visit</button> : <p>Complete payment to unlock the remaining visits. Contact the front desk if paying at the centre.</p>}</article>)}</div>}
    {notice && !selected && <p role="status">{notice}</p>}
    <dialog ref={dialog} className="package-editor" onCancel={e => { if (busy) e.preventDefault(); else setSelected(null); }}>
      {selected && <form onSubmit={book}><h2>{selected.name}</h2><p>This visit is included in your paid package. One visit per day.</p><fieldset disabled={busy}><label>Choose a day<input type="date" min={earliest(selected)} required value={date} onChange={e => setDate(e.target.value)} /></label><div className="package-slot-grid">{!slots ? <p role="status">Loading availability…</p> : slots.length === 0 ? <p>No appointments on this day. Choose a different day after your first visit.</p> : slots.map(slot => <button type="button" key={slot.startTime} disabled={slot.remaining <= 0} aria-pressed={time === slot.startTime} onClick={() => setTime(slot.startTime)}>{slot.startTime}<small>{slot.remaining > 0 ? `${slot.remaining} available` : 'Full'}</small></button>)}</div>{notice && <p role="alert">{notice}</p>}<div className="package-admin-actions"><button type="button" onClick={() => setSelected(null)}>Cancel</button><button type="submit" style={s.btnPrimary} disabled={!time || busy}>{busy ? 'Booking…' : 'Confirm included visit'}</button></div></fieldset></form>}
    </dialog>
  </section>;
}
