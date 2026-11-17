import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api.js';
import PhoneInput from '../components/PhoneInput.jsx';
import { toE164, isValidIndianMobile, toLocalDigits } from '../utils/phone.js';
import { Logo } from '../components/ui.jsx';

const STEPS = ['You', 'Health', 'History', 'Consent'];

const CONSENT_PARAS = [
  'I have seen and understood the facilities, manpower, type of treatments available at Ahimsa Wellness Centre, Gurugram and also understood the limitations of such treatments. I have also learnt the charges payable for different treatments.',
  'I have come for treatment at Ahimsa Wellness Centre, Gurugram of my own and under no compulsion or persuasion of any sort. I also agree to pay all the charges payable for treatment in advance.',
  'I understand that in massage and almost all types of treatments given at Ahimsa Wellness Centre, Gurugram physical touch of different organs is involved. I hereby give my consent for physical touch of different organs as may be required for treatment purposes. I shall make no complaint of any sort in this regard.',
  'I hereby confirm that I shall inform the doctor or therapist of any areas of sensitivity, reduced sensation or lack of sensation in my body prior to undergoing treatment. I understand that failure to disclose such conditions may result in complications or adverse effects during or following the treatment.',
  'I also undertake to abide by rules and regulations of Ahimsa Wellness Centre, Gurugram and I shall not do anything which may disturb or adversely affect other patients.',
  'I also undertake to inform the treating doctors in advance in case I undergo any other type of treatments while I am undergoing treatment at Ahimsa Wellness Centre, Gurugram to avoid any complications.',
];

const GENDERS = ['Female', 'Male', 'Other'];
const MARITAL = ['Single', 'Married', 'Widowed', 'Divorced'];
const OCCUPATIONS = ['Homemaker', 'Service / Job', 'Business', 'Student', 'Retired', 'Professional', 'Other'];
const AREAS = [
  'Sector 45', 'Sector 56', 'DLF Phase 1', 'DLF Phase 2', 'DLF Phase 3', 'DLF Phase 4', 'DLF Phase 5',
  'Golf Course Road', 'Sohna Road', 'MG Road', 'Gurgaon other', 'Delhi NCR', 'Out of town',
];
const PHYSICAL = [
  'Back pain', 'Joint pain', 'Neck / shoulder', 'Fatigue', 'Digestion', 'Acidity',
  'Headache', 'Weight issues', 'Skin', 'Breathing', 'BP / sugar', 'Other',
];
const MENTAL = ['Stress', 'Anxiety', 'Low mood', 'Poor focus', 'Anger', 'None'];
const SOCIAL = ['Work pressure', 'Family stress', 'Loneliness', 'None'];
const SEXUAL = ['None', 'Low energy', 'Discomfort', 'Prefer not to say'];
const ADDICTIONS = ['None', 'Tea / coffee', 'Tobacco', 'Alcohol', 'Smoking', 'Other'];
const DIETS = ['Vegetarian', 'Eggetarian', 'Non-vegetarian', 'Vegan', 'Jain'];
const SLEEP = ['Sound (7–8 hrs)', 'Light sleeper', 'Insomnia', 'Less than 5 hrs', 'Irregular'];
const PAST = ['None', 'Diabetes', 'BP', 'Thyroid', 'Asthma', 'Surgery', 'Heart', 'Other'];
const INVEST = ['None', 'Blood reports', 'Scan / X-ray', 'Reports with me', 'Other'];
const MEDS = ['None', 'Allopathy', 'Ayurveda', 'Homeopathy', 'Supplements', 'Other'];

const empty = {
  name: '',
  gender: '',
  age: '',
  occupation: '',
  maritalStatus: '',
  area: '',
  address: '',
  phone: '',
  email: '',
  identificationCard: '',
  idType: '',
  complaintPhysical: [],
  complaintMental: [],
  complaintSocial: [],
  complaintSexual: [],
  addictions: [],
  dietaryHabits: '',
  sleepHabits: '',
  pastHistory: [],
  investigationsDone: [],
  medicationsAtPresent: [],
  notes: '',
  consentAccepted: false,
  consentSignedName: '',
};

