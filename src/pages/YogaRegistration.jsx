import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api.js';
import { Logo } from '../components/ui.jsx';
import PhoneInput from '../components/PhoneInput.jsx';
import { toE164, isValidIndianMobile } from '../utils/phone.js';

const SLOTS = [
  { id: '7-8am', label: '7–8 am', note: 'Morning' },
  { id: '8-9am', label: '8–9 am', note: 'Morning' },
  { id: '4-5pm', label: '4–5 pm', note: 'Evening' },
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
      <div className="ah-yoga">
        <div className="ah-yoga-shell">
          <header className="ah-yoga-brand">
            <Logo size={42} showWord sub="YOGA" />
          </header>
          <div className="ah-yoga-done">
            <div className="ah-yoga-done-mark" aria-hidden="true">✓</div>
            <h1>You&apos;re registered</h1>
            <p>We&apos;ll message you on WhatsApp with class details shortly.</p>
            <Link to="/" className="ah-yoga-text-link">Back to Ahimsa</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ah-yoga">
      <div className="ah-yoga-shell">
        <header className="ah-yoga-brand">
          <Logo size={40} showWord sub="AHIMSA WELLNESS" />
        </header>

        <main className="ah-yoga-main">
          <div className="ah-yoga-intro">
            <p className="ah-yoga-kicker">Yoga at the centre</p>
            <h1>Registration for Yoga Class <span>(free for limited time)</span></h1>
            <p className="ah-yoga-lead">
              Tell us a little about yourself and the slots that suit you. Takes under a minute.
            </p>
          </div>

          <form
            className="ah-yoga-form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <label className="ah-yoga-field">
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                autoCapitalize="words"
                enterKeyHint="next"
              />
            </label>

            <label className="ah-yoga-field">
              WhatsApp number
              <PhoneInput
                value={whatsapp}
                onChange={setWhatsapp}
                style={{ borderRadius: 12, marginTop: 8, minHeight: 48 }}
              />
            </label>

            <label className="ah-yoga-field">
              Email
              <input
                type="text"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                enterKeyHint="next"
                placeholder="you@email.com"
              />
            </label>

            <fieldset className="ah-yoga-fieldset">
              <legend>
                Preferred slot
                <span>Choose one or more</span>
              </legend>
              <div className="ah-yoga-slots" role="group" aria-label="Time slots">
                {SLOTS.map((slot) => {
                  const on = slots.includes(slot.id);
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      className={`ah-yoga-slot${on ? ' is-on' : ''}`}
                      onClick={() => toggleSlot(slot.id)}
                      aria-pressed={on}
                    >
                      <span className="ah-yoga-slot-check" aria-hidden="true">{on ? '✓' : ''}</span>
                      <span className="ah-yoga-slot-text">
                        <strong>{slot.label}</strong>
                        <em>{slot.note}</em>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="ah-yoga-fieldset">
              <legend>Gender</legend>
              <div className="ah-yoga-genders" role="radiogroup" aria-label="Gender">
                {GENDERS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={`ah-yoga-gender${gender === g.id ? ' is-on' : ''}`}
                    onClick={() => setGender(g.id)}
                    aria-pressed={gender === g.id}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {err && <div className="ah-yoga-error" role="alert">{err}</div>}

            <div className="ah-yoga-actions">
              <button type="submit" className="ah-yoga-submit" disabled={busy}>
                {busy ? 'Submitting…' : 'Submit registration'}
              </button>
              <p className="ah-yoga-foot">We&apos;ll confirm on WhatsApp. No payment needed for this offer.</p>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
