import React, { useState } from 'react';
import { useDonationStore } from '../stores/useDonationStore';
import { Search, Filter, Download, FileText } from 'lucide-react';

export default function DonationTransactions() {
  const { transactions } = useDonationStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTx = transactions.filter(tx => 
    tx.donorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tx.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search donors, receipts, or ref..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 text-sm flex items-center gap-2">
            <Filter size={16} /> Filter
          </button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 text-sm flex items-center gap-2">
            <FileText size={16} /> Tax Reports
          </button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 text-sm flex items-center gap-2">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Status & Date</th>
                <th className="px-6 py-4">Donor Profile</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Method & Ref</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredTx.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                     <div className="flex flex-col gap-1">
                       <div className="flex items-center gap-1.5">
                         <div className={`w-2 h-2 rounded-full ${row.status === 'Completed' ? 'bg-emerald-500' : row.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'}`} />
                         <span className={`text-xs font-bold ${row.status === 'Completed' ? 'text-emerald-700' : row.status === 'Pending' ? 'text-amber-700' : 'text-red-700'}`}>{row.status}</span>
                       </div>
                       <span className="text-slate-500 text-xs">{new Date(row.date).toLocaleString()}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                       <span className="font-bold text-slate-900">{row.donorName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">{row.categoryName}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                       <span className="text-slate-700 font-medium">{row.method}</span>
                       <span className="text-xs text-slate-400 font-mono">{row.reference}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-emerald-600 text-right">{row.currency} {row.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td className="px-6 py-4 text-center">
                    {row.receiptUrl ? (
                       <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block" title="Download Receipt">
                         <Download size={16} />
                       </button>
                    ) : (
                       <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
