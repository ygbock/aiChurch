import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, FileText, Download, Filter, Search, TrendingUp, Users, Wallet } from 'lucide-react';

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Organization Reports</h1>
          <p className="text-slate-500 font-medium">Global analytics and cross-branch insights.</p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
             <Filter size={16} /> Filters
           </button>
           <button className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2">
             <Download size={16} /> Export All
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Growth Analysis', icon: <TrendingUp className="text-blue-600" />, color: 'bg-blue-50' },
          { label: 'Member Demographics', icon: <Users className="text-indigo-600" />, color: 'bg-indigo-50' },
          { label: 'Financial Consolidation', icon: <Wallet className="text-emerald-600" />, color: 'bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center`}>
              {stat.icon}
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
               <h3 className="text-xl font-black text-slate-900">View Data</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-center p-12">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
           <BarChart3 size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Global Analytics</h2>
        <p className="text-slate-500 max-w-md mx-auto mt-2">
          The global reporting dashboard is being populated with data from your district and branch hierarchies.
        </p>
      </div>
    </div>
  );
}
