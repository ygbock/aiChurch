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
import { useRole } from '../../../components/Layout';
import Modal from '../../../components/Modal';
import { collection, query, getDocs, limit, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../lib/firebase';
import { useFirebase } from '../../../components/FirebaseProvider';
import { toast } from 'sonner';

import { useNavigate, useLocation } from 'react-router-dom';

export default function CommunicationHub() {
  const { role } = useRole();
  const { profile } = useFirebase();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'broadcasts' | 'automations'>('broadcasts');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'Email' | 'SMS' | 'Push'>('Email');
  const [targetGroup, setTargetGroup] = useState('All Members');
  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [membersCount, setMembersCount] = useState(0);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState('Default Branch Branding');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useFirebase();
  
  const [automations, setAutomations] = useState({
    birthdays: true,
    anniversaries: false,
    spiritualMilestones: true,
    firstTimers: true
  });

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

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'broadcasts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const fetched = snapshot.docs.map(doc => {
          const data = doc.data();
          const createdAt = data.createdAt ? data.createdAt.toDate() : new Date();
          let timeString = 'Just now';
          const diffInMinutes = Math.floor((new Date().getTime() - createdAt.getTime()) / 60000);
          if (diffInMinutes > 0 && diffInMinutes < 60) {
            timeString = `${diffInMinutes}m ago`;
          } else if (diffInMinutes >= 60 && diffInMinutes < 1440) {
            timeString = `${Math.floor(diffInMinutes / 60)}h ago`;
          } else if (diffInMinutes >= 1440) {
            timeString = `${Math.floor(diffInMinutes / 1440)}d ago`;
          }

          return {
            id: doc.id,
            title: data.title,
            type: data.channel,
            recipients: data.recipientsCount || 0,
            status: data.status,
            time: timeString,
            icon: data.channel === 'Email' ? <Mail /> : data.channel === 'SMS' ? <MessageSquare /> : <Smartphone />
          };
        });
        setBroadcasts(fetched);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'broadcasts');
      }
    }, error => {
      handleFirestoreError(error, OperationType.LIST, 'broadcasts');
    });

    return () => unsubscribe();
  }, [user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'broadcasts'), {
        title: messageTitle,
        body: messageBody,
        channel: selectedChannel,
        targetGroup: targetGroup,
        recipientsCount: membersCount,
        status: 'Sent',
        senderId: user.uid,
        senderName: profile.fullName || 'Unknown',
        createdAt: serverTimestamp()
      });
      toast.success(`${selectedChannel} message dispatched successfully`);
      setIsComposeOpen(false);
      setMessageTitle('');
      setMessageBody('');
    } catch (error) {
      toast.error('Failed to dispatch message');
      handleFirestoreError(error, OperationType.CREATE, 'broadcasts');
    } finally {
      setIsSubmitting(false);
    }
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
      {/* Social Tab Navigation for Mobile */}
      <div className="flex md:hidden gap-6 border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar -mx-4 px-4 w-[calc(100%+32px)]">
        {[
          { label: 'Feed', path: '/community-feed', mobileOnly: false },
          { label: 'Channels', path: '/ministry-channels', mobileOnly: false },
          { label: 'Messages', path: '/direct-messages', mobileOnly: false },
          { label: 'Announcements', path: '/communication', mobileOnly: true }
        ].map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`shrink-0 pb-4 text-sm font-bold transition-all whitespace-nowrap relative ${
              location.pathname === tab.path 
                ? 'text-indigo-600' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
            {location.pathname === tab.path && (
              <motion.div 
                layoutId="activeTabMobileComm"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
              />
            )}
          </button>
        ))}
      </div>

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full w-fit mb-4">
             <MessageSquare size={14} />
             <span className="text-[10px] font-black uppercase tracking-widest">Branch Broadcast System</span>
           </div>
           <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">Communication Hub</h2>
           <p className="text-slate-500 font-medium mt-1">
             Manage omnichannel engagement across Email, SMS, and Mobile notifications.
           </p>
        </div>
        <div className="flex flex-row gap-2 sm:gap-3 w-full lg:w-auto">
          <button 
            onClick={() => {
              setSelectedChannel('Email');
              setIsComposeOpen(true);
              setShowTemplates(true);
            }}
            className="flex-1 lg:flex-none px-4 sm:px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-xs sm:text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 sm:gap-2"
          >
            <Layout size={16} className="sm:w-[18px] sm:h-[18px]" />
            Templates
          </button>
          <button 
            onClick={() => setIsComposeOpen(true)}
            className="flex-1 lg:flex-none px-4 sm:px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-xs sm:text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-xl shadow-indigo-100 active:scale-95"
          >
            <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
            Compose
          </button>
        </div>
      </div>

      {/* Modern Stats Summary */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        <ModernCommStat label="Sent Broadcasts" value="12,480" icon={<Send />} color="indigo" trend="+15% MTD" />
        <ModernCommStat label="Success Rate" value="99.2%" icon={<CheckCircle2 />} color="emerald" trend="Optimal" />
        <ModernCommStat label="Global Reach" value="8.4k" icon={<Users />} color="amber" trend="Active Users" />
      </div>

      <div className="flex flex-row bg-slate-100 p-1 rounded-2xl w-full sm:w-fit gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('broadcasts')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'broadcasts' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Broadcast Log
        </button>
        <button
          onClick={() => setActiveTab('automations')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'automations' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Automations
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main history channel */}
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'broadcasts' ? (
            <>
              <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col min-h-[600px]">
                 <div className="px-4 py-4 sm:px-8 sm:py-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/30">
                    <div>
                       <h3 className="text-lg sm:text-xl font-bold text-slate-900">Message Audit Trail</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Omnichannel Log</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                       <div className="relative w-full sm:w-auto">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input type="text" placeholder="Search archive..." className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-100" />
                       </div>
                       <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 shrink-0">
                          <Filter size={18} />
                       </button>
                    </div>
                 </div>

                 <div className="flex-1 divide-y divide-slate-50 overflow-y-auto">
                    {broadcasts.length === 0 ? (
                      <div className="p-12 text-center text-slate-500 font-medium">No broadcasts found. Compose a new message to get started.</div>
                    ) : (
                      broadcasts.map(b => (
                        <ModernMessageItem 
                          key={b.id}
                          title={b.title} 
                          type={b.type} 
                          recipients={b.recipients} 
                          status={b.status} 
                          time={b.time} 
                          icon={b.icon}
                          onClick={() => setSelectedMessage({ title: b.title, type: b.type, recipients: b.recipients, status: b.status, time: b.time, icon: b.icon })}
                        />
                      ))
                    )}
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
            </>
          ) : (
            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col pt-6 pb-8">
              <div className="px-8 pb-6 border-b border-slate-100 mb-6">
                 <h3 className="text-xl font-bold text-slate-900">Life Event Automations</h3>
                 <p className="text-sm text-slate-500 font-medium mt-1">Configure automated triggers for important dates and milestones.</p>
              </div>
              <div className="px-4 sm:px-8 space-y-4 sm:space-y-6">
                <AutomationCard 
                  title="Birthday Greetings" 
                  description="Sends an automatic SMS and customized email to members on their recorded birthday." 
                  icon={<Sparkles className="text-amber-500" />}
                  isActive={automations.birthdays}
                  onToggle={() => setAutomations(prev => ({ ...prev, birthdays: !prev.birthdays }))}
                  onConfigure={() => handleApplyTemplate({ title: "Happy Birthday from the Branch!", body: "We wish you a blessed birthday filled with joy and peace.", type: "Email" })}
                />
                <AutomationCard 
                  title="Wedding Anniversaries" 
                  description="Celebrate marriages with a personalized anniversary blessing email." 
                  icon={<CheckCircle2 className="text-rose-500" />}
                  isActive={automations.anniversaries}
                  onToggle={() => setAutomations(prev => ({ ...prev, anniversaries: !prev.anniversaries }))}
                  onConfigure={() => handleApplyTemplate({ title: "Happy Anniversary!", body: "May God continue to bless your marriage.", type: "Email" })}
                />
                <AutomationCard 
                  title="Spiritual Milestones" 
                  description="Automated check-ins for Baptismiversaries and membership anniversaries." 
                  icon={<Tag className="text-indigo-500" />}
                  isActive={automations.spiritualMilestones}
                  onToggle={() => setAutomations(prev => ({ ...prev, spiritualMilestones: !prev.spiritualMilestones }))}
                  onConfigure={() => handleApplyTemplate({ title: "Spiritual Milestone", body: "Congratulations on your milestone today!", type: "Email" })}
                />
                <AutomationCard 
                  title="First-Timer Follow Up" 
                  description="A scheduled sequence of SMS messages to guests welcoming them over their first 7 days." 
                  icon={<MessageSquare className="text-emerald-500" />}
                  isActive={automations.firstTimers}
                  onToggle={() => setAutomations(prev => ({ ...prev, firstTimers: !prev.firstTimers }))}
                  onConfigure={() => handleApplyTemplate({ title: "Welcome!", body: "Thank you for visiting us. We hope to see you again soon.", type: "SMS" })}
                />
              </div>
            </div>
          )}
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
                 <div className="w-full bg-slate-50 rounded-2xl p-4 flex items-center justify-between border-2 border-transparent">
                    <span className="text-sm font-bold text-slate-900">1,248 Users</span>
                    <Users size={16} className="text-slate-300" />
                 </div>
              </div>
           </div>

           {selectedChannel === 'Email' && (
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col gap-3">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm">
                       <Layout size={18} />
                     </div>
                     <div>
                       <p className="text-xs font-bold text-slate-900">Newsletter Template</p>
                       <p className="text-[10px] text-slate-500 font-medium">Using {activeTemplate}.</p>
                     </div>
                   </div>
                   <button 
                     type="button" 
                     onClick={() => setShowTemplates(!showTemplates)}
                     className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-white px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm transition-all"
                   >
                     Change
                   </button>
                 </div>
                 
                 {showTemplates && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-3 border-t border-indigo-100/50">
                       {[
                         { id: 'default', name: 'Default Branch Branding', desc: 'Standard colors & logos' },
                         { id: 'urgent', name: 'Urgent Alert', desc: 'High visibility minimal styling' },
                         { id: 'newsletter', name: 'Monthly Newsletter', desc: 'Image-heavy grid layout' },
                         { id: 'event', name: 'Event Invitation', desc: 'Includes RSVP buttons' }
                       ].map(t => (
                         <div 
                           key={t.id}
                           onClick={() => {
                             setActiveTemplate(t.name);
                             setShowTemplates(false);
                             toast.success(`Template changed to ${t.name}`);
                           }}
                           className={`p-3 rounded-xl border cursor-pointer transition-all ${activeTemplate === t.name ? 'bg-white border-indigo-300 shadow-sm' : 'border-indigo-100/50 hover:bg-white/50'}`}
                         >
                           <p className="text-xs font-bold text-slate-900">{t.name}</p>
                           <p className="text-[9px] text-slate-500 mt-0.5">{t.desc}</p>
                         </div>
                       ))}
                    </div>
                 )}
              </div>
           )}

           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Subject / Title</label>
              <input 
                type="text" 
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                placeholder="Message headline..." 
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-100 border-2 border-transparent" 
                required 
              />
           </div>

           <div>
              <div className="flex justify-between items-end mb-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Message Body</label>
                 {selectedChannel === 'SMS' && (
                    <span className={`text-[10px] font-bold ${messageBody.length > 160 ? 'text-rose-500' : 'text-slate-400'}`}>
                       {messageBody.length} / 160 characters {messageBody.length > 160 && '(2 segments)'}
                    </span>
                 )}
              </div>
              <div className="bg-slate-50 rounded-2xl border border-transparent focus-within:border-indigo-100 focus-within:ring-2 focus-within:ring-indigo-100 transition-all overflow-hidden">
                 {selectedChannel === 'Email' && (
                    <div className="flex items-center gap-1 p-2 border-b border-slate-200 bg-white">
                       <button type="button" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors tooltip" title="Bold"><strong>B</strong></button>
                       <button type="button" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors tooltip" title="Italic"><em>I</em></button>
                       <button type="button" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors tooltip" title="Underline"><u>U</u></button>
                       <div className="w-px h-4 bg-slate-200 mx-1" />
                       <button type="button" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors tooltip flex items-center gap-1" title="Insert Image">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          <span className="text-[10px] font-bold">Image</span>
                       </button>
                    </div>
                 )}
                 <textarea 
                   value={messageBody}
                   onChange={(e) => setMessageBody(e.target.value)}
                   rows={selectedChannel === 'Email' ? 8 : 5}
                   placeholder={selectedChannel === 'Email' ? "Design your beautiful newsletter here..." : "Type urgent SMS message..."} 
                   className="w-full bg-transparent border-none p-4 text-sm font-medium placeholder:text-slate-300 outline-none resize-none" 
                   required 
                 />
              </div>
           </div>

           <div className="flex gap-4 pt-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`flex-[2] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 ${
                   selectedChannel === 'SMS' 
                     ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100' 
                     : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                }`}
              >
                {isSubmitting ? 'Dispatching...' : (selectedChannel === 'SMS' ? 'Send Urgent SMS' : 'Dispatch Message')}
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

      <AnimatePresence>
        {selectedMessage && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 relative"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm">
                     {selectedMessage.icon}
                   </div>
                   <div>
                     <h3 className="font-bold text-slate-900">{selectedMessage.type} Message</h3>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedMessage.time}</p>
                   </div>
                 </div>
                 <button onClick={() => setSelectedMessage(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors">
                   <X size={20} />
                 </button>
              </div>
              
              <div className="p-6 space-y-6">
                 <div>
                   <h4 className="text-xl font-black text-slate-900 leading-tight">{selectedMessage.title}</h4>
                   <div className="flex items-center gap-2 mt-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                         selectedMessage.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                         selectedMessage.status === 'Sent' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                         'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                         {selectedMessage.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                         <Users size={12} /> {selectedMessage.recipients} Recipients
                      </span>
                   </div>
                 </div>
                 
                 <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative overflow-hidden">
                    <p className="text-sm text-slate-600 leading-relaxed font-medium relative z-10">
                       Greetings Branch Family,<br/><br/>
                       This is a detailed record of the engagement titled <strong>"{selectedMessage.title}"</strong>. 
                       We are continually seeking to communicate effectively and provide clear updates to all {selectedMessage.recipients} targeted individuals.<br/><br/>
                       Blessings,<br/>
                       Branch Administration
                    </p>
                    <div className="absolute top-4 right-4 text-slate-200 z-0">
                      <MessageSquare size={48} className="opacity-20" />
                    </div>
                 </div>
              </div>
              
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                 <button 
                   onClick={() => {
                     toast.success(`${selectedMessage?.type} message resent successfully`);
                     setSelectedMessage(null);
                   }} 
                   className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                 >
                   <Send size={16} /> Resend Message
                 </button>
                 <button onClick={() => setSelectedMessage(null)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
                   Close Details
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
    <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl pb-0.5 flex items-center justify-center mb-4 sm:mb-6 transition-all group-hover:scale-110 ${theme.bg} ${theme.text}`}>
         {React.cloneElement(icon, { size: 24 })}
      </div>
      <div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
         <div className="flex items-baseline gap-2">
            <h4 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{value}</h4>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{trend}</span>
         </div>
      </div>
    </div>
  );
}

