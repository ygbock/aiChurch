import React, { useState } from 'react';
import { Search, Plus, Filter, Edit, Trash, ChevronRight, ChevronDown } from 'lucide-react';
import { useAccountingStore } from '../store/accountingStore';
import AccountFormModal from './AccountFormModal';
import { Account } from '../types';

export default function ChartOfAccounts() {
  const accounts = useAccountingStore(state => state.accounts);
  const journals = useAccountingStore(state => state.journals);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  const filteredAccounts = accounts.filter(acc => 
    acc.code.includes(searchTerm) || 
    acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    acc.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedParents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const calculateBalance = (accountId: string, category: string) => {
    const isDebitNormal = category === 'Asset' || category === 'Expense';
    let balance = 0;
    
    // Quick ledger balance calculation. In real app, consider nested balances.
    journals.filter(j => j.status === 'Posted').forEach(j => {
      j.lines.forEach(l => {
        if (l.accountId === accountId) {
          balance += isDebitNormal ? (l.debit - l.credit) : (l.credit - l.debit);
        }
      });
    });
    
    return balance;
  };

  const handleEdit = (acc: Account) => {
    setEditingAccount(acc);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  // Group by parent logic
  const renderAccountTree = (parentId: string | undefined = undefined, depth: number = 0) => {
    const children = filteredAccounts.filter(a => a.parentAccountId === parentId);
    
    return children.map(acc => {
      const isExpanded = expandedParents[acc.id] || searchTerm; // auto expand if searching
      const hasChildren = accounts.some(a => a.parentAccountId === acc.id);
      
      return (
        <React.Fragment key={acc.id}>
          <tr className="hover:bg-slate-50 transition-colors group">
            <td className="px-6 py-4 font-mono font-bold text-slate-600" style={{ paddingLeft: `${(depth * 1.5) + 1.5}rem` }}>
              <div className="flex items-center gap-2">
                {hasChildren ? (
                  <button onClick={() => toggleExpand(acc.id)} className="p-0.5 text-slate-400 hover:text-slate-700">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                ) : <div className="w-5" />}
                {acc.code}
              </div>
            </td>
            <td className="px-6 py-4 font-bold text-slate-900">{acc.name}</td>
            <td className="px-6 py-4">
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${getCategoryColor(acc.category)}`}>
                {acc.category}
              </span>
            </td>
            <td className="px-6 py-4 text-center">
              <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full tracking-wider ${acc.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {acc.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
              {calculateBalance(acc.id, acc.category).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </td>
            <td className="px-6 py-4 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(acc)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                <Edit size={16} />
              </button>
              <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                <Trash size={16} />
              </button>
            </td>
          </tr>
          {hasChildren && isExpanded && renderAccountTree(acc.id, depth + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search accounts by code or name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 text-sm flex items-center gap-2">
            <Filter size={16} /> Filter
          </button>
          <button onClick={handleCreate} className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 text-sm flex items-center gap-2 shadow-sm">
            <Plus size={16} /> Add Account
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Account Code</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Balance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {renderAccountTree(undefined, 0)}
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No accounts found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AccountFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} editAccount={editingAccount} />
    </div>
  );
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'Asset': return 'bg-blue-50 text-blue-700';
    case 'Liability': return 'bg-rose-50 text-rose-700';
    case 'Equity': return 'bg-purple-50 text-purple-700';
    case 'Income': return 'bg-emerald-50 text-emerald-700';
    case 'Expense': return 'bg-amber-50 text-amber-700';
    default: return 'bg-slate-50 text-slate-700';
  }
}

