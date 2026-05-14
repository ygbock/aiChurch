import React, { useState } from 'react';
import { useDonationStore } from '../stores/useDonationStore';
import { Search, Filter, Play, Pause, XCircle } from 'lucide-react';

export default function RecurringGiving() {
  const { recurring, updateRecurringStatus } = useDonationStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecurring = recurring.filter(r => 
    r.donorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search donors or categories..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 text-sm flex items-center gap-2">
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Donor Profile</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Amount & Freq</th>
                <th className="px-6 py-4">Next Billing</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredRecurring.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                     <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        row.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 
                        row.status === 'Paused' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                     }`}>
                       {row.status}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900">{row.donorName}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{row.categoryName}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                       <span className="font-bold text-emerald-600">{row.currency} {row.amount.toLocaleString()}</span>
                       <span className="text-xs text-slate-500">{row.frequency}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">
                     {new Date(row.nextBillingDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {row.status !== 'Active' && (
                       <button onClick={() => updateRecurringStatus(row.id, 'Active')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-block" title="Resume">
                         <Play size={16} />
                       </button>
                    )}
                    {row.status === 'Active' && (
                       <button onClick={() => updateRecurringStatus(row.id, 'Paused')} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors inline-block" title="Pause">
                         <Pause size={16} />
                       </button>
                    )}
                    {row.status !== 'Cancelled' && (
                       <button onClick={() => updateRecurringStatus(row.id, 'Cancelled')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block" title="Cancel">
                         <XCircle size={16} />
                       </button>
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
