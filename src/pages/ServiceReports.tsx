import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ClipboardList, 
  Send,
  Calendar,
  Users,
  CheckCircle,
  Loader2,
  TrendingUp,
  History
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { toast } from 'sonner';

export default function ServiceReports() {
  const { profile } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [pastReports, setPastReports] = useState<any[]>([]);

  const [date, setDate] = useState('');
  const [serviceType, setServiceType] = useState('Sunday Service');
  const [adults, setAdults] = useState('');
  const [children, setChildren] = useState('');
  const [youths, setYouths] = useState('');
  const [firstTimers, setFirstTimers] = useState('');
  const [newConverts, setNewConverts] = useState('');
  const [totalSalvations, setTotalSalvations] = useState('');
  const [tithe, setTithe] = useState('');
  const [offering, setOffering] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (profile?.districtId && profile?.branchId) {
      loadPastReports();
    }
  }, [profile]);

  const loadPastReports = async () => {
    if (!profile?.districtId || !profile?.branchId) return;
    try {
      const q = query(
        collection(db, `districts/${profile.districtId}/branches/${profile.branchId}/serviceReports`),
        orderBy('date', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPastReports(reports);
    } catch (error) {
      console.error("Failed to load past reports", error);
    }
  };

  const calculateTotal = () => {
    const a = parseInt(adults) || 0;
    const c = parseInt(children) || 0;
    const y = parseInt(youths) || 0;
    return a + c + y;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.districtId || !profile?.branchId) {
      toast.error('Branch context missing.');
      return;
    }

    setLoading(true);
    try {
      const path = `districts/${profile.districtId}/branches/${profile.branchId}/serviceReports`;
      await addDoc(collection(db, path), {
        date,
        serviceType,
        attendance: {
          adults: parseInt(adults) || 0,
          children: parseInt(children) || 0,
          youths: parseInt(youths) || 0,
          total: calculateTotal()
        },
        souls: {
          firstTimers: parseInt(firstTimers) || 0,
          newConverts: parseInt(newConverts) || 0,
          totalSalvations: parseInt(totalSalvations) || 0
        },
        financials: {
          tithe: parseFloat(tithe) || 0,
          offering: parseFloat(offering) || 0
        },
        notes,
        submittedBy: profile.uid,
        submittedByName: profile.fullName || 'Unknown',
        createdAt: serverTimestamp()
      });

      toast.success('Service report submitted successfully');
      setAdults('');
      setChildren('');
      setYouths('');
      setFirstTimers('');
      setNewConverts('');
      setTotalSalvations('');
      setTithe('');
      setOffering('');
      setNotes('');
      setDate('');
      
      loadPastReports();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'serviceReports');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl mx-auto pb-12"
    >
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full w-fit mb-4">
             <ClipboardList size={14} />
             <span className="text-[10px] font-black uppercase tracking-widest">Operations</span>
           </div>
           <h2 className="text-4xl font-black text-slate-900 tracking-tight">Service Reports</h2>
           <p className="text-slate-500 font-medium mt-1">Submit weekly metrics to district oversight.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service Date</label>
                   <input
                     type="date"
                     required
                     value={date}
                     onChange={(e) => setDate(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 h-11 px-4 rounded-xl text-sm"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service Type</label>
                   <select
                     required
                     value={serviceType}
                     onChange={(e) => setServiceType(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 h-11 px-4 rounded-xl text-sm"
                   >
                     <option value="Sunday Service">Sunday Service</option>
                     <option value="Mid-Week Service">Mid-Week Service</option>
                     <option value="Special Program">Special Program</option>
                     <option value="Vigil / Night of Worship">Vigil / Night of Worship</option>
                   </select>
                 </div>
               </div>

               <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Users size={16} className="text-slate-400" /> Attendance Breakdown
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase">Adults</label>
                       <input
                         type="number"
                         min="0"
                         required
                         value={adults}
                         onChange={(e) => setAdults(e.target.value)}
                         placeholder="0"
                         className="w-full bg-slate-50 border border-slate-200 h-11 px-4 rounded-xl text-sm"
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase">Youths</label>
                       <input
                         type="number"
                         min="0"
                         required
                         value={youths}
                         onChange={(e) => setYouths(e.target.value)}
                         placeholder="0"
                         className="w-full bg-slate-50 border border-slate-200 h-11 px-4 rounded-xl text-sm"
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase">Children</label>
                       <input
                         type="number"
                         min="0"
                         required
                         value={children}
                         onChange={(e) => setChildren(e.target.value)}
                         placeholder="0"
                         className="w-full bg-slate-50 border border-slate-200 h-11 px-4 rounded-xl text-sm"
                       />
                     </div>
                  </div>
                  <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex justify-between items-center text-indigo-900">
                    <span className="font-bold">Total Attendance</span>
                    <span className="text-2xl font-black">{calculateTotal()}</span>
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-slate-400" /> Souls & Growth
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase">First Timers</label>
                       <input
                         type="number"
                         min="0"
                         required
                         value={firstTimers}
                         onChange={(e) => setFirstTimers(e.target.value)}
                         placeholder="0"
                         className="w-full bg-slate-50 border border-slate-200 h-11 px-4 rounded-xl text-sm"
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase">New Converts</label>
                       <input
                         type="number"
                         min="0"
                         required
                         value={newConverts}
                         onChange={(e) => setNewConverts(e.target.value)}
                         placeholder="0"
                         className="w-full bg-slate-50 border border-slate-200 h-11 px-4 rounded-xl text-sm"
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase">Total Salvations</label>
                       <input
                         type="number"
                         min="0"
                         required
                         value={totalSalvations}
                         onChange={(e) => setTotalSalvations(e.target.value)}
                         placeholder="0"
                         className="w-full bg-slate-50 border border-slate-200 h-11 px-4 rounded-xl text-sm"
                       />
                     </div>
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-slate-400" /> Financials
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase">Tithe</label>
                       <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                         <input
                           type="number"
                           min="0"
                           step="0.01"
                           required
                           value={tithe}
                           onChange={(e) => setTithe(e.target.value)}
                           placeholder="0.00"
                           className="w-full bg-slate-50 border border-slate-200 h-11 pl-8 pr-4 rounded-xl text-sm"
                         />
                       </div>
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase">Offering</label>
                       <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                         <input
                           type="number"
                           min="0"
                           step="0.01"
                           required
                           value={offering}
                           onChange={(e) => setOffering(e.target.value)}
                           placeholder="0.00"
                           className="w-full bg-slate-50 border border-slate-200 h-11 pl-8 pr-4 rounded-xl text-sm"
                         />
                       </div>
                     </div>
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase">Service Notes / Highlights</label>
                   <textarea
                     value={notes}
                     onChange={(e) => setNotes(e.target.value)}
                     placeholder="Brief overview of the service, special occurrences, testimonies..."
                     className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm min-h-[120px]"
                   />
                 </div>
               </div>

               <div className="pt-4 flex justify-end">
                   <button
                     type="submit"
                     disabled={loading}
                     className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
                   >
                     {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                     Submit Report
                   </button>
               </div>
            </form>
        </div>

        <div className="space-y-6">
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                 <History size={18} className="text-slate-400" />
                 <h3 className="font-bold text-slate-900">Recent Submissions</h3>
              </div>
              <div className="space-y-4">
                 {pastReports.map(report => (
                   <div key={report.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center group cursor-pointer hover:bg-slate-100 transition-colors">
                      <div>
                         <p className="font-bold text-slate-800 text-sm">{report.serviceType}</p>
                         <p className="text-xs text-slate-500 mt-1">{report.date}</p>
                      </div>
                      <div className="text-right">
                         <p className="font-bold text-emerald-600 flex items-center gap-1 justify-end text-sm">
                            <Users size={14} /> Total {report.attendance?.total || 0}
                         </p>
                         {report.financials && (
                            <p className="font-bold text-slate-700 flex items-center gap-1 justify-end text-xs mt-0.5">
                               ${((report.financials.tithe || 0) + (report.financials.offering || 0)).toFixed(2)}
                            </p>
                         )}
                         <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1 flex items-center gap-1 justify-end">
                            <CheckCircle size={10} /> Submitted
                         </p>
                      </div>
                   </div>
                 ))}
                 {pastReports.length === 0 && (
                   <div className="text-center py-8 text-slate-400 text-sm">
                     No recent reports found.
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
