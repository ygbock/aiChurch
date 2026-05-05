import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, deleteDoc, doc, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useFirebase } from '@/components/FirebaseProvider';
import { MemberData } from '@/types/membership';
import { format } from 'date-fns';
import { CircleDollarSign, Plus, Loader2, Trash2, Calendar, CreditCard, Filter, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Modal from '@/components/Modal';
import { toast } from 'sonner';

interface MemberGivingTabProps {
  member: MemberData;
}

interface Contribution {
  id: string;
  amount: number;
  type: string;
  category: string;
  method: string;
  date: any;
  description?: string;
  note?: string;
  recordedBy?: string;
  memberId?: string;
}

const CONTRIBUTION_TYPES = ['Tithes', 'Offering', 'Donation', 'Building Fund', 'Pledge', 'Other'];
const PAYMENT_METHODS = ['Cash', 'Card', 'Bank Transfer', 'Check', 'Online'];

export const MemberGivingTab: React.FC<MemberGivingTabProps> = ({ member }) => {
  const { profile } = useFirebase();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Tithes');
  const [method, setMethod] = useState('Cash');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');

  const fetchContributions = async () => {
    if (!member.districtId || !member.branchId) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, `districts/${member.districtId}/branches/${member.branchId}/transactions`),
        where('memberId', '==', member.id),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Contribution[];
      setContributions(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributions();
  }, [member.id, member.districtId, member.branchId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) {
      toast.error('Please enter a valid amount.');
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, `districts/${member.districtId}/branches/${member.branchId}/transactions`), {
        amount: Number(amount),
        type: 'income',
        category,
        method,
        description: `Contribution from ${member.fullName}`,
        date: new Date(date).toISOString(),
        note,
        memberId: member.id,
        recordedBy: profile?.uid || 'system',
        timestamp: serverTimestamp()
      });
      
      toast.success('Contribution recorded successfully.');
      setIsModalOpen(false);
      
      // Reset form
      setAmount('');
      setCategory('Tithes');
      setMethod('Cash');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setNote('');
      
      fetchContributions();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    
    try {
      await deleteDoc(doc(db, `districts/${member.districtId}/branches/${member.branchId}/transactions`, id));
      toast.success('Record deleted.');
      setContributions(contributions.filter(c => c.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'transactions');
    }
  };

  const totalGiven = contributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="bg-emerald-50 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
             <CircleDollarSign className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total Lifetime Giving</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(totalGiven)}</h3>
          </div>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-6 h-12 w-full sm:w-auto flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          Log Contribution
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h4 className="font-bold text-slate-800">Contribution History</h4>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm">
               <ArrowDownToLine size={16} />
            </button>
          </div>
        </div>

        {contributions.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
               <CircleDollarSign size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No giving records</h3>
            <p className="text-slate-500 text-sm max-w-sm">
              There are no fiscal contributions logged for this member. Click "Log Contribution" to add a new record.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-xs uppercase tracking-wider font-bold text-slate-500">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Method</th>
                  <th className="px-6 py-4 hidden md:table-cell">Note</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contributions.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                         <Calendar size={14} className="text-slate-400" />
                         <span className="font-medium text-slate-700">
                           {c.date ? format(new Date(c.date), 'MMM d, yyyy') : 'N/A'}
                         </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold leading-none bg-blue-50 text-blue-700 border border-blue-100">
                        {c.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-emerald-600">
                         {formatCurrency(c.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                        <CreditCard size={14} className="text-slate-400" />
                        {c.method || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-slate-500 truncate max-w-[200px]" title={c.note || c.description}>
                        {c.note || (c.description !== `Contribution from ${member.fullName}` ? c.description : '-')}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => handleDelete(c.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Record"
                      >
                         <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Contribution">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Amount *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
              <input 
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-900"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Type *</label>
               <select 
                 required
                 value={category}
                 onChange={e => setCategory(e.target.value)}
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-900"
               >
                 {CONTRIBUTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
               </select>
             </div>
             <div>
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Date *</label>
               <input 
                 type="date"
                 required
                 value={date}
                 onChange={e => setDate(e.target.value)}
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-900"
               />
             </div>
          </div>

          <div>
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Payment Method *</label>
             <select 
               required
               value={method}
               onChange={e => setMethod(e.target.value)}
               className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-900"
             >
               {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
             </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Note (Optional)</label>
            <input 
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-900"
              placeholder="e.g. November Tihes, Project XYZ"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-6">
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
              className="font-bold px-6"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSaving}
              className="font-bold px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Save Record'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
