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
  const [transferReason, setTransferReason] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  
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
      let needsApprovalCount = 0;
      
      const toBranchObj = branches.find(b => b.id === targetBranchId);
      const toBranchName = toBranchObj ? toBranchObj.name : 'Unknown';

      for (const member of selectedMembers) {
        // Skip if they are already in the target branch
        if (member.branchId === targetBranchId && member.districtId === targetDistrictId) {
           continue;
        }

        const isLeaderTransfer = ['District Overseer', 'Branch Pastor', 'Assistant Pastor', 'Department Head', 'Leader'].includes(member.level) || 
                                 ['District Overseer', 'Branch Pastor', 'Assistant Pastor', 'Department Head', 'Leader'].includes(newCapacity);

        if (profile?.role !== 'superadmin' && isLeaderTransfer) {
           const transferRef = doc(collection(db, 'transfers'));
           batch.set(transferRef, {
             memberId: member.id,
             memberName: member.fullName,
             fromDistrictId: member.districtId || 'unassigned',
             fromBranchId: member.branchId || 'unassigned',
             fromBranchName: member.branch || 'Unknown',
             toDistrictId: targetDistrictId,
             toBranchId: targetBranchId,
             toBranchName: toBranchName,
             reason: transferReason,
             newCapacity: newCapacity || member.level,
             requestedBy: profile?.uid || 'system',
             status: 'pending',
             createdAt: new Date().toISOString()
           });
           needsApprovalCount++;
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
           ...(newCapacity ? { level: newCapacity } : {}),
           transferHistory: [
             ...(member.transferHistory || []),
             {
               date: new Date().toISOString(),
               fromDistrict: member.districtId,
               fromBranch: member.branchId,
               toDistrict: targetDistrictId,
               toBranch: targetBranchId,
               reason: transferReason,
               newCapacity: newCapacity || member.level,
               transferredBy: profile?.uid || 'system'
             }
           ]
        };

        // If the query returns 'path' field we shouldn't save back the old path
        delete updatedData.path; 

        batch.set(newRef, updatedData);
        batch.delete(oldRef);
        
        transferCount++;
      }

      if (transferCount > 0 || needsApprovalCount > 0) {
         await batch.commit();
         if (transferCount > 0) {
           toast.success(`Successfully transferred ${transferCount} members.`);
         }
         if (needsApprovalCount > 0) {
           toast.success(`${needsApprovalCount} leader transfers sent to HQ for approval.`);
         }
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
              <select 
                onChange={(e) => handleDistrictChange(e.target.value)} 
                value={targetDistrictId}
                className="w-full bg-slate-50 border border-slate-200 h-11 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Select District</option>
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
           )}

           <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Destination Branch</label>
             <select 
               onChange={(e) => setTargetBranchId(e.target.value)} 
               value={targetBranchId} 
               disabled={!targetDistrictId || isLoadingLocations}
               className="w-full bg-slate-50 border border-slate-200 h-11 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <option value="" disabled>
                  {!targetDistrictId ? "Select district first" : isLoadingLocations ? "Loading..." : "Select Branch"}
                </option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
             </select>
           </div>

           <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reason for Transfer</label>
             <select 
               onChange={(e) => setTransferReason(e.target.value)} 
               value={transferReason}
               className="w-full bg-slate-50 border border-slate-200 h-11 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
               <option value="" disabled>Select Reason</option>
               {profile?.role === 'superadmin' && (
                 <option value="Official HQ Transfer">Official HQ Transfer</option>
               )}
               <option value="Relocation">Relocation</option>
               <option value="Change of Service">Change of Service / Role</option>
               <option value="Personal Request">Personal Request</option>
               <option value="Other">Other</option>
             </select>
           </div>

           <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Capacity / Role</label>
             <select 
               onChange={(e) => setNewCapacity(e.target.value)} 
               value={newCapacity}
               className="w-full bg-slate-50 border border-slate-200 h-11 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
               <option value="">Keep Current Capacity</option>
               <option value="District Overseer">District Overseer</option>
               <option value="Branch Pastor">Branch Pastor</option>
               <option value="Assistant Pastor">Assistant Pastor</option>
               <option value="Department Head">Department Head</option>
               <option value="Leader">Leader</option>
               <option value="Worker">Worker</option>
               <option value="Member">Member</option>
             </select>
             <p className="text-xs text-slate-500">Leaving this empty will preserve their current role/level.</p>
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
