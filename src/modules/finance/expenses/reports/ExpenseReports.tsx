import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Download, BarChart2 } from 'lucide-react';

const REPORTS = [
  { id: 'r1', name: 'Department Spending Analysis', desc: 'Detailed breakdown of expenses across all departments.', icon: BarChart2 },
  { id: 'r2', name: 'Vendor Payment History', desc: 'Summary of all payouts made to registered vendors.', icon: FileText },
  { id: 'r3', name: 'Petty Cash Reconciliation', desc: 'Audit trail of petty cash disbursements and replenishments.', icon: FileSpreadsheet },
  { id: 'r4', name: 'Budget Consumption', desc: 'Comparison of approved budgets versus actual expenses.', icon: BarChart2 }
];

export default function ExpenseReports() {
  const [selectedReport, setSelectedReport] = useState(REPORTS[0].id);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
       <div className="md:col-span-1 space-y-4">
          <h3 className="font-bold text-slate-900 mb-4 px-2">Expense Reports</h3>
          <div className="space-y-2">
            {REPORTS.map(report => (
              <button 
                 key={report.id}
                 onClick={() => setSelectedReport(report.id)}
                 className={`w-full text-left p-4 rounded-xl border transition-colors flex items-start gap-4 ${
                    selectedReport === report.id 
                    ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                    : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                 }`}
              >
                 <div className={`p-2 rounded-lg shrink-0 ${selectedReport === report.id ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                   <report.icon size={20} />
                 </div>
                 <div>
                   <h4 className={`font-bold text-sm ${selectedReport === report.id ? 'text-emerald-900' : 'text-slate-900'}`}>{report.name}</h4>
                   <p className="text-xs text-slate-500 mt-1">{report.desc}</p>
                 </div>
              </button>
            ))}
          </div>
       </div>

       <div className="md:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
             <div className="p-4 bg-emerald-50 rounded-full text-emerald-600 mb-4">
                <FileSpreadsheet size={48} />
             </div>
             <h2 className="text-xl font-bold text-slate-900 mb-2">Configure Report</h2>
             <p className="text-slate-500 max-w-sm mb-8">Select criteria to generate the {REPORTS.find(r => r.id === selectedReport)?.name}.</p>
             
             <div className="flex gap-4 w-full max-w-sm">
                <div className="flex-1 space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-500 uppercase">Start Date</label>
                  <input type="date" className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white" />
                </div>
                <div className="flex-1 space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-500 uppercase">End Date</label>
                  <input type="date" className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white" />
                </div>
             </div>

             <div className="mt-8 flex gap-3">
               <button className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 text-sm transition-colors flex items-center gap-2">
                 <FileText size={16} /> Generate PDF
               </button>
               <button className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 text-sm transition-colors flex items-center gap-2">
                 <Download size={16} /> Export CSV
               </button>
             </div>
          </div>
       </div>
    </div>
  );
}
