import React, { useState } from 'react';
import { useBudgetStore } from '../stores/budgetStore';
import { ArrowRight, FileText, CheckCircle2 } from 'lucide-react';

export default function BudgetTransfers() {
  const { plans, transfers, setTransfers } = useBudgetStore();
  
  const [fromBudgetId, setFromBudgetId] = useState('');
  const [toBudgetId, setToBudgetId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('');
  
  const approvedPlans = plans.filter(p => p.status === 'Approved');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromBudgetId || !toBudgetId || amount <= 0) return;
    
    // In a real app we'd validate limits and fund constraints
    const newTransfer = {
      id: `trx-${Date.now()}`,
      fromBudgetId,
      toBudgetId,
      amount,
      reason,
      status: 'Pending' as const,
      date: new Date().toISOString(),
      requestedBy: 'Current User'
    };
    
    setTransfers([...transfers, newTransfer]);
    
    setFromBudgetId('');
    setToBudgetId('');
    setAmount(0);
    setReason('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Request Transfer</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">From Budget</label>
              <select 
                value={fromBudgetId}
                onChange={(e) => setFromBudgetId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500 bg-white"
                required
              >
                <option value="">Select source budget</option>
                {approvedPlans.map(p => (
                  <option key={`from-${p.id}`} value={p.id}>{p.name} (Le {p.remainingAmount.toLocaleString()})</option>
                ))}
              </select>
            </div>

            <div className="flex justify-center text-slate-400">
               <ArrowRight size={20} className="rotate-90 lg:rotate-0" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">To Budget</label>
              <select 
                value={toBudgetId}
                onChange={(e) => setToBudgetId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500 bg-white"
                required
              >
                <option value="">Select destination budget</option>
                {approvedPlans.filter(p => p.id !== fromBudgetId).map(p => (
                  <option key={`to-${p.id}`} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Amount (Le)</label>
              <input 
                type="number" 
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500"
                required
                min="1"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Reason</label>
              <textarea 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500"
                rows={3}
                required
                placeholder="Why is this transfer needed?"
              />
            </div>

            <button type="submit" className="w-full py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors">
              Submit Request
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="px-6 py-5 border-b border-slate-100">
             <h3 className="font-bold text-slate-900">Transfer History</h3>
           </div>
           
           <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Transfer Path</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {transfers.map(tr => {
                   const fromPlan = plans.find(p => p.id === tr.fromBudgetId)?.name || 'Unknown';
                   const toPlan = plans.find(p => p.id === tr.toBudgetId)?.name || 'Unknown';
                   
                   return (
                     <tr key={tr.id} className="hover:bg-slate-50">
                       <td className="px-6 py-4 text-slate-500">{new Date(tr.date).toLocaleDateString()}</td>
                       <td className="px-6 py-4">
                         <div className="flex flex-col">
                           <span className="text-rose-600 font-medium">From: {fromPlan}</span>
                           <span className="text-emerald-600 font-medium">To: {toPlan}</span>
                         </div>
                       </td>
                       <td className="px-6 py-4 font-bold text-slate-900 text-right">Le {tr.amount.toLocaleString()}</td>
                       <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${
                            tr.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            tr.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {tr.status}
                          </span>
                       </td>
                     </tr>
                   );
                })}
                {transfers.length === 0 && (
                   <tr>
                     <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                       <FileText size={32} className="mx-auto mb-3 text-slate-300" />
                       <p>No budget transfers found.</p>
                     </td>
                   </tr>
                )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
