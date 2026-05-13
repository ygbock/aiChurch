import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Wallet, 
  Download, 
  Plus, 
  Clock,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Payroll() {
  const [activeTab, setActiveTab] = useState<'employees' | 'runs' | 'settings'>('runs');

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mxauto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payroll Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage staff salaries, deductions, and initiate Monime payouts.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 text-sm transition-colors shadow-sm flex items-center gap-2">
            <Plus size={16} /> Run Payroll
          </button>
        </div>
      </div>

      <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl w-fit">
        {['employees', 'runs', 'settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
          >
            {tab === 'runs' ? 'Payroll Runs' : tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'runs' && (
          <motion.div key="runs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><CheckCircle2 size={20} /></div>
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">Paid</span>
                </div>
                <p className="text-sm font-medium text-slate-500 mb-1">Last Run (Apr 2026)</p>
                <h4 className="text-3xl font-black text-slate-900">Le 45,200.00</h4>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Users size={20} /></div>
                </div>
                <p className="text-sm font-medium text-slate-500 mb-1">Active Payroll Staff</p>
                <h4 className="text-3xl font-black text-slate-900">14</h4>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-orange-50 rounded-xl text-orange-600"><Clock size={20} /></div>
                  <span className="bg-orange-50 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">Upcoming</span>
                </div>
                <p className="text-sm font-medium text-slate-500 mb-1">Next Run (May 2026)</p>
                <h4 className="text-3xl font-black text-slate-900">Le 45,200.00</h4>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Payroll History</h3>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Period</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Employees</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {[
                    { period: 'April 2026', amt: 'Le 45,200.00', emp: 14, status: 'Completed' },
                    { period: 'March 2026', amt: 'Le 44,800.00', emp: 14, status: 'Completed' },
                    { period: 'February 2026', amt: 'Le 42,500.00', emp: 13, status: 'Completed' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-900">{row.period}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{row.amt}</td>
                      <td className="px-6 py-4 text-slate-500">{row.emp}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] uppercase font-bold rounded-full tracking-wider">{row.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-emerald-600"><Download size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
