import { useState } from 'react';
import { NavLink, useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Logo } from './ui.jsx';
import { c, font } from '../theme.js';

const HEADERS = [
  { match: /^\/dashboard/, title: 'My bookings', subtitle: 'Patient · account' },
  { match: /^\/book/, title: 'Book a session', subtitle: 'Patient' },
  { match: /^\/invoice/, title: 'Invoice', subtitle: 'Patient · billing' },
  { match: /^\/admin\/today/, title: 'Today at the centre', subtitle: 'Front desk' },
  { match: /^\/admin\/new/, title: 'New booking', subtitle: 'Front desk · walk-in' },
  { match: /^\/admin\/services/, title: 'Services & pricing', subtitle: 'Admin' },
  { match: /^\/admin\/staff/, title: 'Staff & permissions', subtitle: 'Admin' },
  { match: /^\/admin\/schedule/, title: 'My schedule today', subtitle: 'Therapist' },
];
function headerFor(pathname) {
  return HEADERS.find((h) => h.match.test(pathname)) || { title: 'Ahimsa Wellness', subtitle: '' };
}

function PublicNavLink({ to, label, end = false, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      style={({ isActive }) => ({
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 13.5,
        fontWeight: isActive ? 600 : 500,
        color: isActive ? c.teal : c.bodyText,
        background: isActive ? c.navActive : 'transparent',
        cursor: 'pointer',
        textDecoration: 'none',
      })}
    >
      {label}
    </NavLink>
  );
}

function MobileDrawer({ open, onClose, isPatient, isStaff, bookingsTo }) {
  const navigate = useNavigate();
  const location = useLocation();
  if (!open) return null;

  const go = (path, state) => {
    onClose();
    navigate(path, state ? { state } : undefined);
  };

  return (
    <>
      <div className="ah-mobile-drawer-overlay" onClick={onClose} aria-hidden="true" />
      <nav className="ah-mobile-drawer" aria-label="Menu">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Logo size={36} showWord />
          <button type="button" className="ah-menu-btn" onClick={onClose} aria-label="Close menu">
            ×
          </button>
        </div>
        <Link
          to="/"
          className={`ah-drawer-link${location.pathname === '/' ? ' active' : ''}`}
          onClick={onClose}
        >
          Home
        </Link>
        {isStaff ? (
          <button type="button" className="ah-drawer-link" style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent' }} onClick={() => go('/admin/today')}>
            Workspace
          </button>
        ) : (
          <button
            type="button"
            className={`ah-drawer-link${location.pathname === '/dashboard' ? ' active' : ''}`}
            style={{ width: '100%', textAlign: 'left', border: 'none', background: location.pathname === '/dashboard' ? c.greenSoft : 'transparent' }}
            onClick={() => go(bookingsTo, !isPatient ? { from: '/dashboard' } : undefined)}
          >
            My bookings
          </button>
        )}
        {!isStaff && (
          <button
            type="button"
            className="ah-drawer-link"
            style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent' }}
            onClick={() => go('/staff/login')}
          >
            Staff sign in
          </button>
        )}
        <button type="button" className="ah-drawer-cta" onClick={() => go('/book')}>
          Book a session
        </button>
      </nav>
    </>
  );
}

export function PublicLayout() {
  const navigate = useNavigate();
  const { isPatient, isStaff } = useAuth();
  const location = useLocation();
  const bookingsTo = isPatient ? '/dashboard' : '/login';
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: c.ivory }}>
      <header className="ah-public-header">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
          <Logo size={38} showWord />
        </Link>

        <div className="ah-nav-desktop">
          <PublicNavLink to="/" label="Home" end />
          {isStaff ? (
            <div
              onClick={() => navigate('/admin/today')}
              style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13.5, fontWeight: 500, color: c.bodyText, cursor: 'pointer' }}
            >
              Workspace
            </div>
          ) : (
            <NavLink
              to={bookingsTo}
              state={!isPatient ? { from: '/dashboard' } : undefined}
              style={({ isActive }) => ({
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? c.teal : c.bodyText,
                background: isActive && location.pathname === '/dashboard' ? c.navActive : 'transparent',
                cursor: 'pointer',
                textDecoration: 'none',
              })}
            >
              My bookings
            </NavLink>
          )}
          <button
            type="button"
            onClick={() => navigate('/book')}
            style={{
              marginLeft: 8,
              padding: '10px 18px',
              borderRadius: 9,
              border: 'none',
              background: c.teal,
              color: c.ivory,
              fontWeight: 600,
              fontSize: 13.5,
              cursor: 'pointer',
            }}
          >
            Book a session
          </button>
          {!isStaff && (
            <div
              onClick={() => navigate('/staff/login')}
              style={{ marginLeft: 6, fontSize: 12, color: c.mutedWarm, cursor: 'pointer', padding: '6px 8px' }}
            >
              Staff sign in
            </div>
          )}
        </div>

        <div className="ah-nav-mobile-actions">
          <button
            type="button"
            onClick={() => navigate('/book')}
            style={{
              padding: '9px 14px',
              borderRadius: 9,
              border: 'none',
              background: c.teal,
              color: c.ivory,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Book
          </button>
          <button type="button" className="ah-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            ☰
          </button>
        </div>
      </header>

      <MobileDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        isPatient={isPatient}
        isStaff={isStaff}
        bookingsTo={bookingsTo}
      />

      <main style={{ flex: 1, paddingBottom: isPatient && !isStaff ? 'calc(72px + env(safe-area-inset-bottom))' : 0 }}>
        <Outlet />
      </main>

      {isPatient && !isStaff && <PatientBottomNav />}
    </div>
  );
}

