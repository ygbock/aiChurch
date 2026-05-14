import React, { useState } from 'react';
import { X, Download, Printer } from 'lucide-react';
import { useAccountingStore } from '../store/accountingStore';
import { exportToCSV } from '../utils/exportUtils';

interface CashFlowStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CashFlowStatementModal({ isOpen, onClose }: CashFlowStatementModalProps) {
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

  // Identify Cash accounts (Category 'Asset' and typically name contains Cash or Bank or Mobile Money)
  // For simplicity, we'll assume short term liquid assets with codes starting with 10 or 11 or 12 are Cash
  // or explicitly check name.
  const cashAccounts = accounts.filter(a => a.category === 'Asset' && (a.name.toLowerCase().includes('cash') || a.name.toLowerCase().includes('bank') || a.name.toLowerCase().includes('money') || a.name.toLowerCase().includes('wallet')));
  const cashAccountIds = new Set(cashAccounts.map(a => a.id));

  // Cash flows
  let operatingOperatingInflow = 0;
  let operatingOperatingOutflow = 0;
  let investingInflow = 0;
  let investingOutflow = 0;
  let financingInflow = 0;
  let financingOutflow = 0;

  validJournals.forEach(j => {
    // Check if journal hits a cash account
    const hitsCash = j.lines.some(l => cashAccountIds.has(l.accountId));
    if (!hitsCash) return; // Non-cash transaction

    let netCashChange = 0;
    
    // Calculate net cash change in this journal
    j.lines.forEach(l => {
      if (cashAccountIds.has(l.accountId)) {
        netCashChange += (l.debit - l.credit); // debit increases cash, credit decreases
      }
    });

    if (netCashChange === 0) return;

    // Identify offsetting accounts to categorize the cash flow
    const nonCashLines = j.lines.filter(l => !cashAccountIds.has(l.accountId));
    
    // Simplistic heuristic for cash flow categorization:
    // Income / Expense -> Operating
    // Other Assets -> Investing
    // Liability / Equity -> Financing
    let category: 'Operating' | 'Investing' | 'Financing' | 'Unknown' = 'Unknown';
    if (nonCashLines.length > 0) {
      // just pick the category of the largest offsetting line
      const largestOffset = [...nonCashLines].sort((a,b) => Math.abs(b.debit - b.credit) - Math.abs(a.debit - a.credit))[0];
      const acc = accounts.find(a => a.id === largestOffset.accountId);
      if (acc) {
        if (acc.category === 'Income' || acc.category === 'Expense') category = 'Operating';
        else if (acc.category === 'Asset') category = 'Investing';
        else category = 'Financing';
      }
    }

    if (netCashChange > 0) {
      if (category === 'Operating') operatingOperatingInflow += netCashChange;
      else if (category === 'Investing') investingInflow += netCashChange;
      else financingInflow += netCashChange;
    } else {
      if (category === 'Operating') operatingOperatingOutflow += Math.abs(netCashChange);
      else if (category === 'Investing') investingOutflow += Math.abs(netCashChange);
      else financingOutflow += Math.abs(netCashChange);
    }
  });

  const netOperating = operatingOperatingInflow - operatingOperatingOutflow;
  const netInvesting = investingInflow - investingOutflow;
  const netFinancing = financingInflow - financingOutflow;
  const netCashFlow = netOperating + netInvesting + netFinancing;

