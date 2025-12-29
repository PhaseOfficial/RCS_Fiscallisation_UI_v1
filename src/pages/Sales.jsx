import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import QRCode from 'react-qr-code';
import { Eye, CheckCircle, Clock, X, RefreshCw, Zap, AlertTriangle, Copy, Check } from 'lucide-react';

export default function Sales() {
  const [items, setItems] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedError, setSelectedError] = useState(null); // <--- New State for Error Modal
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false); // To show "Copied!" feedback

  // Real-time subscription
  useEffect(() => {
    fetchData();

    const receiptSub = supabase
      .channel('receipts-update')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fiscal_receipts' }, () => fetchData())
      .subscribe();

    const queueSub = supabase
      .channel('queue-update')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_queue' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(receiptSub);
      supabase.removeChannel(queueSub);
    };
  }, []);

  async function fetchData() {
    setLoading(true);
    
    // 1. Fetch Completed Receipts
    const { data: receipts } = await supabase
      .from('fiscal_receipts')
      .select('id, created_at, receipt_global_no, total_amount, zimra_verification_code, qr_code_url, fiscal_devices(serial_number)')
      .order('created_at', { ascending: false })
      .limit(50);

    // 2. Fetch Queue Items
    const { data: queue } = await supabase
      .from('sales_queue')
      .select('id, created_at, status, sale_payload, error_details, fiscal_devices(serial_number)')
      .in('status', ['PENDING', 'PROCESSING', 'FAILED'])
      .order('created_at', { ascending: false });

    // 3. Normalize & Merge
    const formattedReceipts = (receipts || []).map(r => ({
      id: r.id,
      date: r.created_at,
      device: r.fiscal_devices?.serial_number || 'Unknown',
      receiptNo: r.receipt_global_no,
      amount: r.total_amount,
      status: 'SIGNED',
      error: null,
      raw: r
    }));

    const formattedQueue = (queue || []).map(q => ({
      id: q.id,
      date: q.created_at,
      device: q.fiscal_devices?.serial_number || 'Unknown',
      receiptNo: 'Pending...',
      amount: q.sale_payload?.total || 0,
      status: q.status,
      error: q.error_details,
      raw: null 
    }));

    setItems([...formattedQueue, ...formattedReceipts]);
    setLoading(false);
  }

  async function forceProcess() {
    setProcessing(true);
    const { error } = await supabase.functions.invoke('process-queue');
    if (error) alert("Error: " + error.message);
    else {
      setTimeout(() => {
        fetchData();
        setProcessing(false);
      }, 2000);
    }
  }

  const handleCopyError = () => {
    if (selectedError) {
      navigator.clipboard.writeText(selectedError);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2s
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sales History</h1>
        
        <div className="flex gap-2">
           <button onClick={fetchData} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition" title="Refresh List">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          
          <button onClick={forceProcess} disabled={processing} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50">
            <Zap size={16} /> {processing ? 'Processing...' : 'Process Queue Now'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {items.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No sales records found.</div>
        ) : (
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Receipt #</th>
                <th className="p-4">Device</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(item => (
                <tr key={item.id} className={`hover:bg-gray-50 transition ${item.status === 'FAILED' ? 'bg-red-50' : ''}`}>
                  <td className="p-4 whitespace-nowrap">{new Date(item.date).toLocaleString()}</td>
                  
                  <td className="p-4">
                    {item.status === 'SIGNED' ? (
                      <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs font-bold"><CheckCircle size={12} /> Signed</span>
                    ) : item.status === 'FAILED' ? (
                      <div className="flex flex-col items-start gap-1">
                        <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-1 rounded-full text-xs font-bold"><X size={12} /> Failed</span>
                        
                        {/* OPEN ERROR MODAL BUTTON */}
                        <button 
                          onClick={() => setSelectedError(item.error || "Unknown Error")}
                          className="text-[10px] text-red-600 underline hover:text-red-800 font-medium flex items-center gap-1"
                        >
                          <AlertTriangle size={10} /> View Error
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-1 rounded-full text-xs font-bold animate-pulse"><Clock size={12} /> {item.status}</span>
                    )}
                  </td>

                  <td className="p-4 font-mono text-gray-500">{item.receiptNo}</td>
                  <td className="p-4 text-gray-900 font-medium">{item.device}</td>
                  <td className="p-4 font-bold text-gray-900 text-right">${Number(item.amount).toFixed(2)}</td>
                  
                  <td className="p-4 text-center">
                    {item.status === 'SIGNED' && item.raw ? (
                      <button onClick={() => setSelectedReceipt(item.raw)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition"><Eye size={18} /></button>
                    ) : <span className="text-gray-300">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- ERROR MODAL --- */}
      {selectedError && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 border-b bg-red-50 flex justify-between items-center">
              <div className="flex items-center gap-2 text-red-700 font-bold">
                <AlertTriangle size={20} />
                <h3>Transaction Failed</h3>
              </div>
              <button onClick={() => setSelectedError(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-2 font-medium">ZIMRA API Response:</p>
              
              {/* Copyable Code Block */}
              <div className="relative group">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-auto max-h-60 whitespace-pre-wrap break-all border border-gray-700">
                  {selectedError}
                </pre>
                
                {/* Copy Button (Top Right of Code Block) */}
                <button 
                  onClick={handleCopyError}
                  className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white p-1.5 rounded-md shadow transition flex items-center gap-1 text-xs"
                >
                  {copied ? <><Check size={12} className="text-green-400"/> Copied</> : <><Copy size={12}/> Copy</>}
                </button>
              </div>

              <div className="mt-6 flex justify-end">
                <button onClick={() => setSelectedError(null)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- RECEIPT MODAL --- */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">Fiscal Receipt</h3>
              <button onClick={() => setSelectedReceipt(null)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            
            <div className="bg-white p-4 inline-block rounded-lg border-2 border-gray-100 mb-4">
               <QRCode value={selectedReceipt.qr_code_url || "Pending"} size={180} />
            </div>

            <div className="space-y-2 text-sm text-left bg-gray-50 p-4 rounded-lg">
               <div className="flex justify-between"><span className="text-gray-500">ZIMRA Code:</span><span className="font-mono font-bold text-xs">{selectedReceipt.zimra_verification_code?.substring(0, 15)}...</span></div>
               <div className="flex justify-between"><span className="text-gray-500">Receipt #:</span><span className="font-mono font-bold">{selectedReceipt.receipt_global_no}</span></div>
               <div className="flex justify-between border-t pt-2 mt-2"><span className="text-gray-900 font-bold">Total Paid:</span><span className="text-xl font-bold text-indigo-600">${selectedReceipt.total_amount}</span></div>
            </div>
            
            <button onClick={() => setSelectedReceipt(null)} className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-200">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}