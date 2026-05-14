import React, { useState } from 'react';
import { useExpenseStore } from '../stores/expenseStore';
import { Search, Plus, MoreVertical, Building2, Phone, Mail } from 'lucide-react';

export default function VendorManagement() {
  const { vendors } = useExpenseStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search vendors..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-white w-full sm:w-64"
          />
        </div>
        <button className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 text-sm transition-colors shadow-sm flex items-center gap-2">
          <Plus size={16} /> Add Vendor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map(vendor => (
          <div key={vendor.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
             <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{vendor.name}</h3>
                    <p className="text-xs text-slate-500">{vendor.type}</p>
                  </div>
               </div>
               <button className="p-1 text-slate-400 hover:text-slate-600 rounded">
                 <MoreVertical size={16} />
               </button>
             </div>

             <div className="space-y-2 mt-6">
               <div className="flex items-center gap-2 text-sm text-slate-600">
                 <Phone size={14} className="text-slate-400" />
                 <span>{vendor.phone}</span>
               </div>
               <div className="flex items-center gap-2 text-sm text-slate-600">
                 <Mail size={14} className="text-slate-400" />
                 <span className="truncate">{vendor.email}</span>
               </div>
             </div>

             <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  vendor.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 
                  vendor.status === 'Inactive' ? 'bg-slate-100 text-slate-600' : 
                  'bg-rose-50 text-rose-700'
                }`}>
                  {vendor.status}
                </span>
                <span className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer">View Details &rarr;</span>
             </div>
          </div>
        ))}

        {filteredVendors.length === 0 && (
           <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
             <Building2 size={48} className="mx-auto mb-4 text-slate-300" />
             <p>No vendors found.</p>
           </div>
        )}
      </div>
    </div>
  );
}
