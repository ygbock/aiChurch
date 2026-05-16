import React from 'react';
import { motion } from 'motion/react';
import { ClipboardList, Filter, Download, Search, CheckCircle2, AlertCircle, Clock, BarChart3 } from 'lucide-react';

export default function ServiceReports() {
  const reports = [
    { title: 'Sunday Worship Service', branch: 'Main Campus', date: 'May 12, 2024', status: 'verified', attendance: 842, tithing: '$12,450' },
    { title: 'Wednesday Prayer Night', branch: 'Community Center', date: 'May 15, 2024', status: 'pending', attendance: 125, tithing: '$1,200' },
    { title: 'Youth Seminar', branch: 'Main Campus', date: 'May 14, 2024', status: 'verified', attendance: 210, tithing: 'N/A' },
    { title: 'Special Thanksgiving', branch: 'Downtown Branch', date: 'May 11, 2024', status: 'verified', attendance: 550, tithing: '$8,900' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Service Reports</h1>
          <p className="text-slate-500 font-medium">Cross-branch service metrics and administrative summaries.</p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
             <Filter size={16} /> Filter Branches
           </button>
           <button className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2">
             <Download size={16} /> Aggregate PDF
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Weekly Attendance</p>
               <h3 className="text-3xl font-black text-slate-900">1.7k</h3>
               <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold mt-2">
                  <BarChart3 size={12} /> +12% from last week
               </div>
            </div>
         </div>
         <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Pending Verification</p>
            <h3 className="text-3xl font-black text-slate-900">3</h3>
            <div className="flex items-center gap-1.5 text-amber-500 text-xs font-bold mt-2">
               <Clock size={12} /> Awaiting admin review
            </div>
         </div>
         <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Digital Tithing (Est.)</p>
            <h3 className="text-3xl font-black text-slate-900">$22.5k</h3>
            <div className="flex items-center gap-1.5 text-blue-600 text-xs font-bold mt-2">
               <CheckCircle2 size={12} /> 94% processed
            </div>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-900">Recent Service Submissions</h3>
            <div className="relative w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input type="text" placeholder="Search branch or service..." className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:ring-1 focus:ring-blue-600 transition-all font-medium" />
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-50">
                     <th className="px-8 py-4">Service Event</th>
                     <th className="px-8 py-4">Branch</th>
                     <th className="px-8 py-4">Attendance</th>
                     <th className="px-8 py-4">Finances</th>
                     <th className="px-8 py-4">Status</th>
                     <th className="px-8 py-4"></th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {reports.map((report, i) => (
                     <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                           <p className="font-bold text-slate-900 leading-none">{report.title}</p>
                           <p className="text-[10px] text-slate-400 font-bold mt-1.5">{report.date}</p>
                        </td>
                        <td className="px-8 py-5">
                           <span className="text-sm font-medium text-slate-600">{report.branch}</span>
                        </td>
                        <td className="px-8 py-5">
                           <span className="text-sm font-black text-slate-900">{report.attendance}</span>
                        </td>
                        <td className="px-8 py-5">
                           <span className="text-sm font-bold text-emerald-600">{report.tithing}</span>
                        </td>
                        <td className="px-8 py-5">
                           <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${
                              report.status === 'verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                           }`}>
                              {report.status === 'verified' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                              {report.status}
                           </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <button className="text-xs font-black text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Details</button>
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
