import { useEffect, useState } from 'react';
import { api, ApiError } from '../api.js';
import { c, font, s, rupees } from '../theme.js';
import { Spinner, Toast, Modal } from '../components/ui.jsx';

const empty = { name: '', category: '', blurb: '', priceInPaise: 0, durationMin: 45, capacity: 1, capacityUnit: 'spots', active: true };

export default function AdminServices() {
  const [services, setServices] = useState(null);
  const [editing, setEditing] = useState(null); // service or new
  const [toast, setToast] = useState(null);

  const load = () => api.get('/services?includeInactive=true').then((d) => setServices(d.services)).catch(() => setServices([]));
  useEffect(() => { load(); }, []);

  async function save(form) {
    try {
      const body = {
        name: form.name,
        category: form.category,
        blurb: form.blurb,
        priceInPaise: Math.round(Number(form.price) * 100),
        durationMin: Number(form.durationMin),
        capacity: Number(form.capacity),
        capacityUnit: form.capacityUnit,
        active: form.active,
      };
      if (form._id) await api.patch(`/admin/services/${form._id}`, body);
      else await api.post('/admin/services', body);
      setEditing(null);
      setToast({ tone: 'info', msg: 'Service saved.' });
      load();
    } catch (e) {
      setToast({ tone: 'error', msg: e.details?.fields ? `Check: ${e.details.fields.join(', ')}` : e.message });
    }
  }

  async function remove(svc) {
    if (!confirm(`Delete “${svc.name}”?`)) return;
    try {
      await api.del(`/admin/services/${svc._id}`);
      setToast({ tone: 'info', msg: 'Service deleted.' });
      load();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'service_in_use') {
        if (confirm('Future bookings use this service. Deactivate it instead (hides it from patients, keeps history)?')) {
          await api.patch(`/admin/services/${svc._id}`, { active: false });
          load();
        }
      } else setToast({ tone: 'error', msg: e.message });
    }
  }

  if (!services) return <Spinner center />;

  return (
    <div style={s.page} className="ah-fade">
      {toast && <Toast tone={toast.tone} onClose={() => setToast(null)}>{toast.msg}</Toast>}
      {editing && <ServiceModal initial={editing} onClose={() => setEditing(null)} onSave={save} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ ...s.sectionLabel }}>{services.length} SERVICES</div>
        <button onClick={() => setEditing({ ...empty, price: '' })} style={{ ...s.btnPrimary, padding: '9px 16px', fontSize: 13 }}>＋ Add service</button>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 90px 90px 100px 80px', gap: 12, padding: '11px 18px', background: '#FCFBF7', borderBottom: `1px solid ${c.border}`, fontSize: 10.5, letterSpacing: '.1em', color: c.mutedWarm, fontWeight: 700 }}>
          <div>SERVICE</div><div>CATEGORY</div><div>PRICE</div><div>DURATION</div><div>CAPACITY</div><div></div>
        </div>
        {services.map((svc) => (
          <div key={svc._id} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 90px 90px 100px 80px', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${c.borderSoft}`, alignItems: 'center', opacity: svc.active ? 1 : 0.55 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{svc.name} {!svc.active && <span style={{ fontSize: 11, color: c.mutedWarm }}>· inactive</span>}</div>
              <div style={{ fontSize: 11.5, color: c.muted }}>{svc.therapistName}</div>
            </div>
            <div style={{ fontSize: 12, color: c.bodyText }}>{svc.category}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: c.teal }}>₹{rupees(svc.priceInPaise)}</div>
            <div style={{ fontSize: 13, color: c.bodyText }}>{svc.durationMin} min</div>
            <div style={{ fontSize: 13, color: c.bodyText }}>{svc.capacity} {svc.capacityUnit}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span onClick={() => setEditing({ ...svc, price: (svc.priceInPaise / 100).toString() })} style={{ cursor: 'pointer', color: c.teal, fontSize: 13, fontWeight: 600 }}>Edit</span>
              <span onClick={() => remove(svc)} style={{ cursor: 'pointer', color: c.dangerText, fontSize: 13, fontWeight: 600 }}>Del</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState({
    _id: initial._id,
    name: initial.name || '',
    category: initial.category || '',
    blurb: initial.blurb || '',
    price: initial.price ?? '',
    durationMin: initial.durationMin || 45,
    capacity: initial.capacity || 1,
    capacityUnit: initial.capacityUnit || 'spots',
    active: initial.active ?? true,
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Modal onClose={onClose}>
      <div style={{ fontFamily: font.serif, fontSize: 20, marginBottom: 16 }}>{form._id ? 'Edit service' : 'Add service'}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
        <label style={{ ...s.label, gridColumn: '1 / -1' }}>Name<input value={form.name} onChange={set('name')} style={s.input} /></label>
        <label style={{ ...s.label, gridColumn: '1 / -1' }}>Category<input value={form.category} onChange={set('category')} placeholder="e.g. HYDRO & MUD THERAPY" style={s.input} /></label>
        <label style={{ ...s.label, gridColumn: '1 / -1' }}>Blurb<textarea value={form.blurb} onChange={set('blurb')} rows={2} style={{ ...s.input, resize: 'vertical' }} /></label>
        <label style={s.label}>Price (₹)<input value={form.price} onChange={set('price')} type="number" style={s.input} /></label>
        <label style={s.label}>Duration (min)<input value={form.durationMin} onChange={set('durationMin')} type="number" style={s.input} /></label>
        <label style={s.label}>Capacity<input value={form.capacity} onChange={set('capacity')} type="number" style={s.input} /></label>
        <label style={s.label}>Unit<input value={form.capacityUnit} onChange={set('capacityUnit')} placeholder="tubs / rooms / mats" style={s.input} /></label>
        <label style={{ ...s.label, gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active (visible to patients)
        </label>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
        <button onClick={onClose} style={s.btnGhost}>Cancel</button>
        <button onClick={() => onSave(form)} style={s.btnPrimary}>Save service</button>
      </div>
    </Modal>
  );
}
