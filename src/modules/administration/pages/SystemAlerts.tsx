import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, AlertTriangle, ShieldCheck, Activity, Terminal, Zap, Info } from 'lucide-react';

export default function SystemAlerts() {
  const alerts = [
    { type: 'critical', title: 'Unauthorized API Access Attempt', time: '14 mins ago', source: 'Auth-Gateway (L-2)', id: 'AL-829' },
    { type: 'warning', title: 'Cloud Function Latency Spike', time: '2 hours ago', source: 'WorkerNode-04', id: 'AL-825' },
    { type: 'info', title: 'Daily Backup Completed Successfully', time: '12 hours ago', source: 'Storage-Sync', id: 'AL-821' },
    { type: 'critical', title: 'High Memory Usage in Branch Registry', time: '1 day ago', source: 'DB-Instance', id: 'AL-818' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Alerts</h1>
          <p className="text-slate-500 font-medium">Core platform diagnostics and security event stream.</p>
        </div>
        <div className="flex gap-2">
           <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                 <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200">
                    <img src={`https://i.pravatar.cc/150?u=${i}`} className="w-full h-full rounded-full object-cover" alt="Admin" />
                 </div>
              ))}
           </div>
           <p className="text-[10px] font-black text-slate-400 self-center ml-2 uppercase tracking-widest">3 Monitoring</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-slate-900 p-8 rounded-[2rem] col-span-1 lg:col-span-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-500">
               <Activity size={120} className="text-blue-500" />
            </div>
            <div className="relative z-10">
               <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full w-fit mb-6">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Heartbeat: Healthy</span>
               </div>
               <h2 className="text-4xl font-black text-white mb-2">99.98%</h2>
               <p className="text-blue-100/40 text-sm font-bold uppercase tracking-widest">System Uptime (30D)</p>
            </div>
         </div>
         <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
               <ShieldAlert size={24} />
            </div>
            <div>
               <h3 className="text-2xl font-black text-slate-900">2</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Critical</p>
            </div>
         </div>
         <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
               <ShieldCheck size={24} />
            </div>
            <div>
               <h3 className="text-2xl font-black text-slate-900">842</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Events Cleared</p>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-900">Real-time Security Logs</h3>
            <button className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
               <Terminal size={14} /> Open Live Console
            </button>
         </div>
         <div className="divide-y divide-slate-50">
            {alerts.map((alert, i) => (
               <div key={i} className="p-6 flex items-center gap-6 group hover:bg-slate-50 transition-colors">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                     alert.type === 'critical' ? 'bg-rose-50 text-rose-500' :
                     alert.type === 'warning' ? 'bg-amber-50 text-amber-500' :
                     'bg-blue-50 text-blue-500'
                  }`}>
                     {alert.type === 'critical' ? <ShieldAlert size={20} /> :
                      alert.type === 'warning' ? <AlertTriangle size={20} /> :
                      <Info size={20} />}
                  </div>
                  <div className="flex-1">
                     <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-900">{alert.title}</h4>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{alert.id}</span>
                     </div>
                     <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs font-medium text-slate-500">{alert.source}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="text-xs font-medium text-slate-400">{alert.time}</span>
                     </div>
                  </div>
                  <button className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white hover:text-blue-600 hover:border-blue-200 transition-all">
                     Acknowledge
                  </button>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
