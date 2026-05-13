import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  CheckCircle,
  XCircle,
  Clock,
  Filter
} from 'lucide-react';

export default function Expenses() {
  const [activeTab, setActiveTab] = useState<'requests' | 'approved' | 'vendors'>('requests');

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expenses & Payouts</h1>
          <p className="text-slate-500 text-sm mt-1">Manage budget requests, approvals, and vendor payouts.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 text-sm transition-colors shadow-sm flex items-center gap-2">
            <Plus size={16} /> New Request
          </button>
        </div>
      </div>

      <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl w-fit">
        {['requests', 'approved', 'vendors'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-900">Pending Approvals</h3>
          <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
            <Filter size={16} /> Filter
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Request ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {[
                { id: 'EXP-2391', date: '2026-05-13', dept: 'Media', desc: 'New Camera Lens', amt: 'Le 4,500.00' },
                { id: 'EXP-2390', date: '2026-05-12', dept: 'Youth', desc: 'Conference Catering Deposit', amt: 'Le 2,000.00' },
                { id: 'EXP-2389', date: '2026-05-10', dept: 'Admin', desc: 'Office Supplies', amt: 'Le 500.00' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{row.id}</td>
                  <td className="px-6 py-4 text-slate-500">{row.date}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{row.dept}</td>
                  <td className="px-6 py-4 text-slate-500">{row.desc}</td>
                  <td className="px-6 py-4 font-bold text-slate-900 text-right">{row.amt}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                       <button className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors" title="Approve">
                         <CheckCircle size={16} />
                       </button>
                       <button className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors" title="Reject">
                         <XCircle size={16} />
                       </button>
                    </div>
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