  const handleExport = () => {
    const headers = ['Category', 'Item', 'Amount'];
    const data: any[][] = [];

    data.push(['Operating Activities', '', '']);
    data.push(['', 'Cash from Operations', operatingOperatingInflow.toFixed(2)]);
    data.push(['', 'Cash paid for Operations', `(${operatingOperatingOutflow.toFixed(2)})`]);
    data.push(['Net Cash from Operating Activities', '', netOperating.toFixed(2)]);

    data.push(['', '', '']);
    data.push(['Investing Activities', '', '']);
    data.push(['', 'Cash from Investing', investingInflow.toFixed(2)]);
    data.push(['', 'Cash paid for Investing', `(${investingOutflow.toFixed(2)})`]);
    data.push(['Net Cash from Investing Activities', '', netInvesting.toFixed(2)]);

    data.push(['', '', '']);
    data.push(['Financing Activities', '', '']);
    data.push(['', 'Cash from Financing', financingInflow.toFixed(2)]);
    data.push(['', 'Cash paid for Financing', `(${financingOutflow.toFixed(2)})`]);
    data.push(['Net Cash from Financing Activities', '', netFinancing.toFixed(2)]);

    data.push(['', '', '']);
    data.push(['Net Increase (Decrease) in Cash', '', netCashFlow.toFixed(2)]);

    exportToCSV(`Cash_Flow_${endDate}`, headers, data);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Cash Flow Statement</h2>
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
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Statement of Cash Flows</h1>
                <p className="text-slate-500 font-medium">{new Date(startDate).toLocaleDateString()} &mdash; {new Date(endDate).toLocaleDateString()}</p>
             </div>

             <div className="space-y-8">
                {/* Operating Activities */}
                <div>
                   <h3 className="font-bold text-slate-900 uppercase tracking-widest text-sm mb-3 border-b-2 border-emerald-500 pb-1 inline-block">Operating Activities</h3>
                   <div className="space-y-2">
                      <div className="flex justify-between text-slate-700">
                         <span className="font-medium">Cash from Operations</span>
                         <span className="font-mono">{operatingOperatingInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                         <span className="font-medium">Cash paid for Operations</span>
                         <span className="font-mono">({operatingOperatingOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                      </div>
                   </div>
                   <div className="flex justify-between font-bold text-slate-900 mt-4 pt-4 border-t border-slate-200 bg-slate-50 p-2 rounded-lg">
                      <span>Net Cash from Operating Activities</span>
                      <span className="font-mono">{netOperating < 0 ? '(' : ''}{Math.abs(netOperating).toLocaleString(undefined, { minimumFractionDigits: 2 })}{netOperating < 0 ? ')' : ''}</span>
                   </div>
                </div>

                {/* Investing Activities */}
                <div>
                   <h3 className="font-bold text-slate-900 uppercase tracking-widest text-sm mb-3 border-b-2 border-blue-500 pb-1 inline-block">Investing Activities</h3>
                   <div className="space-y-2">
                      <div className="flex justify-between text-slate-700">
                         <span className="font-medium">Cash from Investing</span>
                         <span className="font-mono">{investingInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                         <span className="font-medium">Cash paid for Investing</span>
                         <span className="font-mono">({investingOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                      </div>
                   </div>
                   <div className="flex justify-between font-bold text-slate-900 mt-4 pt-4 border-t border-slate-200 bg-slate-50 p-2 rounded-lg">
                      <span>Net Cash from Investing Activities</span>
                      <span className="font-mono">{netInvesting < 0 ? '(' : ''}{Math.abs(netInvesting).toLocaleString(undefined, { minimumFractionDigits: 2 })}{netInvesting < 0 ? ')' : ''}</span>
                   </div>
                </div>

                {/* Financing Activities */}
                <div>
                   <h3 className="font-bold text-slate-900 uppercase tracking-widest text-sm mb-3 border-b-2 border-amber-500 pb-1 inline-block">Financing Activities</h3>
                   <div className="space-y-2">
                      <div className="flex justify-between text-slate-700">
                         <span className="font-medium">Cash from Financing</span>
                         <span className="font-mono">{financingInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                         <span className="font-medium">Cash paid for Financing</span>
                         <span className="font-mono">({financingOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                      </div>
                   </div>
                   <div className="flex justify-between font-bold text-slate-900 mt-4 pt-4 border-t border-slate-200 bg-slate-50 p-2 rounded-lg">
                      <span>Net Cash from Financing Activities</span>
                      <span className="font-mono">{netFinancing < 0 ? '(' : ''}{Math.abs(netFinancing).toLocaleString(undefined, { minimumFractionDigits: 2 })}{netFinancing < 0 ? ')' : ''}</span>
                   </div>
                </div>

                {/* Net Cash Flow */}
                <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl shadow-inner mt-8">
                   <span className="font-bold uppercase tracking-widest text-sm">Net Increase (Decrease) in Cash</span>
                   <span className="font-mono font-black text-xl">{netCashFlow < 0 ? '-' : ''}Le {Math.abs(netCashFlow).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
