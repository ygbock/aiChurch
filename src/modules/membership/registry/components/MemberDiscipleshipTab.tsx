import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, CheckCircle, Circle, Clock, Check } from 'lucide-react';
import { MemberData } from '../../../../types/membership';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../../lib/firebase';
import { toast } from 'sonner';

interface MemberDiscipleshipTabProps {
  member: MemberData;
}

const MILESTONES = [
  { id: 'believersClass', label: 'Believers Foundation Class', desc: 'Introduction to basic doctrines.' },
  { id: 'baptismalClass', label: 'Baptismal Class', desc: 'Preparation for water baptism.' },
  { id: 'discipleshipTraining', label: 'Discipleship Training', desc: 'Growing deep in the word.' },
  { id: 'workersInTraining', label: 'Workers In Training', desc: 'Preparation for service.' }
] as const;

export const MemberDiscipleshipTab: React.FC<MemberDiscipleshipTabProps> = ({ member }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  // local copy to optimistically update UI
  const [discipleship, setDiscipleship] = useState(member.discipleship || {});

  const handleUpdateMilestone = async (milestoneId: string, newStatus: 'pending' | 'in-progress' | 'completed') => {
    if (!member.districtId || !member.branchId || !member.id) return;
    setIsUpdating(true);
    try {
      const path = `districts/${member.districtId}/branches/${member.branchId}/members/${member.id}`;
      
      const newDiscipleship = {
        ...discipleship,
        [milestoneId]: {
          status: newStatus,
          date: new Date().toISOString()
        }
      };

      await updateDoc(doc(db, path), {
        discipleship: newDiscipleship,
        updatedAt: serverTimestamp()
      });

      setDiscipleship(newDiscipleship);
      toast.success(`${MILESTONES.find(m => m.id === milestoneId)?.label} status updated to ${newStatus}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'member discipleship');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-3 mb-6">
         <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <BookOpen size={24} />
         </div>
         <div>
           <h3 className="text-xl font-bold text-slate-800">Spiritual Growth Track</h3>
           <p className="text-sm text-slate-500">Monitor progression through foundation and training classes.</p>
         </div>
       </div>

       <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 relative overflow-hidden">
          <div className="absolute left-10 top-10 bottom-10 w-0.5 bg-slate-200" />
          
          <div className="space-y-8 relative">
            {MILESTONES.map((milestone, idx) => {
              const currentStatus = (discipleship as any)[milestone.id]?.status || 'pending';
              const isCompleted = currentStatus === 'completed';
              const isInProgress = currentStatus === 'in-progress';
              const dateStr = (discipleship as any)[milestone.id]?.date;

              return (
                <div key={milestone.id} className="relative flex gap-6">
                   <div className="relative shrink-0 w-8 h-8 flex items-center justify-center -ml-1 mt-1 bg-white rounded-full">
                      {isCompleted ? (
                        <CheckCircle className="text-emerald-500 w-6 h-6 bg-white shrink-0 shadow-[0_0_0_4px_#f8fafc]" />
                      ) : isInProgress ? (
                        <div className="w-5 h-5 rounded-full border-[3px] border-amber-500 bg-white shrink-0 shadow-[0_0_0_4px_#f8fafc]"></div>
                      ) : (
                        <Circle className="text-slate-300 w-5 h-5 bg-white shrink-0 shadow-[0_0_0_4px_#f8fafc]" />
                      )}
                   </div>
                   <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md group">
                     <div className="sm:flex justify-between items-start">
                        <div>
                           <h4 className={`text-lg font-bold mb-1 ${isCompleted ? 'text-emerald-800' : isInProgress ? 'text-amber-800' : 'text-slate-700'}`}>
                              {milestone.label}
                           </h4>
                           <p className="text-sm text-slate-500 mb-3">{milestone.desc}</p>
                           {dateStr && (
                             <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4">
                               Last Updated: {new Date(dateStr).toLocaleDateString()}
                             </p>
                           )}
                        </div>
                        <div className="flex gap-2">
                           {currentStatus !== 'pending' && (
                             <button
                               disabled={isUpdating}
                               onClick={() => handleUpdateMilestone(milestone.id, 'pending')}
                               className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
                             >
                               Reset
                             </button>
                           )}
                           {currentStatus !== 'in-progress' && !isCompleted && (
                             <button
                               disabled={isUpdating}
                               onClick={() => handleUpdateMilestone(milestone.id, 'in-progress')}
                               className="text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                             >
                               Start
                             </button>
                           )}
                           {!isCompleted && (
                             <button
                               disabled={isUpdating}
                               onClick={() => handleUpdateMilestone(milestone.id, 'completed')}
                               className="text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1"
                             >
                               Complete <Check size={14} />
                             </button>
                           )}
                        </div>
                     </div>
                   </div>
                </div>
              );
            })}
          </div>
       </div>
    </div>
  );
}
