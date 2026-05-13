import React from 'react';
import { Download, Filter, PieChart, TrendingUp, User, Globe } from 'lucide-react';

export default function Reports() {
  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Exportable financial data and comparative analytics.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 text-sm transition-colors shadow-sm flex items-center gap-2">
            <Download size={16} /> Export Master Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: <TrendingUp size={24} />, title: 'Income MTD', desc: 'Detailed view of incoming funds classified by categories.', type: 'Donations' },
          { icon: <PieChart size={24} />, title: 'Expense Breakdown', desc: 'Departmental spending vs allocated budget.', type: 'Expenses' },
          { icon: <User size={24} />, title: 'Payroll Summary', desc: 'Staff deductions, taxes, and net payouts.', type: 'Payroll' },
          { icon: <Globe size={24} />, title: 'Branch Comparison', desc: 'Financial health metric across all districts.', type: 'Global' },
        ].map((rep, i) => (
          <div key={i} className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div className={`p-3 rounded-xl mb-4 w-fit ${
              rep.type === 'Donations' ? 'bg-emerald-50 text-emerald-600' :
              rep.type === 'Expenses' ? 'bg-red-50 text-red-600' :
              rep.type === 'Payroll' ? 'bg-blue-50 text-blue-600' :
              'bg-purple-50 text-purple-600'
            }`}>
              {rep.icon}
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{rep.title}</h3>
            <p className="text-sm text-slate-500 mt-2">{rep.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
