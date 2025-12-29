import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Building2, MapPin, Phone, Mail, Edit2, X, Users, Shield, User, Loader2 } from 'lucide-react';

export default function Organizations() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // -- Modals State --
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  
  // -- Data State --
  const [editingOrg, setEditingOrg] = useState(null);
  const [selectedOrgForUsers, setSelectedOrgForUsers] = useState(null);
  const [orgUsers, setOrgUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false); // Loading state for user list

  // -- Forms State --
  const initialOrgForm = {
    name: '', tin: '', vat_number: '',
    address_province: '', address_city: '', address_street: '', address_house_no: '',
    contact_email: '', contact_phone: ''
  };
  const [orgForm, setOrgForm] = useState(initialOrgForm);

  const [userForm, setUserForm] = useState({ email: '', password: '', role: 'cashier' });

  useEffect(() => {
    fetchOrgs();
  }, []);

  async function fetchOrgs() {
    const { data, error } = await supabase.from('organizations').select('*').order('name');
    if (error) console.error('Error fetching orgs:', error);
    else setOrgs(data);
  }

  // --- USER MANAGEMENT LOGIC ---

  async function openUsersModal(org) {
    setSelectedOrgForUsers(org);
    setIsUsersModalOpen(true);
    fetchOrgUsers(org.id);
  }

  async function fetchOrgUsers(orgId) {
    setLoadingUsers(true);
    // Call the SQL function we created
    const { data, error } = await supabase.rpc('get_org_users', { target_org_id: orgId });
    
    if (error) {
      console.error(error);
      alert("Error loading users: " + error.message);
    } else {
      setOrgUsers(data || []);
    }
    setLoadingUsers(false);
  }

  async function handleAddUser(e) {
    e.preventDefault();
    setLoading(true); // Reusing main loading state for button

    // Call Edge Function to create user
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: {
        email: userForm.email,
        password: userForm.password,
        organizationId: selectedOrgForUsers.id,
        role: userForm.role 
      }
    });

    if (error || data?.error) {
      alert('Error: ' + (error?.message || data?.error));
    } else {
      alert(`User added as ${userForm.role}!`);
      setUserForm({ email: '', password: '', role: 'cashier' }); // Reset form
      fetchOrgUsers(selectedOrgForUsers.id); // Refresh list immediately
    }
    setLoading(false);
  }

  // --- ORG MANAGEMENT LOGIC ---

  const openCreateOrgModal = () => {
    setEditingOrg(null);
    setOrgForm(initialOrgForm);
    setIsOrgModalOpen(true);
  };

  const openEditOrgModal = (org) => {
    setEditingOrg(org);
    setOrgForm({
      name: org.name,
      tin: org.tin,
      vat_number: org.vat_number || '',
      address_province: org.address_province || '',
      address_city: org.address_city || '',
      address_street: org.address_street || '',
      address_house_no: org.address_house_no || '',
      contact_email: org.contact_email || '',
      contact_phone: org.contact_phone || ''
    });
    setIsOrgModalOpen(true);
  };

  async function handleOrgSubmit(e) {
    e.preventDefault();
    setLoading(true);

    let error;
    if (editingOrg) {
      const { error: updateError } = await supabase.from('organizations').update(orgForm).eq('id', editingOrg.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('organizations').insert([orgForm]);
      error = insertError;
    }

    if (error) alert('Error: ' + error.message);
    else {
      alert(editingOrg ? 'Organization Updated!' : 'Organization Created!');
      setIsOrgModalOpen(false);
      fetchOrgs();
    }
    setLoading(false);
  }

  const handleOrgChange = (e) => setOrgForm({ ...orgForm, [e.target.name]: e.target.value });


  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Organizations</h1>
        <button 
          onClick={openCreateOrgModal} 
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm"
        >
          <Plus size={20} /> Add Organization
        </button>
      </div>

      {/* ORG LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orgs.map((org) => (
          <div key={org.id} className="group bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition relative">
            
            {/* Top Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <button 
                onClick={() => openEditOrgModal(org)}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
                title="Edit Details"
              >
                <Edit2 size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4 pr-16">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 leading-tight truncate">{org.name}</h3>
                <p className="text-xs text-gray-500 font-mono mt-1">TIN: {org.tin}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
               <div className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 text-gray-400 shrink-0" />
                <span className="leading-snug truncate">
                  {org.address_city}, {org.address_province}
                </span>
              </div>
              {org.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" />
                  <span className="truncate">{org.contact_email}</span>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-3 border-t">
              <button 
                onClick={() => openUsersModal(org)}
                className="w-full text-center text-xs font-bold text-white bg-gray-800 hover:bg-gray-900 py-2 rounded flex justify-center items-center gap-2 transition"
              >
                <Users size={14} /> Manage Team
              </button>
            </div>
          </div>
        ))}
      </div>


      {/* --- MODAL 1: CREATE/EDIT ORG --- */}
      {isOrgModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-semibold">{editingOrg ? 'Edit Organization' : 'Add New Organization'}</h2>
              <button onClick={() => setIsOrgModalOpen(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleOrgSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className="text-sm font-medium">Company Name</label><input name="name" required className="input-field" onChange={handleOrgChange} value={orgForm.name} /></div>
              <div><label className="text-sm font-medium">TIN</label><input name="tin" required className="input-field" onChange={handleOrgChange} value={orgForm.tin} /></div>
              <div><label className="text-sm font-medium">VAT</label><input name="vat_number" className="input-field" onChange={handleOrgChange} value={orgForm.vat_number} /></div>
              {/* Address Fields Simplified */}
              <div><label className="text-sm font-medium">City</label><input name="address_city" className="input-field" onChange={handleOrgChange} value={orgForm.address_city} /></div>
              <div><label className="text-sm font-medium">Province</label><select name="address_province" className="input-field" onChange={handleOrgChange} value={orgForm.address_province}><option>Harare</option><option>Bulawayo</option></select></div>
              
              <div className="md:col-span-2 pt-4 flex justify-end gap-3">
                 <button type="button" onClick={() => setIsOrgModalOpen(false)} className="px-4 py-2 rounded text-gray-600 hover:bg-gray-100">Cancel</button>
                 <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">{loading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* --- MODAL 2: MANAGE USERS (THE REQUESTED FEATURE) --- */}
      {isUsersModalOpen && selectedOrgForUsers && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* LEFT COLUMN: EXISTING MEMBERS LIST */}
            <div className="w-2/3 border-r bg-gray-50 flex flex-col">
              <div className="p-4 border-b bg-white flex justify-between items-center sticky top-0">
                <div>
                  <h3 className="font-bold text-gray-800">{selectedOrgForUsers.name}</h3>
                  <p className="text-xs text-gray-500">Existing Team Members</p>
                </div>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-bold">{orgUsers.length}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingUsers ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <Loader2 size={32} className="animate-spin mb-2" />
                    <p>Loading members...</p>
                  </div>
                ) : orgUsers.length === 0 ? (
                  <div className="text-center text-gray-400 mt-10 p-4 border-2 border-dashed border-gray-200 rounded-lg">
                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No users found in this organization.</p>
                  </div>
                ) : (
                  orgUsers.map(u => (
                    <div key={u.user_id} className="bg-white p-3 rounded-lg border shadow-sm flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${u.role === 'org_admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                          {u.role === 'org_admin' ? <Shield size={16} /> : <User size={16} />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{u.email}</p>
                          <p className="text-xs text-gray-500 capitalize">{u.role.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: ADD NEW USER FORM */}
            <div className="w-1/3 flex flex-col bg-white">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-800 text-sm">Add New Member</h3>
                 <button onClick={() => setIsUsersModalOpen(false)}><X size={20} className="text-gray-400 hover:text-red-500" /></button>
              </div>
              
              <div className="p-6 flex-1">
                <form onSubmit={handleAddUser} className="space-y-4">
                   <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Role</label>
                     <div className="grid grid-cols-2 gap-2">
                       <button 
                         type="button" 
                         onClick={() => setUserForm({...userForm, role: 'cashier'})}
                         className={`p-2 text-xs border rounded text-center transition ${userForm.role === 'cashier' ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}
                       >
                         Cashier
                       </button>
                       <button 
                         type="button" 
                         onClick={() => setUserForm({...userForm, role: 'org_admin'})}
                         className={`p-2 text-xs border rounded text-center transition ${userForm.role === 'org_admin' ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}
                       >
                         Org Admin
                       </button>
                     </div>
                   </div>

                   <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                     <input 
                       type="email" 
                       required
                       className="input-field"
                       placeholder="user@company.com"
                       value={userForm.email}
                       onChange={e => setUserForm({...userForm, email: e.target.value})}
                     />
                   </div>

                   <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                     <input 
                       type="password" 
                       required
                       className="input-field"
                       placeholder="••••••••"
                       value={userForm.password}
                       onChange={e => setUserForm({...userForm, password: e.target.value})}
                     />
                   </div>

                   <button 
                     type="submit" 
                     disabled={loading}
                     className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition disabled:opacity-50 flex justify-center items-center gap-2"
                   >
                     {loading ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>}
                     {loading ? 'Adding...' : 'Add User'}
                   </button>
                </form>

                <div className="mt-8 p-4 bg-yellow-50 rounded border border-yellow-100 text-xs text-yellow-700">
                  <strong>Privileges:</strong> 
                  <ul className="list-disc pl-3 mt-1 space-y-1">
                    <li><strong>Org Admin:</strong> Can manage devices, view sales, and add other users.</li>
                    <li><strong>Cashier:</strong> Can only access the POS Terminal.</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}