import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, Search, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { writeBatch, collection, doc, getDocs, deleteDoc, setDoc, query, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebase } from '@/components/FirebaseProvider';
import { MemberData } from '@/types/membership';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BulkTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMembers: MemberData[];
  onSuccess: () => void;
}

export const BulkTransferModal: React.FC<BulkTransferModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedMembers,
  onSuccess
}) => {
  const { profile } = useFirebase();
  const [targetDistrictId, setTargetDistrictId] = useState('');
  const [targetBranchId, setTargetBranchId] = useState('');
  
  const [districts, setDistricts] = useState<{id: string, name: string}[]>([]);
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);
  
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDistricts();
      // Initialize with user's district if they are district level
      if (profile?.role === 'district' && profile.districtId) {
         setTargetDistrictId(profile.districtId);
         loadBranches(profile.districtId);
      }
    }
  }, [isOpen, profile]);

  const loadDistricts = async () => {
    try {
       const q = collection(db, 'districts');
       const snapshot = await getDocs(q);
       const data = snapshot.docs.map(d => ({ id: d.id, name: d.data().name }));
       setDistricts(data);
    } catch (e) {
       console.error("Failed to load districts", e);
    }
  };

  const loadBranches = async (districtId: string) => {
    if (!districtId) return;
    setIsLoadingLocations(true);
    try {
      const q = collection(db, `districts/${districtId}/branches`);
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, name: d.data().name }));
      setBranches(data);
    } catch (e) {
      console.error("Failed to load branches", e);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const handleDistrictChange = (value: string) => {
    setTargetDistrictId(value);
    setTargetBranchId('');
    loadBranches(value);
  };

  const handleTransfer = async () => {
    if (!targetDistrictId || !targetBranchId) {
      toast.error('Please select both a district and a branch.');
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error('No members selected.');
      return;
    }

    setIsTransferring(true);
    
    try {
      const batch = writeBatch(db);
      
      let transferCount = 0;

      for (const member of selectedMembers) {
        // Skip if they are already in the target branch
        if (member.branchId === targetBranchId && member.districtId === targetDistrictId) {
           continue;
        }

        // The member might be loaded via collectionGroup, the old path is `districts/${member.districtId}/branches/${member.branchId}/members/${member.id}`
        const oldRef = doc(db, `districts/${member.districtId || 'unassigned'}/branches/${member.branchId || 'unassigned'}/members/${member.id}`);
        const newRef = doc(db, `districts/${targetDistrictId}/branches/${targetBranchId}/members/${member.id}`);

        // Set new branch Data
        const updatedData = {
           ...member,
           districtId: targetDistrictId,
           branchId: targetBranchId,
           // Keep a record of transfer history? (Optional, maybe skip for now) // updatedDate is likely there
        };

        // If the query returns 'path' field we shouldn't save back the old path
        delete updatedData.path; 

        batch.set(newRef, updatedData);
        batch.delete(oldRef);
        
        transferCount++;
      }

      if (transferCount > 0) {
         await batch.commit();
         toast.success(`Successfully transferred ${transferCount} members.`);
         onSuccess();
      } else {
         toast.info("No members needed transferring (they are already in the target branch).");
      }
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(`Transfer failed: ${error.message}`);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Transfer">
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
          <ArrowRightLeft className="text-blue-500 shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-blue-900">
            <p className="font-bold mb-1">Transfer {selectedMembers.length} Members</p>
            <p className="text-blue-700">
              Moving members will remove them from their current branch and place them in the selected destination.
            </p>
          </div>
        </div>

        <div className="space-y-4">
           {profile?.role === 'superadmin' && (
             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Destination District</label>
               <Select onValueChange={handleDistrictChange} value={targetDistrictId}>
                 <SelectTrigger className="w-full bg-slate-50 border-slate-200 h-11 rounded-xl focus:ring-blue-500">
                   <SelectValue placeholder="Select District" />
                 </SelectTrigger>
                 <SelectContent>
                   {districts.map(d => (
                     <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           )}

           <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Destination Branch</label>
             <Select onValueChange={setTargetBranchId} value={targetBranchId} disabled={!targetDistrictId || isLoadingLocations}>
               <SelectTrigger className="w-full bg-slate-50 border-slate-200 h-11 rounded-xl focus:ring-blue-500">
                 <SelectValue placeholder={!targetDistrictId ? "Select district first" : isLoadingLocations ? "Loading..." : "Select Branch"} />
               </SelectTrigger>
               <SelectContent>
                 {branches.map(b => (
                   <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={isTransferring}
            className="font-bold px-6"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleTransfer}
            disabled={isTransferring || !targetDistrictId || !targetBranchId}
            className="font-bold px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2"
          >
            {isTransferring ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Transferring...
              </>
            ) : (
              <>
                Confirm Transfer
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
