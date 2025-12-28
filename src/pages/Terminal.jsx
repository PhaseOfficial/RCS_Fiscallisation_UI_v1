import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/Auth';
import { Link } from 'react-router-dom';
import { 
  Plus, Trash2, RefreshCcw, FileSpreadsheet, ShoppingCart, 
  Server, AlertTriangle, CheckCircle, Lock 
} from 'lucide-react';

export default function Terminal() {
  const { user } = useAuth();
  
  // App State
  const [activeMode, setActiveMode] = useState('SALE'); // 'SALE', 'RETURN', 'UPLOAD'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Device & Status State
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [deviceStatus, setDeviceStatus] = useState(null); // 'ACTIVE', 'BLOCKED'
  const [isFiscalDayOpen, setIsFiscalDayOpen] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Transaction Data
  const [cart, setCart] = useState([{ item: '', qty: 1, price: 0, tax: 15 }]);
  const [returnDetails, setReturnDetails] = useState({
    originalReceiptNo: '',
    originalDeviceSerial: '',
    reason: ''
  });
  const [uploadFile, setUploadFile] = useState(null);

  // 1. INITIAL LOAD: Fetch Devices for this User's Org
  useEffect(() => {
    async function init() {
      // Get Org ID
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      
      if (!member) return;

      // Get Devices
      const { data: devs } = await supabase
        .from('fiscal_devices')
        .select('device_id, serial_number, status, device_model_name')
        .eq('organization_id', member.organization_id)
        .order('device_id');

      if (devs && devs.length > 0) {
        setDevices(devs);
        // Auto-select first active device if none selected
        if (!selectedDeviceId) {
           setSelectedDeviceId(devs[0].device_id);
        }
      }
      setCheckingStatus(false);
    }
    init();
  }, [user]);

  // 2. STATUS CHECK: When Device Changes, check if Fiscal Day is Open
  useEffect(() => {
    if (!selectedDeviceId) return;

    async function checkDay() {
      // Update local status ref
      const currentDev = devices.find(d => d.device_id == selectedDeviceId);
      if (currentDev) setDeviceStatus(currentDev.status);

      // Check DB for Open Day
      const { data: openDay } = await supabase
        .from('fiscal_days')
        .select('id')
        .eq('device_id', selectedDeviceId)
        .eq('status', 'FiscalDayOpened')
        .maybeSingle();

      setIsFiscalDayOpen(!!openDay);
    }
    checkDay();
  }, [selectedDeviceId, devices]);


  // --- HANDLERS ---

  const handleLineChange = (index, field, value) => {
    const newCart = [...cart];
    newCart[index][field] = value;
    setCart(newCart);
  };

  const removeLine = (index) => {
    if (cart.length > 1) {
      setCart(cart.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((acc, row) => acc + (row.qty * row.price), 0);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!selectedDeviceId) return setErrorMsg("Please select a Fiscal Device.");
    if (deviceStatus !== 'ACTIVE') return setErrorMsg("Selected Device is Blocked or Inactive.");
    if (!isFiscalDayOpen && activeMode !== 'UPLOAD') return setErrorMsg("Fiscal Day is CLOSED. Please open it first.");
    
    setLoading(true);

    try {
      const orgMember = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
      
      let salePayload = {};

      // A. BUILD PAYLOAD BASED ON MODE
      if (activeMode === 'UPLOAD') {
        if (!uploadFile) throw new Error("Please select a file to upload.");
        // Upload logic would go here (Upload to storage -> Trigger function)
        // For now, we simulate a queue entry
        salePayload = {
           note: "Bulk Upload",
           fileName: uploadFile.name
        };
      } else {
        // SALE OR RETURN
        const total = calculateTotal();
        if (total <= 0) throw new Error("Total amount must be greater than 0.");

        salePayload = {
          currency: 'USD',
          receiptDate: new Date().toISOString(),
          receiptLines: cart.map(row => ({
            item_name: row.item || 'General Goods',
            quantity: Number(row.qty),
            unit_price: Number(row.price),
            tax_percent: Number(row.tax)
          })),
          total: total,
          // Map payment (Simplified for UI, logic handles specifics)
          receiptPayments: [{ paymentType: 'CASH', paymentAmount: total }] 
        };

        if (activeMode === 'RETURN') {
          salePayload.receiptType = 'CREDITNOTE';
          salePayload.receiptNotes = returnDetails.reason;
          salePayload.creditDebitNote = {
            receiptID: returnDetails.originalReceiptNo,
            deviceSerialNo: returnDetails.originalDeviceSerial
          };
        } else {
          salePayload.receiptType = 'FISCALINVOICE';
        }
      }

      // B. PUSH TO QUEUE
      const { error } = await supabase.from('sales_queue').insert({
        organization_id: orgMember.data.organization_id,
        device_id: selectedDeviceId,
        source: activeMode === 'UPLOAD' ? 'EXCEL' : 'POS',
        status: 'PENDING',
        sale_payload: salePayload
      });

      if (error) throw error;

      alert(`${activeMode} queued successfully! Check Sales History for QR Code.`);
      
      // Reset Form
      setCart([{ item: '', qty: 1, price: 0, tax: 15 }]);
      setReturnDetails({ originalReceiptNo: '', originalDeviceSerial: '', reason: '' });
      setUploadFile(null);

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- RENDER HELPERS ---

  if (checkingStatus && devices.length === 0) return <div className="p-10 text-center">Loading Terminal...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      
      {/* HEADER & DEVICE SELECTOR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <Server className="text-indigo-600" /> POS Terminal
           </h1>
           <p className="text-sm text-gray-500">Process Sales, Returns, and Bulk Uploads</p>
        </div>

        {/* DEVICE PICKER */}
        <div className="bg-white p-2 rounded-lg border shadow-sm flex items-center gap-3">
          <label className="text-xs font-bold text-gray-500 uppercase px-2">Active Device:</label>
          <select 
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block p-2 min-w-[200px]"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
            {devices.length === 0 && <option>No Devices Found</option>}
            {devices.map(dev => (
              <option key={dev.device_id} value={dev.device_id}>
                {dev.serial_number} ({dev.device_model_name})
              </option>
            ))}
          </select>
          
          {/* Status Indicator */}
          {selectedDeviceId && (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${isFiscalDayOpen ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
              {isFiscalDayOpen ? (
                <><CheckCircle size={14} /> DAY OPEN</>
              ) : (
                <><Lock size={14} /> DAY CLOSED</>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ERROR / WARNING BANNERS */}
      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r">
          <div className="flex items-center gap-2 text-red-700 font-bold">
            <AlertTriangle size={20} /> Error
          </div>
          <p className="text-red-600">{errorMsg}</p>
        </div>
      )}

      {!isFiscalDayOpen && selectedDeviceId && activeMode !== 'UPLOAD' && (
        <div className="bg-orange-50 border border-orange-200 p-4 mb-6 rounded-lg flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-full text-orange-600"><Lock size={20}/></div>
            <div>
              <h3 className="font-bold text-orange-800">Fiscal Day is Closed</h3>
              <p className="text-sm text-orange-700">You cannot issue receipts until you open the day.</p>
            </div>
          </div>
          <Link to="/dashboard/fiscal-day" className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-700">
            Manage Fiscal Day &rarr;
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT PANEL: MAIN INTERFACE */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* MODE TABS */}
          <div className="bg-white p-1 rounded-lg shadow-sm border inline-flex w-full">
            <button 
              onClick={() => setActiveMode('SALE')}
              className={`flex-1 py-3 rounded-md text-sm font-bold transition flex justify-center items-center gap-2 ${activeMode === 'SALE' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <ShoppingCart size={18} /> Sale
            </button>
            <button 
              onClick={() => setActiveMode('RETURN')}
              className={`flex-1 py-3 rounded-md text-sm font-bold transition flex justify-center items-center gap-2 ${activeMode === 'RETURN' ? 'bg-amber-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <RefreshCcw size={18} /> Return
            </button>
            <button 
              onClick={() => setActiveMode('UPLOAD')}
              className={`flex-1 py-3 rounded-md text-sm font-bold transition flex justify-center items-center gap-2 ${activeMode === 'UPLOAD' ? 'bg-emerald-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <FileSpreadsheet size={18} /> Upload
            </button>
          </div>

          {/* MAIN FORM AREA */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            
            {/* --- UPLOAD MODE --- */}
            {activeMode === 'UPLOAD' ? (
              <div className="p-12 text-center">
                <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4">
                  <FileSpreadsheet size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Bulk Sales Upload</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">Upload an Excel or CSV file containing daily sales. The system will process them sequentially in the background.</p>
                
                <input 
                  type="file" 
                  accept=".csv, .xlsx"
                  onChange={e => setUploadFile(e.target.files[0])}
                  className="block w-full max-w-xs mx-auto text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6">
                
                {/* --- RETURN DETAILS --- */}
                {activeMode === 'RETURN' && (
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="md:col-span-2 flex items-center gap-2 text-amber-800 mb-1">
                      <RefreshCcw size={16} /> 
                      <span className="font-bold text-xs uppercase">Credit Note Requirements</span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-amber-700 mb-1">Original Receipt Global No</label>
                      <input 
                        required 
                        className="input-field border-amber-200 focus:border-amber-500"
                        placeholder="e.g. 1045"
                        value={returnDetails.originalReceiptNo}
                        onChange={e => setReturnDetails({...returnDetails, originalReceiptNo: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-amber-700 mb-1">Original Device Serial</label>
                      <input 
                        required 
                        className="input-field border-amber-200 focus:border-amber-500"
                        placeholder="e.g. 9029D..."
                        value={returnDetails.originalDeviceSerial}
                        onChange={e => setReturnDetails({...returnDetails, originalDeviceSerial: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-amber-700 mb-1">Reason for Return</label>
                      <input 
                        required 
                        className="input-field border-amber-200 focus:border-amber-500"
                        placeholder="e.g. Defective Product"
                        value={returnDetails.reason}
                        onChange={e => setReturnDetails({...returnDetails, reason: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {/* --- CART HEADER --- */}
                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                  <div className="col-span-5">Item Description</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-center">Tax</div>
                  <div className="col-span-1"></div>
                </div>

                {/* --- CART LINES --- */}
                <div className="space-y-2 mb-4">
                  {cart.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <input 
                          className="input-field" 
                          placeholder="Item Name"
                          value={row.item}
                          onChange={e => handleLineChange(idx, 'item', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                         <input 
                          type="number" min="1" 
                          className="input-field text-center" 
                          value={row.qty}
                          onChange={e => handleLineChange(idx, 'qty', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <input 
                          type="number" step="0.01" min="0" 
                          className="input-field text-right" 
                          value={row.price}
                          onChange={e => handleLineChange(idx, 'price', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <select 
                          className="input-field p-1 text-xs"
                          value={row.tax}
                          onChange={e => handleLineChange(idx, 'tax', e.target.value)}
                        >
                          <option value="15">15%</option>
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="30">Exempt</option>
                        </select>
                      </div>
                      <div className="col-span-1 text-center">
                        <button type="button" onClick={() => removeLine(idx)} className="text-gray-400 hover:text-red-500 transition">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  type="button" 
                  onClick={() => setCart([...cart, { item: '', qty: 1, price: 0, tax: 15 }])} 
                  className="text-sm font-semibold text-indigo-600 flex items-center gap-1 hover:text-indigo-800 transition"
                >
                  <Plus size={16} /> Add Line Item
                </button>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: SUMMARY */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Transaction Summary</h3>
            
            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <div className="flex justify-between">
                <span>Items Count</span>
                <span>{cart.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal (Net)</span>
                <span>${(calculateTotal() / 1.15).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-indigo-600">
                <span>Est. Tax (15%)</span>
                <span>${(calculateTotal() - (calculateTotal() / 1.15)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 border-t pt-3 mt-2">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={loading || (!isFiscalDayOpen && activeMode !== 'UPLOAD')}
              className={`w-full py-4 rounded-lg text-white font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                ${activeMode === 'RETURN' ? 'bg-amber-600 hover:bg-amber-700' : 
                  activeMode === 'UPLOAD' ? 'bg-emerald-600 hover:bg-emerald-700' : 
                  'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {loading ? (
                'Processing...' 
              ) : (
                <>
                  {activeMode === 'UPLOAD' ? <FileSpreadsheet /> : <CheckCircle />}
                  {activeMode === 'UPLOAD' ? 'Start Upload' : 
                   activeMode === 'RETURN' ? 'Process Return' : 'Complete Sale'}
                </>
              )}
            </button>

            {!isFiscalDayOpen && activeMode !== 'UPLOAD' && (
              <p className="text-xs text-center text-red-500 mt-3 font-medium">
                Day is Closed. Open Fiscal Day to Proceed.
              </p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-500">
            <h4 className="font-bold text-gray-700 mb-2">Help & Hints</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>Use <strong>0% Tax</strong> for basic commodities (maize, etc).</li>
              <li>Use <strong>Return</strong> mode only if you have the original receipt number.</li>
              <li>Receipts are signed in the background. Check <strong>Sales History</strong> for the QR code.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}