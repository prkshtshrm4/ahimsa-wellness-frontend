import { NavLink, useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Logo } from './ui.jsx';
import { c, font } from '../theme.js';

// Header title/subtitle per route — keeps the top bar in sync automatically.
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

/* ─── Public marketing header (guests) ─────────────────────────────────── */
function PublicNavLink({ to, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
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

export function PublicLayout() {
  const navigate = useNavigate();
  const { isPatient, isStaff } = useAuth();
  const location = useLocation();
  const bookingsTo = isPatient ? '/dashboard' : '/login';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: c.ivory }}>
      <header
        style={{
          height: 66,
          flexShrink: 0,
          borderBottom: `1px solid ${c.border}`,
          background: 'rgba(253,251,247,.92)',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Logo size={38} showWord />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
      </header>
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}

/* ─── Authenticated workspace with role-aware sidebar ──────────────────── */
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: c.ivory }}>
      <aside
        style={{
          width: 264,
          flexShrink: 0,
          background: '#fff',
          borderRight: `1px solid ${c.border}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
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

      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            height: 60,
            flexShrink: 0,
            borderBottom: `1px solid ${c.border}`,
            background: 'rgba(251,248,242,.86)',
            backdropFilter: 'blur(8px)',
            position: 'sticky',
            top: 0,
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 30px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: font.serif, fontSize: 19, fontWeight: 500 }}>{title}</div>
            {subtitle && (
              <div style={{ fontSize: 11, color: c.muted, borderLeft: `1px solid ${c.line}`, paddingLeft: 12 }}>{subtitle}</div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 12, color: c.muted }}>app.ahimsawellnesscentre.com</div>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.sage }} />
          </div>
        </header>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
