import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Lock, Unlock, Loader2 } from 'lucide-react';

export default function FiscalDayControls({ deviceId, onStatusChange }) {
  const [status, setStatus] = useState(null); // 'OPEN' or 'CLOSED'
  const [dayNumber, setDayNumber] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // 1. Check Status on Mount or Device Change
  useEffect(() => {
    if (deviceId) checkStatus();
  }, [deviceId]);

  async function checkStatus() {
    setLoading(true);
    // Find the most recent day entry
    const { data } = await supabase
      .from('fiscal_days')
      .select('*')
      .eq('device_id', deviceId)
      .order('fiscal_day_no', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && data.status === 'FiscalDayOpened') {
      setStatus('OPEN');
      setDayNumber(data.fiscal_day_no);
    } else {
      setStatus('CLOSED');
      setDayNumber(data ? data.fiscal_day_no : 0);
    }
    setLoading(false);
  }

  // 2. Handle Opening
  async function handleOpen() {
    setProcessing(true);
    // Calls the Edge Function which talks to ZIMRA endpoint: /Device/v1/{id}/OpenDay
    const { data, error } = await supabase.functions.invoke('open-fiscal-day', {
      body: { deviceId }
    });

    if (error) {
      alert(`ZIMRA Comms Failed: ${error.message}`);
    } else {
      alert(`Fiscal Day ${data.day} Opened Successfully!`);
      setStatus('OPEN');
      setDayNumber(data.day);
      if (onStatusChange) onStatusChange(true);
    }
    setProcessing(false);
  }

  // 3. Handle Closing (Z-Report)
  async function handleClose() {
    if (!confirm("Close Day & Print Z-Report? This cannot be undone.")) return;
    setProcessing(true);

    // Calls Edge Function which talks to ZIMRA endpoint: /Device/v1/{id}/CloseDay
    const { error } = await supabase.functions.invoke('close-fiscal-day', {
      body: { deviceId }
    });

    if (error) {
      alert(`ZIMRA Comms Failed: ${error.message}`);
    } else {
      alert(`Fiscal Day Closed. Z-Report generated.`);
      setStatus('CLOSED');
      if (onStatusChange) onStatusChange(false);
    }
    setProcessing(false);
  }

  if (loading) return <div className="text-xs text-gray-500 flex gap-2"><Loader2 className="animate-spin" size={14}/> Checking status...</div>;

  if (status === 'OPEN') {
    return (
      <div className="flex items-center gap-4 bg-green-50 border border-green-200 p-3 rounded-lg">
        <div className="flex items-center gap-2 text-green-700">
           <Unlock size={20} />
           <div>
             <span className="block text-xs font-bold uppercase">Fiscal Day {dayNumber}</span>
             <span className="text-sm font-medium">Status: Open</span>
           </div>
        </div>
        <button 
          onClick={handleClose}
          disabled={processing}
          className="ml-auto bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded shadow flex items-center gap-2 transition"
        >
          {processing ? <Loader2 className="animate-spin" size={14}/> : <Lock size={14} />}
          Close Day
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 p-3 rounded-lg">
      <div className="flex items-center gap-2 text-gray-500">
         <Lock size={20} />
         <div>
           <span className="block text-xs font-bold uppercase">Fiscal Day {dayNumber}</span>
           <span className="text-sm font-medium">Status: Closed</span>
         </div>
      </div>
      <button 
        onClick={handleOpen}
        disabled={processing}
        className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded shadow flex items-center gap-2 transition"
      >
        {processing ? <Loader2 className="animate-spin" size={14}/> : <Unlock size={14} />}
        Open Day
      </button>
    </div>
  );
}