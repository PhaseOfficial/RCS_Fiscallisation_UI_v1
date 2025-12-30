import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/Auth';
import { 
  Plus, Trash2, RefreshCcw, FileSpreadsheet, ShoppingCart, 
  Server, AlertTriangle, CheckCircle, Loader2, Activity, Copy, User, CreditCard
} from 'lucide-react';
import FiscalDayControls from '../components/FiscalDayControls';

export default function Terminal() {
  const { user } = useAuth();
  
  // App State
  const [activeMode, setActiveMode] = useState('SALE'); 
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Device State
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [deviceStatus, setDeviceStatus] = useState(null); 
  const [isFiscalDayOpen, setIsFiscalDayOpen] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [syncing, setSyncing] = useState(false); 

  // Data
  const [cart, setCart] = useState([{ item: '', qty: 1, price: 0, tax: 15 }]);
  const [customer, setCustomer] = useState({ name: '', tin: '', address: '' }); // <--- NEW: Customer Data
  const [returnDetails, setReturnDetails] = useState({
    originalReceiptNo: '',
    originalDeviceSerial: '',
    reason: ''
  });
  const [uploadFile, setUploadFile] = useState(null);

  // --- 1. Centralized Data Fetching ---
  const fetchDevices = useCallback(async () => {
    try {
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      
      if (!member) return;

      const { data: devs } = await supabase
        .from('fiscal_devices')
        .select('device_id, serial_number, status, device_model_name, fiscal_day_status, last_fiscal_day_no') 
        .eq('organization_id', member.organization_id)
        .order('device_id');

      if (devs && devs.length > 0) {
        setDevices(devs);
        if (!selectedDeviceId) setSelectedDeviceId(devs[0].device_id);
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
    } finally {
      setCheckingStatus(false);
    }
  }, [user, selectedDeviceId]);

  // Initial Load
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Determine Local Status when Device Changes
  useEffect(() => {
    if (!selectedDeviceId) return;
    refreshLocalStatus();
  }, [selectedDeviceId, devices]);

  function refreshLocalStatus() {
    const currentDev = devices.find(d => d.device_id == selectedDeviceId);
    if (currentDev) {
        setDeviceStatus(currentDev.status);
        if (currentDev.fiscal_day_status === 'FiscalDayOpened') {
            setIsFiscalDayOpen(true);
        } else {
            checkFiscalDayTable();
        }
    }
  }

  async function checkFiscalDayTable() {
    const { data: openDay } = await supabase
        .from('fiscal_days')
        .select('id')
        .eq('device_id', selectedDeviceId)
        .eq('status', 'FiscalDayOpened')
        .maybeSingle();
    setIsFiscalDayOpen(!!openDay);
  }

  // --- SYNC STATUS WITH ZIMRA ---
  async function handleCheckStatus() {
    if (!selectedDeviceId) return;
    setSyncing(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
        const { data, error } = await supabase.functions.invoke('check-device-status', {
            body: { deviceId: selectedDeviceId }
        });

        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);

        const isOpened = data.fiscalDayStatus === 'FiscalDayOpened';
        setIsFiscalDayOpen(isOpened);
        
        let msg = `Synced! Status: ${data.fiscalDayStatus}`;
        if (data.fiscalDayClosingErrorCode) {
            msg += ` (Error: ${data.fiscalDayClosingErrorCode})`;
            setErrorMsg(`ZIMRA Error: ${data.fiscalDayClosingErrorCode}`);
        } else {
            setSuccessMsg(msg);
        }

        await fetchDevices();

    } catch (err) {
        setErrorMsg("Status Check Failed: " + err.message);
    } finally {
        setSyncing(false);
    }
  }

  // --- HELPERS ---
  const handleLineChange = (index, field, value) => {
    const newCart = [...cart];
    newCart[index][field] = value;
    setCart(newCart);
  };

  const removeLine = (index) => {
    if (cart.length > 1) setCart(cart.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return cart.reduce((acc, row) => acc + (row.qty * row.price), 0);
  };

  const getTaxID = (percent) => {
    // Standard ZIMRA Mapping
    if (percent == 15) return 3; // Tax Code A
    if (percent == 0) return 1;  // Tax Code C
    if (percent == 5) return 2;  // Tax Code B
    return 3; 
  };

  const calculateTaxAmount = (saleAmount, taxPercent) => {
    const taxRate = taxPercent / 100;
    const val = (saleAmount * taxRate) / (1 + taxRate);
    return Math.round((val + Number.EPSILON) * 100) / 100;
  };

  const generateReceiptTaxes = (lines) => {
    const taxMap = {};
    lines.forEach(line => {
      const key = `${line.taxID}-${line.taxPercent}`;
      if (!taxMap[key]) {
        taxMap[key] = { taxID: line.taxID, taxPercent: line.taxPercent, salesAmountWithTax: 0 };
      }
      taxMap[key].salesAmountWithTax += Number(line.receiptLineTotal);
    });
    return Object.values(taxMap).map(t => ({
      taxID: t.taxID,
      taxPercent: t.taxPercent,
      salesAmountWithTax: Number(t.salesAmountWithTax.toFixed(2)),
      taxAmount: calculateTaxAmount(t.salesAmountWithTax, t.taxPercent)
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedDeviceId) return setErrorMsg("Please select a Fiscal Device.");
    if (deviceStatus !== 'ACTIVE') return setErrorMsg("Selected Device is Blocked or Inactive.");
    if (!isFiscalDayOpen && activeMode !== 'UPLOAD') return setErrorMsg("Fiscal Day is CLOSED. Please open it first.");
    
    setLoading(true);

    try {
      const orgMember = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
      
      let salePayload = {};

      if (activeMode === 'UPLOAD') {
        if (!uploadFile) throw new Error("Please select a file to upload.");
        salePayload = { note: "Bulk Upload", fileName: uploadFile.name };
      } else {
        const total = calculateTotal();
        if (total <= 0) throw new Error("Total amount must be greater than 0.");
        
        const invoiceNo = `INV-${Math.floor(Math.random() * 1000000)}`;

        let globalNo = 0;
        if (activeMode === 'RETURN') {
             globalNo = parseInt(returnDetails.originalReceiptNo) || 0;
        }

        const receiptLines = cart.map((row, idx) => ({
            receiptLineType: 'Sale',
            receiptLineNo: idx + 1,
            receiptLineHSCode: '04021099',
            receiptLineName: row.item || 'General Goods',
            receiptLineQuantity: Number(row.qty),
            receiptLineTotal: Number((row.qty * row.price).toFixed(2)),
            receiptLinePrice: Number(Number(row.price).toFixed(2)),
            taxPercent: Number(row.tax),
            taxID: getTaxID(Number(row.tax))
        }));

        const receiptTaxes = generateReceiptTaxes(receiptLines);

        salePayload = {
          currency: 'USD',
          receiptDate: new Date().toISOString(),
          receiptGlobalNo: globalNo,
          receiptCounter: 0, 
          invoiceNo: invoiceNo, 
          receiptType: activeMode === 'RETURN' ? 'CREDITNOTE' : 'FISCALINVOICE',
          receiptLinesTaxInclusive: true,
          
          // --- UPDATED: Pass Customer & User Data ---
          buyerData: {
             buyerRegisterName: customer.name || "Walk-in Customer",
             buyerTIN: customer.tin || "",
             buyerAddress: { street: customer.address || "" }
          },
          username: user.email?.split('@')[0] || "Operator",
          
          receiptLines: receiptLines,
          receiptTaxes: receiptTaxes, 
          receiptPayments: [{ moneyTypeCode: 'Cash', paymentAmount: Number(total.toFixed(2)), paymentDate: new Date().toISOString() }],
          total: Number(total.toFixed(2))
        };

        if (activeMode === 'RETURN') {
          salePayload.receiptNotes = returnDetails.reason;
          salePayload.creditDebitNote = {
            receiptID: returnDetails.originalReceiptNo,
            deviceSerialNo: returnDetails.originalDeviceSerial
          };
        }
      }

      const { error } = await supabase.from('sales_queue').insert({
        organization_id: orgMember.data.organization_id,
        device_id: selectedDeviceId,
        source: activeMode === 'UPLOAD' ? 'EXCEL' : 'POS',
        status: 'PENDING',
        sale_payload: salePayload
      });

      if (error) throw error;

      supabase.functions.invoke('process-queue');

      setSuccessMsg(`${activeMode} queued! Processing in background.`);
      setCart([{ item: '', qty: 1, price: 0, tax: 15 }]);
      setCustomer({ name: '', tin: '', address: '' }); // Reset Customer
      setReturnDetails({ originalReceiptNo: '', originalDeviceSerial: '', reason: '' });
      setUploadFile(null);

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Get Current Device Object for Props
  const currentDevice = devices.find(d => d.device_id == selectedDeviceId);

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

        <div className="flex gap-2 items-center">
            {selectedDeviceId && (
                <button 
                    onClick={handleCheckStatus} 
                    disabled={syncing}
                    title="Sync Status with ZIMRA"
                    className="h-10 px-3 bg-white border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 flex items-center gap-2 transition"
                >
                    {syncing ? <Loader2 className="animate-spin text-indigo-600" size={18} /> : <Activity size={18} />}
                    <span className="text-sm font-medium hidden sm:inline">Sync</span>
                </button>
            )}

            <div className="bg-white p-2 rounded-lg border shadow-sm flex items-center gap-3">
            <label className="text-xs font-bold text-gray-500 uppercase px-2">Device:</label>
            <select 
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block p-2 min-w-[200px]"
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
            >
                {devices.length === 0 && <option>No Devices Found</option>}
                {devices.map(dev => (
                <option key={dev.device_id} value={dev.device_id}>
                    {dev.serial_number}
                </option>
                ))}
            </select>
            </div>
        </div>
      </div>

      {/* ERROR / SUCCESS MESSAGES */}
      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r relative group">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 text-red-700 font-bold mb-1">
              <AlertTriangle size={20} /> Error
            </div>
            <button 
              onClick={() => {navigator.clipboard.writeText(errorMsg); alert("Error copied");}}
              className="text-red-400 hover:text-red-700 hover:bg-red-100 p-1 rounded transition"
              title="Copy Error"
            ><Copy size={16} /></button>
          </div>
          <p className="text-red-600 font-mono text-sm break-all pr-8 whitespace-pre-wrap">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r">
          <div className="flex items-center gap-2 text-green-700 font-bold">
            <CheckCircle size={20} /> Success
          </div>
          <p className="text-green-600">{successMsg}</p>
        </div>
      )}

      {selectedDeviceId && (
        <div className="mb-6">
          <FiscalDayControls 
            deviceId={selectedDeviceId} 
            isOpen={isFiscalDayOpen}
            dayNumber={currentDevice?.last_fiscal_day_no || 0} 
            onStatusChange={async (isOpen) => {
                setIsFiscalDayOpen(isOpen);
                await fetchDevices(); 
            }} 
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT PANEL */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* MODE SELECTOR */}
          <div className="bg-white p-1 rounded-lg shadow-sm border inline-flex w-full">
            <button onClick={() => setActiveMode('SALE')} className={`flex-1 py-3 rounded-md text-sm font-bold transition flex justify-center items-center gap-2 ${activeMode === 'SALE' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}><ShoppingCart size={18} /> Sale</button>
            <button onClick={() => setActiveMode('RETURN')} className={`flex-1 py-3 rounded-md text-sm font-bold transition flex justify-center items-center gap-2 ${activeMode === 'RETURN' ? 'bg-amber-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}><RefreshCcw size={18} /> Return</button>
            <button onClick={() => setActiveMode('UPLOAD')} className={`flex-1 py-3 rounded-md text-sm font-bold transition flex justify-center items-center gap-2 ${activeMode === 'UPLOAD' ? 'bg-emerald-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}><FileSpreadsheet size={18} /> Upload</button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {activeMode === 'UPLOAD' ? (
              <div className="p-12 text-center">
                <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4"><FileSpreadsheet size={40} /></div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Bulk Sales Upload</h3>
                <input type="file" onChange={e => setUploadFile(e.target.files[0])} className="block w-full max-w-xs mx-auto text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-emerald-50 file:text-emerald-700" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6">
                
                {/* --- CUSTOMER DETAILS (NEW) --- */}
                {activeMode === 'SALE' && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase col-span-2 mb-1">
                        <User size={12}/> Customer Details (Optional)
                     </div>
                     <input className="input-field bg-white" placeholder="Customer Name (e.g. John Doe)" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
                     <input className="input-field bg-white" placeholder="VAT / TIN Number" value={customer.tin} onChange={e => setCustomer({...customer, tin: e.target.value})} />
                  </div>
                )}

                {activeMode === 'RETURN' && (
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input required className="input-field border-amber-200" placeholder="Original Receipt Global No" value={returnDetails.originalReceiptNo} onChange={e => setReturnDetails({...returnDetails, originalReceiptNo: e.target.value})} />
                    <input required className="input-field border-amber-200" placeholder="Original Device Serial" value={returnDetails.originalDeviceSerial} onChange={e => setReturnDetails({...returnDetails, originalDeviceSerial: e.target.value})} />
                    <input required className="input-field border-amber-200 md:col-span-2" placeholder="Reason for Return" value={returnDetails.reason} onChange={e => setReturnDetails({...returnDetails, reason: e.target.value})} />
                  </div>
                )}

                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                  <div className="col-span-5">Item</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-center">Tax</div>
                  <div className="col-span-1"></div>
                </div>

                <div className="space-y-2 mb-4">
                  {cart.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5"><input className="input-field" placeholder="Item Name" value={row.item} onChange={e => handleLineChange(idx, 'item', e.target.value)} /></div>
                      <div className="col-span-2"><input type="number" min="1" className="input-field text-center" value={row.qty} onChange={e => handleLineChange(idx, 'qty', e.target.value)} /></div>
                      <div className="col-span-2"><input type="number" step="0.01" min="0" className="input-field text-right" value={row.price} onChange={e => handleLineChange(idx, 'price', e.target.value)} /></div>
                      <div className="col-span-2">
                        <select className="input-field p-1 text-xs" value={row.tax} onChange={e => handleLineChange(idx, 'tax', e.target.value)}>
                          <option value="15">15% (A)</option>
                          <option value="0">0% (C)</option>
                          <option value="5">5% (B)</option>
                        </select>
                      </div>
                      <div className="col-span-1 text-center"><button type="button" onClick={() => removeLine(idx)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button></div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setCart([...cart, { item: '', qty: 1, price: 0, tax: 15 }])} className="text-sm font-semibold text-indigo-600 flex items-center gap-1 hover:text-indigo-800"><Plus size={16} /> Add Line Item</button>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: SUMMARY */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Summary</h3>
            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <div className="flex justify-between"><span>Items</span><span>{cart.length}</span></div>
              <div className="flex justify-between"><span>Total</span><span>${calculateTotal().toFixed(2)}</span></div>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={loading || (!isFiscalDayOpen && activeMode !== 'UPLOAD')}
              className={`w-full py-4 rounded-lg text-white font-bold text-lg shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                ${activeMode === 'RETURN' ? 'bg-amber-600 hover:bg-amber-700' : 
                  activeMode === 'UPLOAD' ? 'bg-emerald-600 hover:bg-emerald-700' : 
                  'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {loading ? 'Processing...' : (
                <>
                  {activeMode === 'UPLOAD' ? <FileSpreadsheet /> : <CheckCircle />}
                  {activeMode === 'UPLOAD' ? 'Start Upload' : 
                   activeMode === 'RETURN' ? 'Process Return' : 'Complete Sale'}
                </>
              )}
            </button>
            {!isFiscalDayOpen && activeMode !== 'UPLOAD' && (
              <p className="text-xs text-center text-red-500 mt-3 font-medium">Day is Closed. Open above.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}