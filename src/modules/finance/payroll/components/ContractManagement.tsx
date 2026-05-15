import React, { useState } from 'react';
import { usePayrollStore } from '../stores/usePayrollStore';
import { Plus, Search, FileText, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ContractStatus } from '../types';

export default function ContractManagement() {
  const { contracts, updateContract } = usePayrollStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = contracts.filter(c => 
    c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contractType.replace('_', ' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusStyle = (status: ContractStatus) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending_renewal':
        return 'bg-amber-100 text-amber-700 animate-pulse';
      case 'expired':
        return 'bg-red-100 text-red-700';
      case 'terminated':
        return 'bg-slate-200 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search contracts..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 text-sm transition-colors flex items-center justify-center gap-2">
          <Plus size={16} /> Upload New Contract
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filtered.map(contract => (
            <motion.div key={contract.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{contract.employeeName}</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mt-0.5">{contract.contractType.replace('_', ' ')}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full tracking-wider ${getStatusStyle(contract.status)}`}>
                  {contract.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 flex-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Start Date</span>
                  <span className="font-medium text-slate-900">{new Date(contract.startDate).toLocaleDateString()}</span>
                </div>
                {contract.endDate && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">End Date</span>
                    <span className="font-medium text-slate-900">{new Date(contract.endDate).toLocaleDateString()}</span>
                  </div>
                )}
                {contract.renewalDate && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Renewal/Review</span>
                    <span className="font-medium text-slate-900 flex items-center gap-1">
                      <Clock size={14} className="text-indigo-500" />
                      {new Date(contract.renewalDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {contract.status === 'pending_renewal' && (
                <div className="mb-4 bg-amber-50 rounded-lg p-3 border border-amber-200 flex items-start gap-2">
                   <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                   <p className="text-xs text-amber-800 leading-relaxed font-medium">This contract is nearing its expiration date. Please review terms for renewal.</p>
                </div>
              )}

              <div className="flex gap-2 mt-auto">
                <button className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-sm transition-colors">
                  View Document
                </button>
                <button className="py-2 px-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium rounded-lg text-sm transition-colors">
                  ...
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </motion.div>
  );
}
