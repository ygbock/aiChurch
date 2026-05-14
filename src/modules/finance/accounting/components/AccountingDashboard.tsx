import React from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useAccountingStore } from '../store/accountingStore';

export default function AccountingDashboard() {
  const journals = useAccountingStore(state => state.journals);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Assets" amount="Le 450,200.00" trend="Stable" />
        <StatCard title="Total Liabilities" amount="Le 12,400.00" trend="-5%" />
        <StatCard title="Net Assets" amount="Le 437,800.00" trend="+2%" />
        <StatCard title="Fund Balance" amount="Le 125,000.00" trend="Operating" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Recent Journal Entries</h3>
              <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">JE#</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-right">Debit</th>
                    <th className="px-6 py-4 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {journals.slice(0, 5).map((row, i) => {
                    const totalDr = row.lines.reduce((sum, l) => sum + l.debit, 0);
                    const totalCr = row.lines.reduce((sum, l) => sum + l.credit, 0);
                    return (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{row.id}</td>
                        <td className="px-6 py-4 text-slate-600">{row.entryDate}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{row.description}</td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-900 text-right">{totalDr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-900 text-right">{totalCr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                  {journals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        <BookOpen className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                        <p>No journal entries found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Financial Statements</h3>
            <div className="space-y-3">
              {[
                { name: 'Income Statement', desc: 'Profit and loss overview.' },
                { name: 'Trial Balance', desc: 'Summary of all account balances.' },
                { name: 'Balance Sheet', desc: 'Assets, liabilities, and equity.' },
                { name: 'Cash Flow Statement', desc: 'Operating, investing logic.' }
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
