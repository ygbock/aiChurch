import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FirstTimerForm, FirstTimerFormData } from '@/components/FirstTimerForm';
import { db } from '@/lib/firebase';
import { collectionGroup, getDocs, addDoc, collection, serverTimestamp, query, where } from 'firebase/firestore';
import { toast } from 'sonner';
import { MemberData } from '@/types/membership';

import { useRole } from '../components/Layout';

export default function NewFirstTimer() {
  const navigate = useNavigate();
  const { role } = useRole();
  const [branches, setBranches] = useState<{ id: string; name: string; districtId: string }[]>([]);
  const [members, setMembers] = useState<{ id: string; fullName: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        // Fetch branches
        const branchSnapshot = await getDocs(collectionGroup(db, 'branches'));
        const branchList = branchSnapshot.docs.map(d => {
          const districtId = d.ref.parent.parent?.id || 'unknown';
          return {
            id: d.id,
            name: d.data().name,
            districtId
          };
        });
        setBranches(branchList);

        // Fetch members for "invited by"
        const memberSnapshot = await getDocs(collectionGroup(db, 'members'));
        const memberList = memberSnapshot.docs.map(d => ({
          id: d.id,
          fullName: d.data().fullName
        }));
        setMembers(memberList);

      } catch (err) {
        console.error("Failed to fetch context:", err);
      }
    };
    fetchContext();
  }, []);

  const onFirstTimerSubmit = async (data: FirstTimerFormData) => {
    setIsSaving(true);
    try {
      const selectedBranch = branches.find(b => b.id === data.branchId);
      if (!selectedBranch) throw new Error("Selected branch context not found");

      const path = `/districts/${selectedBranch.districtId}/branches/${data.branchId}/members`;
      
      const newRecord: Partial<MemberData> = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || '',
        branchId: data.branchId,
        districtId: selectedBranch.districtId,
        level: 'Visitor',
        status: 'Active',
        baptismStatus: 'Not Baptised',
        isBaptised: false,
        joinDate: data.firstVisit,
        visitDate: data.firstVisit,
        gender: 'Male', // Default
        community: data.community,
        area: data.area,
        street: data.street,
        publicLandmark: data.publicLandmark,
        serviceDate: data.serviceDate,
        firstVisit: data.firstVisit,
        invitedBy: data.invitedBy,
        followUpStatus: data.followUpStatus,
        followUpNotes: data.followUpNotes,
        notes: data.notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, path), newRecord);
      toast.success("Encounter record executed successfully");
      navigate('/members');
    } catch (err: any) {
      console.error("Failed to save first timer:", err);
      toast.error(err.message || "Failed to execute recording");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full mx-auto pb-20 px-2 sm:px-4 md:px-6">
      <div className="mb-4 sm:mb-6 flex flex-col items-start justify-between gap-4 md:mb-10 md:flex-row md:items-center md:gap-6">
        <div className="space-y-1 w-full">
          <div className="mb-2 flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-blue-600">
             <UserPlus size={14} />
             <span className="text-[10px] font-black uppercase tracking-widest">First-Timer Module</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black leading-none tracking-tight text-slate-900 md:text-4xl uppercase">Encounter Recording</h1>
          <p className="max-w-xl font-medium text-slate-500 text-xs sm:text-sm md:text-base">Registering a new prospect encounter in the follow-up orchestration matrix.</p>
        </div>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center md:gap-4">
          <Button variant="outline" onClick={() => navigate(-1)} className="h-10 sm:h-12 w-full rounded-[2rem] border-slate-200 px-8 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 md:w-auto">
            <ChevronLeft className="mr-2" size={16} /> Back
          </Button>
        </div>
      </div>

      <div className="min-h-[500px] rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm md:rounded-[3rem] md:p-12">
        <FirstTimerForm 
          branches={branches}
          members={members}
          isSaving={isSaving}
          role={role}
          onCancel={() => navigate(-1)}
          onSubmit={onFirstTimerSubmit}
        />
      </div>
    </div>
  );
}
