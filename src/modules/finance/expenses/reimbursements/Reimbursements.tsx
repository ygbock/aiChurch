import React, { useState } from 'react';
import { Receipt, Plus, Download, Scan } from 'lucide-react';
import ScanReceiptModal, { ExtractedData } from '../components/ScanReceiptModal';

export default function Reimbursements() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleScanComplete = (data: ExtractedData) => {
    console.log('Scanned data:', data);
    alert(`Successfully extracted receipt for Le ${data.amount.toLocaleString()}. Ready to pre-fill reimbursement claim.`);
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h2 className="text-lg font-bold text-slate-900">Reimbursements</h2>
           <p className="text-sm text-slate-500">Manage out-of-pocket expenses for staff and volunteers.</p>
        </div>
        <div className="flex gap-3">
          <button 
             onClick={() => setIsScannerOpen(true)}
             className="px-4 py-2 border border-indigo-200 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 text-sm transition-colors flex items-center gap-2"
          >
            <Scan size={16} /> Scan Receipt
          </button>
          <button className="px-4 py-2 border border-slate-300 bg-white text-slate-700 font-medium rounded-lg hover:bg-slate-50 text-sm transition-colors flex items-center gap-2">
            <Download size={16} /> Export
          </button>
          <button className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 text-sm transition-colors shadow-sm flex items-center gap-2">
            <Plus size={16} /> New Claim
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Claimant</th>
              <th className="px-6 py-4">Reason</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
             <tr>
               <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                 <Receipt size={32} className="mx-auto mb-3 text-slate-300" />
                 <p>No reimbursement claims pending.</p>
               </td>
             </tr>
          </tbody>
        </table>
      </div>

      <ScanReceiptModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onComplete={handleScanComplete}
      />
    </div>
  );
}
