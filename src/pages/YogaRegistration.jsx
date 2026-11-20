import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api.js';
import { Logo } from '../components/ui.jsx';
import PhoneInput from '../components/PhoneInput.jsx';
import { toE164, isValidIndianMobile } from '../utils/phone.js';

const SLOTS = [
  { id: '7-8am', label: '7–8 am' },
  { id: '8-9am', label: '8–9 am' },
  { id: '4-5pm', label: '4–5 pm' },
];

const GENDERS = [
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
  { id: 'other', label: 'Other' },
  { id: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export default function YogaRegistration() {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [slots, setSlots] = useState([]);
  const [gender, setGender] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(false);

  function toggleSlot(id) {
    setSlots((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function submit() {
    if (!name.trim()) { setErr('Please enter your name.'); return; }
    if (!isValidIndianMobile(whatsapp)) { setErr('Enter a valid 10-digit WhatsApp number.'); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErr('Enter a valid email address.');
      return;
    }
    if (!slots.length) { setErr('Select at least one time slot.'); return; }
    if (!gender) { setErr('Please select gender.'); return; }

    setBusy(true);
    setErr(null);
    try {
      await api.post(
        '/yoga-registrations',
        {
          name: name.trim(),
          whatsapp: toE164(whatsapp),
          email: email.trim(),
          slots,
          gender,
        },
        { auth: false }
      );
      setDone(true);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not submit registration.');
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="ah-review">
        <div className="ah-review-shell">
          <Logo size={48} showWord sub="YOGA" />
          <div className="ah-review-card ah-review-done">
            <div className="ah-review-mark">✓</div>
            <h1>You&apos;re registered</h1>
            <p>We&apos;ll reach you on WhatsApp with class details.</p>
            <Link to="/" className="ah-review-link">Back to Ahimsa</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ah-review">
      <div className="ah-review-shell">
        <Logo size={44} showWord sub="YOGA REGISTRATION" />
        <div className="ah-review-card">
          <h1>Join a yoga class</h1>
          <p className="ah-review-lead">Fill this short form — pick one or more slots that work for you.</p>

          <label className="ah-review-label">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="next"
            />
          </label>

          <label className="ah-review-label">
            WhatsApp number
            <PhoneInput value={whatsapp} onChange={setWhatsapp} />
          </label>

          <label className="ah-review-label">
            Email
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              enterKeyHint="next"
            />
          </label>

          <div className="ah-review-label" style={{ marginBottom: 14 }}>
            Preferred slot
            <span className="ah-yoga-hint">Select one or more</span>
            <div className="ah-yoga-chips" role="group" aria-label="Time slots">
              {SLOTS.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  className={`ah-yoga-chip${slots.includes(slot.id) ? ' is-on' : ''}`}
                  onClick={() => toggleSlot(slot.id)}
                  aria-pressed={slots.includes(slot.id)}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ah-review-label" style={{ marginBottom: 14 }}>
            Gender
            <div className="ah-yoga-chips" role="radiogroup" aria-label="Gender">
              {GENDERS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`ah-yoga-chip${gender === g.id ? ' is-on' : ''}`}
                  onClick={() => setGender(g.id)}
                  aria-pressed={gender === g.id}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {err && <div className="ah-review-error">{err}</div>}

          <button type="button" className="ah-review-submit" onClick={submit} disabled={busy}>
            {busy ? 'Submitting…' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
}
