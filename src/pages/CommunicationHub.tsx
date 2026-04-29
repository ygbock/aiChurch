import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Mail, 
  Send, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight,
  CheckCircle2,
  Clock,
  MoreVertical,
  Users,
  Layout,
  Smartphone,
  X,
  Target,
  Sparkles,
  Zap,
  Tag
} from 'lucide-react';
import { useRole } from '../components/Layout';
import Modal from '../components/Modal';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';

export default function CommunicationHub() {
  const { role } = useRole();
  const { profile } = useFirebase();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'Email' | 'SMS' | 'Push'>('Email');
  const [targetGroup, setTargetGroup] = useState('All Members');
  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [membersCount, setMembersCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
       if (!profile?.districtId || !profile?.branchId) return;
       const path = `districts/${profile.districtId}/branches/${profile.branchId}/members`;
       const snap = await getDocs(query(collection(db, path), limit(1)));
       // This is a rough estimation for demo purposes
       setMembersCount(1248); 
    }
    fetchCount();
  }, [profile]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would trigger a Firebase function or third-party API (Twilio/SendGrid)
    setIsComposeOpen(false);
    setMessageTitle('');
    setMessageBody('');
  };

  const handleApplyTemplate = (template: any) => {
    setMessageTitle(template.title);
    setMessageBody(template.body);
    setSelectedChannel(template.type);
    setIsComposeOpen(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-12"
    >
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full w-fit mb-4">
             <MessageSquare size={14} />
             <span className="text-[10px] font-black uppercase tracking-widest">Branch Broadcast System</span>
           </div>
           <h2 className="text-4xl font-black text-slate-900 tracking-tight">Communication Hub</h2>
           <p className="text-slate-500 font-medium mt-1">
             Manage omnichannel engagement across Email, SMS, and Mobile notifications.
           </p>
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <button className="flex-1 lg:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
            <Layout size={18} />
            Templates
          </button>
          <button 
            onClick={() => setIsComposeOpen(true)}
            className="flex-1 lg:flex-none px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 active:scale-95"
          >
            <Send size={18} />
            Compose
          </button>
        </div>
      </div>

      {/* Modern Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ModernCommStat label="Sent Broadcasts" value="12,480" icon={<Send />} color="indigo" trend="+15% MTD" />
        <ModernCommStat label="Success Rate" value="99.2%" icon={<CheckCircle2 />} color="emerald" trend="Optimal" />
        <ModernCommStat label="Global Reach" value="8.4k" icon={<Users />} color="amber" trend="Active Users" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main history channel */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col min-h-[600px]">
             <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <div>
                   <h3 className="text-xl font-bold text-slate-900">Message Audit Trail</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Omnichannel Log</p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="relative hidden md:block">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input type="text" placeholder="Search archive..." className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-100" />
                   </div>
                   <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600">
                      <Filter size={18} />
                   </button>
                </div>
             </div>

             <div className="flex-1 divide-y divide-slate-50">
                <ModernMessageItem 
                  title="Sunday Service: Power of Faith" 
                  type="Push" 
                  recipients={1240} 
                  status="Delivered" 
                  time="2h ago" 
                  icon={<Smartphone />}
                />
                <ModernMessageItem 
                  title="Branch Q3 Financial Audit" 
                  type="Email" 
                  recipients={12} 
                  status="Sent" 
                  time="5h ago" 
                  icon={<Mail />}
                />
                <ModernMessageItem 
                  title="Youth Rally Postponement" 
                  type="SMS" 
                  recipients={450} 
                  status="Delivered" 
                  time="Yesterday" 
                  icon={<MessageSquare />}
                />
                <ModernMessageItem 
                  title="Mid-week Prayer Focus" 
                  type="Push" 
                  recipients={840} 
                  status="Failed" 
                  time="2 days ago" 
                  icon={<Smartphone />}
                />
                <ModernMessageItem 
                  title="Welcome to Our Branch" 
                  type="Email" 
                  recipients={5} 
                  status="Delivered" 
                  time="3 days ago" 
                  icon={<Mail />}
                />
             </div>

             <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 flex items-center gap-2">
                   View Full Engagement Report
                   <ArrowRight size={14} />
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <TargetGroupCard title="Entire Congregation" count={membersCount} icon={<Users />} color="bg-indigo-50 text-indigo-600" />
             <TargetGroupCard title="Youth Ministry" count={450} icon={<Zap />} color="bg-rose-50 text-rose-600" />
             <TargetGroupCard title="Music Department" count={85} icon={<MessageSquare />} color="bg-emerald-50 text-emerald-600" />
             <TargetGroupCard title="Global Leaders" count={24} icon={<Target />} color="bg-amber-50 text-amber-600" />
          </div>
        </div>

        {/* Sidebar / Context */}
        <div className="space-y-6">
           {/* Template Panel */}
           <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30">
                 <h3 className="text-lg font-bold text-slate-900">Pre-set Assets</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Verified Templates</p>
              </div>
              <div className="p-6 space-y-3">
                 <ModernTemplateItem 
                    title="New Member Intro" 
                    type="Email" 
                    onApply={() => handleApplyTemplate({ title: "Welcome to our Family!", body: "We are so glad you joined us last Sunday...", type: "Email" })}
                 />
                 <ModernTemplateItem 
                    title="Service Reminder" 
                    type="SMS" 
                    onApply={() => handleApplyTemplate({ title: "Sunday Reminder", body: "Don't forget our service tomorrow at 9 AM!", type: "SMS" })}
                 />
                 <ModernTemplateItem 
                    title="Urgent Prayer Call" 
                    type="Push" 
                    onApply={() => handleApplyTemplate({ title: "Prayer Alert", body: "Join us in prayer for our nation at 12 PM.", type: "Push" })}
                 />
                 <ModernTemplateItem 
                    title="Tithe Acknowledgement" 
                    type="Email" 
                    onApply={() => handleApplyTemplate({ title: "Thank You", body: "We received your donation. Your support means everything.", type: "Email" })}
                 />
              </div>
           </div>

           {/* Credits Panel */}
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10 flex flex-col h-full">
                 <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/10 shrink-0 backdrop-blur-md">
                    <Smartphone size={24} className="text-indigo-400" />
                 </div>
                 <h4 className="text-xl font-bold mb-2">Omnichannel Credits</h4>
                 <div className="flex items-end gap-2 mb-6">
                    <span className="text-4xl font-black tracking-tighter">4,250</span>
                    <span className="text-slate-400 text-xs font-bold uppercase mb-1 tracking-widest">Available</span>
                 </div>
                 <div className="w-full h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[65%]" />
                 </div>
                 <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl active:scale-95">
                    Buy More Credits
                 </button>
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-5">
                 <Smartphone size={280} className="rotate-12" />
              </div>
           </div>
        </div>
      </div>

      {/* Compose Modal */}
      <Modal 
        isOpen={isComposeOpen} 
        onClose={() => setIsComposeOpen(false)} 
        title="Compose New Engagement"
      >
        <form onSubmit={handleSend} className="space-y-6">
           <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
              {(['Email', 'SMS', 'Push'] as const).map(channel => (
                <button
                  key={channel}
                  type="button"
                  onClick={() => setSelectedChannel(channel)}
                  className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                    selectedChannel === channel 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {channel}
                </button>
              ))}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Target Group</label>
                 <select 
                    value={targetGroup}
                    onChange={(e) => setTargetGroup(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-100 appearance-none"
                 >
                    <option>All Members</option>
                    <option>Choir Dept</option>
                    <option>Youth Ministry</option>
                    <option>Branch Leaders</option>
                 </select>
              </div>
              <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Estimated Recipients</label>
                 <div className="w-full bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">1,248 Users</span>
                    <Users size={16} className="text-slate-300" />
                 </div>
              </div>
           </div>

           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Subject / Title</label>
              <input 
                type="text" 
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                placeholder="Message headline..." 
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-100" 
                required 
              />
           </div>

           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Message Body</label>
              <textarea 
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                rows={5}
                placeholder="Write your message here..." 
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-100 resize-none" 
                required 
              />
           </div>

           <div className="flex gap-4 pt-2">
              <button 
                type="submit" 
                className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
              >
                Dispatch Message
                <Send size={16} />
              </button>
              <button 
                type="button"
                className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Draft
              </button>
           </div>
        </form>
      </Modal>
    </motion.div>
  );
}

function ModernCommStat({ label, value, icon, color, trend }: any) {
  const colors: any = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' }
  };
  const theme = colors[color];

  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
      <div className={`w-12 h-12 rounded-2xl pb-0.5 flex items-center justify-center mb-6 transition-all group-hover:scale-110 ${theme.bg} ${theme.text}`}>
         {React.cloneElement(icon, { size: 24 })}
      </div>
      <div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
         <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h4>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{trend}</span>
         </div>
      </div>
    </div>
  );
}

function ModernMessageItem({ title, type, recipients, status, time, icon }: any) {
  const statusColors: any = {
    Delivered: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Sent: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    Failed: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
    <div className="px-8 py-5 hover:bg-slate-50/50 transition-all group cursor-pointer flex items-center justify-between">
       <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-500 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
             {React.cloneElement(icon, { size: 20 })}
          </div>
          <div>
             <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{title}</h4>
             <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{type}</span>
                <span className="text-[10px] font-black text-slate-200">•</span>
                <span className="text-[10px] font-bold text-slate-500">{recipients} Recipients</span>
             </div>
          </div>
       </div>

       <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-1.5 text-slate-400">
             <Clock size={12} />
             <span className="text-[10px] font-bold uppercase tracking-widest">{time}</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColors[status]}`}>
             {status}
          </span>
          <button className="text-slate-300 hover:text-slate-600 transition-colors">
             <MoreVertical size={18} />
          </button>
       </div>
    </div>
  );
}

function TargetGroupCard({ title, count, icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-indigo-200 transition-all group flex items-center justify-between cursor-pointer">
       <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 ${color}`}>
             {React.cloneElement(icon, { size: 24 })}
          </div>
          <div>
             <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{title}</h4>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Segment</p>
          </div>
       </div>
       <div className="text-right">
          <p className="text-xl font-black text-slate-900 tracking-tighter">{count.toLocaleString()}</p>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest tracking-tighter">Engaged</p>
       </div>
    </div>
  );
}

function ModernTemplateItem({ title, type, onApply }: any) {
  return (
    <div 
      onClick={onApply}
      className="flex items-center justify-between p-4 bg-slate-50 hover:bg-white rounded-2xl border border-transparent hover:border-indigo-100 hover:shadow-sm transition-all cursor-pointer group"
    >
       <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{title}</span>
       </div>
       <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{type}</span>
          <Plus size={14} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
       </div>
    </div>
  );
}

const ArrowRight = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
