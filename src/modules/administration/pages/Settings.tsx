import React from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, Shield, Bell, Globe, Database, Cpu, Cloud, Lock } from 'lucide-react';

export default function Settings() {
  const sections = [
    { title: 'General Configuration', icon: <Globe size={18} />, desc: 'Regional settings, localization, and branding priorities.' },
    { title: 'Security & Access', icon: <Shield size={18} />, desc: 'Global RBAC policies, IP white-listing, and audit controls.' },
    { title: 'System Automation', icon: <Cpu size={18} />, desc: 'Trigger logic, AI prompt engineering, and background workers.' },
    { title: 'Database & Storage', icon: <Database size={18} />, desc: 'Retention policies, backups, and cloud storage allocation.' },
    { title: 'Notifications', icon: <Bell size={18} />, desc: 'Multi-channel broadcast logic and priority routing.' },
    { title: 'Authentication', icon: <Lock size={18} />, desc: 'OAuth providers, password complexity, and 2FA requirements.' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Organization Settings</h1>
        <p className="text-slate-500 font-medium tracking-tight">High-level governance and organization-wide parameters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section, i) => (
          <button key={i} className="group text-left bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all active:scale-[0.98]">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-colors mb-6 shadow-sm">
               {section.icon}
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">{section.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{section.desc}</p>
          </button>
        ))}
      </div>

      <div className="bg-slate-900 p-12 rounded-[3rem] relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Cloud size={160} className="text-white" />
         </div>
         <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-blue-300 rounded-full">
               <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Status</span>
            </div>
            <h2 className="text-3xl font-black text-white leading-tight">Your tenant is optimized <br />for high-concurrency.</h2>
            <p className="text-blue-100/60 max-w-md font-medium">FaithFlow infrastructure is automatically scaling to meet your organization's weekly demand cycles.</p>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/40">
               Manage Environment
            </button>
         </div>
      </div>
    </div>
  );
}
