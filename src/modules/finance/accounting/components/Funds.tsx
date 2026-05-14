import React, { useState } from 'react';
import { Search, Plus, Filter, FolderHeart, ArrowRightLeft } from 'lucide-react';
import { useAccountingStore } from '../store/accountingStore';
import TransferFundsModal from './TransferFundsModal';

export default function Funds() {
  const funds = useAccountingStore(state => state.funds);
  const journals = useAccountingStore(state => state.journals);
  const accounts = useAccountingStore(state => state.accounts);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);

  const filteredFunds = funds.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateFundBalance = (fundId: string) => {
    // For a fund, balance is typically Total Income - Total Expense 
    // or we just look at the net equity. 
    // Simplified calculation: sum of all credits to Income minus sum of all debits to Expense within this fund.
    let balance = 0;
    
    const fundJournals = journals.filter(j => j.fundId === fundId && j.status === 'Posted');
    fundJournals.forEach(j => {
      j.lines.forEach(l => {
        const acc = accounts.find(a => a.id === l.accountId);
        if (acc) {
          if (acc.category === 'Income') {
             balance += (l.credit - l.debit);
          } else if (acc.category === 'Expense') {
             balance -= (l.debit - l.credit);
          }
        }
      });
    });
    
    return balance;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-600/20">
        <div className="max-w-xl">
          <h2 className="text-2xl font-bold mb-2">Fund Accounting</h2>
          <p className="text-emerald-100 text-sm">Manage restricted and unrestricted funds. Ensure compliance by tracking balances per fund separately.</p>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <button onClick={() => setShowTransferModal(true)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors flex items-center gap-2">
            <ArrowRightLeft size={16} /> Transfer Funds
          </button>
          <button className="px-4 py-2 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors">
            New Fund
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search funds..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 text-sm flex items-center gap-2">
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFunds.map((fund) => {
          const balance = calculateFundBalance(fund.id);
          return (
            <div key={fund.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col hover:border-emerald-300 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-emerald-600 flex items-center justify-center border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                  <FolderHeart size={20} />
                </div>
                <span className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-lg ${fund.isRestricted ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                  {fund.isRestricted ? 'Restricted' : 'Unrestricted'}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">{fund.name}</h3>
              <p className="text-sm font-medium text-slate-500 mb-6 flex-1 line-clamp-2">{fund.description}</p>
              
              <div className="mt-auto pt-4 border-t border-slate-100">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Net Change</span>
                  <span className={`text-xl font-black ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {balance < 0 ? '-' : ''}Le {Math.abs(balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <TransferFundsModal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} />
    </div>
  );
}
