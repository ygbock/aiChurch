import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Download, 
  Calendar,
  PieChart as PieChartIcon,
  Filter
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
  { name: 'Jan', members: 4000 },
  { name: 'Feb', members: 4500 },
  { name: 'Mar', members: 4200 },
  { name: 'Apr', members: 4800 },
  { name: 'May', members: 5100 },
  { name: 'Jun', members: 5900 },
  { name: 'Jul', members: 6200 },
];

const financialData = [
  { name: 'Tithes', value: 45000 },
  { name: 'Offerings', value: 25000 },
  { name: 'Donations', value: 15000 },
  { name: 'Other', value: 5000 },
];

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#64748b'];

export default function Reports() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analytical Reports</h2>
          <p className="text-slate-500 text-sm">Visualize church growth, financial health, and engagement.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Download size={18} />
            Export Data
          </button>
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Calendar size={18} />
            Last 6 Months
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Users size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Net Growth</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">+1,240</p>
          <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <TrendingUp size={14} />
            15% increase vs last period
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <BarChart3 size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Attendance Rate</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">84.2%</p>
          <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <TrendingUp size={14} />
            2.4% increase vs last period
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <PieChartIcon size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Engagement Score</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">7.8/10</p>
          <p className="text-xs text-slate-400 font-bold mt-1">Based on ministry participation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Growth Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-semibold text-slate-900">Member Growth Trends</h3>
            <button className="text-slate-400 hover:text-slate-600">
              <Filter size={18} />
            </button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="members" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorMembers)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-semibold text-slate-900">Revenue Distribution</h3>
            <button className="text-slate-400 hover:text-slate-600">
              <Filter size={18} />
            </button>
          </div>
          <div className="h-[300px] w-full flex flex-col md:flex-row items-center">
            <div className="h-full w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financialData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {financialData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-4 px-4">
              {financialData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                    <span className="text-sm font-medium text-slate-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">${item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
