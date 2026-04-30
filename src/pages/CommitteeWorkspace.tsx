import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import FloatingActionMenu from '../components/FloatingActionMenu';
import { 
  Users, 
  Calendar, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  ChevronRight,
  ArrowLeft,
  CheckSquare,
  Clock,
  AlertTriangle,
  Plus,
  DollarSign,
  TrendingUp,
  Briefcase
} from 'lucide-react';

export default function CommitteeWorkspace() {
  const { ministryId, committeeId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Home');

  const tabs = ['Home', 'Tasks', 'Meetings', 'Docs', 'Finance', 'Publications', 'Chat', 'Reports'];

  const getMinistryName = () => {
    if (ministryId === 'mens') return "Men's Ministry";
    if (ministryId === 'womens') return "Women's Ministry";
    if (ministryId === 'youth') return "Youth & Young Adults Ministry";
    return "Ministry";
  };

  const getCommitteeName = () => {
    return committeeId?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || "Committee";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <Link to={`/ministries/${ministryId}`} className="hover:text-blue-600 transition-colors">{getMinistryName()}</Link>
        <ChevronRight size={14} />
        <span className="text-slate-900">{getCommitteeName()}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 font-display">
            {getCommitteeName()}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Committee workspace
          </p>
          <div className="flex gap-2 mt-4">
            <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold uppercase rounded-full">
              Head
            </span>
            <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase rounded-full">
              full access
            </span>
          </div>
        </div>
        <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm">
          <Users size={18} />
          Manage Committee
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatBox icon={<CheckSquare size={16} className="text-blue-500" />} label="Total Tasks" value="0" />
        <StatBox icon={<Clock size={16} className="text-yellow-600" />} label="Pending" value="0" highlight="Pending" />
        <StatBox icon={<AlertTriangle size={16} className="text-rose-500" />} label="Overdue" value="0" />
        <StatBox icon={<Calendar size={16} className="text-purple-500" />} label="Meetings" value="0" />
        <StatBox icon={<DollarSign size={16} className="text-emerald-500" />} label="Budget" value="£0" />
        <StatBox icon={<TrendingUp size={16} className="text-orange-500" />} label="Spent" value="£0" />
        <StatBox icon={<FileText size={16} className="text-blue-500" />} label="Publications" value="0" />
        <StatBox icon={<BarChart3 size={16} className="text-emerald-500" />} label="Progress" value="0%" />
      </div>

      {/* Tabs */}
      <div className="bg-slate-100/50 p-1 rounded-xl inline-flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2
              ${activeTab === tab 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}
            `}
          >
            {tab === 'Home' && <Briefcase size={14} />}
            {tab === 'Tasks' && <CheckSquare size={14} />}
            {tab === 'Meetings' && <Calendar size={14} />}
            {tab === 'Docs' && <FileText size={14} />}
            {tab === 'Finance' && <DollarSign size={14} />}
            {tab === 'Publications' && <MessageSquare size={14} />}
            {tab === 'Chat' && <MessageSquare size={14} />}
            {tab === 'Reports' && <BarChart3 size={14} />}
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {activeTab === 'Home' && (
        <div className="grid grid-cols-1 gap-8">
          {/* Recent Activity */}
          <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 font-display">Recent Activity</h3>
            </div>
            
            <div className="space-y-6">
              <ActivityItem 
                dotColor="bg-emerald-500" 
                text='Task "Prepare Monthly Report" completed by David Clark' 
                time="2 hours ago" 
              />
              <ActivityItem 
                dotColor="bg-blue-400" 
                text="New meeting scheduled for February 3rd" 
                time="1 day ago" 
              />
              <ActivityItem 
                dotColor="bg-purple-500" 
                text="Finance update published to ministry page" 
                time="3 days ago" 
              />
            </div>
          </section>
        </div>
      )}
      {/* Floating Action Menu */}
      <FloatingActionMenu actions={[
        { icon: <CheckSquare size={18} />, label: "Create New Task", onClick: () => {} },
        { icon: <Calendar size={18} />, label: "Schedule Meeting", onClick: () => {} },
        { icon: <DollarSign size={18} />, label: "Record Expense", onClick: () => {} },
        { icon: <MessageSquare size={18} />, label: "Create Publication", onClick: () => {} },
        { icon: <BarChart3 size={18} />, label: "View Reports", onClick: () => {} }
      ]} />
    </motion.div>
  );
}

function StatBox({ icon, label, value, highlight }: { icon: React.ReactNode, label: string, value: string, highlight?: string }) {
  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="p-1 bg-slate-50 rounded-lg">
          {icon}
        </div>
        <div className="flex items-center gap-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          {highlight && (
            <span className="px-1 py-0.5 bg-slate-200 text-slate-600 text-[7px] font-bold uppercase rounded">
              {highlight}
            </span>
          )}
        </div>
      </div>
      <p className="text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}

function QuickActionItem({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="w-full flex items-center justify-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
      <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors text-slate-600">
        {icon}
      </div>
      <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
        {label}
      </span>
    </button>
  );
}

function ActivityItem({ dotColor, text, time }: { dotColor: string, text: string, time: string }) {
  return (
    <div className="flex gap-4">
      <div className={`w-2 h-2 rounded-full ${dotColor} mt-2 shrink-0`} />
      <div>
        <p className="text-sm font-bold text-slate-900">{text}</p>
        <p className="text-xs text-slate-500 font-medium mt-1">{time}</p>
      </div>
    </div>
  );
}
