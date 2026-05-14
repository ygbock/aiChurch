import React, { useState } from 'react';
import { X, Download, Printer } from 'lucide-react';
import { useAccountingStore } from '../store/accountingStore';
import { exportToCSV } from '../utils/exportUtils';

interface IncomeStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IncomeStatementModal({ isOpen, onClose }: IncomeStatementModalProps) {
  const accounts = useAccountingStore(state => state.accounts);
  const journals = useAccountingStore(state => state.journals);
  const funds = useAccountingStore(state => state.funds);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterFund, setFilterFund] = useState('');

  if (!isOpen) return null;

  const validJournals = journals.filter(j => 
    j.status === 'Posted' && 
    j.entryDate >= startDate &&
    j.entryDate <= endDate &&
    (filterFund ? j.fundId === filterFund : true)
  );

  let totalIncome = 0;
  let totalExpense = 0;

  const incomeBalances: Record<string, number> = {};
  const expenseBalances: Record<string, number> = {};

  accounts.forEach(acc => {
    if (acc.category === 'Income') incomeBalances[acc.id] = 0;
    if (acc.category === 'Expense') expenseBalances[acc.id] = 0;
  });

  validJournals.forEach(j => {
    j.lines.forEach(l => {
      const acc = accounts.find(a => a.id === l.accountId);
      if (acc) {
        if (acc.category === 'Income') {
          // Income is normally credit
          incomeBalances[acc.id] += (l.credit - l.debit);
        } else if (acc.category === 'Expense') {
          // Expense is normally debit
          expenseBalances[acc.id] += (l.debit - l.credit);
        }
      }
    });
  });

  const incomeAccountsList = accounts
    .filter(a => a.category === 'Income' && incomeBalances[a.id] !== 0)
    .map(a => ({ ...a, balance: incomeBalances[a.id] }));
  
  const expenseAccountsList = accounts
    .filter(a => a.category === 'Expense' && expenseBalances[a.id] !== 0)
    .map(a => ({ ...a, balance: expenseBalances[a.id] }));

  incomeAccountsList.forEach(a => totalIncome += a.balance);
  expenseAccountsList.forEach(a => totalExpense += a.balance);

  const netIncome = totalIncome - totalExpense;

  const handleExport = () => {
    const headers = ['Category', 'Account Name', 'Balance'];
    const data: any[][] = [];
    
    data.push(['Revenue', '', '']);
    incomeAccountsList.forEach(a => data.push(['', a.name, a.balance.toFixed(2)]));
    data.push(['Total Revenue', '', totalIncome.toFixed(2)]);
    
    data.push(['', '', '']);
    
    data.push(['Expenses', '', '']);
    expenseAccountsList.forEach(a => data.push(['', a.name, a.balance.toFixed(2)]));
    data.push(['Total Expenses', '', totalExpense.toFixed(2)]);
    
    data.push(['', '', '']);
    
    data.push(['Net Surplus / Deficit', '', netIncome.toFixed(2)]);
    
    exportToCSV(`Income_Statement_${endDate}`, headers, data);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Income Statement</h2>
            <p className="text-sm text-slate-500">For the period {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-4">
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
             <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm" />
           </div>
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Date</label>
             <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm" />
           </div>
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Filter by Fund</label>
             <select value={filterFund} onChange={e => setFilterFund(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm min-w-[200px]">
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

        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50/50">
          <div className="max-w-3xl mx-auto bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden p-8">
             <div className="text-center mb-8 border-b border-slate-200 pb-6">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Income Statement</h1>
                <p className="text-slate-500 font-medium">{new Date(startDate).toLocaleDateString()} &mdash; {new Date(endDate).toLocaleDateString()}</p>
             </div>

             <div className="space-y-8">
                {/* Revenue */}
                <div>
                   <h3 className="font-bold text-slate-900 uppercase tracking-widest text-sm mb-3 border-b-2 border-emerald-500 pb-1 inline-block">Revenue</h3>
                   <div className="space-y-2">
                      {incomeAccountsList.map(acc => (
                         <div key={acc.id} className="flex justify-between text-slate-700">
                            <span className="font-medium">{acc.name}</span>
                            <span className="font-mono">{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                         </div>
                      ))}
                      {incomeAccountsList.length === 0 && (
                         <div className="text-slate-400 italic text-sm">No revenue recorded in this period.</div>
                      )}
                   </div>
                   <div className="flex justify-between font-bold text-slate-900 mt-4 pt-4 border-t border-slate-200 bg-slate-50 p-2 rounded-lg">
                      <span>Total Revenue</span>
                      <span className="font-mono">{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                   </div>
                </div>

                {/* Expenses */}
                <div>
                   <h3 className="font-bold text-slate-900 uppercase tracking-widest text-sm mb-3 border-b-2 border-rose-500 pb-1 inline-block">Expenses</h3>
                   <div className="space-y-2">
                      {expenseAccountsList.map(acc => (
                         <div key={acc.id} className="flex justify-between text-slate-700">
                            <span className="font-medium">{acc.name}</span>
                            <span className="font-mono">{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                         </div>
                      ))}
                      {expenseAccountsList.length === 0 && (
                         <div className="text-slate-400 italic text-sm">No expenses recorded in this period.</div>
                      )}
                   </div>
                   <div className="flex justify-between font-bold text-slate-900 mt-4 pt-4 border-t border-slate-200 bg-slate-50 p-2 rounded-lg">
                      <span>Total Expenses</span>
                      <span className="font-mono">{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                   </div>
                </div>

                {/* Net Income */}
                <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl shadow-inner mt-8">
                   <span className="font-bold uppercase tracking-widest">Net Surplus / Deficit</span>
                   <span className="font-mono font-black text-xl">{netIncome < 0 ? '-' : ''}Le {Math.abs(netIncome).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
