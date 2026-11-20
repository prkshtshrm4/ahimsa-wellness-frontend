import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { c, s } from '../theme.js';
import { Spinner, Toast } from '../components/ui.jsx';

const GENDER_LABEL = {
  female: 'Female',
  male: 'Male',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
};

const SLOT_LABEL = {
  '7-8am': '7–8 am',
  '8-9am': '8–9 am',
  '4-5pm': '4–5 pm',
};

export default function AdminYogaRegistrations() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [toast, setToast] = useState(null);

  const load = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    api
      .get(`/admin/yoga-registrations?${params}`)
      .then((d) => setRows(d.registrations || []))
      .catch((e) => setToast({ tone: 'error', msg: e.message }));
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={s.page} className="ah-fade">
      {toast && (
        <Toast tone={toast.tone} onClose={() => setToast(null)}>
          {toast.msg}
        </Toast>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        <div>
          <div style={s.eyebrow}>YOGA</div>
          <h1 style={{ ...s.h1, fontSize: 26 }}>Registrations</h1>
          <p style={{ margin: '6px 0 0', color: c.muted, fontSize: 13.5, maxWidth: 440 }}>
            Responses from the public yoga registration form.
          </p>
        </div>
        <Link
          to="/yogaregistration"
          target="_blank"
          rel="noreferrer"
          style={{ ...s.btnGhost, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
        >
          Open form
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="Search name, WhatsApp, email"
          style={{ ...s.input, marginTop: 0, maxWidth: 320 }}
        />
        <button type="button" onClick={load} style={s.btnGhost}>
          Search
        </button>
        <button type="button" onClick={load} style={s.btnPrimary}>
          Refresh
        </button>
      </div>

      {!rows ? (
        <Spinner center />
      ) : rows.length === 0 ? (
        <div style={{ ...s.cardBox, textAlign: 'center', padding: 40, color: c.muted }}>
          No yoga registrations yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((row) => (
            <div
              key={row._id}
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                border: `1px solid ${c.border}`,
                background: '#fff',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{row.name}</div>
                  <div style={{ fontSize: 12.5, color: c.muted, marginTop: 3 }}>
                    {row.whatsapp} · {row.email}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: c.muted }}>
                  {new Date(row.createdAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginTop: 10,
                  alignItems: 'center',
                }}
              >
                {(row.slots || []).map((slot) => (
                  <span
                    key={slot}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '.03em',
                      padding: '4px 8px',
                      borderRadius: 999,
                      background: c.greenSoft,
                      border: `1px solid ${c.greenBorder}`,
                      color: c.greenText,
                    }}
                  >
                    {SLOT_LABEL[slot] || slot}
                  </span>
                ))}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '4px 8px',
                    borderRadius: 999,
                    background: c.amberBg,
                    border: `1px solid ${c.amberBorder}`,
                    color: c.amberText,
                  }}
                >
                  {GENDER_LABEL[row.gender] || row.gender}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