function ModernMessageItem({ title, type, recipients, status, time, icon, onClick }: any) {
  const statusColors: any = {
    Delivered: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Sent: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    Failed: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
    <div 
      className="px-4 py-4 sm:px-8 sm:py-5 hover:bg-slate-50/50 transition-all group cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0"
      onClick={onClick}
    >
       <div className="flex items-center gap-3 sm:gap-5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 text-slate-500 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
             {React.cloneElement(icon, { size: 20 })}
          </div>
          <div>
             <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{title}</h4>
             <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{type}</span>
                <span className="hidden sm:inline text-[10px] font-black text-slate-200">•</span>
                <span className="text-[10px] font-bold text-slate-500">{recipients} Recipients</span>
                <span className="sm:hidden text-[10px] font-bold text-slate-400">- {time}</span>
             </div>
          </div>
       </div>

       <div className="flex items-center gap-4 sm:gap-6 justify-between w-full sm:w-auto mt-2 sm:mt-0 pl-12 sm:pl-0">
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
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
    <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-indigo-200 transition-all group flex items-center justify-between cursor-pointer">
       <div className="flex items-center gap-3 sm:gap-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110 ${color}`}>
             {React.cloneElement(icon, { className: 'w-5 h-5 sm:w-6 sm:h-6' })}
          </div>
          <div>
             <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{title}</h4>
             <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Segment</p>
          </div>
       </div>
       <div className="text-right pl-2 shrink-0">
          <p className="text-lg sm:text-xl font-black text-slate-900 tracking-tighter">{count.toLocaleString()}</p>
          <p className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest tracking-tighter">Engaged</p>
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

function AutomationCard({ title, description, icon, isActive, onToggle, onConfigure }: any) {
  return (
    <div className={`p-4 sm:p-6 rounded-2xl border transition-all ${isActive ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
      <div className="flex justify-between items-start gap-3">
        <div className="flex gap-3 sm:gap-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-white shadow-sm' : 'bg-slate-50'}`}>
            {icon}
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">{title}</h4>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm">{description}</p>
            {isActive && (
               <button 
                 onClick={onConfigure}
                 className="mt-3 text-[10px] sm:text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1"
               >
                 Configure Template <ChevronRight size={14} />
               </button>
            )}
          </div>
        </div>
        <button 
           onClick={onToggle}
           className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 border-2 ${isActive ? 'bg-indigo-500 border-indigo-500' : 'bg-slate-200 border-slate-200'}`}
        >
           <div className={`w-4 h-4 bg-white rounded-full transition-transform absolute shadow-sm ${isActive ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>
    </div>
  );
}
