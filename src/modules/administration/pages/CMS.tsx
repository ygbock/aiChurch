import React from 'react';
import { motion } from 'motion/react';
import { Globe, Layout, Edit3, Image as ImageIcon, Share2, Plus, Zap } from 'lucide-react';

export default function CMS() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Content Management</h1>
          <p className="text-slate-500 font-medium">Manage multi-channel digital publishing and ministry content.</p>
        </div>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
           <Plus size={18} /> Create Content
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {[
           { label: 'Published', value: '142', icon: <Share2 size={20} />, color: 'text-emerald-600' },
           { label: 'Drafts', value: '12', icon: <Edit3 size={20} />, color: 'text-amber-600' },
           { label: 'In Review', value: '5', icon: <Layout size={20} />, color: 'text-blue-600' },
           { label: 'Assets', value: '1.2k', icon: <ImageIcon size={20} />, color: 'text-slate-600' },
         ].map((item, i) => (
           <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                 <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    {item.icon}
                 </div>
                 <span className={`text-2xl font-black ${item.color}`}>{item.value}</span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
           </div>
         ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-900">Recent Digital Campaigns</h3>
            <div className="flex gap-2">
               <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">Active Channels</span>
            </div>
         </div>
         <div className="p-12 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-200">
               <Globe size={40} />
            </div>
            <h4 className="text-xl font-black text-slate-900">No active campaigns detected</h4>
            <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
               Content synchronized across mobile apps, websites, and community feeds will appear here after publishing.
            </p>
         </div>
      </div>
    </div>
  );
}
