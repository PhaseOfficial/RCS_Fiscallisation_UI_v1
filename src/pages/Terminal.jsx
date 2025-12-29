import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/Auth';
import { 
  Plus, Trash2, RefreshCcw, FileSpreadsheet, ShoppingCart, 
  Server, AlertTriangle, CheckCircle 
} from 'lucide-react';
import FiscalDayControls from '../components/FiscalDayControls';

export default function Terminal() {
  const { user } = useAuth();
  
  // App State
  const [activeMode, setActiveMode] = useState('SALE'); 
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Device & Status State
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [deviceStatus, setDeviceStatus] = useState(null); 
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

  useEffect(() => {
    async function init() {
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      
      if (!member) return;

      const { data: devs } = await supabase
        .from('fiscal_devices')
        .select('device_id, serial_number, status, device_model_name')
        .eq('organization_id', member.organization_id)
        .order('device_id');

      if (devs && devs.length > 0) {
        setDevices(devs);
        if (!selectedDeviceId) setSelectedDeviceId(devs[0].device_id);
      }
      setCheckingStatus(false);
    }
    init();
  }, [user]);

  useEffect(() => {
    if (!selectedDeviceId) return;

    async function checkDay() {
      const currentDev = devices.find(d => d.device_id == selectedDeviceId);
      if (currentDev) setDeviceStatus(currentDev.status);

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
    // Tax ID must be an INTEGER
    if (percent == 15) return 3; 
    if (percent == 0) return 1; 
    if (percent == 5) return 2;  
    return 3;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

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
        
        const totalTaxAmount = (total - (total / 1.15)).toFixed(2);
        const salesAmountWithTax = total.toFixed(2);

        // --- GLOBAL NO FIX ---
        // Must be integer 0 for new sales, or parsed int for returns
        let globalNo = 0;
        if (activeMode === 'RETURN') {
             globalNo = parseInt(returnDetails.originalReceiptNo) || 0;
        }

        salePayload = {
          currency: 'USD',
          receiptDate: new Date().toISOString(), 
          
          // FIX: Send INTEGER 0, never null
          receiptGlobalNo: globalNo, 
          
          receiptType: activeMode === 'RETURN' ? 'CREDITNOTE' : 'FISCALINVOICE',
          
          receiptLines: cart.map((row, idx) => ({
            receiptLineType: 'Sale',
            receiptLineNo: idx + 1, // Integer
            receiptLineName: row.item || 'General Goods',
            receiptLineQuantity: Number(row.qty),
            receiptLineTotal: Number(row.qty * row.price).toFixed(2),
            taxPercent: Number(row.tax),
            taxID: getTaxID(Number(row.tax)) // Integer
          })),

          receiptTaxes: [
            {
              taxID: 3, 
              taxPercent: 15,
              taxAmount: Number(totalTaxAmount),
              salesAmountWithTax: Number(salesAmountWithTax)
            }
          ],

          
           receiptPayments: [
            {
              moneyTypeCode: 'CASH', // <--- CHANGED from 'paymentType'
              paymentAmount: Number(total.toFixed(2)),
              paymentDate: new Date().toISOString() // Edge function will format this
            }
          ],
          
          // 4. Root Total
          total: Number(total.toFixed(2))
        };

        if (activeMode === 'RETURN') {
          salePayload.receiptNotes = returnDetails.reason;
          salePayload.creditDebitNote = {
            receiptID: returnDetails.originalReceiptNo, // Keep as string here if API expects match
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

      alert(`${activeMode} queued! Processing in background.`);
      
      setCart([{ item: '', qty: 1, price: 0, tax: 15 }]);
      setReturnDetails({ originalReceiptNo: '', originalDeviceSerial: '', reason: '' });
      setUploadFile(null);

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (checkingStatus && devices.length === 0) return <div className="p-10 text-center">Loading Terminal...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <Server className="text-indigo-600" /> POS Terminal
           </h1>
           <p className="text-sm text-gray-500">Process Sales, Returns, and Bulk Uploads</p>
        </div>
        <div className="bg-white p-2 rounded-lg border shadow-sm flex items-center gap-3">
          <label className="text-xs font-bold text-gray-500 uppercase px-2">Device:</label>
          <select 
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block p-2 min-w-[200px]"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
            {devices.length === 0 && <option>No Devices Found</option>}
            {devices.map(dev => <option key={dev.device_id} value={dev.device_id}>{dev.serial_number}</option>)}
          </select>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r">
          <div className="flex items-center gap-2 text-red-700 font-bold"><AlertTriangle size={20} /> Error</div>
          <p className="text-red-600">{errorMsg}</p>
        </div>
      )}

      {selectedDeviceId && (
        <div className="mb-6"><FiscalDayControls deviceId={selectedDeviceId} onStatusChange={(isOpen) => setIsFiscalDayOpen(isOpen)} /></div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
                          <option value="15">15%</option><option value="0">0%</option><option value="5">5%</option>
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
              className={`w-full py-4 rounded-lg text-white font-bold text-lg shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${activeMode === 'RETURN' ? 'bg-amber-600' : 'bg-indigo-600'}`}
            >
              {loading ? 'Processing...' : (activeMode === 'RETURN' ? 'Process Return' : 'Complete Sale')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}