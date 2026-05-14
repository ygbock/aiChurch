import React, { useState, useMemo } from 'react';
import { X, Plus, Trash, AlertCircle } from 'lucide-react';
import { useAccountingStore } from '../store/accountingStore';
import { createAccountingOperations } from '../services/accountingOperations';
import { useFirebase } from '../../../../components/FirebaseProvider';

interface JournalEntryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JournalEntryFormModal({ isOpen, onClose }: JournalEntryFormModalProps) {
  const accounts = useAccountingStore((state) => state.accounts);
  const funds = useAccountingStore((state) => state.funds);
  const { profile } = useFirebase();

  const [description, setDescription] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [fundId, setFundId] = useState(funds[0]?.id || '');
  const [branchId, setBranchId] = useState('b-1'); // dummy branch
  const [status, setStatus] = useState<'Draft' | 'Pending Approval'>('Draft');
  
  const [lines, setLines] = useState([
    { id: '1', accountId: '', debit: 0, credit: 0 },
    { id: '2', accountId: '', debit: 0, credit: 0 },
  ]);

  if (!isOpen) return null;

  const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleAddLine = () => {
    setLines([...lines, { id: Math.random().toString(), accountId: '', debit: 0, credit: 0 }]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length > 2) {
      setLines(lines.filter(l => l.id !== id));
    }
  };

  const updateLine = (id: string, field: 'accountId' | 'debit' | 'credit', value: any) => {
    setLines(lines.map(l => {
      if (l.id === id) {
        const newLine = { ...l, [field]: value };
        if (field === 'debit' && value > 0) newLine.credit = 0;
        if (field === 'credit' && value > 0) newLine.debit = 0;
        return newLine;
      }
      return l;
    }));
  };

  const ops = useMemo(() => {
    if (profile?.districtId && profile?.branchId) {
      return createAccountingOperations(profile.districtId, profile.branchId);
    }
    return null;
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced || !ops || !profile) return;
    
    // validate that all selected accounts are non-empty
    if (lines.some(l => !l.accountId)) return;

    try {
      await ops.saveJournalEntry({
        id: `JE-${Math.floor(Math.random() * 10000)}`,
        entryDate,
        description,
        status,
        fundId,
        branchId: profile.branchId as string,
        createdBy: profile.uid,
        createdAt: new Date().toISOString(),
        lines: lines.map(l => ({
          accountId: l.accountId,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0
        }))
      });
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">New Journal Entry</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="journal-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <div>
                 <label className="block text-sm font-bold text-slate-900 mb-1">Date</label>
                 <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
               </div>
               <div>
                 <label className="block text-sm font-bold text-slate-900 mb-1">Fund</label>
                 <select value={fundId} onChange={(e) => setFundId(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                   {funds.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-bold text-slate-900 mb-1">Status</label>
                 <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="Draft">Draft</option>
                    <option value="Pending Approval">Pending Approval</option>
                 </select>
               </div>
               <div className="lg:col-span-4">
                 <label className="block text-sm font-bold text-slate-900 mb-1">Description</label>
                 <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Reason for journal entry..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
               </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-200">
                     <tr>
                        <th className="px-4 py-3 w-1/2">Account</th>
                        <th className="px-4 py-3 w-1/5 text-right">Debit</th>
                        <th className="px-4 py-3 w-1/5 text-right">Credit</th>
                        <th className="px-4 py-3 w-10"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {lines.map((line, i) => (
                        <tr key={line.id} className="bg-white">
                           <td className="p-2">
                             <select value={line.accountId} onChange={(e) => updateLine(line.id, 'accountId', e.target.value)} required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                               <option value="" disabled>Select Account...</option>
                               {accounts.map(acc => (
                                 <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                               ))}
                             </select>
                           </td>
                           <td className="p-2 text-right">
                             <input type="number" min="0" step="0.01" value={line.debit || ''} onChange={(e) => updateLine(line.id, 'debit', parseFloat(e.target.value) || 0)} placeholder="0.00" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-right font-mono" />
                           </td>
                           <td className="p-2 text-right">
                             <input type="number" min="0" step="0.01" value={line.credit || ''} onChange={(e) => updateLine(line.id, 'credit', parseFloat(e.target.value) || 0)} placeholder="0.00" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-right font-mono" />
                           </td>
                           <td className="p-2 text-center">
                              <button type="button" onClick={() => handleRemoveLine(line.id)} disabled={lines.length <= 2} className="p-1.5 text-slate-400 hover:text-rose-500 disabled:opacity-50">
                                 <Trash size={16} />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
               <div className="p-2 border-t border-slate-100 bg-slate-50">
                  <button type="button" onClick={handleAddLine} className="px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1">
                     <Plus size={14} /> Add Line
                  </button>
               </div>
               <div className="p-4 border-t border-slate-200 bg-slate-100 flex justify-end gap-8">
                  <div className="text-right">
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Debit</p>
                     <p className="font-mono font-bold text-slate-900">{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Credit</p>
                     <p className="font-mono font-bold text-slate-900">{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
               </div>
            </div>

            {!isBalanced && (totalDebit > 0 || totalCredit > 0) && (
               <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700">
                  <AlertCircle size={20} />
                  <p className="text-sm font-bold">Total debits must equal total credits.</p>
               </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
           <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
              Cancel
           </button>
           <button type="submit" form="journal-form" disabled={!isBalanced || lines.some(l => !l.accountId)} className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              Save Entry
           </button>
        </div>
      </div>
    </div>
  );
}
