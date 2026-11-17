import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api.js';
import PhoneInput from '../components/PhoneInput.jsx';
import { toE164, isValidIndianMobile } from '../utils/phone.js';
import { Logo } from '../components/ui.jsx';

const STEPS = ['You', 'Complaints', 'History', 'Consent'];

const CONSENT_PARAS = [
  'I have seen and understood the facilities, manpower, type of treatments available at Ahimsa Wellness Centre, Gurugram and also understood the limitations of such treatments. I have also learnt the charges payable for different treatments.',
  'I have come for treatment at Ahimsa Wellness Centre, Gurugram of my own and under no compulsion or persuasion of any sort. I also agree to pay all the charges payable for treatment in advance.',
  'I understand that in massage and almost all types of treatments given at Ahimsa Wellness Centre, Gurugram physical touch of different organs is involved. I hereby give my consent for physical touch of different organs as may be required for treatment purposes. I shall make no complaint of any sort in this regard.',
  'I hereby confirm that I shall inform the doctor or therapist of any areas of sensitivity, reduced sensation or lack of sensation in my body prior to undergoing treatment. I understand that failure to disclose such conditions may result in complications or adverse effects during or following the treatment.',
  'I also undertake to abide by rules and regulations of Ahimsa Wellness Centre, Gurugram and I shall not do anything which may disturb or adversely affect other patients.',
  'I also undertake to inform the treating doctors in advance in case I undergo any other type of treatments while I am undergoing treatment at Ahimsa Wellness Centre, Gurugram to avoid any complications.',
];

const empty = {
  name: '',
  gender: '',
  age: '',
  occupation: '',
  maritalStatus: '',
  address: '',
  phone: '',
  email: '',
  identificationCard: '',
  complaintPhysical: '',
  complaintMental: '',
  complaintSocial: '',
  complaintSexual: '',
  addictions: '',
  dietaryHabits: '',
  sleepHabits: '',
  pastHistory: '',
  investigationsDone: '',
  medicationsAtPresent: '',
  consentAccepted: false,
  consentSignedName: '',
};

