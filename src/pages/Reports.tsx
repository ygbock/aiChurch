import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Download, 
  Calendar,
  PieChart as PieChartIcon,
  Filter,
  Sparkles,
  ArrowUpRight,
  Target,
  Zap,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const growthData = [
  { name: 'Jan', members: 4000, active: 3200 },
  { name: 'Feb', members: 4500, active: 3800 },
  { name: 'Mar', members: 4200, active: 3600 },
  { name: 'Apr', members: 4800, active: 4100 },
  { name: 'May', members: 5100, active: 4400 },
  { name: 'Jun', members: 5900, active: 5200 },
  { name: 'Jul', members: 6200, active: 5500 },
];

const financialData = [
  { name: 'Tithes', value: 45000 },
  { name: 'Offerings', value: 25000 },
  { name: 'Outreach', value: 15000 },
  { name: 'Missions', value: 5000 },
];

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#6366f1'];

export default function Reports() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-12"
    >
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full w-fit mb-4">
             <BarChart3 size={14} />
             <span className="text-[10px] font-black uppercase tracking-widest">Intelligence Suite</span>
           </div>
           <h2 className="text-4xl font-black text-slate-900 tracking-tight">Executive Reports</h2>
           <p className="text-slate-500 font-medium mt-1">Advanced data visualization for strategic branch oversight.</p>
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <button className="flex-1 lg:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
            <Calendar size={18} />
            H1 2024
          </button>
          <button className="flex-1 lg:flex-none px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ModernReportStat label="Cumulative Growth" value="+1,240" trend="+15%" icon={<Users />} color="blue" />
        <ModernReportStat label="Avg. Attendance" value="84.2%" trend="+2.4%" icon={<Target />} color="emerald" />
        <ModernReportStat label="Active Ministries" value="24" trend="Optimal" icon={<Zap />} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Growth Chart Area */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center mb-10">
            <div>
               <h3 className="text-xl font-bold text-slate-900">Member Acquisition Trend</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Growth Mechanics • Monthly</p>
            </div>
            <div className="flex gap-2">
               <button className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600">
                  <Filter size={18} />
               </button>
            </div>
          </div>

          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="members" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorMembers)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="active" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorActive)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 flex gap-6">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-600" />
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Total Registered</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Active Participation</span>
             </div>
          </div>
        </div>

        {/* Right side breakdown */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center">
              <h3 className="text-lg font-bold text-slate-900 w-full mb-8 text-center uppercase tracking-widest text-[10px] text-slate-400">Revenue Breakdown</h3>
              
              <div className="h-[240px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={financialData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={8}
                    >
                      {financialData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Total</span>
                   <span className="text-2xl font-black text-slate-900 tracking-tighter">$90k</span>
                </div>
              </div>

              <div className="w-full space-y-4 mt-8">
                {financialData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900 tracking-tighter">${item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
           </div>

           <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2rem] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
              <div className="relative z-10">
                 <Sparkles className="mb-6 opacity-60" size={24} />
                 <h4 className="text-xl font-bold mb-2">Predictive Growth</h4>
                 <p className="text-indigo-100 text-sm font-medium mb-6">Based on current velocity, we forecast <span className="text-white font-black underline underline-offset-4">+150 new members</span> by next quarter.</p>
                 <button className="w-full py-3 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-lg flex items-center justify-center gap-2">
                    Open Insights Hub
                    <ArrowRight size={14} />
                 </button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function ModernReportStat({ label, value, trend, icon, color }: any) {
  const themes: any = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' }
  };
  const theme = themes[color];

  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 ${theme.bg} ${theme.text}`}>
         {React.cloneElement(icon as any, { size: 24 })}
      </div>
      <div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
         <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h4>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
               <ArrowUpRight size={12} />
               {trend}
            </span>
         </div>
      </div>
    </div>
  );
}
