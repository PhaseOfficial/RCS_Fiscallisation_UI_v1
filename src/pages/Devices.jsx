import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/Auth';
import forge from 'node-forge'; 
import { 
  Server, Plus, Shield, CheckCircle, XCircle, 
  Key, Activity, AlertTriangle, Loader2, Hash, Tag, Box, RefreshCw, Sun, Moon
} from 'lucide-react';

export default function Devices() {
  const { user } = useAuth();
  
  // Data State
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingId, setCheckingId] = useState(null); // Which device is currently syncing?
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  
  // Forms
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [activationKey, setActivationKey] = useState('');
  const [registering, setRegistering] = useState(false);
  const [logs, setLogs] = useState([]); 

  const [newDevice, setNewDevice] = useState({
    device_id: '',           
    serial_number: '',       
    device_model_name: 'Server',
    device_model_version: 'v1'
  });

  useEffect(() => {
    fetchDevices();
  }, [user]);

  async function fetchDevices() {
    try {
      const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
      if (member) {
        const { data } = await supabase
          .from('fiscal_devices')
          .select('*')
          .eq('organization_id', member.organization_id)
          .order('created_at', { ascending: false });
        setDevices(data || []);
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
    } finally {
      setLoading(false);
    }
  }

  function addLog(msg) {
    setLogs(prev => [...prev, msg]);
  }

  // --- NEW: CHECK STATUS FUNCTION ---
  async function handleCheckStatus(device) {
    setCheckingId(device.device_id);
    try {
        const { data, error } = await supabase.functions.invoke('check-device-status', {
            body: { deviceId: device.device_id }
        });

        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);

        // Success - refresh list to show new status
        await fetchDevices();
        alert(`Status Updated!\nMode: ${data.deviceOperatingMode || 'Unknown'}\nDay: ${data.fiscalDayStatus || 'Unknown'}`);

    } catch (err) {
        alert("Status Check Failed: " + err.message);
    } finally {
        setCheckingId(null);
    }
  }

  // --- ADD DEVICE ---
  async function handleAddDevice(e) {
    e.preventDefault();
    if(!newDevice.device_id || !newDevice.serial_number) return alert("Required fields missing");
    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();

    const { error } = await supabase.from('fiscal_devices').insert({
      organization_id: member.organization_id,
      device_id: newDevice.device_id,
      serial_number: newDevice.serial_number,
      device_model_name: newDevice.device_model_name,
      device_model_version: newDevice.device_model_version,
      status: 'PENDING' 
    });

    if (error) alert("Error: " + error.message);
    else {
      setIsModalOpen(false);
      fetchDevices();
      setNewDevice({ device_id: '', serial_number: '', device_model_name: 'Server', device_model_version: 'v1' });
    }
  }

  // --- REGISTER DEVICE ---
  const openRegisterModal = (device) => {
    setSelectedDevice(device);
    setActivationKey('');
    setLogs([]);
    setIsRegisterModalOpen(true);
  };

  async function handleRegister(e) {
    e.preventDefault();
    setRegistering(true);
    setLogs([]);

    try {
      if (activationKey.length < 8) throw new Error("Key too short");

      const rawSerial = String(selectedDevice.serial_number).trim();
      const rawId = String(selectedDevice.device_id).trim();
      const zimraDeviceId = rawId.padStart(10, '0');
      const version = selectedDevice.device_model_version || 'v1';
      const commonName = `ZIMRA-${rawSerial}-${zimraDeviceId}`;

      addLog(`Generating Keys for CN: ${commonName}...`);

      const keys = await new Promise((resolve, reject) => {
         forge.pki.rsa.generateKeyPair({ bits: 2048, workers: 2 }, (err, keypair) => {
           if (err) reject(err); else resolve(keypair);
         });
      });

      const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
      const publicKey = keys.publicKey;
      
      addLog("Keys Generated. Creating CSR...");

      const csr = forge.pki.createCertificationRequest();
      csr.publicKey = publicKey;
      csr.setSubject([{ name: 'commonName', value: commonName }]);
      csr.sign(keys.privateKey, forge.md.sha256.create());
      const csrPem = forge.pki.certificationRequestToPem(csr);

      const proxyUrl = `/zimra-proxy/Public/${version}/${zimraDeviceId}/RegisterDevice`;
      addLog(`Sending to ZIMRA via Proxy...`);
      
      const zimraRes = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DeviceModelName': selectedDevice.device_model_name || 'Server',
          'DeviceModelVersion': '1.0'
        },
        body: JSON.stringify({
          activationKey: activationKey.trim(),
          certificateRequest: csrPem
        })
      });

      const responseText = await zimraRes.text();
      if (!zimraRes.ok) throw new Error(`ZIMRA Error (${zimraRes.status}): ${responseText}`);

      addLog("ZIMRA Accepted! Saving credentials...");
      const zimraData = JSON.parse(responseText);

      const { error: dbError } = await supabase.from('fiscal_devices').update({
          status: 'ACTIVE',
          private_key_pem: privateKeyPem,
          certificate_pem: zimraData.certificate,
          registered_at: new Date().toISOString(),
          activation_key: activationKey 
        }).eq('device_id', selectedDevice.device_id);

      if (dbError) throw dbError;

      addLog("SUCCESS! Device is Active.");
      alert('Device Registered Successfully!');
      setIsRegisterModalOpen(false);
      fetchDevices();

    } catch (err) {
      console.error(err);
      addLog(`FAILED: ${err.message}`);
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Server className="text-indigo-600" /> Fiscal Devices
          </h1>
          <p className="text-sm text-gray-500">Manage your ZIMRA-connected hardware.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2">
          <Plus size={18} /> Add Device
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && <p className="text-gray-400">Loading devices...</p>}
        {!loading && devices.length === 0 && <div className="col-span-3 p-10 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">No devices found.</div>}

        {devices.map(device => (
          <div key={device.device_id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 relative group">
            
            {/* Top Badge: Online/Offline Mode */}
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${device.operating_mode === 'Online' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
               <Activity size={12}/> {device.operating_mode || 'Unknown Mode'}
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-lg ${device.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}><Server size={24} /></div>
              <div><h3 className="font-bold text-gray-800">{device.device_model_name}</h3><p className="text-xs text-gray-500 font-mono">SN: {device.serial_number}</p></div>
            </div>

            {/* Device Stats Grid */}
            <div className="space-y-2 text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between pb-1"><span className="text-gray-400">ID</span><span className="font-mono">{device.device_id}</span></div>
              <div className="flex justify-between pb-1"><span className="text-gray-400">Last Receipt</span><span className="font-bold">{device.last_receipt_global_no || 0}</span></div>
              
              {/* Fiscal Day Status Line */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                 <span className="text-gray-400 flex items-center gap-1">Day Status</span>
                 <span className={`font-bold text-xs px-2 py-0.5 rounded ${device.fiscal_day_status === 'FiscalDayOpened' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}>
                    {device.fiscal_day_status === 'FiscalDayOpened' ? <span className="flex items-center gap-1"><Sun size={10}/> Open</span> : <span className="flex items-center gap-1"><Moon size={10}/> Closed</span>}
                 </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
                {device.status !== 'ACTIVE' ? (
                  <button onClick={() => openRegisterModal(device)} className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition flex justify-center items-center gap-2"><Key size={16} /> Register with ZIMRA</button>
                ) : (
                  <div className="flex gap-2">
                    {/* Check Status Button */}
                    <button 
                        onClick={() => handleCheckStatus(device)} 
                        disabled={checkingId === device.device_id}
                        className="flex-1 py-2 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-lg font-bold text-sm transition flex justify-center items-center gap-2"
                    >
                        {checkingId === device.device_id ? <Loader2 className="animate-spin" size={16}/> : <RefreshCw size={16} />} 
                        Check Status
                    </button>
                    <button disabled className="px-3 py-2 bg-gray-100 text-gray-400 rounded-lg font-bold text-sm cursor-not-allowed"><Shield size={16} /></button>
                  </div>
                )}
            </div>

          </div>
        ))}
      </div>

      {/* Modals for Register and Add Device remain the same... */}
      {/* ... (Keep the modals code from previous step here) ... */}
      {/* Register Modal */}
      {isRegisterModalOpen && selectedDevice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200">
            <h3 className="font-bold text-lg mb-4">ZIMRA Registration</h3>
            <div className="bg-gray-900 text-green-400 font-mono text-xs p-3 rounded mb-4 h-32 overflow-y-auto">
              {logs.length === 0 ? "Ready to start..." : logs.map((l, i) => <div key={i}>{l}</div>)}
              {registering && <div className="animate-pulse">_</div>}
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <input required className="input-field text-center text-2xl tracking-widest font-mono" placeholder="Activation Key" maxLength={10} value={activationKey} onChange={e => setActivationKey(e.target.value)} />
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" disabled={registering} onClick={() => setIsRegisterModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" disabled={registering} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 disabled:opacity-50">
                  {registering ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />} {registering ? 'Working...' : 'Register Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Device Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Add New Fiscal Device</h2>
            <form onSubmit={handleAddDevice} className="space-y-4">
              <div><label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Hash size={12}/> ZIMRA Device ID</label><input required className="input-field font-mono" placeholder="e.g. 29470" value={newDevice.device_id} onChange={e => setNewDevice({...newDevice, device_id: e.target.value})} /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Tag size={12}/> Serial Number</label><input required className="input-field" placeholder="e.g. procomm-1" value={newDevice.serial_number} onChange={e => setNewDevice({...newDevice, serial_number: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Box size={12}/> Model</label><input required className="input-field" value={newDevice.device_model_name} onChange={e => setNewDevice({...newDevice, device_model_name: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Activity size={12}/> Version</label><input required className="input-field" value={newDevice.device_model_version} onChange={e => setNewDevice({...newDevice, device_model_version: e.target.value})} /></div>
              </div>
              <div className="flex justify-end gap-2 mt-6"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save Device</button></div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}