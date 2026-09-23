import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { s, rupees } from '../theme.js';
import { Spinner, Toast } from '../components/ui.jsx';

const blank = { name: '', blurb: '', price: '', durationMin: 60, visitCount: 1, capacity: 1, inclusions: '', serviceIds: [], active: true };

export default function AdminPackages() {
  const [packages, setPackages] = useState(null);
  const [services, setServices] = useState([]);
  const [serviceError, setServiceError] = useState('');
  const [search, setSearch] = useState('');
  const loadServices = async () => {
    try { const data = await api.get('/services?includeInactive=true&kind=service'); setServices(data.services); setServiceError(''); }
    catch (e) { setServiceError(e.message); }
  };
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const dialog = useRef(null);
  const load = async () => {
    setError('');
    try { const data = await api.get('/admin/packages'); setPackages(data.packages); }
    catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); loadServices(); }, []);
  useEffect(() => { if (editing) dialog.current?.showModal(); else dialog.current?.close(); }, [!!editing]);
  const edit = p => { setSearch(''); loadServices(); setEditing(p ? { ...p, serviceIds: (p.includedServices || []).map(s => s.serviceId), price: (p.priceInPaise / 100).toString(), inclusions: (p.inclusions || []).join('\n') } : { ...blank }); };
  const set = (key, value) => setEditing(old => ({ ...old, [key]: value }));
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const body = { serviceIds: editing.serviceIds, name: editing.name.trim(), blurb: editing.blurb.trim(), priceInPaise: Math.round(Number(editing.price) * 100), durationMin: Number(editing.durationMin), capacity: Number(editing.capacity), visitCount: Number(editing.visitCount), active: editing.active, inclusions: editing.inclusions.split('\n').map(x => x.trim()).filter(Boolean) };
      if (editing._id) await api.patch(`/admin/packages/${editing._id}`, body);
      else await api.post('/admin/packages', body);
      setEditing(null); setToast({ tone: 'info', text: 'Package saved.' }); await load();
    } catch (e) { setToast({ tone: 'error', text: e.details?.fields ? `Check: ${e.details.fields.join(', ')}` : e.message }); }
    finally { setBusy(false); }
  }
  async function change(p, action) {
    if (action === 'delete' && !window.confirm(`Delete “${p.name}”? Packages with bookings must be deactivated instead.`)) return;
    setBusy(true);
    try {
      if (action === 'delete') await api.del(`/admin/packages/${p._id}`);
      else await api.patch(`/admin/packages/${p._id}`, { active: !p.active });
      setToast({ tone: 'info', text: action === 'delete' ? 'Package deleted.' : 'Package visibility updated.' });
      await load();
    } catch (e) { setToast({ tone: 'error', text: e.message }); }
    finally { setBusy(false); }
  }
  return <div style={s.page} className="package-admin">
    {toast && <Toast tone={toast.tone} onClose={() => setToast(null)}>{toast.text}</Toast>}
    <div className="package-admin-heading"><div><h1 style={s.h1}>Packages</h1><p>Create one-visit or multi-day plans. Each included visit is scheduled separately.</p></div><button style={s.btnPrimary} onClick={() => edit()} disabled={busy}>＋ Add package</button></div>
    {error ? <div role="alert" className="package-message">{error} <button onClick={load}>Try again</button></div> : !packages ? <Spinner center /> : packages.length === 0 ? <p className="package-message">No packages yet. Add your first package to make it available online.</p> : <div className="package-admin-grid">{packages.map(p => <article key={p._id} className="package-admin-card"><div className="package-card-label">{p.active ? 'ACTIVE' : 'INACTIVE'} · {p.visitCount} {p.visitCount === 1 ? 'VISIT' : 'VISITS'}</div><h2>{p.name}</h2><p>{p.blurb}</p><strong>₹{rupees(p.priceInPaise)}</strong><p>{p.durationMin} min per visit · {p.capacity} appointments per time slot</p><ul>{(p.includedServices || []).map(item => <li key={item.serviceId}>{item.name}</li>)}{p.inclusions.map((item, i) => <li key={i}>{item}</li>)}</ul><div className="package-admin-actions"><button onClick={() => edit(p)} disabled={busy}>Edit</button><button onClick={() => change(p, 'toggle')} disabled={busy}>{p.active ? 'Deactivate' : 'Activate'}</button><button onClick={() => change(p, 'delete')} disabled={busy}>Delete</button></div></article>)}</div>}
    <dialog ref={dialog} className="package-editor" onCancel={e => { if (busy) e.preventDefault(); else setEditing(null); }} onClose={() => { if (!busy) setEditing(null); }}>
      {editing && <form onSubmit={save}>
        <h2>{editing._id ? 'Edit package' : 'Add package'}</h2>
        {toast?.tone === 'error' && <p role="alert">{toast.text}</p>}
        <fieldset disabled={busy}><div className="package-form-grid">
          <label className="full">Name<input autoFocus required maxLength={120} value={editing.name} onChange={e => set('name', e.target.value)} /></label>
          <label className="full">Description<textarea rows={3} maxLength={1200} value={editing.blurb} onChange={e => set('blurb', e.target.value)} /></label>
          <label>Total package price (₹)<input type="number" required min="0.01" max="1000000" step="0.01" value={editing.price} onChange={e => set('price', e.target.value)} /></label>
          <label>Number of visits / days<input type="number" required min="1" max="365" step="1" value={editing.visitCount} onChange={e => set('visitCount', e.target.value)} /></label>
          <label>Minutes per visit<input type="number" required min="5" max="600" step="1" value={editing.durationMin} onChange={e => set('durationMin', e.target.value)} /></label>
          <label>Capacity per time slot<input type="number" required min="1" max="100" step="1" value={editing.capacity} onChange={e => set('capacity', e.target.value)} /></label>
          <div className="full package-service-picker">
            <label htmlFor="package-service-search">Included services · {editing.serviceIds.length} selected</label>
            <p>Select existing services below. To add a service exclusively for packages, create it in <a href="/admin/services" target="_blank" rel="noreferrer">Services ↗</a> and mark it “Package only”.</p>
            <input id="package-service-search" type="search" placeholder="Search services…" value={search} onChange={e => setSearch(e.target.value)} />
            <button type="button" onClick={loadServices}>Refresh services</button>
            {serviceError && <p role="alert">Couldn’t load services: {serviceError}</p>}
            <div className="package-service-options">{services.filter(s => `${s.name} ${s.category}`.toLowerCase().includes(search.toLowerCase())).map(service => <label key={service._id} className="package-service-option">
              <input type="checkbox" checked={editing.serviceIds.includes(service._id)} disabled={!service.active && !editing.serviceIds.includes(service._id)} onChange={e => set('serviceIds', e.target.checked ? [...editing.serviceIds, service._id] : editing.serviceIds.filter(id => id !== service._id))} />
              <span><strong>{service.name}</strong><small>{service.category} · {service.durationMin} min{service.packageOnly ? ' · Package only' : ''}{!service.active ? ' · Inactive' : ''}</small></span>
            </label>)}</div>
            {!services.length && !serviceError && <p>No services yet. Create a service, then refresh this list.</p>}
          </div>
          <label className="full">Additional inclusions (one per line)<textarea rows={4} value={editing.inclusions} onChange={e => set('inclusions', e.target.value)} /></label>
          <label className="full package-checkbox"><input type="checkbox" checked={editing.active} onChange={e => set('active', e.target.checked)} /> Visible to patients</label>
        </div><p className="package-editor-note">Price covers all visits. Duration and capacity apply to each appointment. Reserve dedicated capacity for the package; inclusions do not automatically reserve other therapy rooms. Select at least one service or add an inclusion. Existing purchases keep their original visit count and inclusions.</p><div className="package-admin-actions"><button type="button" onClick={() => setEditing(null)}>Cancel</button><button type="submit" style={s.btnPrimary}>{busy ? 'Saving…' : 'Save package'}</button></div></fieldset>
      </form>}
    </dialog>
  </div>;
}
