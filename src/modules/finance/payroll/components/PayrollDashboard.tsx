import React, { useState } from 'react';
import { usePayrollStore } from '../stores/usePayrollStore';
import { Users, Clock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import RunDetailsDrawer from './RunDetailsDrawer';

export default function PayrollDashboard() {
  const { runs, profiles } = usePayrollStore();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const activeProfiles = profiles.filter(p => p.isActive).length;
  const lastRun = runs[0]; // Assuming runs are sorted newest first, index 0 is latest

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><Clock size={20} /></div>
            {lastRun && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${lastRun.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                    {lastRun.status.replace('_', ' ')}
                </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Last Run ({lastRun?.name || 'None'})</p>
          <h4 className="text-3xl font-black text-slate-900">${lastRun?.totalNetPay || 0}</h4>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Users size={20} /></div>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Active Payroll Staff/Volunteers</p>
          <h4 className="text-3xl font-black text-slate-900">{activeProfiles}</h4>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 rounded-xl text-orange-600"><Clock size={20} /></div>
            <span className="bg-orange-50 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">Upcoming</span>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Pending Approval</p>
          <h4 className="text-3xl font-black text-slate-900">{runs.filter(r => r.status === 'calculated').length}</h4>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Recent Payroll Runs</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Period</th>
              <th className="px-6 py-4">Net Pay</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {runs.map((run, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedRunId(run.id)}>
                <td className="px-6 py-4 font-bold text-slate-900">{run.name}</td>
                <td className="px-6 py-4 text-slate-600">
                    {new Date(run.periodStart).toLocaleDateString()} - {new Date(run.periodEnd).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 font-black">${run.totalNetPay}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full tracking-wider ${
                      run.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                      {run.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-indigo-600 font-medium hover:text-indigo-800 text-xs uppercase tracking-wider">
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
         {selectedRunId && (
            <RunDetailsDrawer runId={selectedRunId} onClose={() => setSelectedRunId(null)} />
         )}
      </AnimatePresence>
    </motion.div>
  );
}
