import React, { useState, useMemo } from 'react';
import { Target, Plus, Search, Filter } from 'lucide-react';
import { useAccountingStore } from '../store/accountingStore';
import { Budget, JournalEntry, Account } from '../types';
import { createAccountingOperations } from '../services/accountingOperations';
import { useFirebase } from '../../../../components/FirebaseProvider';

export default function Budgets() {
  const { budgets, accounts, journals } = useAccountingStore();
  const { profile } = useFirebase();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBudget, setNewBudget] = useState<Partial<Budget>>({
    name: '',
    amount: 0,
    accountId: '',
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
  });

  const ops = useMemo(() => {
    if (profile?.districtId && profile?.branchId) {
      return createAccountingOperations(profile.districtId, profile.branchId);
    }
    return null;
  }, [profile]);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ops || !profile) return;
    
    try {
      const budget: Budget = {
        id: `bud-${Date.now()}`,
        name: newBudget.name!,
        amount: Number(newBudget.amount),
        accountId: newBudget.accountId!,
        periodStart: newBudget.periodStart!,
        periodEnd: newBudget.periodEnd!,
        branchId: profile.branchId!,
        createdAt: new Date().toISOString()
      };
      await ops.saveBudget(budget);
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const calculateActualSpent = (accountId: string, start: string, end: string) => {
    let actual = 0;
    journals.filter(j => j.status === 'Posted' && j.entryDate >= start && j.entryDate <= end)
      .forEach(j => {
        j.lines.forEach(l => {
          if (l.accountId === accountId) {
             const acc = accounts.find(a => a.id === accountId);
             if (acc?.category === 'Expense') {
                actual += (l.debit - l.credit);
             } else if (acc?.category === 'Income') {
                actual += (l.credit - l.debit);
             }
          }
        });
      });
    return actual;
  };

  const filteredBudgets = budgets.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-emerald-600" />
            Budgeting vs. Actuals
          </h2>
          <p className="text-slate-500 text-sm mt-1">Track allocated budgets against real-time ledger data.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-emerald-700 transition"
        >
          <Plus size={16} />
          New Budget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search budgets..." 
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-semibold text-slate-700">Budget Name</th>
              <th className="px-6 py-3 font-semibold text-slate-700">Account</th>
              <th className="px-6 py-3 font-semibold text-slate-700">Period</th>
              <th className="px-6 py-3 font-semibold text-slate-700 text-right">Allocated</th>
              <th className="px-6 py-3 font-semibold text-slate-700 text-right">Actual</th>
              <th className="px-6 py-3 font-semibold text-slate-700 text-right">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredBudgets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  No budgets found. Create one to start tracking.
                </td>
              </tr>
            ) : filteredBudgets.map(budget => {
              const actual = calculateActualSpent(budget.accountId, budget.periodStart, budget.periodEnd);
              const variance = budget.amount - actual;
              const account = accounts.find(a => a.id === budget.accountId);
              const isOver = variance < 0;
              const percentage = (actual / budget.amount) * 100;

              return (
                <tr key={budget.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{budget.name}</td>
                  <td className="px-6 py-4 text-slate-600">{account?.name || 'Unknown Account'}</td>
                  <td className="px-6 py-4 text-slate-600">{budget.periodStart} - {budget.periodEnd}</td>
                  <td className="px-6 py-4 text-slate-900 font-medium text-right">${budget.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-slate-900 text-right">
                     <span className={`inline-flex flex-col items-end`}>
                        ${actual.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-xs text-slate-400 mt-1">{percentage.toFixed(1)}%</span>
                     </span>
                  </td>
                  <td className={`px-6 py-4 font-medium text-right ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {isOver ? '-' : '+'}${Math.abs(variance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">Create Budget</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleCreateBudget} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Budget Name</label>
                <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={newBudget.name} onChange={e => setNewBudget({...newBudget, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account (Income/Expense)</label>
                <select required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={newBudget.accountId} onChange={e => setNewBudget({...newBudget, accountId: e.target.value})}>
                  <option value="">Select Account</option>
                  {accounts.filter(a => a.category === 'Expense' || a.category === 'Income').map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.category})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input required type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={newBudget.periodStart} onChange={e => setNewBudget({...newBudget, periodStart: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input required type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={newBudget.periodEnd} onChange={e => setNewBudget({...newBudget, periodEnd: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Allocated Amount</label>
                <input required type="number" min="0" step="0.01" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={newBudget.amount} onChange={e => setNewBudget({...newBudget, amount: Number(e.target.value)})} />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700">Save Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
