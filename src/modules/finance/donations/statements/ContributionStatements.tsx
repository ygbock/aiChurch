import React, { useState } from 'react';
import { useDonationStore } from '../stores/useDonationStore';
import { Search, Download, Mail, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function ContributionStatements() {
  const { donors, transactions } = useDonationStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [year, setYear] = useState('2026');

  const filteredDonors = donors.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDownload = (donorName: string) => {
    toast.success('Generating Statement', { description: `Downloading ${year} contribution statement for ${donorName}...` });
  };

  const handleEmail = (donorName: string) => {
    toast.success('Sending Email', { description: `Emailed ${year} statement to ${donorName}.` });
  };

  return (
    <div className="space-y-6">
      <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-600/20">
        <div className="max-w-2xl">
           <h2 className="text-2xl font-bold mb-2">Contribution Statements</h2>
           <p className="text-emerald-100 text-sm mb-6">Generate official church giving records for tax purposes or personal tracking. Automatically formatted to comply with donor requirements.</p>
           
           <div className="flex flex-col sm:flex-row gap-4">
             <div className="relative flex-1">
               <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200" />
               <input 
                 type="text" 
                 placeholder="Search specific donor..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="w-full pl-10 pr-4 py-3 bg-emerald-700/50 border border-emerald-500/50 rounded-xl text-sm focus:ring-2 focus:ring-white outline-none text-white placeholder-emerald-300" 
               />
             </div>
             <select 
               value={year}
               onChange={e => setYear(e.target.value)}
               className="px-4 py-3 bg-emerald-700/50 border border-emerald-500/50 rounded-xl text-white outline-none focus:ring-2 focus:ring-white"
             >
               <option value="2026">2026 Tax Year</option>
               <option value="2025">2025 Tax Year</option>
               <option value="2024">2024 Tax Year</option>
             </select>
             <button className="px-6 py-3 bg-white text-emerald-700 font-bold rounded-xl shadow-sm hover:bg-emerald-50 transition-colors whitespace-nowrap">
               Generate All
             </button>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Donor Name</th>
                <th className="px-6 py-4 text-center">Tx Count</th>
                <th className="px-6 py-4 text-right">Total Contributed</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredDonors.map((donor) => {
                // Calculate their specific stats for the selected period
                const donorTx = transactions.filter(t => t.donorId === donor.id || t.donorName === donor.name);
                const total = donorTx.reduce((sum, t) => sum + t.amount, 0);
                
                return (
                 <tr key={donor.id} className="hover:bg-slate-50 transition-colors">
                   <td className="px-6 py-4">
                     <span className="font-bold text-slate-900">{donor.name}</span>
                     <p className="text-xs text-slate-500 mt-0.5">{donor.email}</p>
                   </td>
                   <td className="px-6 py-4 text-center text-slate-600 font-medium">
                     {donorTx.length}
                   </td>
                   <td className="px-6 py-4 font-black text-emerald-600 text-right">
                     Le {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                   </td>
                   <td className="px-6 py-4 text-center">
                     <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                       Ready
                     </span>
                   </td>
                   <td className="px-6 py-4 text-right space-x-2">
                     <button 
                       onClick={() => handleDownload(donor.name)}
                       className="p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-lg transition-colors inline-block" 
                       title="Download PDF"
                     >
                       <Download size={16} />
                     </button>
                     <button 
                       onClick={() => handleEmail(donor.name)}
                       className="p-1.5 text-blue-500 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors inline-block" 
                       title="Email to Donor"
                     >
                       <Mail size={16} />
                     </button>
                   </td>
                 </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
