import React from 'react';
import { motion } from 'motion/react';
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
  Smartphone
} from 'lucide-react';
import { useRole } from '../components/Layout';

export default function CommunicationHub() {
  const { role } = useRole();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Communication Hub</h2>
          <p className="text-slate-500 text-sm">
            {role === 'admin' ? 'Messaging for Main Campus members and departments.' : 
             role === 'district' ? 'District-wide communication for North America branches.' :
             'Centralized messaging system for SMS, Email, and In-app notifications.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Layout size={18} />
            Manage Templates
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
            <Send size={18} />
            Compose Message
          </button>
        </div>
      </div>

      {/* Communication Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Messages Sent" value="12,480" icon={<Send className="text-blue-600" size={20} />} trend="+15% this month" />
        <StatCard label="Delivery Rate" value="99.2%" icon={<CheckCircle2 className="text-emerald-600" size={20} />} trend="Avg. per channel" />
        <StatCard label="Active Templates" value="24" icon={<Layout className="text-purple-600" size={20} />} trend="Pre-configured" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Messages */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Message History</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="text" placeholder="Search history..." className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-xs focus:ring-1 focus:ring-blue-600 outline-none" />
                </div>
                <button className="p-1.5 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg">
                  <Filter size={14} />
                </button>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              <MessageItem 
                title="Sunday Service Reminder" 
                type="SMS" 
                recipients={1240} 
                status="Delivered" 
                time="2 hours ago" 
                icon={<Smartphone size={16} />}
              />
              <MessageItem 
                title="Weekly Financial Report" 
                type="Email" 
                recipients={45} 
                status="Sent" 
                time="5 hours ago" 
                icon={<Mail size={16} />}
              />
              <MessageItem 
                title="Youth Outreach Rally" 
                type="Push" 
                recipients={450} 
                status="Delivered" 
                time="Yesterday" 
                icon={<MessageSquare size={16} />}
              />
              <MessageItem 
                title="Leadership Meeting Update" 
                type="Email" 
                recipients={18} 
                status="Delivered" 
                time="Yesterday" 
                icon={<Mail size={16} />}
              />
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
              <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View All History
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Targeted Groups */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GroupCard 
              title="All Members" 
              count={12482} 
              icon={<Users size={18} className="text-blue-600" />}
            />
            <GroupCard 
              title="Choir Department" 
              count={120} 
              icon={<Users size={18} className="text-emerald-600" />}
            />
            <GroupCard 
              title="Youth Ministry" 
              count={450} 
              icon={<Users size={18} className="text-purple-600" />}
            />
            <GroupCard 
              title="District Leaders" 
              count={24} 
              icon={<Users size={18} className="text-orange-600" />}
            />
          </div>
        </div>

        {/* Templates Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Popular Templates</h3>
            </div>
            <div className="p-4 space-y-3">
              <TemplateItem title="Welcome Message" type="Email" />
              <TemplateItem title="Event Reminder" type="SMS" />
              <TemplateItem title="Prayer Request" type="Push" />
              <TemplateItem title="Donation Receipt" type="Email" />
              <TemplateItem title="Meeting Invite" type="SMS" />
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
              <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                Browse All Templates
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-lg font-bold mb-2">Bulk SMS Credits</h4>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-bold">4,250</span>
                <span className="text-slate-400 text-sm mb-1">credits left</span>
              </div>
              <button className="bg-white text-slate-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors">
                Top Up Credits
              </button>
            </div>
            <Smartphone className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32 group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, icon, trend }: { label: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 rounded-lg">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{trend}</span>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function MessageItem({ title, type, recipients, status, time, icon }: { title: string, type: string, recipients: number, status: string, time: string, icon: React.ReactNode }) {
  return (
    <div className="px-6 py-4 hover:bg-slate-50 transition-colors group">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-blue-600 transition-colors border border-transparent group-hover:border-slate-200">
            {icon}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{type} • {recipients} recipients</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">{status}</span>
          <button className="text-slate-400 hover:text-slate-600">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 flex items-center gap-1">
        <Clock size={10} />
        {time}
      </p>
    </div>
  );
}

function GroupCard({ title, count, icon }: { title: string, count: number, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors group cursor-pointer">
      <div className="flex justify-between items-center mb-3">
        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
          {icon}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-900">{count.toLocaleString()}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Members</p>
        </div>
      </div>
      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h4>
    </div>
  );
}

function TemplateItem({ title, type }: { title: string, type: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{title}</span>
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase">{type}</span>
    </div>
  );
}
