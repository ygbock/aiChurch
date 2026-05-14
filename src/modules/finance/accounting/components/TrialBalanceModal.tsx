import React, { useState } from 'react';
import { X, Download, Printer } from 'lucide-react';
import { useAccountingStore } from '../store/accountingStore';
import { exportToCSV } from '../utils/exportUtils';

interface TrialBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TrialBalanceModal({ isOpen, onClose }: TrialBalanceModalProps) {
  const accounts = useAccountingStore(state => state.accounts);
  const journals = useAccountingStore(state => state.journals);
  const funds = useAccountingStore(state => state.funds);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterFund, setFilterFund] = useState('');

  if (!isOpen) return null;

  let totalDebit = 0;
  let totalCredit = 0;

  const validJournals = journals.filter(j => 
    j.status === 'Posted' && 
    j.entryDate <= date &&
    (filterFund ? j.fundId === filterFund : true)
  );

  const balances = accounts.map(acc => {
    let debit = 0;
    let credit = 0;

    validJournals.forEach(j => {
      j.lines.forEach(l => {
        if (l.accountId === acc.id) {
          debit += l.debit;
          credit += l.credit;
        }
      });
    });

    const isDebitNormal = acc.category === 'Asset' || acc.category === 'Expense';
    let netDebit = 0;
    let netCredit = 0;

    if (isDebitNormal) {
      const net = debit - credit;
      if (net >= 0) netDebit = net;
      else netCredit = Math.abs(net);
    } else {
      const net = credit - debit;
      if (net >= 0) netCredit = net;
      else netDebit = Math.abs(net);
    }

    return { ...acc, debit: netDebit, credit: netCredit };
  }).filter(b => b.debit !== 0 || b.credit !== 0);

  balances.forEach(b => {
    totalDebit += b.debit;
    totalCredit += b.credit;
  });

  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleExport = () => {
    const headers = ['Account Code', 'Account Name', 'Debit', 'Credit'];
    const data = balances.map(b => [
      b.code,
      b.name,
      b.debit > 0 ? b.debit.toFixed(2) : '0.00',
      b.credit > 0 ? b.credit.toFixed(2) : '0.00'
    ]);
    data.push(['Total', '', totalDebit.toFixed(2), totalCredit.toFixed(2)]);
    exportToCSV(`Trial_Balance_${date}`, headers, data);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Trial Balance</h2>
            <p className="text-sm text-slate-500">As of {new Date(date).toLocaleDateString()}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 bg-slate-50 flex gap-4">
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">As Of Date</label>
             <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm" />
           </div>
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Filter by Fund</label>
             <select value={filterFund} onChange={e => setFilterFund(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm">
               <option value="">All Funds</option>
               {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
             </select>
           </div>
           <div className="flex-1 flex justify-end items-end gap-2">
             <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 text-sm flex items-center gap-2">
               <Printer size={16} /> Print
             </button>
             <button onClick={handleExport} className="px-3 py-1.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 text-sm flex items-center gap-2">
               <Download size={16} /> Export Excel
             </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold tracking-widest sticky top-0 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-32">Acct Code</th>
                <th className="px-6 py-4">Account Name</th>
                <th className="px-6 py-4 w-40 text-right">Debit</th>
                <th className="px-6 py-4 w-40 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {balances.map(b => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-mono text-slate-500">{b.code}</td>
                  <td className="px-6 py-3 font-bold text-slate-900">{b.name}</td>
                  <td className="px-6 py-3 font-mono text-slate-900 text-right">{b.debit > 0 ? b.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                  <td className="px-6 py-3 font-mono text-slate-900 text-right">{b.credit > 0 ? b.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                </tr>
              ))}
              {balances.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No account balances found for the selected criteria.</td></tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50 sticky bottom-0 border-t-2 border-slate-200">
               <tr>
                  <td colSpan={2} className="px-6 py-4 text-right font-bold text-slate-900 uppercase tracking-widest text-xs">Total</td>
                  <td className="px-6 py-4 font-mono font-black text-slate-900 text-right border-double border-b-4 border-slate-300">
                    {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 font-mono font-black text-slate-900 text-right border-double border-b-4 border-slate-300">
                    {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
               </tr>
            </tfoot>
          </table>
        </div>
        {!isBalanced && (
          <div className="p-4 bg-rose-50 text-rose-700 font-bold text-sm text-center border-t border-rose-200">
            Warning: The Trial Balance is out of balance by {Math.abs(totalDebit - totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}.
          </div>
        )}
      </div>
    </div>
  );
}
