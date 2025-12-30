import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Sun, Moon, Loader2, AlertCircle, Calendar } from 'lucide-react';

export default function FiscalDayControls({ deviceId, isOpen, dayNumber, onStatusChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleAction(action) {
    const endpoint = action === 'OPEN' ? 'open-fiscal-day' : 'close-fiscal-day';
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(endpoint, {
        body: { deviceId }
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const successMsg = action === 'OPEN' 
        ? `Success: Fiscal Day ${data.day} Opened!` 
        : `Success: Fiscal Day ${data.day} Closed!`;
      
      alert(successMsg);

      if (onStatusChange) {
        // Pass 'true' if we just opened, 'false' if we just closed
        onStatusChange(action === 'OPEN');
      }

    } catch (err) {
      console.error(err);
      setError(err.message || "Operation failed. Check console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      
      {/* Icon & Label with Dynamic Status */}
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
           {isOpen ? <Sun size={20} /> : <Moon size={20} />}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="font-bold text-gray-700 text-sm">Fiscal Day Management</h4>
            
            {/* STATUS BADGE */}
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${isOpen ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
              {isOpen ? 'Open' : 'Closed'}
            </span>

            {/* DAY NUMBER BADGE */}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
              <Calendar size={8} /> Day #{dayNumber || '--'}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {isOpen ? "Day is currently open for sales." : "Open the day to start selling."}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {error && (
            <div className="text-xs text-red-600 font-bold flex items-center gap-1 mr-2 bg-red-50 px-2 py-1 rounded border border-red-100">
                <AlertCircle size={12}/> {error}
            </div>
        )}
        
        {/* Open Button */}
        <button 
          onClick={() => handleAction('OPEN')}
          disabled={loading || isOpen}
          className={`px-4 py-2 text-white text-xs font-bold rounded flex items-center gap-2 transition 
            ${isOpen ? 'bg-gray-300 cursor-not-allowed opacity-50' : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'}
          `}
        >
           {loading ? <Loader2 className="animate-spin" size={14}/> : <Sun size={14}/>} 
           Open Day
        </button>

        {/* Close Button */}
        <button 
          onClick={() => handleAction('CLOSE')}
          disabled={loading || !isOpen}
          className={`px-4 py-2 text-white text-xs font-bold rounded flex items-center gap-2 transition 
            ${!isOpen ? 'bg-gray-300 cursor-not-allowed opacity-50' : 'bg-gray-800 hover:bg-gray-900 shadow-sm'}
          `}
        >
           {loading ? <Loader2 className="animate-spin" size={14}/> : <Moon size={14}/>} 
           Close Day
        </button>
      </div>
    </div>
  );
}