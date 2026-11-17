import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { c, font, s } from '../theme.js';

/** Build a QR via a lightweight public chart API-free SVG using qrcode-like matrix from a tiny inline encoder is heavy —
 *  Use Google Charts QR endpoint which works offline-free for the drive display. */
function qrImageUrl(text, size = 320) {
  const u = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${u}&margin=12`;
}

export default function AdminIntakeQr() {
  const [copied, setCopied] = useState(false);
  const printRef = useRef(null);

  const intakeUrl = useMemo(() => {
    const origin = window.location.origin;
    return `${origin}/intake`;
  }, []);

  useEffect(() => {
    document.title = 'Intake QR · Ahimsa';
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(intakeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div style={s.page} className="ah-fade">
      <Link to="/admin/cases" style={{ ...s.btnGhost, display: 'inline-flex', marginBottom: 16, textDecoration: 'none', padding: '8px 12px' }}>
        ← Case sheets
      </Link>

      <div style={s.eyebrow}>DRIVE DESK</div>
      <h1 style={{ ...s.h1, fontSize: 28, marginBottom: 8 }}>Patient intake QR</h1>
      <p style={{ color: c.muted, fontSize: 14, maxWidth: 480, marginTop: 0, lineHeight: 1.5 }}>
        Print or display this code at the registration desk. Patients scan it, fill the case sheet on their phone, and get a patient number.
      </p>

      <div
        ref={printRef}
        style={{
          ...s.cardBox,
          maxWidth: 420,
          marginTop: 24,
          textAlign: 'center',
          padding: '28px 24px 32px',
        }}
      >
        <div style={{ fontFamily: font.serif, fontSize: 22, color: c.teal, marginBottom: 4 }}>Ahimsa Wellness</div>
        <div style={{ fontSize: 12, letterSpacing: '.14em', fontWeight: 700, color: c.gold, marginBottom: 18 }}>SCAN TO REGISTER</div>
        <img
          src={qrImageUrl(intakeUrl, 360)}
          alt={`QR code for ${intakeUrl}`}
          width={280}
          height={280}
          style={{ width: 280, height: 280, borderRadius: 12, border: `1px solid ${c.border}` }}
        />
        <div style={{ marginTop: 16, fontSize: 13, color: c.bodyText, wordBreak: 'break-all' }}>{intakeUrl}</div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
        <button type="button" onClick={copy} style={s.btnPrimary}>
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <button type="button" onClick={() => window.print()} style={s.btnGhost}>
          Print QR
        </button>
        <a href={intakeUrl} target="_blank" rel="noreferrer" style={{ ...s.btnGhost, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
          Open form
        </a>
      </div>
    </div>
  );
}
