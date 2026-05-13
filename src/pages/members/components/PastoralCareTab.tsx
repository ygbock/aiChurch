import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Plus, 
  Calendar, 
  User, 
  MessageSquare, 
  Clock, 
  ChevronRight,
  MoreVertical,
  Trash2,
  AlertCircle,
  Stethoscope,
  Users,
  Target,
  FileText,
  Loader2
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../lib/firebase';
import { format } from 'date-fns';
import { useFirebase } from '../../../components/FirebaseProvider';
import { toast } from 'sonner';

interface PastoralNote {
  id: string;
  memberId: string;
  pastorId: string;
  pastorName: string;
  type: 'Visitation' | 'Counseling' | 'Welfare' | 'Deliverance' | 'Other';
  content: string;
  followUpRequired: boolean;
  date: any;
}

interface Props {
  memberId: string;
  memberName: string;
}

export function PastoralCareTab({ memberId, memberName }: Props) {
  const { profile } = useFirebase();
  const [notes, setNotes] = useState<PastoralNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Visitation' as const,
    content: '',
    followUpRequired: false
  });

  useEffect(() => {
    if (!memberId) return;

    const q = query(
      collection(db, 'pastoralNotes'),
      where('memberId', '==', memberId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PastoralNote)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'pastoralNotes');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [memberId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid || !formData.content) return;

    try {
      await addDoc(collection(db, 'pastoralNotes'), {
        memberId,
        pastorId: profile.uid,
        pastorName: profile.fullName || 'Overseer',
        type: formData.type,
        content: formData.content,
        followUpRequired: formData.followUpRequired,
        date: serverTimestamp()
      });
      
      toast.success('Pastoral note recorded');
      setIsAdding(false);
      setFormData({ type: 'Visitation', content: '', followUpRequired: false });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'pastoralNotes');
    }
  };

  const handleDelete = async (id: string, pastorId: string) => {
    if (profile?.role !== 'superadmin' && profile?.uid !== pastorId) {
       toast.error('Unauthorized to delete this note');
       return;
    }

    if (!window.confirm('Are you sure you want to delete this confidential record?')) return;
    
    try {
      await deleteDoc(doc(db, 'pastoralNotes', id));
      toast.success('Note removed');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'pastoralNotes');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-50">
        <Loader2 className="animate-spin text-rose-500 mb-4" size={32} />
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">Decrypting Records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-4">
         <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
           <AlertCircle size={20} />
         </div>
         <div>
            <h4 className="text-sm font-black text-rose-900 uppercase tracking-tight">Confidential Section</h4>
            <p className="text-rose-700 text-xs font-medium">These records are only visible to pastoral staff and authorized admins. Handle with care.</p>
         </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">Pastoral <span className="text-rose-500">Care Log</span></h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
        >
          {isAdding ? <FileText size={16} /> : <Plus size={16} />}
          {isAdding ? 'VIEW LOGS' : 'NEW RECORD'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isAdding ? (
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6"
          >
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Encounter Type</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-100 transition-all appearance-none shadow-inner"
                  >
                    <option value="Visitation">Visitation</option>
                    <option value="Counseling">Counseling</option>
                    <option value="Welfare">Welfare & Support</option>
                    <option value="Deliverance">Deliverance/Spiritual Warfare</option>
                    <option value="Other">Other Encounter</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                   <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="followUp" 
                        checked={formData.followUpRequired} 
                        onChange={e => setFormData({...formData, followUpRequired: e.target.checked})}
                        className="w-5 h-5 rounded-lg border-2 border-slate-300 text-rose-500 focus:ring-rose-500 transition-all"
                      />
                      <label htmlFor="followUp" className="text-sm font-bold text-slate-700 cursor-pointer">Follow-up Required</label>
                   </div>
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Log Content / Notes</label>
                <textarea 
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  placeholder="Detailed notes regarding this visitation or counseling session..."
                  rows={4}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-rose-100 transition-all resize-none"
                  required
                />
             </div>

             <button 
               type="submit"
               className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-100"
             >
               SAVE CONFIDENTIAL RECORD
             </button>
          </motion.form>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-[2.5rem] border border-slate-100 text-center px-6">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
                   <Heart size={32} />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900 mb-1">No Pastoral Logs</h3>
                 <p className="text-slate-500 text-xs font-medium italic">Record first visitation or counseling notes for {memberName}.</p>
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                         <div className={`p-2.5 rounded-xl ${
                           note.type === 'Visitation' ? 'bg-blue-50 text-blue-600' :
                           note.type === 'Counseling' ? 'bg-purple-50 text-purple-600' :
                           note.type === 'Deliverance' ? 'bg-rose-50 text-rose-600' :
                           'bg-slate-50 text-slate-600'
                         }`}>
                           {note.type === 'Visitation' && <Users size={18} />}
                           {note.type === 'Counseling' && <MessageSquare size={18} />}
                           {note.type === 'Deliverance' && <Target size={18} />}
                           {note.type === 'Welfare' && <Heart size={18} />}
                           {note.type === 'Other' && <FileText size={18} />}
                         </div>
                         <div>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{note.type}</span>
                            <h4 className="text-sm font-bold text-slate-900">Recorded by {note.pastorName}</h4>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right hidden sm:block">
                           <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">DATE</p>
                           <p className="text-xs font-bold text-slate-600">
                             {note.date ? format(note.date.toDate(), 'MMM d, yyyy') : 'Recently'}
                           </p>
                        </div>
                        <button 
                          onClick={() => handleDelete(note.id, note.pastorId)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                   </div>

                   <p className="text-slate-600 text-sm font-medium leading-relaxed mb-4">
                     {note.content}
                   </p>

                   {note.followUpRequired && (
                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                       <AlertCircle size={12} />
                       Follow-up Required
                     </div>
                   )}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