export default function Intake() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null);
  const [sigEmpty, setSigEmpty] = useState(true);
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setVal = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    document.title = 'Case sheet · Ahimsa Wellness';
    return () => { document.title = 'Ahimsa Wellness'; };
  }, []);

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
  function endDraw() {
    drawing.current = false;
  }
  function clearSig() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#FCFAF5';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setSigEmpty(true);
  }

  function validateStep() {
    if (step === 0) {
      if (!form.name.trim()) return 'Please enter your full name.';
      if (!isValidIndianMobile(form.phone)) return 'Enter a valid 10-digit mobile number.';
    }
    if (step === 3) {
      if (!form.consentAccepted) return 'Please accept the consent to continue.';
      if (!form.consentSignedName.trim()) return 'Type your name as signature.';
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
      const res = await api.post(
        '/intake',
        {
          ...form,
          age: form.age === '' ? undefined : Number(form.age),
          phone: toE164(form.phone),
          consentAccepted: true,
          consentSignatureDataUrl: signature,
        },
        { auth: false }
      );
      setDone(res.caseSheet);
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
            <p>Thank you, {done.name}. Our doctors will review your case sheet shortly.</p>
            <div className="ah-intake-patient-no">
              <span>Patient no.</span>
              <strong>{done.patientNo}</strong>
            </div>
            <p className="ah-intake-hint">Please show this number at the front desk.</p>
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
              <p className="ah-intake-lead">A few details so our doctors can prepare for your visit.</p>
              <label className="ah-intake-label">Full name *
                <input value={form.name} onChange={set('name')} autoComplete="name" placeholder="As on your ID" />
              </label>
              <div className="ah-intake-row">
                <label className="ah-intake-label">Age
                  <input type="number" inputMode="numeric" min="0" max="120" value={form.age} onChange={set('age')} placeholder="Years" />
                </label>
                <label className="ah-intake-label">Gender
                  <select value={form.gender} onChange={set('gender')}>
                    <option value="">Select</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                </label>
              </div>
              <div className="ah-intake-row">
                <label className="ah-intake-label">Occupation
                  <input value={form.occupation} onChange={set('occupation')} />
                </label>
                <label className="ah-intake-label">Marital status
                  <select value={form.maritalStatus} onChange={set('maritalStatus')}>
                    <option value="">Select</option>
                    <option>Single</option>
                    <option>Married</option>
                    <option>Widowed</option>
                    <option>Divorced</option>
                    <option>Other</option>
                  </select>
                </label>
              </div>
              <label className="ah-intake-label">Address
                <textarea rows={2} value={form.address} onChange={set('address')} placeholder="Locality, city" />
              </label>
              <label className="ah-intake-label">Mobile number *
                <PhoneInput value={form.phone} onChange={(digits) => setVal('phone', digits)} />
              </label>
              <label className="ah-intake-label">Email
                <input type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="optional" />
              </label>
              <label className="ah-intake-label">Identification card
                <input value={form.identificationCard} onChange={set('identificationCard')} placeholder="Aadhaar / PAN / other (last 4 ok)" />
              </label>
            </section>
          )}

          {step === 1 && (
            <section className="ah-intake-section">
              <h1>Present complaints</h1>
              <p className="ah-intake-lead">Tell us what brings you in — physical, mental, social or sexual.</p>
              <label className="ah-intake-label">(1) Physical
                <textarea rows={3} value={form.complaintPhysical} onChange={set('complaintPhysical')} placeholder="Pain, fatigue, digestion…" />
              </label>
              <label className="ah-intake-label">(2) Mental
                <textarea rows={2} value={form.complaintMental} onChange={set('complaintMental')} placeholder="Stress, sleep, mood…" />
              </label>
              <label className="ah-intake-label">(3) Social
                <textarea rows={2} value={form.complaintSocial} onChange={set('complaintSocial')} />
              </label>
              <label className="ah-intake-label">(4) Sexual
                <textarea rows={2} value={form.complaintSexual} onChange={set('complaintSexual')} />
              </label>
              <label className="ah-intake-label">Addictions if any
                <textarea rows={2} value={form.addictions} onChange={set('addictions')} placeholder="Tobacco, alcohol, caffeine…" />
              </label>
              <label className="ah-intake-label">Dietary habits
                <textarea rows={2} value={form.dietaryHabits} onChange={set('dietaryHabits')} placeholder="Veg / non-veg, meal timing…" />
              </label>
              <label className="ah-intake-label">Sleep habits
                <textarea rows={2} value={form.sleepHabits} onChange={set('sleepHabits')} placeholder="Hours, quality, issues…" />
              </label>
            </section>
          )}

          {step === 2 && (
            <section className="ah-intake-section">
              <h1>History</h1>
              <p className="ah-intake-lead">Past illness, tests and medicines help us treat you safely.</p>
              <label className="ah-intake-label">Past history
                <textarea rows={3} value={form.pastHistory} onChange={set('pastHistory')} placeholder="Surgeries, chronic conditions…" />
              </label>
              <label className="ah-intake-label">Investigations done
                <textarea rows={3} value={form.investigationsDone} onChange={set('investigationsDone')} placeholder="Blood reports, scans…" />
              </label>
              <label className="ah-intake-label">Medications at present
                <textarea rows={3} value={form.medicationsAtPresent} onChange={set('medicationsAtPresent')} placeholder="Name, dose if known" />
              </label>
            </section>
          )}

          {step === 3 && (
            <section className="ah-intake-section">
              <h1>Consent & undertaking</h1>
              <p className="ah-intake-lead">Please read carefully, then sign below.</p>
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
              <label className="ah-intake-label">Type your full name *
                <input
                  value={form.consentSignedName}
                  onChange={set('consentSignedName')}
                  placeholder={form.name || 'Signature name'}
                />
              </label>
              <div className="ah-intake-sig-head">
                <span>Signature *</span>
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
              <p className="ah-intake-hint">Sign with your finger or stylus.</p>
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
              {busy ? 'Submitting…' : 'Submit case sheet'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
