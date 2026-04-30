import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConvertForm, ConvertFormData } from '@/components/ConvertForm';
import { db } from '@/lib/firebase';
import { collectionGroup, getDocs, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { MemberData } from '@/types/membership';

import { useRole } from '../components/Layout';

export default function NewConvert() {
  const navigate = useNavigate();
  const { role } = useRole();
  const [branches, setBranches] = useState<{ id: string; name: string; districtId: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const snapshot = await getDocs(collectionGroup(db, 'branches'));
        const list = snapshot.docs.map(d => {
          const districtId = d.ref.parent.parent?.id || 'unknown';
          return {
            id: d.id,
            name: d.data().name,
            districtId
          };
        });
        setBranches(list);
      } catch (err) {
        console.error("Failed to fetch branches:", err);
      }
    };
    fetchBranches();
  }, []);

  const resolveMinistries = (dob: string, gender: string): string[] => {
    if (!dob) return [];
    
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    const g = gender.toLowerCase();
    
    if (age < 13) {
      return ['children'];
    } else if (age >= 13 && age <= 34) {
      return ['youth'];
    } else if (age >= 35) {
      return g === 'female' ? ['womens'] : ['mens'];
    }
    return [];
  };

  const onConvertSubmit = async (data: ConvertFormData) => {
    setIsSaving(true);
    try {
      const selectedBranch = branches.find(b => b.id === data.branchId);
      if (!selectedBranch) throw new Error("Selected branch context not found");

      const path = `/districts/${selectedBranch.districtId}/branches/${data.branchId}/members`;
      
      const calculatedMinistries = resolveMinistries(data.dateOfBirth, data.gender as string);

      const newMember: Partial<MemberData> = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        branchId: data.branchId,
        districtId: selectedBranch.districtId,
        level: 'Convert',
        status: 'Active',
        baptismStatus: 'Not Baptised',
        isBaptised: false,
        joinDate: new Date().toISOString().split('T')[0],
        gender: data.gender as 'Male' | 'Female',
        dob: data.dateOfBirth,
        photoUrl: data.photoUrl,
        community: data.community,
        area: data.area,
        ministries: calculatedMinistries,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, path), newMember);
      toast.success("Convert record initialized successfully");
      navigate('/members');
    } catch (err: any) {
      console.error("Failed to save convert:", err);
      toast.error(err.message || "Failed to initialize convert record");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full mx-auto pb-20 px-2 sm:px-4 md:px-6">
      <div className="mb-4 sm:mb-6 flex flex-col items-start justify-between gap-4 md:mb-10 md:flex-row md:items-center md:gap-6">
        <div className="space-y-1 w-full">
          <div className="mb-2 flex w-fit items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-indigo-600">
             <Building2 size={14} />
             <span className="text-[10px] font-black uppercase tracking-widest">Neo-Convert Module</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black leading-none tracking-tight text-slate-900 md:text-4xl uppercase">Convert Ingestion</h1>
          <p className="max-w-xl font-medium text-slate-500 text-xs sm:text-sm md:text-base">Initializing a new digital identity for the ecclesiastical matrix.</p>
        </div>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center md:gap-4">
          <Button variant="outline" onClick={() => navigate(-1)} className="h-10 sm:h-12 w-full rounded-[2rem] border-slate-200 px-8 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 md:w-auto">
            <ChevronLeft className="mr-2" size={16} /> Back
          </Button>
        </div>
      </div>

      <div className="min-h-[500px] rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm md:rounded-[3rem] md:p-12">
        <ConvertForm 
          branches={branches}
          isSaving={isSaving}
          role={role}
          onCancel={() => navigate(-1)}
          onSubmit={onConvertSubmit}
        />
      </div>
    </div>
  );
}
