import React, { useState } from 'react';
import { usePayrollStore } from '../stores/usePayrollStore';
import { Calendar, Plus, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function PayrollSchedules() {
  const { schedules } = usePayrollStore();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
            <h3 className="text-lg font-bold text-slate-900">Payroll Schedules</h3>
            <p className="text-sm text-slate-500">Configure recurring payroll intervals</p>
         </div>
         <button className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 text-sm transition-colors flex items-center justify-center gap-2">
            <Plus size={16} /> New Schedule
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map(schedule => (
             <div key={schedule.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-2 text-indigo-600">
                         <div className="p-2 bg-indigo-50 rounded-lg">
                            <Calendar size={18} />
                         </div>
                         <h4 className="font-bold text-slate-900 text-lg">{schedule.name}</h4>
                     </div>
                     <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full tracking-wider ${schedule.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                         {schedule.isActive ? 'Active' : 'Inactive'}
                     </span>
                 </div>
                 
                 <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <div className="flex justify-between items-center shadow-sm">
                         <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Frequency</span>
                         <span className="text-sm font-medium capitalize text-slate-900 shadow-sm">{schedule.frequency.replace('_', ' ')}</span>
                     </div>
                     <div className="flex justify-between items-center shadow-sm">
                         <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Next Run</span>
                         <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                             <Clock size={14} className="text-orange-500" />
                             {new Date(schedule.nextRunDate).toLocaleDateString()}
                         </div>
                     </div>
                     <div className="flex justify-between items-center shadow-sm">
                         <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Cutoff</span>
                         <span className="text-sm font-medium text-slate-900 shadow-sm">{new Date(schedule.cutoffDate).toLocaleDateString()}</span>
                     </div>
                 </div>

                 <button className="w-full py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium rounded-lg text-sm transition-colors">
                     Edit Configuration
                 </button>
             </div>
          ))}
      </div>
    </motion.div>
  );
}
