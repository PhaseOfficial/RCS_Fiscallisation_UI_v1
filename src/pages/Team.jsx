import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/Auth';
import { Users, UserPlus, Shield, User, Search, Trash2 } from 'lucide-react';

export default function Team() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [orgId, setOrgId] = useState(null);

  // Form State
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'cashier' });

  useEffect(() => {
    fetchTeam();
  }, [user]);

  async function fetchTeam() {
    try {
      setLoading(true);
      
      // 1. Get My Organization ID
      const { data: myOrg, error: orgError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (orgError || !myOrg) throw new Error("Could not find your organization.");
      setOrgId(myOrg.organization_id);

      // 2. Fetch Users using the Secure RPC function
      // This bypasses the restriction on reading the auth.users table directly
      const { data: teamData, error: teamError } = await supabase
        .rpc('get_org_users', { target_org_id: myOrg.organization_id });

      if (teamError) throw teamError;
      setMembers(teamData || []);

    } catch (err) {
      console.error("Team Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUser(e) {
    e.preventDefault();
    setActionLoading(true);

    try {
      // Call Edge Function to create user in Auth system
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { 
          email: newUser.email, 
          password: newUser.password, 
          organizationId: orgId,
          role: newUser.role
        }
      });

      if (error || data?.error) {
        throw new Error(error?.message || data?.error);
      }

      alert(`Success! ${newUser.email} added as ${newUser.role}.`);
      setNewUser({ email: '', password: '', role: 'cashier' }); // Reset form
      fetchTeam(); // Refresh the list immediately

    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-indigo-600" /> Team Management
          </h1>
          <p className="text-sm text-gray-500">Manage access for your organization staff.</p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
          {members.length} Active Members
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: ADD USER FORM */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <UserPlus size={18} className="text-gray-400" /> Add New Member
          </h3>
          
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button" 
                  onClick={() => setNewUser({...newUser, role: 'cashier'})}
                  className={`p-2 text-sm border rounded-lg transition ${newUser.role === 'cashier' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  Cashier
                </button>
                <button 
                  type="button" 
                  onClick={() => setNewUser({...newUser, role: 'org_admin'})}
                  className={`p-2 text-sm border rounded-lg transition ${newUser.role === 'org_admin' ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  Admin
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
              <input 
                type="email" 
                required 
                className="input-field" 
                placeholder="staff@company.com"
                value={newUser.email}
                onChange={e => setNewUser({...newUser, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
              <input 
                type="password" 
                required 
                className="input-field" 
                placeholder="••••••••"
                value={newUser.password}
                onChange={e => setNewUser({...newUser, password: e.target.value})}
              />
            </div>

            <button 
              type="submit" 
              disabled={actionLoading} 
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50 mt-2"
            >
              {actionLoading ? 'Creating User...' : 'Add Team Member'}
            </button>
            
            <p className="text-xs text-gray-400 text-center mt-2">
              User will be able to log in immediately.
            </p>
          </form>
        </div>

        {/* RIGHT: TEAM LIST */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700">Staff Directory</h3>
            <Search size={18} className="text-gray-400" />
          </div>

          <div className="flex-1 overflow-y-auto max-h-[600px]">
            {loading ? (
              <div className="p-10 text-center text-gray-400">Loading team...</div>
            ) : members.length === 0 ? (
              <div className="p-10 text-center text-gray-400">No team members found.</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold sticky top-0">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map((member) => (
                    <tr key={member.user_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${member.role === 'org_admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                            {member.role === 'org_admin' ? <Shield size={14} /> : <User size={14} />}
                          </div>
                          <span className="font-medium text-gray-900">{member.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${member.role === 'org_admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {member.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}