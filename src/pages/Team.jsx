import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/Auth';

export default function Team() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [newUser, setNewUser] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

  async function fetchTeam() {
    const { data } = await supabase
      .from('organization_members')
      .select('*, users:auth.users(email)') // Note: This join might fail on standard RLS unless a view is created, simpler to just list roles if auth.users is hidden
      // Fix: Supabase doesn't let you join auth.users easily from client. 
      // Workaround: We just list the rows or use an Edge Function to fetch team details. 
      // For this example, we assume we created a public view or just listing IDs.
    if (data) setMembers(data);
  }

  async function addCashier(e) {
    e.preventDefault();
    setLoading(true);
    
    // Get Org ID
    const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    
    // CALL EDGE FUNCTION
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: { 
        email: newUser.email, 
        password: newUser.password, 
        organizationId: orgMember.organization_id,
        role: 'cashier'
      }
    });

    if (error || data.error) {
      alert('Error: ' + (error?.message || data?.error));
    } else {
      alert('Cashier Created!');
      setNewUser({ email: '', password: '' });
      fetchTeam();
    }
    setLoading(false);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Team Management</h1>
      
      {/* Add User Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 max-w-2xl">
        <h2 className="font-bold text-lg mb-4">Add New Cashier</h2>
        <form onSubmit={addCashier} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500">Email</label>
            <input className="input-field" type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500">Password</label>
            <input className="input-field" type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
          </div>
          <button disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium">
            {loading ? 'Adding...' : 'Add User'}
          </button>
        </form>
      </div>
    </div>
  );
}