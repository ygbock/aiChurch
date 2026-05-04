import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addDoc, collection, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Save, Loader2, X, Camera } from 'lucide-react';

interface SuperAdminAddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SuperAdminAddMemberModal({ isOpen, onClose, onSuccess }: SuperAdminAddMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [districts, setDistricts] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    gender: 'Male',
    memberLevel: 'Disciple',
    districtId: '',
    branchId: '',
    photoUrl: ''
  });

  // Fetch districts
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const snap = await getDocs(collection(db, 'districts'));
        const distData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDistricts(distData);
      } catch (err) {
        console.error("Failed to fetch districts", err);
      }
    };
    if (isOpen) {
      fetchDistricts();
    }
  }, [isOpen]);

  // Fetch branches when district changes
  useEffect(() => {
    const fetchBranches = async () => {
      if (!formData.districtId) {
        setBranches([]);
        return;
      }
      try {
        const snap = await getDocs(collection(db, 'districts', formData.districtId, 'branches'));
        const brData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBranches(brData);
      } catch (err) {
        console.error("Failed to fetch branches", err);
      }
    };
    fetchBranches();
  }, [formData.districtId]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const pFile = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(pFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.districtId || !formData.branchId) {
      toast.error('District and Branch are required');
      return;
    }
    
    setLoading(true);
    try {
      const selectedBranch = branches.find(b => b.id === formData.branchId);

      const calcLevel = formData.memberLevel === 'Disciple' ? 'Disciple' :
                        formData.memberLevel === 'Worker' ? 'Worker' :
                        formData.memberLevel === 'Leader' ? 'Leader' : 'Disciple';

      const memberData = {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        gender: formData.gender,
        level: calcLevel,
        baptizedSubLevel: formData.memberLevel.toLowerCase(),
        districtId: formData.districtId,
        branchId: formData.branchId,
        branch: selectedBranch?.name || '',
        photoUrl: formData.photoUrl,
        status: 'Active',
        isBaptised: false,
        baptismStatus: 'Not Baptised',
        joinDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(
        collection(db, 'districts', formData.districtId, 'branches', formData.branchId, 'members'),
        memberData
      );

      toast.success('Member added successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl overflow-hidden p-0 border-0 max-h-[90vh] overflow-y-auto">
        <div className="bg-slate-900 p-6 flex items-center justify-between sticky top-0 z-10">
          <DialogTitle className="text-white text-xl font-bold">Add Member</DialogTitle>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2 items-center mb-4">
            <div 
              className="h-24 w-24 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.photoUrl ? (
                <img src={formData.photoUrl} alt="Member" className="h-full w-full object-cover" />
              ) : (
                <Camera className="text-slate-400" size={32} />
              )}
              <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={24} />
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">{formData.photoUrl ? 'Change Photo' : 'Upload Photo'}</span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handlePhotoChange} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 uppercase">District *</label>
              <select
                required
                className="h-11 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.districtId}
                onChange={(e) => setFormData({ ...formData, districtId: e.target.value, branchId: '' })}
              >
                <option value="">Select District</option>
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 uppercase">Branch *</label>
              <select
                required
                disabled={!formData.districtId}
                className="h-11 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              >
                <option value="">Select Branch</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 uppercase">Full Name *</label>
            <Input
              required
              placeholder="e.g. John Doe"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 uppercase">Phone Number</label>
              <Input
                placeholder="+1 234 567 890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 uppercase">Gender</label>
              <select
                className="h-11 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 uppercase">Email</label>
            <Input
              type="email"
              placeholder="e.g. john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-11"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 uppercase">Member Level</label>
            <select
              className="h-11 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.memberLevel}
              onChange={(e) => setFormData({ ...formData, memberLevel: e.target.value })}
            >
              <option value="Disciple">Disciple</option>
              <option value="Worker">Worker</option>
              <option value="Leader">Leader</option>
            </select>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-6">
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
              Save Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
