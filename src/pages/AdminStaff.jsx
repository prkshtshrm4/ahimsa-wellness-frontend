import { useEffect, useState } from 'react';
import { api, ApiError } from '../api.js';
import { c, font, s } from '../theme.js';
import { Spinner, Toast, Modal } from '../components/ui.jsx';
import PhoneInput from '../components/PhoneInput.jsx';
import { toE164, isValidIndianMobile } from '../utils/phone.js';

// Module catalogue — label + description for the permission checklist.
const MODULES = [
  { key: 'bookings.read', label: 'Bookings calendar', group: 'Front desk' },
  { key: 'bookings.create', label: 'Walk-in booking', group: 'Front desk' },
  { key: 'bookings.manage', label: 'Manage bookings', group: 'Front desk' },
  { key: 'services.manage', label: 'Services & pricing', group: 'Admin' },
  { key: 'staff.manage', label: 'Staff management', group: 'Admin' },
  { key: 'payments.collect', label: 'Collect payments', group: 'Payments' },
  { key: 'payments.link', label: 'Send payment links', group: 'Payments' },
  { key: 'invoices.read', label: 'Invoices & payments', group: 'Payments' },
  { key: 'schedule.own', label: 'My schedule (own)', group: 'Therapist' },
  { key: 'reports.read', label: 'Reports & KPIs', group: 'Admin' },
];

export default function AdminStaff() {
  const [staff, setStaff] = useState(null);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);
  const [inviting, setInviting] = useState(false);

  const load = () =>
    api.get('/admin/staff').then((d) => {
      setStaff(d.staff);
      setSelected((prev) => d.staff.find((s2) => s2._id === prev?._id) || d.staff[0] || null);
    });
  useEffect(() => { load(); }, []);

  async function toggleModule(key) {
    if (!selected) return;
    const has = selected.grantedModules.includes(key);
    const next = has ? selected.grantedModules.filter((k) => k !== key) : [...selected.grantedModules, key];
    // optimistic
    setSelected({ ...selected, grantedModules: next });
    try {
      const res = await api.patch(`/admin/staff/${selected._id}`, { grantedModules: next });
      setSelected(res.staff);
      setStaff((list) => list.map((x) => (x._id === res.staff._id ? res.staff : x)));
    } catch (e) {
      setSelected({ ...selected }); // revert
      if (e instanceof ApiError && e.code === 'last_admin') setToast({ tone: 'error', msg: 'You cannot remove the last remaining admin.' });
      else setToast({ tone: 'error', msg: e.message });
    }
  }

  if (!staff) return <Spinner center />;

  return (
    <div style={s.page} className="ah-fade">
      {toast && <Toast tone={toast.tone} onClose={() => setToast(null)}>{toast.msg}</Toast>}
      {inviting && <InviteModal onClose={() => setInviting(false)} onDone={() => { setInviting(false); load(); }} />}

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Team list */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={s.sectionLabel}>TEAM · {staff.length}</div>
            <span onClick={() => setInviting(true)} style={{ fontSize: 13, fontWeight: 600, color: c.teal, cursor: 'pointer' }}>＋ Invite</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {staff.map((st) => {
              const active = selected?._id === st._id;
              return (
                <div key={st._id} onClick={() => setSelected(st)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 12, cursor: 'pointer', background: active ? c.greenSoft : '#fff', border: `1px solid ${active ? c.teal : c.border}` }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: c.teal, color: c.ivory, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                    {st.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{st.name}</div>
                    <div style={{ fontSize: 12, color: c.muted }}>{st.role}</div>
                  </div>
                  <div style={{ fontSize: 11, color: c.mutedWarm }}>{st.grantedModules.length} modules</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Permission checklist */}
        {selected && (
          <div style={s.cardBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: c.teal, color: c.ivory, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                {selected.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </div>
              <div>
                <div style={{ fontFamily: font.serif, fontSize: 20 }}>{selected.name}</div>
                <div style={{ fontSize: 12.5, color: c.muted }}>{selected.role} · {selected.email}</div>
              </div>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 12 }}>Modules this person can access</div>
            <div style={{ fontSize: 12, color: c.muted, marginBottom: 16, lineHeight: 1.5 }}>
              Their sidebar shows only what's ticked. Untick a module and it disappears from their view — no broken links.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {MODULES.map((m) => {
                const on = selected.grantedModules.includes(m.key);
                return (
                  <div key={m.key} onClick={() => toggleModule(m.key)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 13px', borderRadius: 11, cursor: 'pointer', background: on ? c.greenSoft : '#fff', border: `1px solid ${on ? c.teal : c.line}` }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${on ? c.teal : c.line}`, background: on ? c.teal : 'transparent', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{on ? '✓' : ''}</div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.label}</div>
                      <div style={{ fontSize: 11, color: c.mutedWarm }}>{m.group}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InviteModal({ onClose, onDone }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'Receptionist' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit() {
    if (!isValidIndianMobile(form.phone)) {
      setErr('Enter a valid 10-digit mobile number.');
      return;
    }
    try {
      setBusy(true);
      await api.post('/admin/staff/invite', {
        ...form,
        phone: toE164(form.phone),
        grantedModules: ['bookings.read'],
      });
      onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} width={460}>
      <div style={{ fontFamily: font.serif, fontSize: 20, marginBottom: 4 }}>Invite a team member</div>
      <div style={{ fontSize: 12.5, color: c.muted, marginBottom: 16 }}>They sign in with their registered mobile via OTP.</div>
      {err && <div style={{ fontSize: 12.5, color: c.dangerText, marginBottom: 10 }}>{err}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={s.label}>Name<input value={form.name} onChange={set('name')} style={s.input} /></label>
        <label style={s.label}>Email<input value={form.email} onChange={set('email')} placeholder="name@ahimsa.in" style={s.input} /></label>
        <label style={s.label}>
          Mobile number
          <PhoneInput value={form.phone} onChange={(digits) => setForm({ ...form, phone: digits })} />
        </label>
        <label style={s.label}>Role<input value={form.role} onChange={set('role')} style={s.input} /></label>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
        <button onClick={onClose} style={s.btnGhost}>Cancel</button>
        <button onClick={submit} disabled={busy || !form.name || !form.email || !isValidIndianMobile(form.phone)} style={{ ...s.btnPrimary, opacity: busy || !form.name || !form.email || !isValidIndianMobile(form.phone) ? 0.5 : 1 }}>Add staff</button>
      </div>
    </Modal>
  );
}
