import React, { useState } from 'react';
import { FileSpreadsheet, ArrowRight, Download, Filter } from 'lucide-react';
import TrialBalanceModal from './TrialBalanceModal';
import IncomeStatementModal from './IncomeStatementModal';
import CashFlowStatementModal from './CashFlowStatementModal';
import BalanceSheetModal from './BalanceSheetModal';

export default function AccountingReports() {
  const [isTrialBalanceOpen, setIsTrialBalanceOpen] = useState(false);
  const [isIncomeStatementOpen, setIsIncomeStatementOpen] = useState(false);
  const [isCashFlowOpen, setIsCashFlowOpen] = useState(false);
  const [isBalanceSheetOpen, setIsBalanceSheetOpen] = useState(false);

  const reports = [
    { id: 'trial_balance', name: 'Trial Balance', category: 'Financial Statements', desc: 'Summary of all account balances to ensure debits equal credits.', isPremium: false },
    { id: 'balance_sheet', name: 'Balance Sheet', category: 'Financial Statements', desc: 'Assets, liabilities, and equity at a specific point in time.', isPremium: false },
    { id: 'income_statement', name: 'Income Statement', category: 'Financial Statements', desc: 'Also known as Profit & Loss. Shows revenues and expenses.', isPremium: false },
    { id: 'cash_flow', name: 'Cash Flow Statement', category: 'Financial Statements', desc: 'Operating, investing, and financing cash flows.', isPremium: true },
    { id: 'fund_balances', name: 'Fund Balances', category: 'Fund Accounting', desc: 'Detailed breakdown of restricted and unrestricted funds.', isPremium: false },
    { id: 'general_ledger', name: 'General Ledger', category: 'Ledger', desc: 'Detailed transaction history for all chart of accounts.', isPremium: false },
    { id: 'journal_register', name: 'Journal Register', category: 'Ledger', desc: 'Chronological list of all journal entries.', isPremium: false },
  ];

  const handleGenerate = (id: string) => {
    if (id === 'trial_balance') {
      setIsTrialBalanceOpen(true);
    } else if (id === 'income_statement') {
      setIsIncomeStatementOpen(true);
    } else if (id === 'cash_flow') {
      setIsCashFlowOpen(true);
    } else if (id === 'balance_sheet') {
      setIsBalanceSheetOpen(true);
    } else {
      alert(`Report ${id} not implemented yet`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
           <h2 className="text-xl font-bold flex items-center gap-2">
             <FileSpreadsheet className="text-emerald-400" />
             Report Center
           </h2>
           <p className="text-slate-400 text-sm mt-1">Generate dynamic, audit-ready financial reports.</p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-700 text-sm flex items-center gap-2 transition-colors">
              <Filter size={16} /> Global Filters
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col hover:border-emerald-300 transition-colors group cursor-pointer" onClick={() => handleGenerate(report.id)}>
            <div className="flex justify-between items-start mb-4">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{report.category}</span>
               {report.isPremium && (
                 <span className="bg-amber-100 text-amber-700 text-[10px] uppercase font-bold px-2 py-1 rounded-full">Premium</span>
               )}
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-emerald-600 transition-colors">{report.name}</h3>
            <p className="text-sm font-medium text-slate-500 mb-6 flex-1">{report.desc}</p>
            
            <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
              <button onClick={(e) => { e.stopPropagation(); handleGenerate(report.id); }} className="flex-1 px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-xl hover:bg-emerald-100 transition-colors flex justify-center items-center gap-2">
                 Generate <ArrowRight size={16} />
              </button>
              <button className="p-2 bg-slate-50 text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors" title="Export as PDF/Excel" onClick={e => e.stopPropagation()}>
                 <Download size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <TrialBalanceModal isOpen={isTrialBalanceOpen} onClose={() => setIsTrialBalanceOpen(false)} />
      <IncomeStatementModal isOpen={isIncomeStatementOpen} onClose={() => setIsIncomeStatementOpen(false)} />
      <CashFlowStatementModal isOpen={isCashFlowOpen} onClose={() => setIsCashFlowOpen(false)} />
      <BalanceSheetModal isOpen={isBalanceSheetOpen} onClose={() => setIsBalanceSheetOpen(false)} />
    </div>
  );
}
