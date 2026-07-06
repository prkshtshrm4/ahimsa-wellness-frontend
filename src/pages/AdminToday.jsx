import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { c, font, s } from '../theme.js';
import { Spinner, StatusPill, EmptyState } from '../components/ui.jsx';

const today = () => new Date().toISOString().slice(0, 10);

export default function AdminToday() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [rows, setRows] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get(`/admin/bookings?date=${today()}`).then((d) => setRows(d.rows)).catch(() => setRows([]));
    if (can('reports.read')) {
      api.get(`/admin/stats?date=${today()}`).then(setStats).catch(() => setStats(null));
    }
  }, [can]);

  const dayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={s.page} className="ah-fade">
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 22 }}>
          <Tile label="Sessions today" value={stats.sessionsToday} />
          <Tile label="Walk-ins" value={stats.walkIns} />
          <Tile label="Awaiting payment" value={stats.awaitingPayment} amber />
          <Tile label="Capacity used" value={`${stats.capacityUsedPct}%`} />
        </div>
      )}

      <div style={{ background: '#fff', border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: `1px solid ${c.border}` }}>
          <div style={{ fontFamily: font.serif, fontSize: 18 }}>{dayLabel}</div>
          {can('bookings.create') && (
            <button onClick={() => navigate('/admin/new')} style={{ ...s.btnPrimary, padding: '8px 15px', fontSize: 13 }}>＋ New booking</button>
          )}
        </div>

        {!rows ? (
          <Spinner center />
        ) : rows.length === 0 ? (
          <div style={{ padding: 30 }}>
            <EmptyState icon="◷" title="A quiet day so far" sub="No bookings on the calendar yet. New walk-ins and online bookings will appear here." />
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 150px 130px 120px', gap: 12, padding: '11px 18px', background: '#FCFBF7', borderBottom: `1px solid ${c.border}`, fontSize: 10.5, letterSpacing: '.1em', color: c.mutedWarm, fontWeight: 700 }}>
              <div>TIME</div><div>PATIENT / SERVICE</div><div>THERAPIST</div><div>ROOM</div><div>STATUS</div>
            </div>
            {rows.map((r) => (
              <div key={r._id} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 150px 130px 120px', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${c.borderSoft}`, alignItems: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: c.teal, fontVariantNumeric: 'tabular-nums' }}>{r.startTime}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                    {r.patientName || <span style={{ color: c.mutedWarm }}>Open slot</span>}
                    {r.source === 'frontDesk' && <span style={{ fontSize: 11, color: c.mutedWarm, fontWeight: 500 }}> (walk-in)</span>}
                  </div>
                  <div style={{ fontSize: 12, color: c.muted }}>{r.serviceName}</div>
                </div>
                <div style={{ fontSize: 13, color: c.bodyText }}>{r.therapistName}</div>
                <div style={{ fontSize: 13, color: c.bodyText }}>{r.room}</div>
                <div><StatusPill status={r.status} /></div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function Tile({ label, value, amber }) {
  return (
    <div style={{ background: amber ? c.amberBg : '#fff', border: `1px solid ${amber ? c.amberBorder : c.border}`, borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 11.5, color: amber ? c.amberText : c.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: font.serif, fontSize: 28, color: amber ? c.amberText : c.teal }}>{value}</div>
    </div>
  );
}
