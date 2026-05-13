import React from 'react';
import { Search, ShieldAlert, Clock, Download } from 'lucide-react';

export default function AuditLogs() {
  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit & Compliance</h1>
          <p className="text-slate-500 text-sm mt-1">Immutable ledger of all system actions, approvals, and failed logins.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-sm transition-colors flex items-center gap-2 shadow-sm">
            <Download size={16} /> Export Logs
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
          <div className="relative w-full md:w-96">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input type="text" placeholder="Search actor, action..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
         </div>
         <table className="w-full text-left">
           <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
             <tr>
               <th className="px-6 py-4">Timestamp</th>
               <th className="px-6 py-4">Actor</th>
               <th className="px-6 py-4">Action</th>
               <th className="px-6 py-4">Resource IP</th>
               <th className="px-6 py-4">Status</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
             {[
               { time: '2026-05-13 14:02:11', actor: 'jsesay@church.org', action: 'Approved Payroll Run (May 2026)', ip: '102.33.12.11', stat: 'Success' },
               { time: '2026-05-13 11:15:42', actor: 'system_monime_webhook', action: 'Verified Orange Money Tx (TX-123)', ip: '198.51.100.2', stat: 'Success' },
               { time: '2026-05-12 09:45:10', actor: 'unknown', action: 'Failed Admin Login Attempt', ip: '45.22.11.9', stat: 'Failed' },
             ].map((row, i) => (
               <tr key={i} className="hover:bg-slate-50">
                 <td className="px-6 py-4 font-mono text-xs">{row.time}</td>
                 <td className="px-6 py-4 font-medium text-slate-900">{row.actor}</td>
                 <td className="px-6 py-4">{row.action}</td>
                 <td className="px-6 py-4 font-mono text-xs">{row.ip}</td>
                 <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-bold ${row.stat === 'Success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {row.stat === 'Success' ? <Clock size={14} /> : <ShieldAlert size={14} />} {row.stat}
                    </span>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
      </div>
    </div>
  );
}
