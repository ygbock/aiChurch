import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  UserMinus,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Search,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../components/Layout';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const growthData = [
  { name: 'Jan', members: 1200 },
  { name: 'Feb', members: 1250 },
  { name: 'Mar', members: 1350 },
  { name: 'Apr', members: 1420 },
  { name: 'May', members: 1480 },
  { name: 'Jun', members: 1600 },
];

const demographicData = [
  { name: 'Adults', value: 850, color: '#3b82f6' },
  { name: 'Youth', value: 420, color: '#6366f1' },
  { name: 'Children', value: 330, color: '#ec4899' },
];

export default function MembersDashboard() {
  const navigate = useNavigate();
  const { role } = useRole();

  const isBranchAdmin = role === 'admin';
  const isDistrictAdmin = role === 'district';
  const isSuperAdmin = role === 'superadmin';

  const appendParams = (path: string) => path;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Members App Dashboard</h2>
          <p className="text-slate-500 text-sm">
            {isBranchAdmin ? 'Congregation analytics for Main Campus' : 
             isDistrictAdmin ? 'Regional growth and demographic analytics' : 
             'Global congregation oversight and performance'}
          </p>
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <button 
            onClick={() => navigate(appendParams('/members/registry'))}
            className="flex-1 lg:flex-none px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <Users size={18} />
            Member Registry
          </button>
          {role !== 'member' && (
            <button 
              onClick={() => navigate(appendParams('/members/new'))}
              className="flex-1 lg:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus size={18} />
              Add Member
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Members" 
          value={isBranchAdmin ? "1,600" : isDistrictAdmin ? "12,400" : "84,500"} 
          change="+12.5%" 
          trend="up" 
          icon={<Users className="text-blue-600" size={20} />} 
        />
        <StatCard 
          title="Active Members" 
          value={isBranchAdmin ? "1,420" : isDistrictAdmin ? "10,850" : "72,100"} 
          change="+8.2%" 
          trend="up" 
          icon={<UserCheck className="text-emerald-600" size={20} />} 
        />
        <StatCard 
          title="New Converts" 
          value={isBranchAdmin ? "45" : isDistrictAdmin ? "820" : "2,450"} 
          change="+15.3%" 
          trend="up" 
          icon={<TrendingUp className="text-indigo-600" size={20} />} 
        />
        <StatCard 
          title="Inactive/Churn" 
          value={isBranchAdmin ? "12" : isDistrictAdmin ? "145" : "420"} 
          change="-2.1%" 
          trend="down" 
          icon={<UserMinus className="text-slate-400" size={20} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">Congregation Growth</h3>
            <select className="text-xs font-bold text-slate-500 bg-slate-50 border-none rounded-lg px-2 py-1 outline-none">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="members" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorMembers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-6">Demographic Split</h3>
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demographicData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {demographicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {demographicData.map((item) => (
              <div key={item.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-medium text-slate-600">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden text-right">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center text-left">
          <h3 className="font-bold text-slate-900">Recent Registrations</h3>
          <button onClick={() => navigate(appendParams('/members/registry'))} className="text-xs font-bold text-blue-600 hover:text-blue-700">View All</button>
        </div>
        <div className="divide-y divide-slate-100 text-left">
          {[
            { name: 'Alice Thompson', branch: 'Main Campus', date: '2 hours ago', status: 'Active' },
            { name: 'Robert Chen', branch: 'North Point', date: '5 hours ago', status: 'Pending' },
            { name: 'Sarah Miller', branch: 'Grace Chapel', date: 'Yesterday', status: 'Active' },
          ].map((item, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.branch} • {item.date}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${item.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, change, trend, icon }: { title: string, value: string, change: string, trend: 'up' | 'down', icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </div>
      </div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
    </div>
  );
}
