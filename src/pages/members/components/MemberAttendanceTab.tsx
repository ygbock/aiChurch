import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, deleteDoc, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { MemberData } from '@/types/membership';
import { format } from 'date-fns';
import { Activity, Loader2, Calendar, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface MemberAttendanceTabProps {
  member: MemberData;
}

interface AttendanceRecord {
  id: string;
  date: string;
  timestamp: any;
  service: string;
  method: string;
  status: string;
}

export const MemberAttendanceTab: React.FC<MemberAttendanceTabProps> = ({ member }) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    if (!member.districtId || !member.branchId) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, `districts/${member.districtId}/branches/${member.branchId}/members/${member.id}/attendance`),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AttendanceRecord[];
      setAttendance(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [member.id, member.districtId, member.branchId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
    
    try {
      await deleteDoc(doc(db, `districts/${member.districtId}/branches/${member.branchId}/members/${member.id}/attendance`, id));
      toast.success('Record deleted.');
      setAttendance(attendance.filter(c => c.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'attendance');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="bg-indigo-50 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
             <Activity className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total Check-ins</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{attendance.length} Visits</h3>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h4 className="font-bold text-slate-800">Attendance Telemetry</h4>
        </div>

        {attendance.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
               <Activity size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No attendance records</h3>
            <p className="text-slate-500 text-sm max-w-sm">
              There are no attendance check-ins logged for this member yet. Kiosk check-ins will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-xs uppercase tracking-wider font-bold text-slate-500">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                         <Calendar size={14} className="text-slate-400" />
                         <span className="font-medium text-slate-700">
                           {(() => {
                             if (!a.date) return 'N/A';
                             try {
                               const d = new Date(a.date);
                               if (isNaN(d.getTime())) return 'N/A';
                               return format(d, 'MMM d, yyyy');
                             } catch {
                               return 'N/A';
                             }
                           })()}
                         </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold leading-none bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-slate-700">
                         {a.service}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                        <CheckCircle size={14} className="text-indigo-400" />
                        {a.method || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => handleDelete(a.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Record"
                      >
                         <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
