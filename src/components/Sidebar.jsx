import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Server, LogOut, LayoutDashboard } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path 
    ? "bg-gray-700 text-white" 
    : "text-indigo-100 hover:bg-gray-800";

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-6 font-bold text-xl tracking-wider border-b border-gray-800 items-center flex">
       <img src="/src/assets/weblogo.png" alt="Logo" className="h-8 mr-2 inline-block" />
      <h1>FDMS ADMIN</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <Link 
          to="/dashboard/devices" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard/devices')}`}
        >
          <Server size={20} />
          Devices
        </Link>
        
        {/* Placeholder for Organizations page */}
  <Link 
  to="/dashboard/orgs" 
  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard/orgs')}`}
  >
  <LayoutDashboard size={20} />
  Organizations
  </Link>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 text-gray-200 hover:text-white w-full px-4 py-2"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
}