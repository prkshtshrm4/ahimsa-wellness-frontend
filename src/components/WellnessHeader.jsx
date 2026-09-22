import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export function Brand() {
  return <Link className="wellness-brand" to="/" aria-label="Ahimsa Wellness Centre home"><img src="/assets/ahimsa-logo.jpg" alt="" /><span>ahimsa<small>WELLNESS CENTRE</small></span></Link>;
}
export default function WellnessHeader() {
  const [open,setOpen]=useState(false);
  const {isPatient,isStaff}=useAuth();
  const location=useLocation();
  useEffect(() => { setOpen(false); if (!location.hash) window.scrollTo(0,0); else requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView()); }, [location.pathname,location.hash,location.key]);
  useEffect(() => { const key=e=>{if(e.key==='Escape')setOpen(false);}; window.addEventListener('keydown',key); return()=>window.removeEventListener('keydown',key); },[]);
  const account=isStaff?'/admin/today':isPatient?'/dashboard':'/login';
  return <header className="wellness-header"><Brand/><nav className="wellness-desktop" aria-label="Main navigation"><Link to="/#our-story">Our story</Link><Link to="/#therapies">Therapies</Link><Link to="/#the-centre">The centre</Link><Link to="/#visit">Visit us</Link></nav><div className="wellness-header-actions"><Link className="wellness-account" to={account}>{isStaff?'Workspace':'My bookings'}</Link><Link className="wellness-button small" to="/book">Book a visit <span aria-hidden="true">↗</span></Link><button className="wellness-menu-toggle" aria-expanded={open} aria-controls="wellness-mobile-nav" onClick={()=>setOpen(!open)} aria-label={open?'Close menu':'Open menu'}>{open?'✕':'☰'}</button></div><nav id="wellness-mobile-nav" className="wellness-mobile" aria-label="Mobile navigation" hidden={!open}>{[['/#our-story','Our story'],['/#therapies','Therapies'],['/#the-centre','The centre'],['/#visit','Visit us'],[account,isStaff?'Workspace':'My bookings']].map(([to,label])=><Link key={to} to={to} onClick={()=>setOpen(false)}>{label}<span aria-hidden="true">↗</span></Link>)}</nav></header>;
}
