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
  Edit3,
  Sparkles,
  ArrowRight,
  LayoutGrid,
  Cloud,
  ShieldCheck
} from 'lucide-react';
import { useRole } from '../components/Layout';

export default function CMS() {
  const { role } = useRole();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-12"
    >
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full w-fit mb-4">
             <Globe size={14} />
             <span className="text-[10px] font-black uppercase tracking-widest">Global Asset Manager</span>
           </div>
           <h2 className="text-4xl font-black text-slate-900 tracking-tight">Content Hub</h2>
           <p className="text-slate-500 font-medium mt-1">
             Synchronize digital experiences across web, app, and internal portals.
           </p>
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <button className="flex-1 lg:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
            <ExternalLink size={18} />
            Live Site
          </button>
          <button className="flex-1 lg:flex-none px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95">
            <Plus size={18} />
            New Asset
          </button>
        </div>
      </div>

      {/* Modern CMS Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ModernCMSStat label="Global Pages" value="24" icon={<LayoutGrid />} color="blue" trend="Active" />
        <ModernCMSStat label="Cloud Assets" value="1,420" icon={<Cloud />} color="emerald" trend="12.4 GB" />
        <ModernCMSStat label="Integrity Score" value="98%" icon={<ShieldCheck />} color="amber" trend="Verified" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col min-h-[500px]">
             <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <div>
                   <h3 className="text-xl font-bold text-slate-900">Resource Repository</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Dynamic Content Log</p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="relative hidden md:block">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input type="text" placeholder="Filter resources..." className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-100 transition-all" />
                   </div>
                   <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-emerald-600 transition-colors">
                      <Filter size={18} />
                   </button>
                </div>
             </div>

             <div className="flex-1 divide-y divide-slate-50">
                <ModernContentItem 
                  title="Sunday Service Highlights" 
                  type="Blog" 
                  author="Admin User" 
                  status="Published" 
                  date="2h ago" 
                  icon={<FileText />}
                />
                <ModernContentItem 
                  title="Community Sanctuary" 
                  type="Page" 
                  author="Pastor Mike" 
                  status="Published" 
                  date="5h ago" 
                  icon={<Layout />}
                />
                <ModernContentItem 
                  title="Youth Outreach 2024" 
                  type="News" 
                  author="Sarah J." 
                  status="Draft" 
                  date="Yesterday" 
                  icon={<FileText />}
                />
                <ModernContentItem 
                  title="Ministry Framework" 
                  type="Page" 
                  author="Admin User" 
                  status="Pending" 
                  date="Yesterday" 
                  icon={<Layout />}
                />
             </div>

             <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
                <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 flex items-center gap-2">
                   View Global Asset Library
                   <ArrowRight size={14} />
                </button>
             </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm p-8">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-slate-900">Media Vault</h3>
                <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700">Manage Files</button>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <ModernMediaItem img="https://picsum.photos/seed/church1/400/400" name="service_wide.jpg" size="1.2 MB" />
                <ModernMediaItem img="https://picsum.photos/seed/church2/400/400" name="youth_rally.png" size="840 KB" />
                <ModernMediaItem img="https://picsum.photos/seed/church3/400/400" name="choir_main.jpg" size="2.4 MB" />
                <ModernMediaItem img="https://picsum.photos/seed/church4/400/400" name="outreach_h1.jpg" size="1.1 MB" />
             </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
           <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30">
                 <h3 className="text-lg font-bold text-slate-900">Review Queue</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pending Validation</p>
              </div>
              <div className="p-6 space-y-6">
                 <ModernApprovalItem 
                    title="Testimony Reel" 
                    user="David Wilson" 
                    time="2h ago" 
                 />
                 <ModernApprovalItem 
                    title="H1 Growth Report" 
                    user="Financial Dept" 
                    time="5h ago" 
                 />
                 <ModernApprovalItem 
                    title="Vision Statement" 
                    user="Pastor Mike" 
                    time="Yesterday" 
                 />
              </div>
              <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
                 <button className="w-full py-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700">
                    Open Workflow Center
                 </button>
              </div>
           </div>

           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                 <Sparkles className="mb-6 text-emerald-400 group-hover:scale-125 transition-transform" size={24} />
                 <h4 className="text-xl font-bold mb-2">Automated SEO</h4>
                 <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">AI-driven analysis of your content metadata for global search optimization.</p>
                 <button className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/40">
                    Run Optimization
                 </button>
              </div>
              <div className="absolute right-0 top-0 opacity-5">
                 <Globe size={240} className="translate-x-1/2 -translate-y-1/2" />
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function ModernCMSStat({ label, value, icon, color, trend }: any) {
  const themes: any = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' }
  };
  const theme = themes[color];

  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 ${theme.bg} ${theme.text}`}>
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

function ModernContentItem({ title, type, author, status, date, icon }: any) {
  const statusColors: any = {
    Published: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Draft: 'bg-slate-100 text-slate-500 border-slate-200',
    Pending: 'bg-amber-50 text-amber-600 border-amber-100'
  };

  return (
    <div className="px-8 py-5 hover:bg-slate-50/50 transition-all group cursor-pointer flex items-center justify-between">
       <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-colors">
             {React.cloneElement(icon, { size: 20 })}
          </div>
          <div>
             <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{title}</h4>
             <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{type}</span>
                <span className="text-[10px] font-black text-slate-200">•</span>
                <span className="text-[10px] font-bold text-slate-500">By {author}</span>
             </div>
          </div>
       </div>

       <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-4">
             <button className="text-[10px] font-black text-slate-300 hover:text-emerald-600 uppercase tracking-widest transition-colors flex items-center gap-1.5">
                <Eye size={12} />
                Preview
             </button>
             <button className="text-[10px] font-black text-slate-300 hover:text-emerald-600 uppercase tracking-widest transition-colors flex items-center gap-1.5">
                <Edit3 size={12} />
                Edit
             </button>
          </div>
          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColors[status]}`}>
             {status}
          </span>
       </div>
    </div>
  );
}

function ModernMediaItem({ img, name, size }: any) {
  return (
    <div className="group cursor-pointer">
      <div className="aspect-square rounded-[1.5rem] overflow-hidden border border-slate-100 relative shadow-sm">
        <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute inset-0 bg-emerald-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex gap-2">
             <button className="p-2 bg-white rounded-xl text-emerald-600 shadow-xl active:scale-95 transition-all">
                <Eye size={18} />
             </button>
             <button className="p-2 bg-white rounded-xl text-emerald-600 shadow-xl active:scale-95 transition-all">
                <Plus size={18} />
             </button>
          </div>
        </div>
      </div>
      <div className="mt-3 text-center">
         <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight truncate">{name}</p>
         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{size}</p>
      </div>
    </div>
  );
}

function ModernApprovalItem({ title, user, time }: any) {
  return (
    <div className="flex gap-4 group">
       <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
          {user.charAt(0)}
       </div>
       <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-900 truncate">{title}</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">By {user} • {time}</p>
          <div className="flex gap-3 mt-3">
             <button className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors">Accept</button>
             <button className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-colors">Reject</button>
          </div>
       </div>
    </div>
  );
}
