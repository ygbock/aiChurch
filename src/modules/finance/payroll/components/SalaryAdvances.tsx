import React, { useState } from 'react';
import { usePayrollStore } from '../stores/usePayrollStore';
import { Plus, Search, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdvanceStatus } from '../types';

export default function SalaryAdvances() {
  const { advances, updateAdvanceStatus } = usePayrollStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = advances.filter(a => 
    a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: AdvanceStatus) => {
    switch(status) {
        case 'pending_approval': return 'bg-amber-100 text-amber-700';
        case 'approved': return 'bg-blue-100 text-blue-700';
        case 'paid': return 'bg-indigo-100 text-indigo-700';
        case 'repaying': return 'bg-orange-100 text-orange-700';
        case 'repaid': return 'bg-emerald-100 text-emerald-700';
        case 'rejected': return 'bg-red-100 text-red-700';
        default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search advances by name, purpose..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 text-sm transition-colors flex items-center justify-center gap-2">
          <Plus size={16} /> New Advance Request
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Salary Advances</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Purpose</th>
                <th className="px-6 py-4">Requested</th>
                <th className="px-6 py-4">Balance</th>
                <th className="px-6 py-4">Monthly Ded.</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
                <AnimatePresence>
                {filtered.map((adv) => (
                    <motion.tr 
                        key={adv.id} 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="hover:bg-slate-50"
                    >
                    <td className="px-6 py-4 font-bold text-slate-900">{adv.employeeName}</td>
                    <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate">{adv.purpose}</td>
                    <td className="px-6 py-4 font-medium">${adv.amountRequested}</td>
                    <td className="px-6 py-4 text-orange-600 font-bold">${adv.remainingBalance}</td>
                    <td className="px-6 py-4 text-slate-500">${adv.monthlyDeduction}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full tracking-wider ${getStatusColor(adv.status)}`}>
                            {adv.status.replace('_', ' ')}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                        {adv.status === 'pending_approval' && (
                            <>
                                <button onClick={() => updateAdvanceStatus(adv.id, 'approved')} className="p-1 hover:bg-emerald-50 text-emerald-600 rounded">
                                    <CheckCircle2 size={18} />
                                </button>
                                <button onClick={() => updateAdvanceStatus(adv.id, 'rejected')} className="p-1 hover:bg-red-50 text-red-600 rounded">
                                    <XCircle size={18} />
                                </button>
                            </>
                        )}
                        {(adv.status === 'approved' || adv.status === 'paid') && (
                            <button onClick={() => updateAdvanceStatus(adv.id, 'repaying')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                                Mark Repaying
                            </button>
                        )}
                    </td>
                    </motion.tr>
                ))}
                </AnimatePresence>
            </tbody>
            </table>
        </div>
      </div>
    </motion.div>
  );
}
