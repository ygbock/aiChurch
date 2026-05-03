import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Target,
  Clock,
  CheckCircle2,
  Calendar,
  Save,
  CalendarDays
} from 'lucide-react';
import AccessManagement from './AccessManagement';
import { useFirebase } from '../components/FirebaseProvider';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { toast } from 'sonner';

export default function Settings() {
  const { profile, user } = useFirebase();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  
  // Availability State
  const [availability, setAvailability] = useState({
    enabled: false,
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '09:00',
    endTime: '17:00'
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    bookings: true,
    reminders: true,
    events: true,
    news: false
  });

  useEffect(() => {
    if (profile?.availability) {
      setAvailability({
        enabled: profile.availability.enabled ?? false,
        days: profile.availability.days ?? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: profile.availability.startTime ?? '09:00',
        endTime: profile.availability.endTime ?? '17:00'
      });
    }
    if (profile?.notificationPrefs) {
      setNotificationPrefs({
        bookings: profile.notificationPrefs.bookings ?? true,
        reminders: profile.notificationPrefs.reminders ?? true,
        events: profile.notificationPrefs.events ?? true,
        news: profile.notificationPrefs.news ?? false
      });
    }
  }, [profile]);

  const saveAvailability = async () => {
    if (!db || !user?.uid) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        availability,
        updatedAt: serverTimestamp()
      });
      toast.success('Duty schedule synchronized successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const saveNotificationPrefs = async () => {
    if (!db || !user?.uid) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        notificationPrefs,
        updatedAt: serverTimestamp()
      });
      toast.success('Notification preferences updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

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
          {(profile?.role === 'admin' || profile?.role === 'superadmin' || profile?.role === 'district') && (
            <ModernSettingsTab 
               onClick={() => setActiveTab('availability')} 
               icon={<Clock />} 
               label="Duty Schedule" 
               active={activeTab === 'availability'} 
               color="amber"
            />
          )}
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
          ) : activeTab === 'availability' ? (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
               <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                     <div>
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                          <Clock className="text-amber-500" />
                          Duty Schedule
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure your counseling availability</p>
                     </div>
                     <button 
                       onClick={() => setAvailability(prev => ({ ...prev, enabled: !prev.enabled }))}
                       className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${availability.enabled ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-200 text-slate-500'}`}
                     >
                       {availability.enabled ? 'Booking Enabled' : 'Booking Disabled'}
                     </button>
                  </div>

                  <div className="p-10 space-y-12">
                     <section className="space-y-6">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                           <Calendar size={14} />
                           Available Working Days
                        </h4>
                        <div className="flex flex-wrap gap-3">
                           {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                              <button
                                key={day}
                                onClick={() => toggleDay(day)}
                                className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all border ${availability.days.includes(day) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                              >
                                {day}
                              </button>
                           ))}
                        </div>
                     </section>

                     <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                              <Clock size={14} />
                              Service Window
                           </h4>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Time</label>
                                 <input 
                                   type="time" 
                                   value={availability.startTime}
                                   onChange={(e) => setAvailability(prev => ({ ...prev, startTime: e.target.value }))}
                                   className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-50 outline-none transition-all"
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">End Time</label>
                                 <input 
                                   type="time" 
                                   value={availability.endTime}
                                   onChange={(e) => setAvailability(prev => ({ ...prev, endTime: e.target.value }))}
                                   className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-50 outline-none transition-all"
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100/50 self-end">
                           <div className="flex gap-4">
                              <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                                 <Shield size={20} />
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-slate-900 leading-tight">Smart Slot Engine</p>
                                 <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">
                                    The system automatically calculates availability based on these hours and your current bookings.
                                 </p>
                              </div>
                           </div>
                        </div>
                     </section>
                  </div>

                  <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                     <button 
                       onClick={saveAvailability}
                       disabled={isSaving}
                       className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                     >
                       {isSaving ? (
                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                       ) : <Save size={16} />}
                       Synchronize Schedule
                     </button>
                  </div>
               </div>
            </motion.div>
          ) : activeTab === 'notifications' ? (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
               <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                     <div>
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                          <Bell className="text-amber-500" />
                          Notification Protocols
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure your personal alert management</p>
                     </div>
                  </div>

                  <div className="p-10 space-y-10">
                    {[
                      { key: 'bookings', title: 'Session Lifecycle Signals', desc: 'Alerts for new requests, approvals, and scheduling changes.', icon: <CalendarDays size={18} /> },
                      { key: 'reminders', title: 'Automated Duty Reminders', desc: 'Proactive 30-minute alerts before active session starts.', icon: <Clock size={18} /> },
                      { key: 'events', title: 'Community Pulse Updates', desc: 'News on department workshops, events, and ministry milestones.', icon: <Target size={18} /> },
                      { key: 'news', title: 'Operational News', desc: 'System-wide announcements and branch administrative updates.', icon: <Globe size={18} /> }
                    ].map((pref) => (
                      <div key={pref.key} className="flex items-center justify-between group p-2 hover:bg-slate-50 rounded-2xl transition-all">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-amber-600 group-hover:border-amber-100 transition-all shadow-sm">
                            {pref.icon}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 tracking-tight leading-tight">{pref.title}</p>
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1 max-w-sm">{pref.desc}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setNotificationPrefs(prev => ({ ...prev, [pref.key as keyof typeof notificationPrefs]: !prev[pref.key as keyof typeof notificationPrefs] }))}
                          className={`w-12 h-6 rounded-full relative transition-all duration-300 ${notificationPrefs[pref.key as keyof typeof notificationPrefs] ? 'bg-amber-500 shadow-lg shadow-amber-100' : 'bg-slate-200'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${notificationPrefs[pref.key as keyof typeof notificationPrefs] ? 'left-7 shadow-sm' : 'left-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                     <button 
                       onClick={saveNotificationPrefs}
                       disabled={isSaving}
                       className="px-8 py-3 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-700 transition-all shadow-xl shadow-amber-100 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                     >
                       {isSaving ? (
                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                       ) : <Save size={16} />}
                       Commit Prefs
                     </button>
                  </div>
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
