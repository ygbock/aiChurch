import React, { useState } from 'react';
import { useDonationStore } from '../stores/useDonationStore';
import { Search, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function PledgeManagement() {
  const { pledges, recordPledgePayment } = useDonationStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPledges = pledges.filter(p => 
    p.donorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.campaignName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePay = (id: string, remaining: number) => {
    // In a real app we would open a payment modal here
    const payment = Math.min(1000, remaining);
    recordPledgePayment(id, payment);
    toast.success('Pledge Payment Recorded', { description: `Recorded Le ${payment} towards pledge.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search donors or campaigns..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 text-sm flex items-center gap-2 shadow-sm">
            <Plus size={16} /> New Pledge
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPledges.map((pledge) => {
           const percent = Math.round((pledge.totalPaid / pledge.totalPledged) * 100);
           return (
             <div key={pledge.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
               <div className="flex justify-between items-start mb-4">
                 <div>
                   <h3 className="font-bold text-slate-900 text-lg mb-1">{pledge.campaignName}</h3>
                   <span className="text-sm font-medium text-slate-500">Pledged by {pledge.donorName}</span>
                 </div>
                 <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                    pledge.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                    pledge.status === 'Active' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                 }`}>
                   {pledge.status}
                 </span>
               </div>
               
               <div className="mt-4 space-y-3 flex-1">
                 <div className="flex justify-between text-sm items-end">
                   <div className="flex flex-col">
                      <span className="text-xs text-slate-500">Paid</span>
                      <span className="font-bold text-emerald-600 leading-none">{pledge.currency} {pledge.totalPaid.toLocaleString()}</span>
                   </div>
                   <div className="flex flex-col text-right">
                      <span className="text-xs text-slate-500">Total</span>
                      <span className="font-bold text-slate-700 leading-none">{pledge.currency} {pledge.totalPledged.toLocaleString()}</span>
                   </div>
                 </div>
                 <div className="flex justify-between text-sm items-end mb-1">
                    <span className="font-bold text-slate-500">{percent}% Completed</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                   <div className={`h-2.5 rounded-full ${percent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'} transition-all`} style={{ width: `${percent}%` }}></div>
                 </div>
               </div>

               <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                 <span className="text-xs text-slate-500">Due: {new Date(pledge.dueDate).toLocaleDateString()}</span>
                 {pledge.status !== 'Completed' && (
                    <button 
                      onClick={() => handlePay(pledge.id, pledge.totalPledged - pledge.totalPaid)}
                      className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-sm hover:bg-emerald-100 transition-colors"
                    >
                      Record Payment
                    </button>
                 )}
               </div>
             </div>
           )
        })}
      </div>
    </div>
  );
}
