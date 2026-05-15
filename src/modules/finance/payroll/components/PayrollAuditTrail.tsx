import React, { useState } from 'react';
import { useAuditLogger } from '../../../../core/audit/useAuditLogger';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShieldCheck, Clock, User } from 'lucide-react';

export default function PayrollAuditTrail() {
  const { logs } = useAuditLogger();
  const payrollLogs = logs.filter(log => log.module === 'Payroll');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = payrollLogs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search audit trail..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Compliance & Audit Trail</h3>
            <p className="text-xs text-slate-500">Immutable record of all payroll actions</p>
          </div>
        </div>
        
        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No matching audit logs found.</div>
          ) : (
            <AnimatePresence>
              {filtered.map(log => (
                <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:px-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-sm mb-1">{log.action}</p>
                    <p className="text-slate-600 text-sm">{log.details}</p>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 text-xs text-slate-500 shrink-0">
                    <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded font-medium text-slate-700">
                      <User size={12} /> {log.userId}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
}