const iconStyle = { fontSize: 15, width: 18, textAlign: 'center' };

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 9,
        fontSize: 13.5,
        fontWeight: 600,
        cursor: 'pointer',
        color: isActive ? c.teal : '#4b524e',
        background: isActive ? c.greenSoft : 'transparent',
        border: `1px solid ${isActive ? 'rgba(28,75,67,.14)' : 'transparent'}`,
      })}
    >
      <span style={iconStyle}>{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

function NavGroup({ label, children }) {
  return (
    <>
      <div style={{ fontSize: 10.5, letterSpacing: '.16em', fontWeight: 700, color: c.mutedWarm, padding: '16px 10px 8px' }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</div>
    </>
  );
}

function PatientBottomNav() {
  const { pathname } = useLocation();
  const active = (re) => re.test(pathname);

  return (
    <nav className="ah-patient-bottom-nav" aria-label="Patient navigation">
      <div className="ah-patient-bottom-nav-inner">
        <NavLink to="/" className={`ah-patient-tab${active(/^\/$/) ? ' active' : ''}`}>
          <span className="ah-patient-tab-icon">⌂</span>
          Home
        </NavLink>
        <NavLink to="/book" className={`ah-patient-tab${active(/^\/book/) ? ' active' : ''}`}>
          <span className="ah-patient-tab-icon">✦</span>
          Book
        </NavLink>
        <NavLink to="/dashboard" className={`ah-patient-tab${active(/^\/dashboard|^\/invoice/) ? ' active' : ''}`}>
          <span className="ah-patient-tab-icon">▤</span>
          Bookings
        </NavLink>
      </div>
    </nav>
  );
}

export function AppLayout() {
  const { isStaff, isPatient, staff, patient, can, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { title, subtitle } = headerFor(pathname);

  const initials = (name = '') =>
    name
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const who = isStaff ? staff : patient;
  const patientShell = isPatient && !isStaff;

  return (
    <div className={`ah-app-shell${patientShell ? ' ah-app-shell--patient' : ''}`}>
      <aside className="ah-app-sidebar">
        <div style={{ padding: '20px 18px 16px', borderBottom: `1px solid ${c.borderSoft}` }}>
          <Logo size={44} showWord sub={isStaff ? 'STAFF WORKSPACE' : 'WELLNESS · GURUGRAM'} />
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
          {isPatient && (
            <NavGroup label="PATIENT">
              <NavItem to="/book" icon="✦" label="Book a session" />
              <NavItem to="/dashboard" icon="▤" label="My bookings" />
            </NavGroup>
          )}

          {isStaff && (can('bookings.read') || can('bookings.create') || can('services.manage') || can('staff.manage')) && (
            <NavGroup label="FRONT DESK & ADMIN">
              {can('bookings.read') && <NavItem to="/admin/today" icon="▤" label="Today's bookings" />}
              {can('bookings.create') && <NavItem to="/admin/new" icon="＋" label="New walk-in" />}
              {can('services.manage') && <NavItem to="/admin/services" icon="≡" label="Services & pricing" />}
              {can('staff.manage') && <NavItem to="/admin/staff" icon="◎" label="Staff & permissions" />}
            </NavGroup>
          )}

          {isStaff && can('schedule.own') && (
            <NavGroup label="THERAPIST">
              <NavItem to="/admin/schedule" icon="◷" label="My schedule" />
            </NavGroup>
          )}
        </nav>

        <div
          onClick={() => navigate('/')}
          style={{
            margin: '0 12px 8px',
            padding: '11px 12px',
            borderRadius: 9,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            fontSize: 13,
            fontWeight: 600,
            color: c.teal,
            background: c.greenSoft,
            border: '1px solid rgba(28,75,67,.14)',
          }}
        >
          <span>◱</span> View public site
        </div>
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${c.borderSoft}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: c.teal,
              color: c.ivory,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {initials(who?.name)}
          </div>
          <div style={{ lineHeight: 1.2, flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{who?.name}</div>
            <div style={{ fontSize: 11, color: c.muted }}>{isStaff ? staff?.role : 'Patient'}</div>
          </div>
          <span onClick={signOut} title="Sign out" style={{ cursor: 'pointer', color: c.muted, fontSize: 14 }}>
            ⎋
          </span>
        </div>
      </aside>

      <main className="ah-app-main">
        {patientShell && (
          <div className="ah-patient-mobile-header">
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: font.serif, fontSize: 17, fontWeight: 500 }}>{title}</div>
              <div style={{ fontSize: 11, color: c.muted }}>{patient?.name}</div>
            </div>
            <button type="button" onClick={signOut} style={{ ...{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${c.line}`, background: '#fff', fontSize: 12, fontWeight: 600, color: c.bodyText, cursor: 'pointer' } }}>
              Sign out
            </button>
          </div>
        )}

        <header className="ah-app-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{ fontFamily: font.serif, fontSize: 19, fontWeight: 500 }}>{title}</div>
            {subtitle && (
              <div className="ah-app-topbar-meta" style={{ fontSize: 11, color: c.muted, borderLeft: `1px solid ${c.line}`, paddingLeft: 12 }}>
                {subtitle}
              </div>
            )}
          </div>
          <div className="ah-app-topbar-meta">
            <div className="ah-app-topbar-domain">ahimsawellnesscentre.com</div>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.sage }} />
          </div>
        </header>

        <div className="ah-app-content" style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>

        {patientShell && <PatientBottomNav />}
      </main>
    </div>
  );
}
