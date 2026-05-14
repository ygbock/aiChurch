import React, { useState } from 'react';
import { Search, Filter, ShieldAlert } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  targetDetails: string;
  ipAddress?: string;
}

export default function AuditTrail() {
  const [searchTerm, setSearchTerm] = useState('');

  // Dummy data for audit logs
  const logs: AuditLog[] = [
    { id: 'AL-1092', timestamp: '2026-05-13T14:22:04Z', user: 'admin', action: 'Approved Journal Entry', targetDetails: 'JE-1024 - Sunday Service Tithes (Le 12,500.00)' },
    { id: 'AL-1091', timestamp: '2026-05-13T12:00:00Z', user: 'system', action: 'Created Journal Entry', targetDetails: 'JE-1024 - Auto-generated from Donation module' },
    { id: 'AL-1090', timestamp: '2026-05-12T10:05:12Z', user: 'jane.smith', action: 'Reversed Journal Entry', targetDetails: 'JE-1018 - Reversed due to incorrect amount' },
    { id: 'AL-1089', timestamp: '2026-05-12T10:00:00Z', user: 'admin', action: 'Posted Journal Entry', targetDetails: 'JE-1025 - Youth Department Event Tickets' },
    { id: 'AL-1088', timestamp: '2026-05-11T16:45:00Z', user: 'admin', action: 'Updated Account', targetDetails: 'Account 1100 name changed from "Cash" to "Cash on Hand"' },
    { id: 'AL-1087', timestamp: '2026-05-11T09:30:00Z', user: 'admin', action: 'Closed Accounting Period', targetDetails: 'Period: April 2026 (Branch: All)' },
  ];

  const filteredLogs = logs.filter(l => 
    l.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.targetDetails.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <div>
           <h2 className="text-xl font-bold flex items-center gap-2">
             <ShieldAlert className="text-amber-400" />
             Audit Trail Log
           </h2>
           <p className="text-slate-400 text-sm mt-1">Immutable record of all accounting actions and changes.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search logs by user, action, or details..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 text-sm flex items-center gap-2">
            <Filter size={16} /> Date Range
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Target / Details</th>
                <th className="px-6 py-4 text-right">Log ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLogs.map((log) => (
               <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                 <td className="px-6 py-4 text-slate-500 tabular-nums">
                   {new Date(log.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                 </td>
                 <td className="px-6 py-4 font-bold text-slate-900">{log.user}</td>
                 <td className="px-6 py-4">
                   <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg text-xs">
                     {log.action}
                   </span>
                 </td>
                 <td className="px-6 py-4 text-slate-600 line-clamp-1" title={log.targetDetails}>{log.targetDetails}</td>
                 <td className="px-6 py-4 font-mono text-xs text-slate-400 text-right">{log.id}</td>
               </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No audit logs found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
