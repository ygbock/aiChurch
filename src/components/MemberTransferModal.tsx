import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, getDocs, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { X, ArrowRightLeft, Send, MapPin, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';

interface MemberTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MemberTransferModal: React.FC<MemberTransferModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { profile } = useFirebase();
  const [targetDistrictId, setTargetDistrictId] = useState('');
  const [targetBranchId, setTargetBranchId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  
  const [districts, setDistricts] = useState<{id: string, name: string}[]>([]);
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);
  
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDistricts();
    }
  }, [isOpen]);

  // Load Branches when District changes
  useEffect(() => {
    if (targetDistrictId && targetDistrictId !== 'undecided') {
      loadBranches(targetDistrictId);
    } else {
      setBranches([]);
      setTargetBranchId('');
    }
  }, [targetDistrictId]);

  const loadDistricts = async () => {
    setLoadingDistricts(true);
    try {
      const q = query(collection(db, 'districts'));
      const snapshot = await getDocs(q);
      setDistricts(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    } catch (error) {
      console.error(error);
      toast.error('Failed to load districts');
    } finally {
      setLoadingDistricts(false);
    }
  };

  const loadBranches = async (districtId: string) => {
    setLoadingBranches(true);
    try {
      const q = query(collection(db, `districts/${districtId}/branches`));
      const snapshot = await getDocs(q);
      setBranches(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    } catch (error) {
      console.error(error);
      toast.error('Failed to load branches');
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleSubmit = async () => {
    if (!profile?.uid) return;
    
    if (!transferReason) {
      toast.error("Please provide a reason for the transfer request.");
      return;
    }

    if (transferReason === 'Other' && !additionalComments) {
      toast.error("Please provide additional context for 'Other' reason.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Find branch name if possible
      let toBranchName = 'Undecided / Not Selected';
      if (targetBranchId && targetBranchId !== 'undecided') {
        const toBranchObj = branches.find(b => b.id === targetBranchId);
        if (toBranchObj) {
          toBranchName = toBranchObj.name;
        }
      }

      await addDoc(collection(db, 'transfers'), {
        memberId: profile.uid,
        memberName: profile.fullName || 'Member',
        fromDistrictId: profile.districtId || 'unassigned',
        fromBranchId: profile.branchId || 'unassigned',
        fromBranchName: (profile as any).branchName || (profile as any).branch || 'Unknown',
        toDistrictId: targetDistrictId || 'undecided',
        toBranchId: targetBranchId || 'undecided',
        toBranchName: toBranchName,
        reason: transferReason,
        additionalComments: additionalComments, // member's comments
        requestedBy: profile.uid,
        status: 'pending',
        requestedAt: serverTimestamp(),
        createdAt: new Date().toISOString()
      });

      toast.success("Transfer request submitted successfully. Your spiritual leader will be notified.");
      onSuccess();
      onClose();
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, 'transfers');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col gap-1">
             <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
               <ArrowRightLeft className="text-blue-500" />
               Request Transfer
             </h2>
             <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Initiate relocation protocol</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh] no-scrollbar">
          
           <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800">
             <div className="mt-0.5"><Info size={16} className="text-blue-500" /></div>
             <p className="text-xs font-medium leading-relaxed font-sans">
               Relocating? Notify your spiritual leaders so they can ensure a seamless transition and connect you with your new branch family.
             </p>
           </div>
           
           <div className="space-y-4">
             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reason for Transfer</label>
               <select 
                 onChange={(e) => setTransferReason(e.target.value)} 
                 value={transferReason}
                 className="w-full bg-slate-50 border border-slate-200 h-11 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
               >
                 <option value="" disabled>Select Reason</option>
                 <option value="Relocation / Moving">Relocation / Moving</option>
                 <option value="Job Relocation">Job Relocation</option>
                 <option value="School / University">School / University</option>
                 <option value="Marriage">Marriage</option>
                 <option value="Closer Proximity">Found a closer branch</option>
                 <option value="Other">Other (Please specify below)</option>
               </select>
             </div>

             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expected New Location (Optional)</label>
               <select 
                 onChange={(e) => setTargetDistrictId(e.target.value)} 
                 value={targetDistrictId}
                 className="w-full bg-slate-50 border border-slate-200 h-11 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                 disabled={loadingDistricts}
               >
                 <option value="">I don't know my new district yet</option>
                 {districts.map(d => (
                   <option key={d.id} value={d.id}>{d.name}</option>
                 ))}
               </select>
               
               {targetDistrictId && targetDistrictId !== 'undecided' && (
                 <select 
                   onChange={(e) => setTargetBranchId(e.target.value)} 
                   value={targetBranchId}
                   className="w-full bg-slate-50 border border-slate-200 h-11 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                   disabled={loadingBranches}
                 >
                   <option value="">I don't know my specific branch yet</option>
                   {branches.map(b => (
                     <option key={b.id} value={b.id}>{b.name}</option>
                   ))}
                 </select>
               )}
             </div>

             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Additional Information</label>
               <textarea 
                 value={additionalComments}
                 onChange={(e) => setAdditionalComments(e.target.value)}
                 placeholder={transferReason === 'Other' ? "Please specify your reason here..." : "Any additional context you want your leader to know..."}
                 className="w-full bg-slate-50 border border-slate-200 min-h-[100px] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
               />
             </div>
           </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button 
            onClick={onClose}
            className="px-5 h-11 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !transferReason}
            className="px-6 h-11 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            Submit Request
          </button>
        </div>
      </motion.div>
    </div>
  );
};