function ChipGroup({ label, options, value, onChange, multi = false, hint }) {
  const selected = multi
    ? (Array.isArray(value) ? value : [])
    : value
      ? [value]
      : [];

  function tap(opt) {
    if (!multi) {
      onChange(value === opt ? '' : opt);
      return;
    }
    const has = selected.includes(opt);
    // Exclusive "None"
    if (opt === 'None') {
      onChange(has ? [] : ['None']);
      return;
    }
    let next = selected.filter((x) => x !== 'None');
    next = has ? next.filter((x) => x !== opt) : [...next, opt];
    onChange(next);
  }

  return (
    <div className="ah-intake-chips-block">
      <div className="ah-intake-chips-label">
        {label}
        {hint && <span>{hint}</span>}
      </div>
      <div className="ah-intake-chips" role="group" aria-label={label}>
        {options.map((opt) => {
          const on = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              className={`ah-intake-chip${on ? ' is-on' : ''}`}
              aria-pressed={on}
              onClick={() => tap(opt)}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function joinList(arr) {
  if (!Array.isArray(arr) || !arr.length) return '';
  if (arr.length === 1 && arr[0] === 'None') return 'None';
  return arr.filter((x) => x !== 'None').join(', ');
}

export default function Intake() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null);
  const [sigEmpty, setSigEmpty] = useState(true);
  const [contactOk, setContactOk] = useState(false);
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setVal = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    document.title = 'Case sheet · Ahimsa Wellness';
    setContactOk(typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window);
    return () => { document.title = 'Ahimsa Wellness'; };
  }, []);

  // Prefill signed name when reaching consent
  useEffect(() => {
    if (step === 3 && !form.consentSignedName && form.name) {
      setForm((f) => ({ ...f, consentSignedName: f.name }));
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || step !== 3) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1B3C35';
    ctx.fillStyle = '#FCFAF5';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setSigEmpty(true);
  }, [step]);

  function pointerPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }
  function startDraw(e) {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const p = pointerPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }
  function moveDraw(e) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const p = pointerPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setSigEmpty(false);
  }
  function endDraw() { drawing.current = false; }
  function clearSig() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#FCFAF5';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setSigEmpty(true);
  }

  async function pickFromPhone() {
    try {
      const contacts = await navigator.contacts.select(['name', 'tel', 'email', 'address'], { multiple: false });
      const c = contacts?.[0];
      if (!c) return;
      setForm((f) => {
        const next = { ...f };
        if (c.name?.[0]) next.name = String(c.name[0]).slice(0, 120);
        const tel = c.tel?.[0];
        if (tel) next.phone = toLocalDigits(tel);
        if (c.email?.[0] && !next.email) next.email = String(c.email[0]).slice(0, 160);
        const addr = c.address?.[0];
        if (addr) {
          const line = [addr.addressLine?.[0], addr.city, addr.postalCode].filter(Boolean).join(', ');
          if (line) next.address = line.slice(0, 500);
        }
        return next;
      });
    } catch {
      // User cancelled or unsupported — ignore
    }
  }

  function validateStep() {
    if (step === 0) {
      if (!form.name.trim()) return 'Please enter your full name.';
      if (!isValidIndianMobile(form.phone)) return 'Enter a valid 10-digit mobile number.';
    }
    if (step === 3) {
      if (!form.consentAccepted) return 'Please accept the consent to continue.';
      if (!form.consentSignedName.trim()) return 'Confirm your name below.';
      if (sigEmpty) return 'Please sign in the box below.';
    }
    return null;
  }

  function next() {
    const v = validateStep();
    if (v) { setErr(v); return; }
    setErr(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function back() {
    setErr(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    const v = validateStep();
    if (v) { setErr(v); return; }
    setBusy(true);
    setErr(null);
    try {
      const signature = canvasRef.current?.toDataURL('image/png') || '';
      const address = [form.area, form.address].filter(Boolean).join(', ');
      const idCard = [form.idType, form.identificationCard].filter(Boolean).join(' ').trim();
      const res = await api.post(
        '/intake',
        {
          name: form.name.trim(),
          gender: form.gender,
          age: form.age === '' ? undefined : Number(form.age),
          occupation: form.occupation,
          maritalStatus: form.maritalStatus,
          address,
          phone: toE164(form.phone),
          email: form.email.trim(),
          identificationCard: idCard,
          complaintPhysical: joinList(form.complaintPhysical),
          complaintMental: joinList(form.complaintMental),
          complaintSocial: joinList(form.complaintSocial),
          complaintSexual: joinList(form.complaintSexual),
          addictions: joinList(form.addictions),
          dietaryHabits: form.dietaryHabits,
          sleepHabits: form.sleepHabits,
          pastHistory: [joinList(form.pastHistory), form.notes].filter(Boolean).join('. '),
          investigationsDone: joinList(form.investigationsDone),
          medicationsAtPresent: joinList(form.medicationsAtPresent),
          consentAccepted: true,
          consentSignedName: form.consentSignedName.trim() || form.name.trim(),
          consentSignatureDataUrl: signature,
        },
        { auth: false }
      );
      setDone({ ...res.caseSheet, smsSent: Boolean(res.sms?.sent) });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not submit. Please try again.');
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="ah-intake">
        <div className="ah-intake-shell">
          <div className="ah-intake-brand"><Logo size={48} showWord sub="CASE SHEET" /></div>
          <div className="ah-intake-success">
            <div className="ah-intake-success-mark">✓</div>
            <h1>You're registered</h1>
            <p>Thank you, {done.name}. Show this number at the desk.</p>
            <div className="ah-intake-patient-no">
              <span>Patient no.</span>
              <strong>{done.patientNo}</strong>
            </div>
            {done.smsSent && (
              <p className="ah-intake-hint">A confirmation SMS has been sent to your mobile.</p>
            )}
            <Link to="/" className="ah-intake-link">Back to Ahimsa</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ah-intake">
      <div className="ah-intake-shell">
        <header className="ah-intake-top">
          <Logo size={40} showWord sub="DRIVE · CASE SHEET" />
          <div className="ah-intake-progress" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((label, i) => (
              <div key={label} className={`ah-intake-dot${i === step ? ' is-active' : ''}${i < step ? ' is-done' : ''}`}>
                <span>{i < step ? '✓' : i + 1}</span>
                <em>{label}</em>
              </div>
            ))}
          </div>
        </header>

        <div className="ah-intake-card">
          {step === 0 && (
            <section className="ah-intake-section">
              <h1>About you</h1>
              <p className="ah-intake-lead">Tap to select — type only what’s needed.</p>

              {contactOk && (
                <button type="button" className="ah-intake-autofill" onClick={pickFromPhone}>
                  Use details from phone
                </button>
              )}

              <label className="ah-intake-label">Mobile number *
                <PhoneInput
                  value={form.phone}
                  onChange={(digits) => setVal('phone', digits)}
                  autoComplete="tel-national"
                  name="phone"
                  autoFocus
                />
              </label>

              <label className="ah-intake-label">Full name *
                <input
                  value={form.name}
                  onChange={set('name')}
                  autoComplete="name"
                  name="name"
                  enterKeyHint="next"
                  autoCapitalize="words"
                  placeholder="As on your ID"
                />
              </label>

              <div className="ah-intake-row">
                <label className="ah-intake-label">Age
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="bday-year"
                    name="age"
                    maxLength={3}
                    value={form.age}
                    onChange={(e) => setVal('age', e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="Yrs"
                  />
                </label>
                <label className="ah-intake-label">Email
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    name="email"
                    enterKeyHint="next"
                    value={form.email}
                    onChange={set('email')}
                    placeholder="Optional"
                  />
                </label>
              </div>

              <ChipGroup label="Gender" options={GENDERS} value={form.gender} onChange={(v) => setVal('gender', v)} />
              <ChipGroup label="Marital status" options={MARITAL} value={form.maritalStatus} onChange={(v) => setVal('maritalStatus', v)} />
              <ChipGroup label="Occupation" options={OCCUPATIONS} value={form.occupation} onChange={(v) => setVal('occupation', v)} />
              <ChipGroup label="Area" options={AREAS} value={form.area} onChange={(v) => setVal('area', v)} hint="tap one" />

              <label className="ah-intake-label">Landmark / flat (optional)
                <input
                  value={form.address}
                  onChange={set('address')}
                  autoComplete="street-address"
                  name="street-address"
                  enterKeyHint="done"
                  autoCapitalize="sentences"
                  placeholder="Building, street — skip if area is enough"
                />
              </label>

              <ChipGroup
                label="ID type"
                options={['Aadhaar', 'PAN', 'Driving licence', 'Passport', 'Other']}
                value={form.idType}
                onChange={(v) => setVal('idType', v)}
              />
              {form.idType && (
                <label className="ah-intake-label">{form.idType} last 4 digits (optional)
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    name="id-last4"
                    maxLength={4}
                    autoComplete="off"
                    value={form.identificationCard}
                    onChange={(e) => setVal('identificationCard', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                  />
                </label>
              )}
            </section>
          )}

          {step === 1 && (
            <section className="ah-intake-section">
              <h1>How are you feeling?</h1>
              <p className="ah-intake-lead">Tap all that apply — no typing needed.</p>
              <ChipGroup label="Physical" options={PHYSICAL} value={form.complaintPhysical} onChange={(v) => setVal('complaintPhysical', v)} multi hint="multi" />
              <ChipGroup label="Mental" options={MENTAL} value={form.complaintMental} onChange={(v) => setVal('complaintMental', v)} multi />
              <ChipGroup label="Social" options={SOCIAL} value={form.complaintSocial} onChange={(v) => setVal('complaintSocial', v)} multi />
              <ChipGroup label="Sexual" options={SEXUAL} value={form.complaintSexual} onChange={(v) => setVal('complaintSexual', v)} multi />
              <ChipGroup label="Addictions" options={ADDICTIONS} value={form.addictions} onChange={(v) => setVal('addictions', v)} multi />
              <ChipGroup label="Diet" options={DIETS} value={form.dietaryHabits} onChange={(v) => setVal('dietaryHabits', v)} />
              <ChipGroup label="Sleep" options={SLEEP} value={form.sleepHabits} onChange={(v) => setVal('sleepHabits', v)} />
            </section>
          )}

          {step === 2 && (
            <section className="ah-intake-section">
              <h1>History</h1>
              <p className="ah-intake-lead">Helps doctors treat you safely. Tap None if not sure.</p>
              <ChipGroup label="Past conditions" options={PAST} value={form.pastHistory} onChange={(v) => setVal('pastHistory', v)} multi />
              <ChipGroup label="Investigations" options={INVEST} value={form.investigationsDone} onChange={(v) => setVal('investigationsDone', v)} multi />
              <ChipGroup label="Medicines now" options={MEDS} value={form.medicationsAtPresent} onChange={(v) => setVal('medicationsAtPresent', v)} multi />
              <label className="ah-intake-label">Anything else? (optional)
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={set('notes')}
                  enterKeyHint="done"
                  autoCapitalize="sentences"
                  placeholder="Skip if chips cover it"
                />
              </label>
            </section>
          )}

          {step === 3 && (
            <section className="ah-intake-section">
              <h1>Consent</h1>
              <p className="ah-intake-lead">Read, tick, and sign with your finger.</p>
              <div className="ah-intake-consent">
                {CONSENT_PARAS.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
              </div>
              <label className="ah-intake-check">
                <input
                  type="checkbox"
                  checked={form.consentAccepted}
                  onChange={(e) => setVal('consentAccepted', e.target.checked)}
                />
                <span>I have read and agree to this consent and undertaking.</span>
              </label>
              <label className="ah-intake-label">Signing as
                <input
                  value={form.consentSignedName}
                  onChange={set('consentSignedName')}
                  autoComplete="name"
                  autoCapitalize="words"
                  enterKeyHint="done"
                />
              </label>
              <div className="ah-intake-sig-head">
                <span>Finger signature *</span>
                <button type="button" className="ah-intake-clear" onClick={clearSig}>Clear</button>
              </div>
              <canvas
                ref={canvasRef}
                className="ah-intake-sig"
                onMouseDown={startDraw}
                onMouseMove={moveDraw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={moveDraw}
                onTouchEnd={endDraw}
              />
            </section>
          )}

          {err && <div className="ah-intake-error" role="alert">{err}</div>}
        </div>

        <div className="ah-intake-actions">
          {step > 0 ? (
            <button type="button" className="ah-intake-btn ghost" onClick={back} disabled={busy}>Back</button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" className="ah-intake-btn primary" onClick={next}>Continue</button>
          ) : (
            <button type="button" className="ah-intake-btn primary" onClick={submit} disabled={busy}>
              {busy ? 'Submitting…' : 'Submit'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
