import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Lock, 
  Globe, 
  Database, 
  Shield,
  ChevronRight,
  Camera,
  Mail,
  ShieldCheck,
  Zap,
  Layout,
  HardDrive,
  CreditCard,
  Target
} from 'lucide-react';
import AccessManagement from './AccessManagement';
import { useFirebase } from '../components/FirebaseProvider';

export default function Settings() {
  const { profile, user } = useFirebase();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-12"
    >
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-full w-fit mb-4">
             <SettingsIcon size={14} />
             <span className="text-[10px] font-black uppercase tracking-widest">Configuration Console</span>
           </div>
           <h2 className="text-4xl font-black text-slate-900 tracking-tight">System Preferences</h2>
           <p className="text-slate-500 font-medium mt-1">
             Fine-tune your administrative experience and security parameters.
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Settings Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <ModernSettingsTab 
             onClick={() => setActiveTab('profile')} 
             icon={<User />} 
             label="Stakeholder Profile" 
             active={activeTab === 'profile'} 
             color="blue"
          />
          <ModernSettingsTab 
             onClick={() => setActiveTab('notifications')} 
             icon={<Bell />} 
             label="Alert Protocols" 
             active={activeTab === 'notifications'} 
             color="amber"
          />
          <ModernSettingsTab 
             onClick={() => setActiveTab('permissions')} 
             icon={<ShieldCheck />} 
             label="Access Control" 
             active={activeTab === 'permissions'} 
             color="indigo"
          />
          <ModernSettingsTab 
             onClick={() => setActiveTab('branch')} 
             icon={<Globe />} 
             label="Branch Identity" 
             active={activeTab === 'branch'} 
             color="emerald"
          />
          <ModernSettingsTab 
             onClick={() => setActiveTab('security')} 
             icon={<Lock />} 
             label="Safety & Encryption" 
             active={activeTab === 'security'} 
             color="rose"
          />
          <ModernSettingsTab 
             onClick={() => setActiveTab('data')} 
             icon={<HardDrive />} 
             label="Data Persistence" 
             active={activeTab === 'data'} 
             color="slate"
          />
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-8">
          {activeTab === 'permissions' ? (
            <AccessManagement />
          ) : activeTab === 'profile' ? (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
               <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                     <div>
                        <h3 className="text-xl font-bold text-slate-900">Stakeholder Identity</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Core Account Information</p>
                     </div>
                     <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                        <Shield size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Verified {profile?.role}</span>
                     </div>
                  </div>
                  
                  <div className="p-10">
                     <div className="flex flex-col md:flex-row items-center gap-10 mb-12">
                        <div className="relative group">
                           <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl">
                              <img 
                                src={user?.photoURL || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"} 
                                alt="Admin" 
                                className="w-full h-full object-cover"
                              />
                           </div>
                           <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center border-4 border-white shadow-lg transition-transform group-hover:scale-110 active:scale-95">
                              <Camera size={16} />
                           </button>
                        </div>
                        <div className="text-center md:text-left flex-1">
                           <h4 className="text-2xl font-black text-slate-900 tracking-tight">{profile?.fullName || "Administrative Stakeholder"}</h4>
                           <p className="text-slate-400 font-medium font-mono text-sm mt-1">{profile?.email || "stakeholder@ministry.cloud"}</p>
                           <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                              <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                                 <Layout size={14} className="text-slate-400" />
                                 <div className="text-left">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Console Access</p>
                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{profile?.role || "Member"}</p>
                                 </div>
                              </div>
                              <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                                 <Target size={14} className="text-slate-400" />
                                 <div className="text-left">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Assigned Branch</p>
                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{profile?.branchId || "Global"}</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ModernInput label="Full Name" defaultValue={profile?.fullName} />
                        <ModernInput label="Email Architecture" defaultValue={profile?.email} />
                        <ModernInput label="Personal Identifier" placeholder="Phone Number" />
                        <ModernInput label="Timezone Protocol" defaultValue="UTC-05:00 Eastern Time" />
                     </div>
                  </div>

                  <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                     <button className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                        Synchronize Profile
                     </button>
                  </div>
               </div>
            </motion.div>
          ) : activeTab === 'notifications' ? (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
               <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/30">
                  <h3 className="text-xl font-bold text-slate-900">Alert Propagation</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Internal Signal Management</p>
               </div>
               <div className="p-10 space-y-10">
                  <ModernToggle 
                    label="Stakeholder Registration" 
                    description="Immediate signal when a new entry is detected in the repository." 
                    checked={true} 
                  />
                  <ModernToggle 
                    label="Financial Synchronization" 
                    description="Weekly telemetry of branch-level fiscal performance." 
                    checked={true} 
                  />
                  <ModernToggle 
                    label="Core Integrity Updates" 
                    description="Stay synchronized with system framework evolutionary patches." 
                    checked={false} 
                  />
               </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-12 text-center">
               <Zap size={48} className="mx-auto text-indigo-100 mb-4" />
               <h3 className="text-xl font-bold text-slate-900 mb-2">Advanced Modular Hub</h3>
               <p className="text-slate-500 font-medium text-sm">Target module is undergoing maintenance or initialization.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ModernSettingsTab({ onClick, icon, label, active, color }: any) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50/50 hover:bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 border-emerald-100",
    amber: "text-amber-600 bg-amber-50/50 hover:bg-amber-50 border-amber-100",
    rose: "text-rose-600 bg-rose-50/50 hover:bg-rose-50 border-rose-100",
    indigo: "text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 border-indigo-100",
    slate: "text-slate-600 bg-slate-50/50 hover:bg-slate-50 border-slate-100",
  };

  return (
    <button 
      onClick={onClick} 
      className={`w-full group flex items-center justify-between px-6 py-5 rounded-3xl text-sm transition-all border ${active ? colors[color] : 'text-slate-500 bg-white border-transparent hover:border-slate-100 hover:bg-slate-50 hover:text-slate-900'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`transition-transform group-hover:scale-110 ${active ? '' : 'text-slate-300'}`}>
          {React.cloneElement(icon, { size: 18 })}
        </div>
        <span className="font-bold tracking-tight">{label}</span>
      </div>
      <ChevronRight size={14} className={active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40 transition-opacity'} />
    </button>
  );
}

function ModernInput({ label, ...props }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">{label}</label>
      <input 
        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-50 outline-none transition-all placeholder:text-slate-300" 
        {...props}
      />
    </div>
  );
}

function ModernToggle({ label, description, checked }: any) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex gap-4">
         <div className={`w-1 origin-left transition-transform duration-300 scale-y-0 group-hover:scale-y-100 ${checked ? "bg-emerald-500" : "bg-slate-200"}`} />
         <div>
            <p className="text-sm font-black text-slate-900 tracking-tight mb-1">{label}</p>
            <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-sm">{description}</p>
         </div>
      </div>
      <div className={`w-14 h-7 rounded-full transition-all relative cursor-pointer border-2 shadow-inner ${checked ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-100 border-slate-200'}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 bg-white shadow-xl ${checked ? 'right-1 scale-110' : 'left-1'}`}></div>
      </div>
    </div>
  );
}
