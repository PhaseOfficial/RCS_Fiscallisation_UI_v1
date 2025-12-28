import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/Auth';
import Login from './pages/Login';
import Devices from './pages/Devices';
import Sidebar from './components/Sidebar'; // We'll make a quick sidebar below
// Import the new page
import Organizations from './pages/Organizations';


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
            {/* Add more pages here like /dashboard/organizations */}
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}