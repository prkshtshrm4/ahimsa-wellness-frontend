import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api.js';
import { Logo } from '../components/ui.jsx';
import PhoneInput from '../components/PhoneInput.jsx';
import { toE164, isValidIndianMobile } from '../utils/phone.js';

export default function Review() {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!rating) { setErr('Tap a star rating.'); return; }
    setBusy(true);
    setErr(null);
    try {
      await api.post(
        '/reviews',
        {
          rating,
          name: name.trim(),
          phone: phone && isValidIndianMobile(phone) ? toE164(phone) : undefined,
          comment: comment.trim(),
        },
        { auth: false }
      );
      setDone(true);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not send review.');
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="ah-review">
        <div className="ah-review-shell">
          <Logo size={48} showWord sub="THANK YOU" />
          <div className="ah-review-card ah-review-done">
            <div className="ah-review-mark">✓</div>
            <h1>Thank you</h1>
            <p>Your feedback helps us care better.</p>
            <Link to="/" className="ah-review-link">Back to Ahimsa</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ah-review">
      <div className="ah-review-shell">
        <Logo size={44} showWord sub="YOUR EXPERIENCE" />
        <div className="ah-review-card">
          <h1>How was your visit?</h1>
          <p className="ah-review-lead">Tap a rating — takes under a minute.</p>

          <div className="ah-review-stars" role="group" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`ah-review-star${rating >= n ? ' is-on' : ''}`}
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
          </div>

          <label className="ah-review-label">
            Your name
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" autoCapitalize="words" placeholder="Optional" />
          </label>
          <label className="ah-review-label">
            Mobile
            <PhoneInput value={phone} onChange={setPhone} />
          </label>
          <label className="ah-review-label">
            Anything to share?
            <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional" enterKeyHint="done" />
          </label>

          {err && <div className="ah-review-error">{err}</div>}

          <button type="button" className="ah-review-submit" onClick={submit} disabled={busy || !rating}>
            {busy ? 'Sending…' : 'Submit review'}
          </button>
        </div>
      </div>
    </div>
  );
}
