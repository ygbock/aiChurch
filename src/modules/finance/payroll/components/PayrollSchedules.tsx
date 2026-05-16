import React, { useState } from 'react';
import { usePayrollStore } from '../stores/usePayrollStore';
import { Calendar, Plus, Clock, Lock, Unlock, Zap, Users } from 'lucide-react';
import { motion } from 'motion/react';
import EditScheduleModal from './EditScheduleModal';
import { PayrollSchedule } from '../types';

export default function PayrollSchedules() {
  const { schedules } = usePayrollStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<PayrollSchedule | undefined>(undefined);

  const handleNewSchedule = () => {
    setSelectedSchedule(undefined);
    setIsModalOpen(true);
  };

  const handleEditSchedule = (schedule: PayrollSchedule) => {
    setSelectedSchedule(schedule);
    setIsModalOpen(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
            <h3 className="text-lg font-bold text-slate-900">Payroll Schedules</h3>
            <p className="text-sm text-slate-500">Configure recurring payroll intervals, cutoff dates, and automatic generation</p>
         </div>
         <button 
           onClick={handleNewSchedule}
           className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 text-sm transition-colors flex items-center justify-center gap-2"
         >
            <Plus size={16} /> New Schedule
         </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {schedules.map(schedule => (
             <div key={schedule.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                 <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-2 text-indigo-600">
                         <div className="p-2 bg-indigo-50 rounded-lg">
                            <Calendar size={18} />
                         </div>
                         <h4 className="font-bold text-slate-900 max-w-[150px] truncate">{schedule.name}</h4>
                     </div>
                     <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full tracking-wider ${schedule.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                         {schedule.isActive ? 'Active' : 'Inactive'}
                     </span>
                 </div>
                 
                 <div className="space-y-3 flex-1 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <div className="flex justify-between items-center">
                         <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Frequency</span>
                         <span className="text-sm font-medium capitalize text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">{schedule.frequency.replace('_', ' ')}</span>
                     </div>
                     <div className="flex justify-between items-center">
                         <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Next Run</span>
                         <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                             <Clock size={14} className="text-orange-500" />
                             {new Date(schedule.nextRunDate).toLocaleDateString()}
                         </div>
                     </div>
                     <div className="flex justify-between items-center">
                         <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Cutoff Date</span>
                         <span className="text-sm font-medium text-slate-900">{new Date(schedule.cutoffDate).toLocaleDateString()}</span>
                     </div>

                     <div className="pt-2 mt-2 border-t border-slate-200 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Auto-Gen</span>
                            <div className="flex items-center gap-1">
                                {schedule.autoGenerate ? (
                                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><Zap size={14} /> Enabled</span>
                                ) : (
                                    <span className="text-xs font-medium text-slate-400">Manual</span>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Lock State</span>
                            <div className="flex items-center gap-1 text-xs">
                                {schedule.isLocked ? (
                                    <span className="flex items-center gap-1 text-rose-600 font-bold"><Lock size={12} /> Locked</span>
                                ) : (
                                    <span className="flex items-center gap-1 text-emerald-600 font-bold"><Unlock size={12} /> Live</span>
                                )}
                            </div>
                        </div>
                     </div>

                     {((schedule.targetRoles && schedule.targetRoles.length > 0) || (schedule.targetEmploymentTypes && schedule.targetEmploymentTypes.length > 0)) && (
                         <div className="pt-3 mt-2 border-t border-slate-200">
                             <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                                <Users size={12} /> Target Constraints
                             </div>
                             <div className="flex flex-wrap gap-1">
                                 {schedule.targetEmploymentTypes?.map(t => (
                                     <span key={t} className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded capitalize">{t.replace('_', ' ')}</span>
                                 ))}
                                 {schedule.targetRoles?.map(r => (
                                     <span key={r} className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">{r}</span>
                                 ))}
                                 {schedule.targetCompensationModels?.map(m => (
                                     <span key={m} className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded capitalize">{m.replace('_', ' ')}</span>
                                 ))}
                             </div>
                         </div>
                     )}
                 </div>

                 <button 
                  onClick={() => handleEditSchedule(schedule)}
                  className="w-full py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium rounded-lg text-sm transition-colors mt-auto flex items-center justify-center gap-2"
                 >
                     Edit Settings
                 </button>
             </div>
          ))}
      </div>

      {isModalOpen && (
        <EditScheduleModal 
          schedule={selectedSchedule} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </motion.div>
  );
}
