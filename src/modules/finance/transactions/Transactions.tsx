import React from 'react';
import { Search, Filter, Download, ArrowLeftRight } from 'lucide-react';

export default function Transactions() {
  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transactions</h1>
          <p className="text-slate-500 text-sm mt-1">Audit and reconcile across all payment providers.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-sm transition-colors flex items-center gap-2">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by ID, member, phone..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-auto">
              <option>All Status</option>
              <option>Successful</option>
              <option>Pending</option>
              <option>Failed</option>
            </select>
            <select className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-auto">
              <option>All Providers</option>
              <option>Orange Money</option>
              <option>Afrimoney</option>
              <option>Bank</option>
              <option>Cash</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Provider</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {[
                { id: 'TXN-M-9A3K2', date: '2026-05-13 14:02', sub: 'Tithe - James K.', prov: 'Orange Money', amt: 'Le 1,500.00', status: 'success' },
                { id: 'TXN-M-8X2J1', date: '2026-05-13 13:45', sub: 'Payroll Payout - P. Sesay', prov: 'Bank Transfer', amt: 'Le 8,500.00', status: 'pending' },
                { id: 'TXN-A-7L9P4', date: '2026-05-13 11:20', sub: 'Offering - Sarah B.', prov: 'Afrimoney', amt: 'Le 200.00', status: 'success' },
                { id: 'TXN-M-6N3X8', date: '2026-05-13 09:12', sub: 'Youth Conference Tkt', prov: 'Orange Money', amt: 'Le 150.00', status: 'failed' },
                { id: 'TXN-C-5B1M7', date: '2026-05-12 18:30', sub: 'Petty Cash - Media Dept', prov: 'Cash', amt: 'Le 400.00', status: 'success' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{row.id}</td>
                  <td className="px-6 py-4 text-slate-500">{row.date}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{row.sub}</td>
                  <td className="px-6 py-4 text-slate-500">{row.prov}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{row.amt}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full tracking-wider ${
                      row.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                      row.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
          <span>Showing 5 of 124 transactions</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm" disabled>Prev</button>
            <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
