import React, { useState } from 'react';
import { Search, Filter, Book, Download } from 'lucide-react';
import { useAccountingStore } from '../store/accountingStore';

export default function GeneralLedger() {
  const accounts = useAccountingStore(state => state.accounts);
  const journals = useAccountingStore(state => state.journals);
  const [selectedAccount, setSelectedAccount] = useState<string>(accounts[0]?.id || '');

  // Calculate ledger entries for selected account
  const ledgerEntries = journals
    .filter(j => j.status === 'Posted')
    .flatMap(j => {
      const line = j.lines.find(l => l.accountId === selectedAccount);
      if (line) {
        return [{
          date: j.entryDate,
          id: j.id,
          description: j.description,
          debit: line.debit,
          credit: line.credit
        }];
      }
      return [];
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = 0;
  const currentAcc = accounts.find(a => a.id === selectedAccount);
  const isDebitNormal = currentAcc?.category === 'Asset' || currentAcc?.category === 'Expense';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex-1 max-w-sm">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Account</label>
          <select 
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 text-sm flex items-center gap-2">
            <Filter size={16} /> Date Range
          </button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 text-sm flex items-center gap-2">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Book size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{currentAcc?.name} Ledger</h3>
              <p className="text-xs text-slate-500 font-mono">Account {currentAcc?.code} &bull; {currentAcc?.category}</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">JE#</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Debit</th>
                <th className="px-6 py-4 text-right">Credit</th>
                <th className="px-6 py-4 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              <tr className="bg-slate-50">
                <td className="px-6 py-3 font-medium text-slate-500" colSpan={3}>Opening Balance</td>
                <td className="px-6 py-3 text-right text-slate-400">-</td>
                <td className="px-6 py-3 text-right text-slate-400">-</td>
                <td className="px-6 py-3 font-mono font-bold text-slate-900 text-right">0.00</td>
              </tr>
              {ledgerEntries.map((line, i) => {
                if (isDebitNormal) {
                  runningBalance += line.debit - line.credit;
                } else {
                  runningBalance += line.credit - line.debit;
                }
                
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600">{line.date}</td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-emerald-600 hover:underline cursor-pointer">{line.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{line.description}</td>
                    <td className="px-6 py-4 font-mono text-slate-600 text-right">{line.debit > 0 ? line.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                    <td className="px-6 py-4 font-mono text-slate-600 text-right">{line.credit > 0 ? line.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 text-right">{runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
              {ledgerEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No transactions found for this account.
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
