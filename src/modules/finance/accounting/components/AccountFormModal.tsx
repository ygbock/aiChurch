import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { useAccountingStore } from '../store/accountingStore';
import { Account, AccountCategory } from '../types';
import { createAccountingOperations } from '../services/accountingOperations';
import { useFirebase } from '../../../../components/FirebaseProvider';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editAccount?: Account | null;
}

export default function AccountFormModal({ isOpen, onClose, editAccount }: AccountFormModalProps) {
  const accounts = useAccountingStore((state) => state.accounts);
  const { profile } = useFirebase();

  const [code, setCode] = useState(editAccount?.code || '');
  const [name, setName] = useState(editAccount?.name || '');
  const [category, setCategory] = useState<AccountCategory>(editAccount?.category || 'Asset');
  const [isActive, setIsActive] = useState(editAccount ? editAccount.isActive : true);
  const [parentAccountId, setParentAccountId] = useState(editAccount?.parentAccountId || '');

  const ops = useMemo(() => {
    if (profile?.districtId && profile?.branchId) {
      return createAccountingOperations(profile.districtId, profile.branchId);
    }
    return null;
  }, [profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ops || !profile) return;

    try {
      if (editAccount) {
        await ops.updateAccount(editAccount.id, { code, name, category, isActive, parentAccountId });
      } else {
        await ops.saveAccount({
          id: `acc-${Date.now()}`,
          code,
          name,
          category,
          isActive,
          parentAccountId: parentAccountId || undefined,
          branchId: profile.branchId as string
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">{editAccount ? 'Edit Account' : 'New Account'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1">Account Code</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="e.g. 1000" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1">Account Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Cash in Bank" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1">Account Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as AccountCategory)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <option value="Asset">Asset</option>
              <option value="Liability">Liability</option>
              <option value="Equity">Equity</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1">Parent Account (Optional)</label>
            <select value={parentAccountId} onChange={(e) => setParentAccountId(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <option value="">None (Top Level)</option>
              {accounts.filter(a => a.id !== editAccount?.id).map(a => (
                <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500" />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-900">Active Account</label>
          </div>

          <div className="pt-6 flex justify-end gap-3">
             <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                Cancel
             </button>
             <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors">
                {editAccount ? 'Save Changes' : 'Create Account'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
