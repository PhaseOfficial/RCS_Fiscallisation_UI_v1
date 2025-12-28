import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/Auth';
import { Upload, Plus, Server, CheckCircle, AlertCircle } from 'lucide-react';

export default function Devices() {
  const { role } = useAuth();
  const [devices, setDevices] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [activeTab, setActiveTab] = useState('auto'); // 'auto' or 'manual'
  const [formData, setFormData] = useState({
    serialNumber: '',
    activationKey: '',
    organizationId: '',
    deviceModelName: 'Server',
    deviceModelVersion: '1.0'
  });
  const [files, setFiles] = useState({ cert: null, key: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDevices();
    fetchOrgs();
  }, []);

  async function fetchDevices() {
    const { data } = await supabase.from('fiscal_devices').select('*, organizations(name)');
    if (data) setDevices(data);
  }

  async function fetchOrgs() {
    const { data } = await supabase.from('organizations').select('id, name');
    if (data) setOrgs(data);
  }

  // --- HANDLER 1: AUTO REGISTRATION (Edge Function) ---
  async function handleAutoRegister(e) {
    e.preventDefault();
    setLoading(true);
    
    const { data, error } = await supabase.functions.invoke('register-device', {
      body: formData
    });

    if (error || data.error) {
      alert('Registration Failed: ' + (error?.message || data?.error));
    } else {
      alert('Device Registered Successfully! Device ID: ' + data.deviceID);
      setIsModalOpen(false);
      fetchDevices();
    }
    setLoading(false);
  }

  // --- HANDLER 2: MANUAL UPLOAD (Direct DB Insert) ---
  async function handleManualUpload(e) {
    e.preventDefault();
    if (!files.cert || !files.key) return alert("Please upload both files");

    setLoading(true);

    // Read files as text
    const certText = await files.cert.text();
    const keyText = await files.key.text();

    // Insert into DB
    // NOTE: Manual upload requires manually assigning a DeviceID. 
    // Usually, you should ask the user for the ZIMRA Device ID they got previously.
    const deviceIdInput = prompt("Enter the existing ZIMRA Device ID (Integer):");
    if (!deviceIdInput) { setLoading(false); return; }

    const { error } = await supabase.from('fiscal_devices').insert({
      device_id: parseInt(deviceIdInput),
      organization_id: formData.organizationId,
      serial_number: formData.serialNumber,
      activation_key: formData.activationKey, // Optional for manual
      device_model_name: formData.deviceModelName,
      device_model_version: formData.deviceModelVersion,
      certificate_pem: certText,
      private_key_pem: keyText,
      status: 'ACTIVE' // Assuming it's already active if they have keys
    });

    if (error) alert(error.message);
    else {
      alert('Device Manually Added!');
      setIsModalOpen(false);
      fetchDevices();
    }
    setLoading(false);
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fiscal Devices</h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          <Plus size={20} /> Add Device
        </button>
      </div>

      {/* DEVICE LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map(device => (
          <div key={device.device_id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{device.serial_number}</h3>
                <p className="text-sm text-gray-500">{device.organizations?.name}</p>
                <p className="text-xs font-mono bg-gray-100 p-1 mt-1 rounded inline-block">ID: {device.device_id}</p>
              </div>
              {device.status === 'ACTIVE' ? <CheckCircle className="text-green-500" /> : <AlertCircle className="text-yellow-500" />}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between text-sm text-gray-600">
              <span>Model: {device.device_model_name}</span>
              <span>v{device.device_model_version}</span>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
            
            {/* TABS */}
            <div className="flex border-b">
              <button 
                onClick={() => setActiveTab('auto')}
                className={`flex-1 p-4 font-medium ${activeTab === 'auto' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
              >
                Auto Register (New)
              </button>
              <button 
                onClick={() => setActiveTab('manual')}
                className={`flex-1 p-4 font-medium ${activeTab === 'manual' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
              >
                Manual Upload (Existing)
              </button>
            </div>

            <form onSubmit={activeTab === 'auto' ? handleAutoRegister : handleManualUpload} className="p-6 space-y-4">
              
              {/* Common Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Organization</label>
                <select 
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  value={formData.organizationId}
                  onChange={e => setFormData({...formData, organizationId: e.target.value})}
                  required
                >
                  <option value="">Select Organization</option>
                  {orgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Device Serial Number</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  value={formData.serialNumber}
                  onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                  required
                />
              </div>

              {/* AUTO TAB SPECIFICS */}
              {activeTab === 'auto' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Activation Key (from ZIMRA)</label>
                  <input 
                    type="text" 
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    value={formData.activationKey}
                    onChange={e => setFormData({...formData, activationKey: e.target.value})}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">We will generate keys and register with ZIMRA automatically.</p>
                </div>
              )}

              {/* MANUAL TAB SPECIFICS */}
              {activeTab === 'manual' && (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200">
                    <p className="text-sm text-yellow-800">Only use this if you already have the .pem and .crt files from a previous registration.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Private Key (.pem/.key)</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Upload size={16} />
                      <input 
                        type="file" 
                        accept=".pem,.key"
                        onChange={e => setFiles({...files, key: e.target.files[0]})}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Certificate (.crt/.pem)</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Upload size={16} />
                      <input 
                        type="file" 
                        accept=".crt,.pem,.cer"
                        onChange={e => setFiles({...files, cert: e.target.files[0]})}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
                  {loading ? 'Processing...' : (activeTab === 'auto' ? 'Register Device' : 'Save Device')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}