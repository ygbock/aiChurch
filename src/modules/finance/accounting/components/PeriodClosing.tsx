import React, { useState } from 'react';
import { Lock, Unlock, Calendar, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAccountingStore } from '../store/accountingStore';

export default function PeriodClosing() {
  const entries = useAccountingStore(state => state.journals);

  const [periods, setPeriods] = useState([
    { id: 'p-1', name: 'March 2026', startDate: '2026-03-01', endDate: '2026-03-31', status: 'closed', closedBy: 'admin', closedAt: '2026-04-05T10:00:00Z' },
    { id: 'p-2', name: 'April 2026', startDate: '2026-04-01', endDate: '2026-04-30', status: 'closed', closedBy: 'admin', closedAt: '2026-05-02T14:30:00Z' },
    { id: 'p-3', name: 'May 2026', startDate: '2026-05-01', endDate: '2026-05-31', status: 'open' }
  ]);

  const openPeriod = periods.find(p => p.status === 'open');
  const pastPeriods = periods.filter(p => p.status === 'closed').sort((a,b) => b.endDate.localeCompare(a.endDate));

  // Count unposted journals in open period
  const unpostedInOpenPeriod = entries.filter(j => 
    openPeriod &&
    j.entryDate >= openPeriod.startDate && 
    j.entryDate <= openPeriod.endDate &&
    j.status !== 'Posted'
  ).length;

  const handleClosePeriod = () => {
    if (!openPeriod) return;
    
    if (unpostedInOpenPeriod > 0) {
      alert(`Cannot close period. There are ${unpostedInOpenPeriod} unposted journals in this period. Please post or delete them first.`);
      return;
    }

    if (confirm(`Are you sure you want to close the period ${openPeriod.name}? This will lock all transactions within this period.`)) {
      setPeriods(prev => prev.map(p => 
        p.id === openPeriod.id 
          ? { ...p, status: 'closed', closedBy: 'current_user', closedAt: new Date().toISOString() } 
          : p
      ));

      // In a real app we'd generate a new open period automatically, e.g., June 2026
      const nextMonthObj = new Date(openPeriod.endDate);
      nextMonthObj.setDate(nextMonthObj.getDate() + 1); // June 1st
      
      const newEndDate = new Date(nextMonthObj.getFullYear(), nextMonthObj.getMonth() + 1, 0);

      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          
      setPeriods(prev => [...prev, {
        id: `p-${Math.random()}`,
        name: `${months[nextMonthObj.getMonth()]} ${nextMonthObj.getFullYear()}`,
        startDate: nextMonthObj.toISOString().split('T')[0],
        endDate: newEndDate.toISOString().split('T')[0],
        status: 'open'
      }]);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Lock size={120} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
            <Lock className="text-amber-400" />
            Period Closing & Lock Dates
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Closing an accounting period locks all journal entries within that date range, preventing further modifications. This ensures your past financial reports remain static and audit-compliant.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs mb-6 relative z-10">Current Open Period</h3>
          
          {openPeriod ? (
            <div className="space-y-6 relative z-10">
              <div>
                <div className="text-2xl font-black text-slate-900">{openPeriod.name}</div>
                <div className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                  <Calendar size={14} />
                  {new Date(openPeriod.startDate).toLocaleDateString()} &mdash; {new Date(openPeriod.endDate).toLocaleDateString()}
                </div>
              </div>

              {unpostedInOpenPeriod > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
                   <AlertTriangle className="shrink-0" />
                   <div>
                      <p className="font-bold text-sm">Action Required</p>
                      <p className="text-xs mt-1">There are {unpostedInOpenPeriod} draft/unposted journal entries in this period. They must be posted or deleted before closing.</p>
                   </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-emerald-800">
                   <ShieldCheck className="shrink-0" />
                   <div>
                      <p className="font-bold text-sm">Ready to Close</p>
                      <p className="text-xs mt-1">All journal entries in this period are posted. It is safe to close the books.</p>
                   </div>
                </div>
              )}

              <button 
                onClick={handleClosePeriod}
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <Lock size={18} /> Close Period "{openPeriod.name}"
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 font-medium relative z-10">
              No open periods found.
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Closed Periods History</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
             <div className="space-y-1">
               {pastPeriods.map((period) => (
                 <div key={period.id} className="p-4 hover:bg-slate-50 rounded-xl flex items-center justify-between transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-slate-200 transition-colors">
                          <Lock size={16} />
                       </div>
                       <div>
                          <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{period.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">Closed {period.closedAt && new Date(period.closedAt).toLocaleDateString()} by {period.closedBy}</div>
                       </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                 </div>
               ))}
               {pastPeriods.length === 0 && (
                 <div className="p-6 text-center text-slate-500 text-sm italic">
                   No closed periods recorded yet.
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
