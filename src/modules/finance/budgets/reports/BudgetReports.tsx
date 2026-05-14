import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Download, BarChart2 } from 'lucide-react';

const REPORTS = [
  { id: 'r1', name: 'Annual Budget Report', desc: 'Comprehensive breakdown of all approved budgets for the fiscal year.', icon: FileText },
  { id: 'r2', name: 'Budget vs Actual', desc: 'Detailed comparison of allocated budgets against actual expenditures.', icon: BarChart2 },
  { id: 'r3', name: 'Department Utilization', desc: 'Efficiency metrics and consumption rates by ministry/department.', icon: FileSpreadsheet },
  { id: 'r4', name: 'Fund Reallocation Log', desc: 'Audit trail of all budget transfers and adjustments.', icon: FileText }
];

export default function BudgetReports() {
  const [selectedReport, setSelectedReport] = useState(REPORTS[0].id);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
       <div className="md:col-span-1 space-y-4">
          <h3 className="font-bold text-slate-900 mb-4 px-2">Available Reports</h3>
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
             <p className="text-slate-500 max-w-sm mb-8">Select date ranges and filters to generate the {REPORTS.find(r => r.id === selectedReport)?.name}.</p>
             
             <div className="flex gap-4 w-full max-w-sm">
                <div className="flex-1 space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-500 uppercase">Fiscal Year</label>
                  <select className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                    <option>2026</option>
                    <option>2025</option>
                  </select>
                </div>
                <div className="flex-1 space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-500 uppercase">Branch</label>
                  <select className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                    <option>All Branches</option>
                    <option>Freetown (Main)</option>
                  </select>
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
