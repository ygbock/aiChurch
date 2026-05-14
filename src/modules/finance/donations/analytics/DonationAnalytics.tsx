import React from 'react';
import { useDonationStore } from '../stores/useDonationStore';
import { Sparkles, TrendingUp, ArrowUpRight, ArrowDownRight, Target, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const data = [
  { name: 'Jan', donations: 4000, pledges: 2400 },
  { name: 'Feb', donations: 3000, pledges: 1398 },
  { name: 'Mar', donations: 2000, pledges: 9800 },
  { name: 'Apr', donations: 2780, pledges: 3908 },
  { name: 'May', donations: 1890, pledges: 4800 },
  { name: 'Jun', donations: 2390, pledges: 3800 },
];

const categoryData = [
  { name: 'Tithe', value: 45000 },
  { name: 'Offering', value: 12000 },
  { name: 'Missions', value: 8500 },
  { name: 'Building', value: 24000 },
];

export default function DonationAnalytics() {
  const { transactions } = useDonationStore();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-12 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-blue-100" size={24} />
            <h2 className="text-xl font-bold">AI Giving Insights</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-md">
               <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Retention Risk</p>
               <p className="text-lg font-bold">12 Donors</p>
               <p className="text-xs text-blue-200 mt-2">Haven't given in 60+ days. Suggest sending a personalized check-in email.</p>
            </div>
            
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-md">
               <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Trending Campaign</p>
               <p className="text-lg font-bold">New Church Roof</p>
               <p className="text-xs text-blue-200 mt-2">Contributions up 24% this week. Consider an update announcement this Sunday.</p>
            </div>
            
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-md">
               <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Giving Pattern</p>
               <p className="text-lg font-bold">Month-End Spike</p>
               <p className="text-xs text-blue-200 mt-2">78% of mobile money donations happen between 25th and 30th.</p>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-md">
               <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Growth Forecast</p>
               <p className="text-lg font-bold text-emerald-300 flex items-center gap-1">+15% projected</p>
               <p className="text-xs text-blue-200 mt-2">Based on recurring pledges, next month's giving is projected to grow.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue YTD</p>
              <h4 className="text-2xl font-black text-slate-900">Le 89,500</h4>
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-emerald-600 mt-4">
              <ArrowUpRight size={16} /> 12% vs last year
            </div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Average Gift Size</p>
              <h4 className="text-2xl font-black text-slate-900">Le 450</h4>
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-emerald-600 mt-4">
              <ArrowUpRight size={16} /> 5% vs last year
            </div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">New Donors</p>
              <h4 className="text-2xl font-black text-slate-900">24</h4>
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-red-600 mt-4">
              <ArrowDownRight size={16} /> -2% vs last month
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Giving Trends</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPledges" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle"/>
                <Area type="monotone" dataKey="donations" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDonations)" />
                <Area type="monotone" dataKey="pledges" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPledges)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-900 mb-6">Giving by Category</h3>
          <div className="flex-1 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} width={80} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
