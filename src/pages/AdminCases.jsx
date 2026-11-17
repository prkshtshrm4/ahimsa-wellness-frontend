import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../api.js';
import { c, font, s } from '../theme.js';
import { Spinner, Toast } from '../components/ui.jsx';

const STATUS_TONE = {
  submitted: { bg: c.amberBg, border: c.amberBorder, color: c.amberText },
  reviewed: { bg: c.greenSoft, border: c.greenBorder, color: c.greenText },
  closed: { bg: '#F3F1EC', border: c.line, color: c.muted },
};

export default function AdminCases() {
  const { id } = useParams();
  if (id) return <CaseDetail id={id} />;
  return <CaseList />;
}

function CaseList() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (status) params.set('status', status);
    api
      .get(`/admin/cases?${params}`)
      .then((d) => setRows(d.cases))
      .catch((e) => setToast({ tone: 'error', msg: e.message }));
  };

  useEffect(() => { load(); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={s.page} className="ah-fade">
      {toast && <Toast tone={toast.tone} onClose={() => setToast(null)}>{toast.msg}</Toast>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <div style={s.eyebrow}>CASE SHEETS</div>
          <h1 style={{ ...s.h1, fontSize: 26 }}>Patient intake</h1>
          <p style={{ margin: '6px 0 0', color: c.muted, fontSize: 13.5, maxWidth: 420 }}>
            Forms submitted via the drive QR code. Doctors fill clinical findings here.
          </p>
        </div>
        <Link to="/admin/intake-qr" style={{ ...s.btnPrimary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
          Show QR code
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="Search name, phone, patient no."
          style={{ ...s.input, marginTop: 0, maxWidth: 280 }}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...s.input, marginTop: 0, width: 160 }}>
          <option value="">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="reviewed">Reviewed</option>
          <option value="closed">Closed</option>
        </select>
        <button type="button" onClick={load} style={s.btnGhost}>Search</button>
      </div>

      {!rows ? (
        <Spinner center />
      ) : rows.length === 0 ? (
        <div style={{ ...s.cardBox, textAlign: 'center', padding: 40, color: c.muted }}>
          No case sheets yet. Share the QR at the drive desk.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((row) => {
            const tone = STATUS_TONE[row.status] || STATUS_TONE.submitted;
            return (
              <button
                key={row._id}
                type="button"
                onClick={() => navigate(`/admin/cases/${row._id}`)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 12,
                  textAlign: 'left',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: `1px solid ${c.border}`,
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{row.name}</div>
                  <div style={{ fontSize: 12.5, color: c.muted, marginTop: 2 }}>
                    {row.patientNo} · {row.phone}
                    {row.age != null ? ` · ${row.age}y` : ''}
                    {row.gender ? ` · ${row.gender}` : ''}
                  </div>
                  {row.complaintPhysical && (
                    <div style={{ fontSize: 12.5, color: c.bodyText, marginTop: 6, lineHeight: 1.4 }}>
                      {row.complaintPhysical.slice(0, 110)}{row.complaintPhysical.length > 110 ? '…' : ''}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', padding: '4px 8px', borderRadius: 6, background: tone.bg, border: `1px solid ${tone.border}`, color: tone.color }}>
                    {row.status}
                  </span>
                  <span style={{ fontSize: 11, color: c.muted }}>
                    {new Date(row.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', color: c.mutedWarm, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 14, color: c.charcoal, marginTop: 3, whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>{value}</div>
    </div>
  );
}

function CaseDetail({ id }) {
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [clinical, setClinical] = useState({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/admin/cases/${id}`),
      api.get('/admin/doctors').catch(() => ({ doctors: [] })),
    ])
      .then(([a, b]) => {
        setSheet(a.caseSheet);
        setDoctors(b.doctors || []);
        setClinical({
          facialDiagnosis: a.caseSheet.facialDiagnosis || '',
          irisDiagnosis: a.caseSheet.irisDiagnosis || '',
          pulseDiagnosis: a.caseSheet.pulseDiagnosis || '',
          navelDiagnosis: a.caseSheet.navelDiagnosis || '',
          tongueDiagnosis: a.caseSheet.tongueDiagnosis || '',
          provisionalDiagnosis: a.caseSheet.provisionalDiagnosis || '',
          finalDiagnosis: a.caseSheet.finalDiagnosis || '',
          dateOfAdmission: a.caseSheet.dateOfAdmission || '',
          dateOfDischarge: a.caseSheet.dateOfDischarge || '',
          assignedDoctorId: a.caseSheet.assignedDoctorId || '',
          status: a.caseSheet.status || 'submitted',
          notes: a.caseSheet.notes || '',
        });
      })
      .catch((e) => setToast({ tone: 'error', msg: e.message }));
  }, [id]);

  const set = (k) => (e) => setClinical((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setBusy(true);
    try {
      const res = await api.patch(`/admin/cases/${id}`, {
        ...clinical,
        assignedDoctorId: clinical.assignedDoctorId || null,
      });
      setSheet(res.caseSheet);
      setToast({ tone: 'info', msg: 'Case sheet saved.' });
    } catch (e) {
      setToast({ tone: 'error', msg: e instanceof ApiError ? e.message : e.message });
    } finally {
      setBusy(false);
    }
  }

  const complaintBits = useMemo(() => {
    if (!sheet) return [];
    return [
      ['Physical', sheet.complaintPhysical],
      ['Mental', sheet.complaintMental],
      ['Social', sheet.complaintSocial],
      ['Sexual', sheet.complaintSexual],
    ].filter(([, v]) => v);
  }, [sheet]);

  if (!sheet) return <Spinner center />;

  return (
    <div style={s.page} className="ah-fade">
      {toast && <Toast tone={toast.tone} onClose={() => setToast(null)}>{toast.msg}</Toast>}

      <button type="button" onClick={() => navigate('/admin/cases')} style={{ ...s.btnGhost, marginBottom: 16, padding: '8px 12px' }}>
        ← All case sheets
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <div style={s.eyebrow}>{sheet.patientNo}</div>
          <h1 style={{ ...s.h1, fontSize: 28 }}>{sheet.name}</h1>
          <div style={{ fontSize: 13, color: c.muted, marginTop: 4 }}>
            {sheet.phone}
            {sheet.age != null ? ` · ${sheet.age} yrs` : ''}
            {sheet.gender ? ` · ${sheet.gender}` : ''}
            {sheet.occupation ? ` · ${sheet.occupation}` : ''}
          </div>
        </div>
        <span style={{
          alignSelf: 'flex-start',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '.04em',
          textTransform: 'uppercase',
          padding: '5px 10px',
          borderRadius: 6,
          ...(STATUS_TONE[sheet.status] || STATUS_TONE.submitted),
          border: `1px solid ${(STATUS_TONE[sheet.status] || STATUS_TONE.submitted).border}`,
          background: (STATUS_TONE[sheet.status] || STATUS_TONE.submitted).bg,
          color: (STATUS_TONE[sheet.status] || STATUS_TONE.submitted).color,
        }}>
          {sheet.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 18 }} className="ah-cases-grid">
        <div style={s.cardBox}>
          <div style={{ fontFamily: font.serif, fontSize: 18, marginBottom: 12 }}>Patient details</div>
          <Field label="Address" value={sheet.address} />
          <Field label="Email" value={sheet.email} />
          <Field label="Marital status" value={sheet.maritalStatus} />
          <Field label="ID card" value={sheet.identificationCard} />
          <Field label="Date of admission" value={sheet.dateOfAdmission} />
          <div style={{ height: 1, background: c.borderSoft, margin: '14px 0' }} />
          <div style={{ fontFamily: font.serif, fontSize: 18, marginBottom: 12 }}>Complaints</div>
          {complaintBits.length === 0 && <div style={{ color: c.muted, fontSize: 13 }}>No complaints noted.</div>}
          {complaintBits.map(([l, v]) => <Field key={l} label={l} value={v} />)}
          <Field label="Addictions" value={sheet.addictions} />
          <Field label="Dietary habits" value={sheet.dietaryHabits} />
          <Field label="Sleep habits" value={sheet.sleepHabits} />
          <div style={{ height: 1, background: c.borderSoft, margin: '14px 0' }} />
          <Field label="Past history" value={sheet.pastHistory} />
          <Field label="Investigations" value={sheet.investigationsDone} />
          <Field label="Medications" value={sheet.medicationsAtPresent} />
          <div style={{ height: 1, background: c.borderSoft, margin: '14px 0' }} />
          <div style={{ fontFamily: font.serif, fontSize: 18, marginBottom: 8 }}>Consent</div>
          <Field label="Signed as" value={sheet.consentSignedName} />
          <Field label="Signed at" value={sheet.consentSignedAt ? new Date(sheet.consentSignedAt).toLocaleString('en-IN') : ''} />
          {sheet.consentSignatureDataUrl && (
            <img src={sheet.consentSignatureDataUrl} alt="Patient signature" style={{ maxWidth: '100%', border: `1px solid ${c.line}`, borderRadius: 8, background: '#FCFAF5' }} />
          )}
        </div>

        <div style={s.cardBox}>
          <div style={{ fontFamily: font.serif, fontSize: 18, marginBottom: 4 }}>Clinical findings</div>
          <p style={{ fontSize: 12.5, color: c.muted, marginTop: 0, marginBottom: 14 }}>Doctor-only — filled after review.</p>

          {[
            ['facialDiagnosis', 'Facial diagnosis / encumbrances'],
            ['irisDiagnosis', 'Iris diagnosis'],
            ['pulseDiagnosis', 'Pulse diagnosis'],
            ['navelDiagnosis', 'Navel diagnosis'],
            ['tongueDiagnosis', 'Tongue diagnosis'],
            ['provisionalDiagnosis', 'Provisional diagnosis'],
            ['finalDiagnosis', 'Final diagnosis'],
          ].map(([k, label]) => (
            <label key={k} style={{ ...s.label, display: 'block', marginBottom: 12 }}>
              {label}
              <textarea value={clinical[k]} onChange={set(k)} rows={2} style={{ ...s.input, resize: 'vertical' }} />
            </label>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={s.label}>Admission
              <input type="date" value={clinical.dateOfAdmission} onChange={set('dateOfAdmission')} style={s.input} />
            </label>
            <label style={s.label}>Discharge
              <input type="date" value={clinical.dateOfDischarge} onChange={set('dateOfDischarge')} style={s.input} />
            </label>
          </div>

          <label style={{ ...s.label, display: 'block', marginTop: 12 }}>
            Assign doctor
            <select value={clinical.assignedDoctorId || ''} onChange={set('assignedDoctorId')} style={s.input}>
              <option value="">Unassigned</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>{d.name} · {d.role}</option>
              ))}
            </select>
          </label>

          <label style={{ ...s.label, display: 'block', marginTop: 12 }}>
            Status
            <select value={clinical.status} onChange={set('status')} style={s.input}>
              <option value="submitted">Submitted</option>
              <option value="reviewed">Reviewed</option>
              <option value="closed">Closed</option>
            </select>
          </label>

          <label style={{ ...s.label, display: 'block', marginTop: 12 }}>
            Internal notes
            <textarea value={clinical.notes} onChange={set('notes')} rows={3} style={{ ...s.input, resize: 'vertical' }} />
          </label>

          <button type="button" onClick={save} disabled={busy} style={{ ...s.btnPrimary, marginTop: 16, width: '100%', opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Saving…' : 'Save clinical notes'}
          </button>
        </div>
      </div>
    </div>
  );
}
