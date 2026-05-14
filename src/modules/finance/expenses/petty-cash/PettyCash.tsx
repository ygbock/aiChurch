import React from 'react';
import { Wallet, Plus, RefreshCw } from 'lucide-react';

export default function PettyCash() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h2 className="text-lg font-bold text-slate-900">Petty Cash Accounts</h2>
           <p className="text-sm text-slate-500">Track and replenish branch and department cash reserves.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 text-sm transition-colors shadow-sm flex items-center gap-2">
            <Plus size={16} /> New Account
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-6">
               <div>
                 <h3 className="font-bold text-slate-900">Main Office Cache</h3>
                 <p className="text-xs text-slate-500">Custodian: Janet Mills</p>
               </div>
               <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                 <Wallet size={20} />
               </div>
            </div>
            
            <div className="space-y-4">
               <div>
                  <p className="text-sm text-slate-500 mb-1">Current Balance</p>
                  <p className="text-2xl font-bold text-slate-900">Le 1,250.00</p>
               </div>
               
               <div className="w-full bg-slate-100 rounded-full h-2">
                 <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '25%' }}></div>
               </div>
               <p className="text-xs text-slate-500 text-right">Limit: Le 5,000.00</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
              <button className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-xs transition-colors">
                Log Expense
              </button>
              <button className="flex-1 py-2 flex items-center justify-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg text-xs transition-colors">
                <RefreshCw size={14} /> Replenish
              </button>
            </div>
         </div>

         {/* Empty state for add new */}
         <button className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-colors p-6 min-h-[250px]">
           <Plus size={32} className="mb-2" />
           <span className="font-medium">Setup New Petty Cash</span>
         </button>
      </div>
    </div>
  );
}
