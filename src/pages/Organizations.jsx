import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Building2, MapPin, Phone, Mail, Edit2, X } from 'lucide-react';

export default function Organizations() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null); // If null, we are in "Create" mode. If set, "Edit" mode.

  // Form State
  const initialFormState = {
    name: '',
    tin: '',
    vat_number: '',
    address_province: '',
    address_city: '',
    address_street: '',
    address_house_no: '',
    contact_email: '',
    contact_phone: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchOrgs();
  }, []);

  async function fetchOrgs() {
    const { data, error } = await supabase.from('organizations').select('*').order('name');
    if (error) console.error('Error fetching orgs:', error);
    else setOrgs(data);
  }

  // --- OPEN MODAL HANDLERS ---
  
  const openCreateModal = () => {
    setEditingOrg(null); // Reset edit mode
    setFormData(initialFormState); // Clear form
    setIsModalOpen(true);
  };

  const openEditModal = (org) => {
    setEditingOrg(org); // Set current org being edited
    setFormData({
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
    setIsModalOpen(true);
  };

  // --- SUBMIT HANDLER (Create OR Update) ---

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    let error;

    if (editingOrg) {
      // UPDATE EXISTING
      const { error: updateError } = await supabase
        .from('organizations')
        .update(formData)
        .eq('id', editingOrg.id); // Critical: Update where ID matches
      error = updateError;
    } else {
      // CREATE NEW
      const { error: insertError } = await supabase
        .from('organizations')
        .insert([formData]);
      error = insertError;
    }

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert(editingOrg ? 'Organization Updated!' : 'Organization Created!');
      setIsModalOpen(false);
      fetchOrgs(); // Refresh the list
    }
    setLoading(false);
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Organizations</h1>
        <button 
          onClick={openCreateModal} 
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm"
        >
          <Plus size={20} /> Add Organization
        </button>
      </div>

      {/* LIST VIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orgs.map((org) => (
          <div key={org.id} className="group bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition relative">
            
            {/* EDIT BUTTON (Absolute Positioned) */}
            <button 
              onClick={() => openEditModal(org)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition opacity-0 group-hover:opacity-100"
              title="Edit Details"
            >
              <Edit2 size={18} />
            </button>

            <div className="flex justify-between items-start mb-4 pr-8"> 
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 leading-tight">{org.name}</h3>
                  <p className="text-xs text-gray-500 font-mono mt-1">TIN: {org.tin}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 text-gray-400 shrink-0" />
                <span className="leading-snug">
                  {org.address_house_no} {org.address_street}, {org.address_city}
                  <span className="block text-xs text-gray-400">{org.address_province}</span>
                </span>
              </div>
              
              {(org.contact_email || org.contact_phone) && (
                <div className="pt-3 border-t border-gray-100 mt-3 flex flex-col gap-2">
                  {org.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      <span className="truncate">{org.contact_email}</span>
                    </div>
                  )}
                  {org.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      <span>{org.contact_phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* SHARED MODAL (Create & Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingOrg ? 'Edit Organization' : 'Add New Organization'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Core Info */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Company Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                    <input name="name" required className="input-field" onChange={handleChange} value={formData.name} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TIN (ZIMRA ID) *</label>
                    <input name="tin" required className="input-field" onChange={handleChange} value={formData.tin} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">VAT Number</label>
                    <input name="vat_number" className="input-field" onChange={handleChange} value={formData.vat_number} />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="md:col-span-2 space-y-4 pt-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-t pt-4">Address</h3>
                <div className="grid md:grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                    <select name="address_province" className="input-field" onChange={handleChange} value={formData.address_province}>
                      <option value="">Select...</option>
                      <option value="Harare">Harare</option>
                      <option value="Bulawayo">Bulawayo</option>
                      <option value="Manicaland">Manicaland</option>
                      <option value="Mashonaland Central">Mashonaland Central</option>
                      <option value="Mashonaland East">Mashonaland East</option>
                      <option value="Mashonaland West">Mashonaland West</option>
                      <option value="Masvingo">Masvingo</option>
                      <option value="Matabeleland North">Matabeleland North</option>
                      <option value="Matabeleland South">Matabeleland South</option>
                      <option value="Midlands">Midlands</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input name="address_city" className="input-field" onChange={handleChange} value={formData.address_city} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                    <input name="address_street" className="input-field" onChange={handleChange} value={formData.address_street} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">House No.</label>
                    <input name="address_house_no" className="input-field" onChange={handleChange} value={formData.address_house_no} />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="md:col-span-2 space-y-4 pt-2">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-t pt-4">Contact</h3>
                 <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" name="contact_email" className="input-field" onChange={handleChange} value={formData.contact_email} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input type="tel" name="contact_phone" className="input-field" onChange={handleChange} value={formData.contact_phone} />
                    </div>
                 </div>
              </div>

              <div className="md:col-span-2 pt-6 flex justify-end gap-3 border-t mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm font-medium">
                  {loading ? 'Saving...' : (editingOrg ? 'Save Changes' : 'Create Organization')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}