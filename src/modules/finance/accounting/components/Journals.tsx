import React, { useState } from 'react';
import { Search, Plus, Filter, AlertCircle, FileText } from 'lucide-react';
import { useAccountingStore } from '../store/accountingStore';
import JournalEntryFormModal from './JournalEntryFormModal';

export default function Journals() {
  const journals = useAccountingStore(state => state.journals);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredJournals = journals.filter(j => 
    j.id.includes(searchTerm) || 
    j.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search journals by ID or description..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 text-sm flex items-center gap-2">
            <Filter size={16} /> Filter
          </button>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 text-sm flex items-center gap-2 shadow-sm">
            <Plus size={16} /> New Journal Entry
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">JE# & Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Debit</th>
                <th className="px-6 py-4 text-right">Credit</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredJournals.map((row) => {
                const totalDr = row.lines.reduce((sum, l) => sum + l.debit, 0);
                const totalCr = row.lines.reduce((sum, l) => sum + l.credit, 0);
                const isBalanced = totalDr === totalCr;

                return (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-slate-900">{row.id}</span>
                        <span className="text-xs text-slate-500">{row.entryDate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 line-clamp-2">{row.description}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full tracking-wider ${getStatusColor(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-700 text-right">{totalDr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-700 text-right">
                      {totalCr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      {!isBalanced && (
                         <span title="Unbalanced Entry">
                           <AlertCircle size={14} className="inline ml-2 text-rose-500" />
                         </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1 justify-end w-full">
                         <FileText size={16} /> View
                       </button>
                    </td>
                  </tr>
                );
              })}
              {filteredJournals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No journal entries found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <JournalEntryFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Draft': return 'bg-slate-100 text-slate-600';
    case 'Pending Approval': return 'bg-amber-100 text-amber-700';
    case 'Posted': return 'bg-emerald-100 text-emerald-700';
    case 'Reversed': return 'bg-rose-100 text-rose-700';
    default: return 'bg-slate-100 text-slate-600';
  }
}

