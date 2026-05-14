import React, { useState, useMemo } from 'react';
import { X, ArrowRight, ArrowRightLeft } from 'lucide-react';
import { useAccountingStore } from '../store/accountingStore';
import { toast } from 'sonner';
import { createAccountingOperations } from '../services/accountingOperations';
import { useFirebase } from '../../../../components/FirebaseProvider';

interface TransferFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TransferFundsModal({ isOpen, onClose }: TransferFundsModalProps) {
  const funds = useAccountingStore(state => state.funds);
  const accounts = useAccountingStore(state => state.accounts);
  const { profile } = useFirebase();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [sourceFund, setSourceFund] = useState('');
  const [destFund, setDestFund] = useState('');
  const [cashAccountId, setCashAccountId] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const cashAccounts = accounts.filter(a => a.category === 'Asset');
  const equityAccounts = accounts.filter(a => a.category === 'Equity');
  // Fallback to Retained Earnings or first equity account for balancing
  const transferAccountId = equityAccounts.length > 0 ? equityAccounts[0].id : accounts[0].id; 

  const ops = useMemo(() => {
    if (profile?.districtId && profile?.branchId) {
      return createAccountingOperations(profile.districtId, profile.branchId);
    }
    return null;
  }, [profile]);

  const handleTransfer = async () => {
    if (!sourceFund || !destFund || !amount || !cashAccountId || !description) {
      toast.error('Please fill in all fields');
      return;
    }
    if (sourceFund === destFund) {
      toast.error('Source and destination funds must be different');
      return;
    }
    if (!ops || !profile) return;

    const transferAmount = Number(amount);
    const ref = `TRF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    try {
      // Source Fund Journal Entry: Reduce Cash, Reduce Equity (Transfer Out)
      // CR Cash, DR Equity
      await ops.saveJournalEntry({
        id: `${ref}-OUT`,
        entryDate: date,
        description: `Transfer Out: ${description}`,
        status: 'Posted',
        fundId: sourceFund,
        branchId: profile.branchId as string,
        createdBy: profile.uid,
        createdAt: new Date().toISOString(),
        reference: ref,
        lines: [
          { accountId: transferAccountId, debit: transferAmount, credit: 0 },
          { accountId: cashAccountId, debit: 0, credit: transferAmount }
        ]
      });

      // Destination Fund Journal Entry: Increase Cash, Increase Equity (Transfer In)
      // DR Cash, CR Equity
      await ops.saveJournalEntry({
        id: `${ref}-IN`,
        entryDate: date,
        description: `Transfer In: ${description}`,
        status: 'Posted',
        fundId: destFund,
        branchId: profile.branchId as string,
        createdBy: profile.uid,
        createdAt: new Date().toISOString(),
        reference: ref,
        lines: [
          { accountId: cashAccountId, debit: transferAmount, credit: 0 },
          { accountId: transferAccountId, debit: 0, credit: transferAmount }
        ]
      });

      toast.success('Funds Transferred successfully');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to transfer funds');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <ArrowRightLeft className="text-emerald-500" />
              Transfer Between Funds
            </h2>
            <p className="text-sm text-slate-500 mt-1">Move balances securely via offset journal entries.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 relative">
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Source Fund</label>
               <select value={sourceFund} onChange={e => setSourceFund(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500">
                 <option value="">Select Fund</option>
                 {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
               </select>
             </div>
             
             <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 mt-3 bg-white p-1 rounded-full border border-slate-100 shadow-sm z-10">
                <ArrowRight size={16} className="text-slate-400" />
             </div>

             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Destination Fund</label>
               <select value={destFund} onChange={e => setDestFund(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500">
                 <option value="">Select Fund</option>
                 {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
               </select>
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Holding Account (Asset)</label>
            <select value={cashAccountId} onChange={e => setCashAccountId(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500">
              <option value="">Select Bank / Cash Account</option>
              {cashAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <p className="text-xs text-slate-400 mt-1">The asset account that holds the cash being transferred.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 font-mono" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Subsidy for upcoming Youth event" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleTransfer} className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors">
            Execute Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
