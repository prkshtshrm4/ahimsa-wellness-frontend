import { c, font } from '../theme.js';

export function Logo({ size = 44, showWord = false, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: '#fff',
          border: `1px solid ${c.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <img
          src="/assets/ahimsa-logo.jpg"
          alt="Ahimsa"
          style={{ width: '112%', height: '112%', objectFit: 'cover', objectPosition: 'center 34%' }}
        />
      </div>
      {showWord && (
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontFamily: font.serif, fontWeight: 600, fontSize: 18, letterSpacing: '.06em' }}>AHIMSA</div>
          <div style={{ fontSize: 9.5, letterSpacing: '.22em', color: c.sage, fontWeight: 600, marginTop: 3 }}>
            {sub || 'WELLNESS • GURUGRAM'}
          </div>
        </div>
      )}
    </div>
  );
}

const PILL = {
  confirmed: { bg: c.greenSoft, border: c.greenBorder, color: c.teal, label: 'Confirmed' },
  completed: { bg: '#F1F0EC', border: '#E2DBCC', color: '#6B7280', label: 'Completed' },
  pendingPayment: { bg: c.amberBg, border: c.amberBorder, color: c.amberText, label: 'Pending payment' },
  partiallyPaid: { bg: c.amberBg, border: c.amberBorder, color: c.amberText, label: 'Partially paid' },
  cancelled: { bg: '#FBEFEA', border: c.dangerBorder, color: c.dangerText, label: 'Cancelled' },
  noShow: { bg: '#FBEFEA', border: c.dangerBorder, color: c.dangerText, label: 'No-show' },
  open: { bg: '#F2F4F1', border: '#DCE4DA', color: '#7C8A80', label: 'Open' },
};

export function StatusPill({ status }) {
  const p = PILL[status] || PILL.open;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11.5,
        fontWeight: 700,
        padding: '3px 11px',
        borderRadius: 999,
        color: p.color,
        background: p.bg,
        border: `1px solid ${p.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {p.label}
    </span>
  );
}

export function Spinner({ center }) {
  const el = <div className="ah-spinner" />;
  if (!center) return el;
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>{el}</div>;
}

export function EmptyState({ icon = '✦', title, sub, action }) {
  return (
    <div
      style={{
        background: c.card,
        border: `1px solid #E6EDE4`,
        borderRadius: 16,
        padding: '46px 30px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: '#F3F7F4',
          border: `1px solid ${c.greenBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 18px',
          color: c.teal,
          fontSize: 22,
        }}
      >
        {icon}
      </div>
      <div style={{ fontFamily: font.serif, fontSize: 24, marginBottom: 6 }}>{title}</div>
      {sub && <div style={{ fontSize: 14, color: c.muted, maxWidth: 380, margin: '0 auto 22px' }}>{sub}</div>}
      {action}
    </div>
  );
}

export function Toast({ tone = 'info', children, onClose }) {
  const tones = {
    info: { bg: c.greenSoft, border: c.greenBorder, color: c.teal },
    error: { bg: '#FBEFEA', border: c.dangerBorder, color: c.dangerText },
    amber: { bg: c.amberBg, border: c.amberBorder, color: c.amberText },
  };
  const t = tones[tone] || tones.info;
  return (
    <div
      style={{
        position: 'fixed',
        top: 18,
        right: 18,
        zIndex: 50,
        background: t.bg,
        border: `1px solid ${t.border}`,
        color: t.color,
        borderRadius: 12,
        padding: '13px 16px',
        fontSize: 13.5,
        fontWeight: 600,
        maxWidth: 360,
        boxShadow: '0 10px 30px rgba(28,75,67,.12)',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <span style={{ flex: 1 }}>{children}</span>
      {onClose && (
        <span onClick={onClose} style={{ cursor: 'pointer', opacity: 0.6 }}>
          ✕
        </span>
      )}
    </div>
  );
}

export function Modal({ children, onClose, width = 560 }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26,31,43,.42)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '60px 20px',
        zIndex: 40,
        animation: 'ahOverlay .2s ease both',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: c.card,
          borderRadius: 16,
          width: '100%',
          maxWidth: width,
          padding: 24,
          animation: 'ahRise .28s ease both',
          boxShadow: '0 24px 60px rgba(26,31,43,.24)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
