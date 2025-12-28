import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // Adjusted path to match project structure
import { useAuth } from '../contexts/Auth';
import { Lock, Unlock, AlertTriangle, Printer } from 'lucide-react';

export default function FiscalDay() {
  const { user } = useAuth();
  const [device, setDevice] = useState(null);
  const [currentDay, setCurrentDay] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    // 1. Get Org ID
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();
    
    if (!member) return;

    // 2. Get Device and its Current Day Status
    const { data: dev } = await supabase.from('fiscal_devices')
      .select('*, fiscal_days(*)')
      .eq('organization_id', member.organization_id)
      .eq('status', 'ACTIVE')
      .order('created_at', { foreignTable: 'fiscal_days', ascending: false })
      .limit(1)
      .single();

    if (dev) {
      setDevice(dev);
      // Find the open day or the last closed day (first item due to desc sort)
      const lastDay = dev.fiscal_days?.[0];
      setCurrentDay(lastDay);
    }
  }

  async function handleCloseDay() {
    if (!confirm("Are you sure you want to close the Fiscal Day? This generates the Z-Report.")) return;
    setLoading(true);

    // Call Edge Function to Calculate Totals, Sign, and Close
    const { data, error } = await supabase.functions.invoke('close-fiscal-day', {
      body: { deviceId: device.device_id }
    });

    if (error) alert('Error: ' + error.message);
    else {
      alert('Fiscal Day Closed Successfully! Z-Report Generated.');
      fetchStatus();
    }
    setLoading(false);
  }

  async function handleOpenDay() {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('open-fiscal-day', {
      body: { deviceId: device.device_id }
    });

    if (error) alert('Error: ' + error.message);
    else {
      alert('New Fiscal Day Opened!');
      fetchStatus();
    }
    setLoading(false);
  }

  if (!device) return <div className="p-10 text-center text-gray-500">Loading Device Status... (Ensure you have an active device)</div>;

  const isDayOpen = currentDay?.status === 'FiscalDayOpened';

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Fiscal Day Management</h1>

      <div className={`rounded-xl p-8 text-center border-2 ${isDayOpen ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
        
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDayOpen ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
          {isDayOpen ? <Unlock size={32} /> : <Lock size={32} />}
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-1">
          {isDayOpen ? `Fiscal Day ${currentDay?.fiscal_day_no} is OPEN` : 'Fiscal Day is CLOSED'}
        </h2>
        <p className="text-gray-500 mb-8">
          {isDayOpen ? 'You can issue receipts.' : 'You must open a new day to start selling.'}
        </p>

        {isDayOpen ? (
          <button 
            onClick={handleCloseDay} 
            disabled={loading}
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 mx-auto transition"
          >
            {loading ? 'Closing...' : <><Lock size={18} /> Close Day & Print Z-Report</>}
          </button>
        ) : (
          <button 
            onClick={handleOpenDay}
            disabled={loading} 
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 mx-auto transition"
          >
            {loading ? 'Opening...' : <><Unlock size={18} /> Open New Fiscal Day</>}
          </button>
        )}
      </div>

      {/* RECENT Z-REPORTS */}
      <div className="mt-8">
        <h3 className="font-bold text-gray-700 mb-4">Recent Z-Reports</h3>
        <div className="bg-white border rounded-lg divide-y">
          {!device.fiscal_days || device.fiscal_days.length === 0 ? (
            <div className="p-4 text-gray-400 text-center">No history available</div>
          ) : (
            device.fiscal_days.map(day => (
              <div key={day.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                <div>
                  <div className="font-bold text-gray-800">Day {day.fiscal_day_no}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(day.opened_at).toLocaleDateString()} 
                    {day.closed_at ? ` - ${new Date(day.closed_at).toLocaleTimeString()}` : ' (Active)'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-gray-900">${day.total_sales_amount || '0.00'}</div>
                  {day.status === 'FiscalDayClosed' && (
                    <button className="text-xs text-indigo-600 font-medium flex items-center gap-1 justify-end mt-1 hover:underline">
                      <Printer size={12} /> Print Report
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}