import React from 'react';
import { useRole } from '../Layout';
import { platformRegistry } from '../../core/platform/registry';
import { useFirebase } from '../FirebaseProvider';
import VerseOfTheDay from '../VerseOfTheDay';
import { Sparkles, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { DashboardWorkspace } from '../../core/dashboard/DashboardWorkspace';

export default function WorkspaceShell() {
  const { role } = useRole();
  const { profile } = useFirebase();
  
  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Welcome */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2rem] sm:rounded-[2.5rem] blur-xl sm:blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
        <div className="relative bg-white p-6 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-slate-50 rounded-full -mr-24 sm:-mr-32 -mt-24 sm:-mt-32 opacity-50" />
          
          <div className="relative z-10 flex-1 space-y-3 sm:space-y-4 w-full">
             <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full w-fit">
               <Sparkles size={14} />
               <span className="text-[10px] font-black uppercase tracking-widest">Active Workspace</span>
             </div>
             <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
               Welcome back, <br />
               <span className="text-blue-600">{profile?.fullName?.split(' ')[0] || 'Member'}</span>
             </h1>
             <p className="text-slate-500 max-w-md font-medium text-sm sm:text-lg">
               Your dynamically composed platform overview.
             </p>
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 flex items-center gap-3">
              <Calendar className="text-slate-400" />
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Date</p>
                <p className="font-black text-slate-700">{format(new Date(), 'MMM d, yyyy')}</p>
              </div>
            </div>
            <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-2xl border border-blue-100 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-blue-400 opacity-80">Access Level</p>
                <p className="font-black capitalize">{role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <VerseOfTheDay />
      
      <div className="w-full">
        <DashboardWorkspace workspaceId="home" />
      </div>
    </div>
  );
}
