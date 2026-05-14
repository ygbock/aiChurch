import React from 'react';
import { Heart, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';
import { useDonationStore } from '../stores/useDonationStore';

export default function DonationsDashboard() {
  const { transactions, donors } = useDonationStore();

  const mtdTotal = transactions.reduce((acc, tx) => acc + tx.amount, 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Heart size={80} />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><Heart size={20} /></div>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">+14.2%</span>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1 relative z-10">Total Giving (MTD)</p>
          <h4 className="text-3xl font-black text-slate-900 relative z-10">Le {mtdTotal.toLocaleString()}</h4>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={80} />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><TrendingUp size={20} /></div>
            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">2 Active</span>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1 relative z-10">Campaign Progress</p>
          <h4 className="text-3xl font-black text-slate-900 relative z-10">Le 112,400</h4>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign size={80} />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><DollarSign size={20} /></div>
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">{donors.length} Donors</span>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1 relative z-10">Average Gift</p>
          <h4 className="text-3xl font-black text-slate-900 relative z-10">
            Le {(donors.length > 0 ? (mtdTotal / transactions.length) : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Recent Transactions</h3>
            <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1">
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="p-0 overflow-y-auto max-h-[400px]">
             {transactions.slice(0, 5).map(tx => (
                <div key={tx.id} className="px-6 py-4 border-b border-slate-50 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm">
                      {tx.donorName === 'Anonymous' ? 'A' : tx.donorName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{tx.donorName}</p>
                      <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()} • {tx.categoryName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">+{tx.amount.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">{tx.method}</p>
                  </div>
                </div>
             ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Active Campaigns</h3>
          </div>
          <div className="p-6 space-y-6 overflow-y-auto max-h-[400px]">
             {[
               { title: 'New Church Roof', raised: 32500, target: 50000, color: 'bg-emerald-500' },
               { title: 'Youth Retreat', raised: 14200, target: 15000, color: 'bg-blue-500' },
             ].map((camp, idx) => {
               const percent = Math.round((camp.raised / camp.target) * 100);
               return (
                 <div key={idx}>
                   <div className="flex justify-between mb-2">
                     <span className="text-sm font-bold text-slate-900">{camp.title}</span>
                     <span className="text-sm font-bold text-slate-500">{percent}%</span>
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                     <div className={`h-2.5 rounded-full ${camp.color}`} style={{ width: `${percent}%` }}></div>
                   </div>
                   <div className="flex justify-between mt-2 text-xs text-slate-500">
                     <span>Raised: Le {camp.raised.toLocaleString()}</span>
                     <span>Target: Le {camp.target.toLocaleString()}</span>
                   </div>
                 </div>
               )
             })}
          </div>
        </div>
      </div>
    </div>
  );
}
