import React from 'react';
import { motion } from 'motion/react';
import { Map, MapPin, Building2, Users, Plus, Globe, Search } from 'lucide-react';

export default function AdminDistricts() {
  const districts = [
    { name: 'North America', branches: 42, members: '12,500', status: 'active', coverage: 'High' },
    { name: 'West Africa', branches: 156, members: '45,200', status: 'active', coverage: 'Critical' },
    { name: 'Europe Central', branches: 28, members: '4,100', status: 'maintenance', coverage: 'Medium' },
    { name: 'East Asia', branches: 12, members: '1,200', status: 'active', coverage: 'Emerging' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Global Districts</h1>
          <p className="text-slate-500 font-medium">Hierarchy management and regional oversight.</p>
        </div>
        <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg">
           <Plus size={18} /> Add New District
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {districts.map((district, i) => (
          <div key={i} className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all">
             <div className="w-14 h-14 bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white rounded-[1.5rem] flex items-center justify-center transition-all mb-8 shadow-sm">
                <Map size={24} />
             </div>
             <div className="space-y-4">
                <div>
                   <h3 className="text-xl font-black text-slate-900">{district.name}</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Regional Territory</p>
                </div>
                <div className="flex items-center justify-between py-4 border-y border-slate-50">
                   <div className="text-center">
                      <p className="text-sm font-black text-slate-900">{district.branches}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Branches</p>
                   </div>
                   <div className="w-[1px] h-8 bg-slate-100" />
                   <div className="text-center">
                      <p className="text-sm font-black text-slate-900">{district.members}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Members</p>
                   </div>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{district.status}</span>
                   <button className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline">Configure</button>
                </div>
             </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 p-1 rounded-[3rem]">
         <div className="bg-white p-12 rounded-[2.8rem] border border-slate-100 shadow-inner flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
               <Globe size={48} />
            </div>
            <div className="max-w-md">
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">Global Infrastructure Visualization</h2>
               <p className="text-slate-500 mt-2 font-medium">Enable the GIS module to visualize your entire organization on a low-latency administrative map.</p>
            </div>
            <button className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
               Activate Map View
            </button>
         </div>
      </div>
    </div>
  );
}
