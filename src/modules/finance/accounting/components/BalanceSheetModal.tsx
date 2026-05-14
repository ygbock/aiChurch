import React, { useState } from 'react';
import { X, Download, Printer } from 'lucide-react';
import { useAccountingStore } from '../store/accountingStore';
import { exportToCSV } from '../utils/exportUtils';

interface BalanceSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BalanceSheetModal({ isOpen, onClose }: BalanceSheetModalProps) {
  const accounts = useAccountingStore(state => state.accounts);
  const journals = useAccountingStore(state => state.journals);
  const funds = useAccountingStore(state => state.funds);

  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterFund, setFilterFund] = useState('');

  if (!isOpen) return null;

  const validJournals = journals.filter(j => 
    j.status === 'Posted' && 
    j.entryDate <= asOfDate &&
    (filterFund ? j.fundId === filterFund : true)
  );

  const assetBalances: Record<string, number> = {};
  const liabilityBalances: Record<string, number> = {};
  const equityBalances: Record<string, number> = {};
  let retainedEarningsAdjustment = 0; // Net Income flows into retained earnings

  accounts.forEach(acc => {
    if (acc.category === 'Asset') assetBalances[acc.id] = 0;
    if (acc.category === 'Liability') liabilityBalances[acc.id] = 0;
    if (acc.category === 'Equity') equityBalances[acc.id] = 0;
  });

  validJournals.forEach(j => {
    j.lines.forEach(l => {
      const acc = accounts.find(a => a.id === l.accountId);
      if (acc) {
        if (acc.category === 'Asset') {
          assetBalances[acc.id] += (l.debit - l.credit);
        } else if (acc.category === 'Liability') {
          liabilityBalances[acc.id] += (l.credit - l.debit);
        } else if (acc.category === 'Equity') {
          equityBalances[acc.id] += (l.credit - l.debit);
        } else if (acc.category === 'Income') {
          retainedEarningsAdjustment += (l.credit - l.debit);
        } else if (acc.category === 'Expense') {
          retainedEarningsAdjustment -= (l.debit - l.credit);
        }
      }
    });
  });

  const assetsList = accounts
    .filter(a => a.category === 'Asset' && assetBalances[a.id] !== 0)
    .map(a => ({ ...a, balance: assetBalances[a.id] }));
  
  const liabilitiesList = accounts
    .filter(a => a.category === 'Liability' && liabilityBalances[a.id] !== 0)
    .map(a => ({ ...a, balance: liabilityBalances[a.id] }));

  const equityList = accounts
    .filter(a => a.category === 'Equity')
    .map(a => ({ ...a, balance: equityBalances[a.id] }));

  // Add retained earnings adjustment to general equity list or a virtual account if needed
  if (retainedEarningsAdjustment !== 0) {
    equityList.push({
      id: 'retained-earnings-virtual',
      code: '—',
      name: 'Net Income (Current Period)',
      category: 'Equity',
      isActive: true,
      balance: retainedEarningsAdjustment,
      branchId: ''
    });
  }

  const totalAssets = assetsList.reduce((sum, item) => sum + item.balance, 0);
  const totalLiabilities = liabilitiesList.reduce((sum, item) => sum + item.balance, 0);
  const totalEquity = equityList.reduce((sum, item) => sum + item.balance, 0);

  const handleExport = () => {
    const headers = ['Category', 'Account Code', 'Account Name', 'Balance'];
    const data: any[][] = [];
    
    data.push(['Assets', '', '', '']);
    assetsList.forEach(a => data.push(['', a.code, a.name, a.balance.toFixed(2)]));
    data.push(['Total Assets', '', '', totalAssets.toFixed(2)]);
    
    data.push(['', '', '', '']);
    
    data.push(['Liabilities', '', '', '']);
    liabilitiesList.forEach(a => data.push(['', a.code, a.name, a.balance.toFixed(2)]));
    data.push(['Total Liabilities', '', '', totalLiabilities.toFixed(2)]);
    
    data.push(['', '', '', '']);
    
    data.push(['Equity', '', '', '']);
    equityList.forEach(a => data.push(['', a.code !== '—' ? a.code : '', a.name, a.balance.toFixed(2)]));
    data.push(['Total Equity', '', '', totalEquity.toFixed(2)]);
    
    data.push(['', '', '', '']);
    data.push(['Total Liabilities & Equity', '', '', (totalLiabilities + totalEquity).toFixed(2)]);
    
    exportToCSV(`Balance_Sheet_${asOfDate}`, headers, data);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Balance Sheet</h2>
            <p className="text-sm text-slate-500">As of {new Date(asOfDate).toLocaleDateString()}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-4">
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">As Of Date</label>
             <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm" />
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
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Balance Sheet</h1>
                <p className="text-slate-500 font-medium">As of {new Date(asOfDate).toLocaleDateString()}</p>
             </div>

             <div className="space-y-10">
                {/* Assets */}
                <div>
                   <h3 className="font-bold text-slate-900 uppercase tracking-widest text-sm mb-3 border-b-2 border-emerald-500 pb-1 inline-block">Assets</h3>
                   <div className="space-y-2">
                      {assetsList.map(acc => (
                         <div key={acc.id} className="flex justify-between text-slate-700">
                            <span className="font-medium">{acc.name} <span className="text-xs text-slate-400 ml-2">{acc.code}</span></span>
                            <span className="font-mono">{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                         </div>
                      ))}
                      {assetsList.length === 0 && (
                         <div className="text-slate-400 italic text-sm">No assets recorded.</div>
                      )}
                   </div>
                   <div className="flex justify-between font-bold text-slate-900 mt-4 pt-4 border-t border-slate-200 bg-emerald-50 p-2 rounded-lg">
                      <span className="uppercase tracking-widest text-sm">Total Assets</span>
                      <span className="font-mono text-lg">{totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                   </div>
                </div>

                {/* Liabilities */}
                <div>
                   <h3 className="font-bold text-slate-900 uppercase tracking-widest text-sm mb-3 border-b-2 border-rose-500 pb-1 inline-block">Liabilities</h3>
                   <div className="space-y-2">
                      {liabilitiesList.map(acc => (
                         <div key={acc.id} className="flex justify-between text-slate-700">
                            <span className="font-medium">{acc.name} <span className="text-xs text-slate-400 ml-2">{acc.code}</span></span>
                            <span className="font-mono">{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                         </div>
                      ))}
                      {liabilitiesList.length === 0 && (
                         <div className="text-slate-400 italic text-sm">No liabilities recorded.</div>
                      )}
                   </div>
                   <div className="flex justify-between font-bold text-slate-900 mt-4 pt-4 border-t border-slate-200 bg-slate-50 p-2 rounded-lg">
                      <span>Total Liabilities</span>
                      <span className="font-mono">{totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                   </div>
                </div>

                {/* Equity */}
                <div>
                   <h3 className="font-bold text-slate-900 uppercase tracking-widest text-sm mb-3 border-b-2 border-amber-500 pb-1 inline-block">Equity</h3>
                   <div className="space-y-2">
                      {equityList.filter(e => e.balance !== 0).map(acc => (
                         <div key={acc.id} className="flex justify-between text-slate-700">
                            <span className="font-medium">{acc.name} <span className="text-xs text-slate-400 ml-2">{acc.code !== '—' && acc.code}</span></span>
                            <span className="font-mono">{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                         </div>
                      ))}
                      {equityList.length === 0 && (
                         <div className="text-slate-400 italic text-sm">No equity recorded.</div>
                      )}
                   </div>
                   <div className="flex justify-between font-bold text-slate-900 mt-4 pt-4 border-t border-slate-200 bg-slate-50 p-2 rounded-lg">
                      <span>Total Equity</span>
                      <span className="font-mono">{totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                   </div>
                </div>

                {/* Total Liabilities & Equity */}
                <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl shadow-inner mt-8">
                   <span className="font-bold uppercase tracking-widest text-sm">Total Liabilities & Equity</span>
                   <span className="font-mono font-black text-xl">{(totalLiabilities + totalEquity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                {Math.abs(totalAssets - (totalLiabilities + totalEquity)) > 0.01 && (
                  <div className="p-4 bg-rose-50 text-rose-700 font-bold text-sm text-center border border-rose-200 rounded-xl">
                    Warning: Balance Sheet is out of balance by {Math.abs(totalAssets - (totalLiabilities + totalEquity)).toLocaleString(undefined, { minimumFractionDigits: 2 })}.
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
