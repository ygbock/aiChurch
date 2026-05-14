import React, { useState } from 'react';
import { Search, Filter, CheckCircle2, AlertCircle, ArrowRightLeft, FileDown, Eye, Upload, Plus } from 'lucide-react';

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'unmatched' | 'matched' | 'ignored';
  matchedJournalId?: string;
}

interface LedgerTransaction {
  id: string;
  date: string;
  description: string;
  amount: number; // positive = debit? Well, for bank, debit increases asset, credit decreases
}

export default function BankReconciliation() {
  const [activeAccount, setActiveAccount] = useState('acc-2'); // Main Bank Account
  const [statementDate, setStatementDate] = useState('2026-05-31');
  const [statementBalance, setStatementBalance] = useState(154200.00);

  const bankTransactions: BankTransaction[] = [
    { id: 'bt-1', date: '2026-05-28', description: 'Monime Transfer Payout', amount: 45200.00, status: 'unmatched' },
    { id: 'bt-2', date: '2026-05-25', description: 'Pos Terminal Deposit 004', amount: 12500.00, status: 'matched', matchedJournalId: 'JE-1025' },
    { id: 'bt-3', date: '2026-05-20', description: 'Utility Bill Payment SLWater', amount: -1500.00, status: 'unmatched' },
    { id: 'bt-4', date: '2026-05-18', description: 'Cheque Deposit #88921', amount: 50000.00, status: 'unmatched' },
    { id: 'bt-5', date: '2026-05-15', description: 'Payroll Transfer May', amount: -85000.00, status: 'matched', matchedJournalId: 'JE-PAY-XYZ' },
  ];

  const ledgerTransactions: LedgerTransaction[] = [
    { id: 'JE-1028', date: '2026-05-28', description: 'Monime Weekly Settlement', amount: 45200.00 },
    { id: 'JE-1027', date: '2026-05-20', description: 'Water Bill - May', amount: -1500.00 },
    { id: 'JE-1026', date: '2026-05-18', description: 'Building Fund Cheque', amount: 50000.00 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="text-emerald-400" />
            Bank Reconciliation
          </h2>
          <p className="text-slate-400 text-sm mt-1">Match bank statement lines with general ledger transactions.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 text-sm transition-colors flex items-center gap-2">
            <Upload size={16} /> Upload Statement
          </button>
          <button className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 text-sm transition-colors flex items-center gap-2">
            Finish Reconciliation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-widest text-xs">Reconciliation Setup</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account</label>
                <select 
                  value={activeAccount} 
                  onChange={(e) => setActiveAccount(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="acc-2">Main Bank Account (...5421)</option>
                  <option value="acc-3">Mobile Money Holding (...9090)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Statement Date</label>
                <input 
                  type="date" 
                  value={statementDate} 
                  onChange={(e) => setStatementDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Statement Ending Balance</label>
                <input 
                  type="number" 
                  value={statementBalance} 
                  onChange={(e) => setStatementBalance(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Statement Balance:</span>
                <span className="font-mono font-bold text-slate-900">{statementBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Cleared Balance:</span>
                <span className="font-mono font-bold text-slate-900">-97,500.00</span>
              </div>
              <div className="flex justify-between font-bold pt-3 border-t border-slate-100">
                <span className="text-slate-900">Difference:</span>
                <span className="font-mono text-rose-600">56,700.00</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
             <div className="flex bg-slate-50 border-b border-slate-100">
               <div className="flex-1 p-4 border-r border-slate-100 font-bold text-slate-700 text-sm flex items-center justify-between">
                 Bank Statement Lines
                 <span className="bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded text-xs font-mono">3 Unmatched</span>
               </div>
               <div className="flex-1 p-4 font-bold text-slate-700 text-sm flex items-center justify-between">
                 Ledger Transactions
                 <Filter size={16} className="text-slate-400" />
               </div>
             </div>

             <div className="flex flex-1 overflow-hidden">
                {/* Bank Statement Column */}
                <div className="flex-1 overflow-y-auto border-r border-slate-100 p-2 space-y-2">
                   {bankTransactions.map(bt => (
                     <div key={bt.id} className={`p-3 rounded-xl border flex flex-col transition-colors ${bt.status === 'matched' ? 'bg-emerald-50 border-emerald-100 opacity-70' : 'bg-white border-slate-200 hover:border-emerald-300 cursor-pointer shadow-sm'}`}>
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{bt.date}</span>
                           <span className={`font-mono font-bold text-sm ${bt.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{bt.amount > 0 ? '+' : ''}{bt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="text-sm font-medium text-slate-800 line-clamp-1">{bt.description}</div>
                        {bt.status === 'matched' && (
                          <div className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 size={14} /> Matched with {bt.matchedJournalId}
                          </div>
                        )}
                        {bt.status === 'unmatched' && (
                          <div className="mt-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <button className="text-xs text-emerald-600 font-bold hover:underline">Find Match</button>
                             <button className="text-xs text-slate-400 hover:text-slate-600 font-medium">Create Rule</button>
                          </div>
                        )}
                     </div>
                   ))}
                </div>

                {/* Ledger Column */}
                <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50 space-y-2">
                   {ledgerTransactions.map(lt => (
                     <div key={lt.id} className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 cursor-pointer shadow-sm transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{lt.date}</span>
                              <span className="text-xs text-slate-500 font-mono">{lt.id}</span>
                           </div>
                           <span className={`font-mono font-bold text-sm ${lt.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{lt.amount > 0 ? '+' : ''}{lt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="text-sm font-medium text-slate-800 line-clamp-1 flex-1">{lt.description}</div>
                        <div className="hidden group-hover:flex mt-2 text-xs text-emerald-600 font-bold">
                           Click to match
                        </div>
                     </div>
                   ))}
                   
                   <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center flex flex-col items-center justify-center text-slate-500 mt-4 bg-slate-50">
                      <div className="p-2 bg-slate-100 rounded-full mb-2">
                         <Plus size={20} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-medium">No matching transaction?</p>
                      <button className="text-emerald-600 font-bold text-sm mt-1 hover:underline">Create Journal Entry</button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
