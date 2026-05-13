import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  PhoneCall, 
  MessageSquare, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Plus,
  Loader2,
  Calendar,
  UserCheck,
  SendHorizontal
} from 'lucide-react';
import { useFirebase } from '../components/FirebaseProvider';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDocs, orderBy, collectionGroup } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Modal from '../components/Modal';

interface FirstTimer {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  firstVisit: any;
  branchId: string;
  followUpStatus?: 'Pending' | 'Called' | 'Visited' | 'Joined';
  lastFollowUp?: any;
}

interface FollowUpTask {
  id: string;
  firstTimerId: string;
  status: 'Pending' | 'In-Progress' | 'Completed' | 'Unreachable';
  method: 'Call' | 'SMS' | 'Visit' | 'Email';
  notes: string;
  assignedTo: string;
  date: any;
}

export default function FollowUpManagement() {
  const { profile } = useFirebase();
  const [visitors, setVisitors] = useState<FirstTimer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState<FirstTimer | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [logs, setLogs] = useState<FollowUpTask[]>([]);
  
  const [formData, setFormData] = useState({
    method: 'Call' as const,
    notes: '',
    status: 'Completed' as const
  });

  useEffect(() => {
    if (!profile?.districtId || !profile?.branchId) return;

    const path = `districts/${profile.districtId}/branches/${profile.branchId}/members`;
    const q = query(
      collection(db, path),
      where('level', '==', 'Visitor'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVisitors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirstTimer)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [profile]);

  useEffect(() => {
    if (!selectedVisitor) return;

    const q = query(
      collection(db, 'followUps'),
      where('firstTimerId', '==', selectedVisitor.id),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FollowUpTask)));
    });

    return () => unsubscribe();
  }, [selectedVisitor]);

  const handleLogFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitor || !profile?.uid) return;

    try {
      await addDoc(collection(db, 'followUps'), {
        firstTimerId: selectedVisitor.id,
        assignedTo: profile.uid,
        status: formData.status,
        method: formData.method,
        notes: formData.notes,
        date: serverTimestamp(),
        branchId: profile.branchId,
        districtId: profile.districtId
      });

      // Update visitor's follow-up status
      const visitorRef = doc(db, `districts/${profile.districtId}/branches/${profile.branchId}/members`, selectedVisitor.id);
      await updateDoc(visitorRef, {
        followUpStatus: formData.method === 'Call' ? 'Called' : 'Completed',
        lastFollowUp: serverTimestamp()
      });

      toast.success('Follow-up activity recorded');
      setFormData({ method: 'Call', notes: '', status: 'Completed' });
      setIsLogModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'followUps');
    }
  };

  const filteredVisitors = visitors.filter(v => {
    const matchesSearch = v.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.followUpStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
           <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full w-fit mb-4">
             <UserCheck size={14} />
             <span className="text-[10px] font-black uppercase tracking-widest">First-Timer Recovery</span>
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">FOLLOW-UP <span className="text-emerald-600">SYSTEM</span></h1>
           <p className="text-slate-500 font-medium mt-2">Ensure every visitor becomes a permanent member of the family.</p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Filter size={14} /> Search Records
             </h3>
             <div className="space-y-4">
               <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                 <input 
                   type="text" 
                   placeholder="Search names..." 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                 />
               </div>
               
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Status Filter</label>
                 <select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-100 transition-all shadow-inner"
                 >
                   <option value="all">Display All</option>
                   <option value="Pending">Pending Contact</option>
                   <option value="Called">Called</option>
                   <option value="Visited">Visited</option>
                   <option value="Joined">Fully Joined</option>
                 </select>
               </div>
             </div>
           </div>

           <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl shadow-slate-200">
              <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Clock size={20} className="text-emerald-400" />
                Golden Hour
              </h4>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">
                First-timers are most likely to return if contacted within the first 24-48 hours of their visit.
              </p>
           </div>
        </div>

        {/* Visitors List */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-50">
               <Loader2 className="animate-spin text-emerald-600 mb-4" size={32} />
               <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">Syncing Records...</p>
             </div>
          ) : filteredVisitors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100 text-center px-6">
               <Users size={40} className="text-slate-200 mb-6" />
               <h3 className="text-xl font-bold text-slate-900 mb-2">No Visitors Found</h3>
               <p className="text-slate-500 max-w-sm font-medium italic">There are no new first-timers pending follow-up at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredVisitors.map(visitor => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={visitor.id} 
                  className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 font-black text-xl group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      {visitor.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase italic">{visitor.fullName}</h3>
                      <div className="flex flex-wrap gap-4 mt-1">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <PhoneCall size={12} />
                          <span className="text-[10px] font-bold uppercase">{visitor.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Calendar size={12} />
                          <span className="text-[10px] font-bold uppercase">Visited: {format(new Date(visitor.firstVisit?.toDate ? visitor.firstVisit.toDate() : visitor.firstVisit || Date.now()), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      visitor.followUpStatus === 'Called' ? 'bg-blue-50 text-blue-600' :
                      visitor.followUpStatus === 'Joined' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-slate-50 text-slate-400'
                    }`}>
                      {visitor.followUpStatus || 'Pending'}
                    </div>
                    <button 
                      onClick={() => { setSelectedVisitor(visitor); setIsLogModalOpen(true); }}
                      className="flex-1 md:flex-none px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      LOG ACTION
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Log Follow-up Modal */}
      <Modal 
        isOpen={isLogModalOpen} 
        onClose={() => setIsLogModalOpen(false)} 
        title={`Follow-up with ${selectedVisitor?.fullName}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Left side: History */}
           <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Action History</h4>
              <div className="bg-slate-50 rounded-[1.5rem] p-4 max-h-[300px] overflow-y-auto space-y-3">
                 {logs.length === 0 ? (
                   <p className="text-center text-slate-400 text-[10px] font-bold py-10 italic">No actions recorded yet.</p>
                 ) : (
                   logs.map(log => (
                      <div key={log.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                         <div className="flex justify-between items-start mb-2">
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">{log.method}</span>
                            <span className="text-[9px] font-bold text-slate-400">{log.date ? format(log.date.toDate(), 'MMM d, h:mm a') : 'Now'}</span>
                         </div>
                         <p className="text-xs text-slate-600 font-medium italic">"{log.notes}"</p>
                      </div>
                   ))
                 )}
              </div>
           </div>

           {/* Right side: Form */}
           <form onSubmit={handleLogFollowUp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Method Used</label>
                <div className="grid grid-cols-4 gap-2">
                   {['Call', 'SMS', 'Visit', 'Email'].map(m => (
                     <button
                        key={m}
                        type="button"
                        onClick={() => setFormData({...formData, method: m as any})}
                        className={`py-3 rounded-xl text-[10px] font-black transition-all ${
                          formData.method === m ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                        }`}
                     >
                       {m}
                     </button>
                   ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">New Status</label>
                <select 
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-100 transition-all shadow-inner"
                >
                  <option value="Completed">Contact Established</option>
                  <option value="In-Progress">Requires Further Work</option>
                  <option value="Unreachable">Unreachable / No Answer</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Engagement Notes</label>
                <textarea 
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
                  placeholder="What was the response? Any prayer needs?"
                  rows={4}
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <SendHorizontal size={18} />
                RECORD ACTIVITY
              </button>
           </form>
        </div>
      </Modal>
    </div>
  );
}
