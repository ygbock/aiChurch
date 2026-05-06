import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X, Check } from 'lucide-react';

interface ResolveTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (districtId: string, branchId: string, branchName: string, capacity: string, comment: string) => void;
  initialDistrictId?: string;
  initialBranchId?: string;
  isHQRequired: boolean;
}

export const ResolveTransferModal: React.FC<ResolveTransferModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  initialDistrictId,
  initialBranchId,
  isHQRequired
}) => {
  const [districtId, setDistrictId] = useState(initialDistrictId || '');
  const [branchId, setBranchId] = useState(initialBranchId || '');
  const [capacity, setCapacity] = useState('Member');
  const [comment, setComment] = useState('');
  
  const [districts, setDistricts] = useState<{id: string, name: string}[]>([]);
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialDistrictId && initialDistrictId !== 'undecided') setDistrictId(initialDistrictId);
      if (initialBranchId && initialBranchId !== 'undecided') setBranchId(initialBranchId);
      loadDistricts();
    }
  }, [isOpen, initialDistrictId, initialBranchId]);

  useEffect(() => {
    if (districtId && districtId !== 'undecided') {
      loadBranches(districtId);
    } else {
      setBranches([]);
      setBranchId('');
    }
  }, [districtId]);

  const loadDistricts = async () => {
    const dSnap = await getDocs(query(collection(db, 'districts')));
    setDistricts(dSnap.docs.map(d => ({ id: d.id, name: d.data().name })));
  };

  const loadBranches = async (dId: string) => {
    setLoading(true);
    const bSnap = await getDocs(query(collection(db, `districts/${dId}/branches`)));
    setBranches(bSnap.docs.map(b => ({ id: b.id, name: b.data().name })));
    setLoading(false);
  };

  const handleApprove = () => {
    const toBranchName = branches.find(b => b.id === branchId)?.name || 'Unknown';
    onApprove(districtId, branchId, toBranchName, capacity, comment);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Assign Destination</h2>
            <p className="text-xs text-slate-500">Provide final placement details before approval.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Target District</label>
            <select 
              value={districtId} 
              onChange={e => setDistrictId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 h-10 px-3 rounded-lg text-sm"
            >
              <option value="">Select District</option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Target Branch</label>
            <select 
              value={branchId} 
              onChange={e => setBranchId(e.target.value)}
              disabled={!districtId || loading}
              className="w-full bg-slate-50 border border-slate-200 h-10 px-3 rounded-lg text-sm disabled:opacity-50"
            >
              <option value="">Select Branch</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">New Capacity</label>
            <select 
              value={capacity} 
              onChange={e => setCapacity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 h-10 px-3 rounded-lg text-sm"
            >
              <option value="Member">Member</option>
              <option value="Worker">Worker</option>
              <option value="Leader">Leader</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Leadership Comment</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Any comments regarding the placement..."
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm min-h-[80px]"
            />
          </div>
          
          {isHQRequired && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg">
              <strong>Notice:</strong> This is a cross-district transfer which requires HQ validation. 
              By proceeding, the member will be moved directly across regions.
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg">
            Cancel
          </button>
          <button 
            onClick={handleApprove}
            disabled={!districtId || !branchId || districtId === 'undecided' || branchId === 'undecided'}
            className="px-4 py-2 text-sm font-bold bg-emerald-600 text-white rounded-lg flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50"
          >
            <Check size={16} /> Confirm & Approve
          </button>
        </div>
      </motion.div>
    </div>
  );
};
