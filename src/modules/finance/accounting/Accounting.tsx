import React, { useState } from 'react';
import { BookOpen, FileText, Download, Plus, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Accounting() {
  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Accounting & Ledger</h1>
          <p className="text-slate-500 text-sm mt-1">Double-entry accounting, statements, and chart of accounts.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-sm transition-colors">
            Trial Balance
          </button>
          <button className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 text-sm transition-colors shadow-sm flex items-center gap-2">
            <Plus size={16} /> Journal Entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Assets" amount="Le 450,200.00" trend="Stable" />
        <StatCard title="Total Liabilities" amount="Le 12,400.00" trend="-5%" />
        <StatCard title="Net Assets" amount="Le 437,800.00" trend="+2%" />
        <StatCard title="Fund Balance" amount="Le 125,000.00" trend="Operating" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Recent Journal Entries</h3>
              <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700">View All</button>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">JE#</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Account</th>
                  <th className="px-6 py-4 text-right">Debit</th>
                  <th className="px-6 py-4 text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {[
                  { je: 'JE-1024', date: '2026-05-13', desc: 'Sunday Service Tithes', acc: '1100 - Cash / 4100 - Tithes', dr: '12,500.00', cr: '12,500.00' },
                  { je: 'JE-1025', date: '2026-05-12', desc: 'Youth Department Van Fuel', acc: '5120 - Auto / 1100 - Cash', dr: '450.00', cr: '450.00' },
                  { je: 'JE-1026', date: '2026-05-10', desc: 'Monime Payout Settlement', acc: '1100 - Cash / 1150 - Clearing', dr: '25,000.00', cr: '25,000.00' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{row.je}</td>
                    <td className="px-6 py-4 text-slate-600">{row.date}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{row.desc}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{row.acc}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-900 text-right">{row.dr}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-900 text-right">{row.cr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Financial Reports</h3>
            <div className="space-y-3">
              {[
                { name: 'Income Statement', desc: 'Profit and loss overview.' },
                { name: 'Balance Sheet', desc: 'Assets, liabilities, and equity.' },
                { name: 'Cash Flow Statement', desc: 'Operating, investing logic.' },
                { name: 'Department Ledger', desc: 'Fund tracking per ministry.' }
              ].map(rep => (
                <button key={rep.name} className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-left group">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700">{rep.name}</h4>
                    <p className="text-xs text-slate-500">{rep.desc}</p>
                  </div>
                  <ArrowRight size={16} className="text-slate-400 group-hover:text-emerald-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, amount, trend }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
      <h4 className="text-2xl font-black text-slate-900 tracking-tight">{amount}</h4>
      <span className="text-xs text-slate-400 font-bold mt-2 block">{trend}</span>
    </div>
  );
}
