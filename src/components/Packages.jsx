import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { rupees } from '../theme.js';
import { useAuth } from '../auth.jsx';

export default function Packages() {
  const [packages, setPackages] = useState(null);
  const [error, setError] = useState(false);
  const { isPatient } = useAuth();
  async function load() {
    setError(false);
    try { const data = await api.get('/packages', { auth: false }); setPackages(data.packages); }
    catch { setError(true); }
  }
  useEffect(() => { load(); }, []);
  return <section id="packages" className="wellness-packages section-wrap">
    <div className="section-kicker"><span className="wellness-eyebrow">CARE THAT CONTINUES</span><span>One visit, or a rhythm of regular care.</span></div>
    <div className="section-heading"><h2>Make wellbeing<br/>a <em>practice.</em></h2><p>Choose a package, book your first visit, and schedule the remaining days from your account.</p></div>
    {error ? <p className="package-message" role="status">We couldn’t load packages. <button onClick={load}>Try again</button></p> : !packages ? <p role="status">Loading packages…</p> : packages.length === 0 ? <p className="package-message">Packages will appear here when available. <Link to="/book">Explore individual appointments ↗</Link></p> : <div className="package-public-grid">{packages.map(p => {
      const destination = `/book?service=${p._id}`;
      return <article key={p._id} className="package-public-card"><span className="wellness-eyebrow">{p.visitCount} {p.visitCount === 1 ? 'VISIT' : 'DAYS / VISITS'}</span><h3>{p.name}</h3><p>{p.blurb}</p><ul>{p.inclusions.map((item,i) => <li key={i}>{item}</li>)}</ul><div className="package-price">₹{rupees(p.priceInPaise)}<small>Total · {p.durationMin} min per visit</small></div><Link to={isPatient ? destination : '/login'} state={isPatient ? undefined : { from: destination }} className="wellness-button" aria-label={`Book now: ${p.name}`}>Book now <span aria-hidden="true">↗</span></Link></article>;
    })}</div>}
  </section>;
}
