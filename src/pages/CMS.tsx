import React from 'react';
import { motion } from 'motion/react';
import { 
  Globe, 
  FileText, 
  Image as ImageIcon, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight,
  CheckCircle2,
  Clock,
  MoreVertical,
  Layout,
  ExternalLink,
  Eye,
  Edit3
} from 'lucide-react';
import { useRole } from '../components/Layout';

export default function CMS() {
  const { role } = useRole();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Content Management</h2>
          <p className="text-slate-500 text-sm">
            {role === 'admin' ? 'Manage Main Campus website content and media.' : 
             role === 'district' ? 'Manage North America District content and branch sites.' :
             'Manage global church website content, media library, and blog articles.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
            <ExternalLink size={18} />
            View Website
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
            <Plus size={18} />
            Create Content
          </button>
        </div>
      </div>

      {/* CMS Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Pages" value="24" icon={<Layout className="text-blue-600" size={20} />} trend="Active on site" />
        <StatCard label="Media Files" value="1,420" icon={<ImageIcon className="text-emerald-600" size={20} />} trend="Images & Docs" />
        <StatCard label="Pending Approval" value="08" icon={<Clock className="text-orange-600" size={20} />} trend="Awaiting review" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Content List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Recent Content</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="text" placeholder="Search content..." className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-xs focus:ring-1 focus:ring-blue-600 outline-none" />
                </div>
                <button className="p-1.5 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg">
                  <Filter size={14} />
                </button>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              <ContentItem 
                title="Sunday Service Highlights" 
                type="Blog Post" 
                author="Admin User" 
                status="Published" 
                date="2 hours ago" 
                icon={<FileText size={16} />}
              />
              <ContentItem 
                title="About Our Sanctuary" 
                type="Page" 
                author="Pastor Mike" 
                status="Published" 
                date="5 hours ago" 
                icon={<Layout size={16} />}
              />
              <ContentItem 
                title="Youth Outreach 2024" 
                type="News" 
                author="Sarah Jenkins" 
                status="Draft" 
                date="Yesterday" 
                icon={<FileText size={16} />}
              />
              <ContentItem 
                title="Ministry Leadership Roles" 
                type="Page" 
                author="Admin User" 
                status="Pending" 
                date="Yesterday" 
                icon={<Layout size={16} />}
              />
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
              <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View All Content
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Media Library Preview */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Media Library</h3>
              <button className="text-xs font-bold text-blue-600 hover:text-blue-700">Open Library</button>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MediaItem img="https://picsum.photos/seed/church1/200/200" name="service_main.jpg" />
              <MediaItem img="https://picsum.photos/seed/church2/200/200" name="youth_rally.png" />
              <MediaItem img="https://picsum.photos/seed/church3/200/200" name="choir_practice.jpg" />
              <MediaItem img="https://picsum.photos/seed/church4/200/200" name="outreach_event.jpg" />
            </div>
          </div>
        </div>

        {/* Approval Queue Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Approval Queue</h3>
            </div>
            <div className="p-4 space-y-4">
              <ApprovalItem 
                title="New Testimony Video" 
                user="David Wilson" 
                time="2 hours ago" 
              />
              <ApprovalItem 
                title="Annual Report 2023" 
                user="Financial Dept" 
                time="5 hours ago" 
              />
              <ApprovalItem 
                title="Mission Statement Update" 
                user="Pastor Mike" 
                time="Yesterday" 
              />
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
              <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                Review All Pending
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="bg-emerald-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-lg font-bold mb-2">SEO Optimizer</h4>
              <p className="text-emerald-100 text-sm mb-4 leading-relaxed">Improve your website's visibility on search engines.</p>
              <button className="bg-white text-emerald-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-colors">
                Run Analysis
              </button>
            </div>
            <Globe className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32 group-hover:scale-110 transition-transform" />
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

function ContentItem({ title, type, author, status, date, icon }: { title: string, type: string, author: string, status: string, date: string, icon: React.ReactNode }) {
  const statusClasses = {
    Published: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Draft: 'bg-slate-100 text-slate-600 border-slate-200',
    Pending: 'bg-orange-50 text-orange-700 border-orange-100'
  };

  return (
    <div className="px-6 py-4 hover:bg-slate-50 transition-colors group">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-blue-600 transition-colors border border-transparent group-hover:border-slate-200">
            {icon}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{type} • By {author}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold uppercase border px-2 py-1 rounded ${statusClasses[status as keyof typeof statusClasses]}`}>
            {status}
          </span>
          <button className="text-slate-400 hover:text-slate-600">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3">
        <button className="text-[10px] font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
          <Eye size={12} />
          Preview
        </button>
        <button className="text-[10px] font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
          <Edit3 size={12} />
          Edit
        </button>
        <span className="text-[10px] text-slate-400 flex items-center gap-1 ml-auto">
          <Clock size={10} />
          {date}
        </span>
      </div>
    </div>
  );
}

function MediaItem({ img, name }: { img: string, name: string }) {
  return (
    <div className="group cursor-pointer">
      <div className="aspect-square rounded-lg overflow-hidden border border-slate-200 relative">
        <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button className="p-2 bg-white rounded-full text-slate-900">
            <Eye size={16} />
          </button>
        </div>
      </div>
      <p className="text-[10px] font-medium text-slate-500 mt-1.5 truncate">{name}</p>
    </div>
  );
}

function ApprovalItem({ title, user, time }: { title: string, user: string, time: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs flex-shrink-0">
        {user.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-900 truncate">{title}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">By {user} • {time}</p>
        <div className="flex gap-2 mt-2">
          <button className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700">Approve</button>
          <button className="text-[10px] font-bold text-red-600 hover:text-red-700">Reject</button>
        </div>
      </div>
    </div>
  );
}
