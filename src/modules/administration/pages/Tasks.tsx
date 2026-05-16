import React from 'react';
import { motion } from 'motion/react';
import { CheckSquare, Clock, AlertCircle, Plus, Filter, LayoutGrid, Search } from 'lucide-react';

export default function Tasks() {
  const tasks = [
    { title: 'Approve District Transfers', priority: 'high', category: 'HR', status: 'pending', deadline: '2 hours' },
    { title: 'Update National Budget Q3', priority: 'medium', category: 'Finance', status: 'in-progress', deadline: '1 day' },
    { title: 'System Security Audit', priority: 'critical', category: 'IT', status: 'todo', deadline: 'Today' },
    { title: 'Review Baptism Registrations', priority: 'low', category: 'Ministry', status: 'completed', deadline: 'Done' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Administrative Tasks</h1>
          <p className="text-slate-500 font-medium">Global organizational task management and follow-ups.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Search tasks..." className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium" />
           </div>
           <button className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2">
             <Plus size={16} /> Create
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm border-l-4 border-l-rose-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Critical</p>
            <h3 className="text-2xl font-black text-slate-900">4</h3>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm border-l-4 border-l-blue-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">In Progress</p>
            <h3 className="text-2xl font-black text-slate-900">12</h3>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm border-l-4 border-l-emerald-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Completed</p>
            <h3 className="text-2xl font-black text-slate-900">86</h3>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm border-l-4 border-l-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Assigned</p>
            <h3 className="text-2xl font-black text-slate-900">102</h3>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex gap-4 bg-slate-50/50">
           <button className="text-sm font-black text-slate-900 px-3 py-1 bg-white rounded-lg shadow-sm">All Tasks</button>
           <button className="text-sm font-bold text-slate-400 hover:text-slate-600 px-3 py-1 transition-colors">Assigned to Me</button>
           <button className="text-sm font-bold text-slate-400 hover:text-slate-600 px-3 py-1 transition-colors">Archived</button>
        </div>
        <div className="divide-y divide-slate-50">
           {tasks.map((task, i) => (
             <div key={i} className="p-6 flex items-center justify-between group hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-white transition-colors">
                      <CheckSquare size={20} />
                   </div>
                   <div>
                      <h4 className="font-bold text-slate-900">{task.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{task.category}</span>
                         <span className="w-1 h-1 bg-slate-200 rounded-full" />
                         <span className={`text-[10px] font-black uppercase tracking-widest ${task.priority === 'critical' ? 'text-rose-600' : 'text-slate-400'}`}>{task.priority} priority</span>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-6">
                   <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Deadline</p>
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                         <Clock size={12} className="text-blue-500" />
                         <span className="text-sm tracking-tight">{task.deadline}</span>
                      </div>
                   </div>
                   <button className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all">
                      <Plus size={16} />
                   </button>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
