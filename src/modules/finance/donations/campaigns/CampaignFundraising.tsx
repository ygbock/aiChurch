import React, { useState } from 'react';
import { useDonationStore, Campaign } from '../stores/useDonationStore';
import { Search, Plus, TrendingUp, Users } from 'lucide-react';

export default function CampaignFundraising() {
  const { campaigns } = useDonationStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search campaigns..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 text-sm flex items-center gap-2 shadow-sm">
            <Plus size={16} /> New Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map((camp: Campaign) => {
          const percent = Math.min(100, Math.round((camp.raisedAmount / camp.targetAmount) * 100));
          
          return (
            <div key={camp.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group">
              {camp.imageUrl ? (
                <div className="h-40 w-full overflow-hidden">
                  <img src={camp.imageUrl} alt={camp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ) : (
                <div className="h-32 w-full bg-emerald-50 border-b border-slate-100 flex items-center justify-center">
                   <TrendingUp className="text-emerald-200" size={48} />
                </div>
              )}
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-900 text-lg">{camp.name}</h3>
                  <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md ${
                    camp.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {camp.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-6 flex-1 line-clamp-2">{camp.description}</p>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1 items-end">
                       <span className="font-bold text-emerald-600 text-lg">{camp.currency} {camp.raisedAmount.toLocaleString()}</span>
                       <span className="text-slate-500 font-medium text-xs">of {camp.targetAmount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-2 rounded-full ${percent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'} transition-all`} style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Users size={14} /> 45 Donors</span>
                    <span>Ends: {new Date(camp.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
