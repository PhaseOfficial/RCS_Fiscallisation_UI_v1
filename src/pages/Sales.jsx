import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import QRCode from 'react-qr-code';
import { Eye, CheckCircle, Clock, X } from 'lucide-react';

export default function Sales() {
  const [receipts, setReceipts] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Real-time subscription to see new receipts instantly
  useEffect(() => {
    fetchReceipts();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fiscal_receipts' }, payload => {
        setReceipts(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchReceipts() {
    const { data } = await supabase
      .from('fiscal_receipts')
      .select('*, fiscal_devices(serial_number)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setReceipts(data);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sales History</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Receipt #</th>
              <th className="p-4">Device</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map(r => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-4 font-mono">{r.receipt_global_no}</td>
                <td className="p-4">{r.fiscal_devices?.serial_number}</td>
                <td className="p-4 font-bold text-gray-900">${r.total_amount}</td>
                <td className="p-4">
                  {r.zimra_signature ? (
                    <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold w-fit">
                      <CheckCircle size={12} /> Signed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs font-bold w-fit">
                      <Clock size={12} /> Pending
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => setSelectedReceipt(r)} 
                    className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* QR CODE MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Fiscal Receipt</h3>
              <button onClick={() => setSelectedReceipt(null)}><X /></button>
            </div>
            
            <div className="bg-white p-4 inline-block rounded-lg border">
               {/* This generates the ZIMRA compliant QR */}
               <QRCode value={selectedReceipt.qr_code_url || "Pending"} size={200} />
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-600">
               <p><strong>ZIMRA ID:</strong> {selectedReceipt.verification_code}</p>
               <p><strong>Date:</strong> {new Date(selectedReceipt.created_at).toLocaleString()}</p>
               <p className="text-xl font-bold text-black mt-2">${selectedReceipt.total_amount}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}