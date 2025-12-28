import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/Auth';
import Login from './pages/Login';
import Devices from './pages/Devices';
import Sidebar from './components/Sidebar'; // We'll make a quick sidebar below
// Import the new page
import Organizations from './pages/Organizations';
import Team from './pages/Team';
import Terminal from './pages/Terminal';
import Sales from './pages/Sales';
import FiscalDay from './pages/Dashboard';


// 1. Protected Route Component
// Checks if user is logged in. If not, sends them to Login.
function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-10">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Outlet /> {/* This renders the child page (e.g., Devices) */}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Navigate to="/dashboard/devices" replace />} />
            <Route path="/dashboard/devices" element={<Devices />} />
            <Route path="/dashboard/orgs" element={<Organizations />} />
            <Route path="/dashboard/team" element={<Team />} />
            <Route path="/dashboard/terminal" element={<Terminal />} />
            <Route path="/dashboard/sales" element={<Sales />} />
            <Route path="/dashboard" element={<FiscalDay />} />
<Route path="/dashboard/terminal" element={<Terminal />} />
<Route path="/dashboard/sales" element={<Sales />} />
<Route path="/dashboard/fiscal-day" element={<FiscalDay />} />
<Route path="/dashboard/team" element={<Team />} />
            {/* Add more pages here like /dashboard/organizations */}
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}