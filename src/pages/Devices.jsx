import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/Auth';
import { Upload, Plus, Server, CheckCircle, AlertCircle, Edit2, X, Eye } from 'lucide-react';

export default function Devices() {
  const { role } = useAuth();
  const [devices, setDevices] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null); // Null = Create, Object = Edit
  
  // Form State
  const [activeTab, setActiveTab] = useState('auto'); // 'auto' or 'manual'
  const initialFormState = {
    organizationId: '',
    serialNumber: '',
    activationKey: '',
    deviceModelName: 'Server',
    deviceModelVersion: '1.0',
    status: 'ACTIVE',
    device_id: '' // Only used for Manual Upload
  };
  const [formData, setFormData] = useState(initialFormState);
  const [files, setFiles] = useState({ cert: null, key: null });

  useEffect(() => {
    fetchDevices();
    fetchOrgs();
  }, []);

  async function fetchDevices() {
    // Selects devices and joins the organization name for display
    const { data } = await supabase
      .from('fiscal_devices')
      .select('*, organizations(name)')
      .order('device_id');
    if (data) setDevices(data);
  }

  async function fetchOrgs() {
    const { data } = await supabase.from('organizations').select('id, name').order('name');
    if (data) setOrgs(data);
  }

  // --- OPEN HANDLERS ---
  const openCreateModal = () => {
    setEditingDevice(null);
    setFormData(initialFormState);
    setActiveTab('auto');
    setIsModalOpen(true);
  };

  const openEditModal = (device) => {
    setEditingDevice(device);
    setFormData({
      organizationId: device.organization_id,
      serialNumber: device.serial_number,
      activationKey: device.activation_key || '',
      deviceModelName: device.device_model_name,
      deviceModelVersion: device.device_model_version,
      status: device.status,
      device_id: device.device_id
    });
    // For edit, we default to a "View/Edit" tab structure logic if needed, 
    // but here we just reuse the form for simplicity.
    setIsModalOpen(true);
  };

  // --- SUBMIT LOGIC ---
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingDevice) {
        // --- UPDATE EXISTING DEVICE ---
        // Note: We typically don't allow changing Device ID or Keys via simple Edit
        // Use a dedicated "Rotate Keys" function for that if needed later.
        const { error } = await supabase
          .from('fiscal_devices')
          .update({
            organization_id: formData.organizationId,
            serial_number: formData.serialNumber,
            device_model_name: formData.deviceModelName,
            device_model_version: formData.deviceModelVersion,
            status: formData.status
          })
          .eq('device_id', editingDevice.device_id);

        if (error) throw error;
        alert('Device Updated Successfully');
      } 
      
      else {
        // --- CREATE NEW DEVICE ---
        if (activeTab === 'auto') {
          // CALL EDGE FUNCTION
          const { data, error } = await supabase.functions.invoke('register-device', {
            body: formData
          });
          if (error || data.error) throw new Error(error?.message || data?.error);
          alert(`Device Registered! ID: ${data.deviceID}`);
        } 
        else {
          // MANUAL DB INSERT
          if (!files.cert || !files.key) throw new Error("Please upload both files");
          if (!formData.device_id) throw new Error("Device ID is required for manual upload");

          const certText = await files.cert.text();
          const keyText = await files.key.text();

          const { error } = await supabase.from('fiscal_devices').insert({
            device_id: parseInt(formData.device_id),
            organization_id: formData.organizationId,
            serial_number: formData.serialNumber,
            activation_key: formData.activationKey,
            device_model_name: formData.deviceModelName,
            device_model_version: formData.deviceModelVersion,
            certificate_pem: certText,
            private_key_pem: keyText,
            status: 'ACTIVE'
          });
          if (error) throw error;
          alert('Device Manually Added!');
        }
      }

      setIsModalOpen(false);
      fetchDevices();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Fiscal Devices</h1>
        <button 
          onClick={openCreateModal} 
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm"
        >
          <Plus size={20} /> Add Device
        </button>
      </div>

      {/* DEVICE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map(device => (
          <div key={device.device_id} className="group bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition relative">
            
            {/* Edit Button */}
            <button 
              onClick={() => openEditModal(device)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition opacity-0 group-hover:opacity-100"
              title="Edit Device"
            >
              <Edit2 size={18} />
            </button>

            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-lg ${device.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                <Server size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">{device.serial_number}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-2 h-2 rounded-full ${device.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-xs font-medium text-gray-600 uppercase">{device.status}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 border-t pt-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Device ID</span>
                <span className="font-mono bg-gray-50 px-2 py-0.5 rounded text-gray-700">{device.device_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Org</span>
                <span className="font-medium text-right truncate w-32">{device.organizations?.name}</span>
              </div>
              <div className="flex justify-between">
                 <span className="text-gray-400">Version</span>
                 <span>{device.device_model_name} v{device.device_model_version}</span>
              </div>
              <div className="flex justify-between">
                 <span className="text-gray-400">Receipts</span>
                 <span>{device.global_receipt_counter || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingDevice ? 'Edit Device Details' : 'Register New Device'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition">
                <X size={20} />
              </button>
            </div>

            {/* TABS (Only for Create Mode) */}
            {!editingDevice && (
              <div className="flex border-b">
                <button 
                  onClick={() => setActiveTab('auto')}
                  className={`flex-1 p-3 text-sm font-medium transition ${activeTab === 'auto' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Auto Register (ZIMRA API)
                </button>
                <button 
                  onClick={() => setActiveTab('manual')}
                  className={`flex-1 p-3 text-sm font-medium transition ${activeTab === 'manual' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Manual Upload
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Common Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Organization</label>
                <select 
                  className="input-field"
                  value={formData.organizationId}
                  onChange={e => setFormData({...formData, organizationId: e.target.value})}
                  required
                >
                  <option value="">Select Organization...</option>
                  {orgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                  <input 
                    type="text" 
                    className="input-field"
                    value={formData.serialNumber}
                    onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                    required
                  />
                </div>
                
                {/* Status Field (Only visible when Editing) */}
                {editingDevice && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select 
                      className="input-field"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="REGISTERED">Registered</option>
                    </select>
                  </div>
                )}
              </div>

              {/* AUTO REGISTER FIELDS */}
              {!editingDevice && activeTab === 'auto' && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <label className="block text-sm font-medium text-blue-900 mb-1">ZIMRA Activation Key</label>
                  <input 
                    type="text" 
                    className="block w-full rounded-md border-blue-200 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g. 12345678"
                    value={formData.activationKey}
                    onChange={e => setFormData({...formData, activationKey: e.target.value})}
                    required
                  />
                  <p className="text-xs text-blue-600 mt-2">
                    We will generate keys and register this device with ZIMRA automatically.
                  </p>
                </div>
              )}

              {/* MANUAL UPLOAD FIELDS */}
              {!editingDevice && activeTab === 'manual' && (
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIMRA Device ID (Integer)</label>
                    <input 
                      type="number" 
                      className="input-field"
                      placeholder="e.g. 15400"
                      value={formData.device_id}
                      onChange={e => setFormData({...formData, device_id: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Private Key (.pem)</label>
                      <input 
                        type="file" 
                        accept=".pem,.key"
                        className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        onChange={e => setFiles({...files, key: e.target.files[0]})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Certificate (.crt)</label>
                      <input 
                        type="file" 
                        accept=".crt,.pem,.cer"
                        className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        onChange={e => setFiles({...files, cert: e.target.files[0]})}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm font-medium">
                  {loading ? 'Processing...' : (editingDevice ? 'Save Changes' : (activeTab === 'auto' ? 'Register Device' : 'Save Device'))}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}