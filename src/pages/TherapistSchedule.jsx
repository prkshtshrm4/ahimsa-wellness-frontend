import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { c, font, s } from '../theme.js';
import { Spinner, EmptyState } from '../components/ui.jsx';

export default function TherapistSchedule() {
  const [data, setData] = useState(null);
  const date = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    api.get(`/me/schedule?date=${date}`).then(setData).catch(() => setData({ rows: [], sessionCount: 0 }));
  }, [date]);

  if (!data) return <Spinner center />;

  const dayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '34px 30px 80px' }} className="ah-fade">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ ...s.h1 }}>{dayLabel}</h1>
          <div style={{ fontSize: 13, color: c.muted, marginTop: 4 }}>{data.sessionCount} session{data.sessionCount === 1 ? '' : 's'} on your schedule.</div>
        </div>
      </div>

      {data.rows.length === 0 ? (
        <EmptyState icon="◷" title="No sessions today — enjoy the stillness" sub="Your schedule is clear. New bookings assigned to you will appear here." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.rows.map((r, i) => (
            <div key={i} style={{ ...s.cardBox, display: 'flex', gap: 18, alignItems: 'flex-start' }}>
              <div style={{ textAlign: 'center', minWidth: 64 }}>
                <div style={{ fontFamily: font.serif, fontSize: 22, color: c.teal, fontVariantNumeric: 'tabular-nums' }}>{r.startTime}</div>
              </div>
              <div style={{ flex: 1, borderLeft: `1px solid ${c.borderSoft}`, paddingLeft: 18 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{r.serviceName}</div>
                <div style={{ fontSize: 13, color: c.bodyText, marginTop: 2 }}>{r.patientName} · {r.room}</div>
                {r.note && (
                  <div style={{ marginTop: 10, fontSize: 12.5, color: c.amberText, background: c.amberBg, border: `1px solid ${c.amberBorder}`, borderRadius: 8, padding: '8px 11px', display: 'inline-block' }}>
                    ◈ {r.note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
