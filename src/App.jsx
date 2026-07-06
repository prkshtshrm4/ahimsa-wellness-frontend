import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { PublicLayout, AppLayout } from './components/Layout.jsx';
import { Spinner } from './components/ui.jsx';

import Home from './pages/Home.jsx';
import Booking from './pages/Booking.jsx';
import Login from './pages/Login.jsx';
import StaffLogin from './pages/StaffLogin.jsx';
import Dashboard from './pages/Dashboard.jsx';
import InvoiceView from './pages/InvoiceView.jsx';
import AdminToday from './pages/AdminToday.jsx';
import AdminNewBooking from './pages/AdminNewBooking.jsx';
import AdminServices from './pages/AdminServices.jsx';
import AdminStaff from './pages/AdminStaff.jsx';
import TherapistSchedule from './pages/TherapistSchedule.jsx';
import Forbidden from './pages/Forbidden.jsx';
import LinkPhone from './pages/LinkPhone.jsx';

function RequireAuth({ children }) {
  const { identity, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner center />;
  if (!identity) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

function RequireStaff({ module, children }) {
  const { identity, loading, isStaff, can } = useAuth();
  if (loading) return <Spinner center />;
  if (!identity) return <Navigate to="/staff/login" replace />;
  if (!isStaff) return <Navigate to="/dashboard" replace />;
  if (module && !can(module)) return <Forbidden module={module} />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="/book" element={<Booking />} />
        <Route path="/login" element={<Login />} />
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route
          path="/link-phone"
          element={
            <RequireAuth>
              <LinkPhone />
            </RequireAuth>
          }
        />
      </Route>

      {/* Authenticated workspace */}
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/invoice/:id" element={<InvoiceView />} />
        <Route path="/admin/today" element={<RequireStaff module="bookings.read"><AdminToday /></RequireStaff>} />
        <Route path="/admin/new" element={<RequireStaff module="bookings.create"><AdminNewBooking /></RequireStaff>} />
        <Route path="/admin/services" element={<RequireStaff module="services.manage"><AdminServices /></RequireStaff>} />
        <Route path="/admin/staff" element={<RequireStaff module="staff.manage"><AdminStaff /></RequireStaff>} />
        <Route path="/admin/schedule" element={<RequireStaff module="schedule.own"><TherapistSchedule /></RequireStaff>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
