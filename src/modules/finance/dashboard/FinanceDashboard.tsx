import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  CreditCard, 
  Activity, 
  Landmark,
  TrendingUp,
  MoreHorizontal
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const mockChartData = [
  { name: 'Jan', income: 4000, expenses: 2400 },
  { name: 'Feb', income: 3000, expenses: 1398 },
  { name: 'Mar', income: 2000, expenses: 9800 },
  { name: 'Apr', income: 2780, expenses: 3908 },
  { name: 'May', income: 1890, expenses: 4800 },
  { name: 'Jun', income: 2390, expenses: 3800 },
  { name: 'Jul', income: 3490, expenses: 4300 },
];

export default function FinanceDashboard() {
  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Finance Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor branch and district financial health.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-sm transition-colors">
            Generate Report
          </button>
          <button className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 text-sm transition-colors shadow-sm">
            Receive Payment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Balance" 
          amount="Le 124,500.00" 
          trend="+12.5%" 
          isPositive={true} 
          icon={<Landmark size={20} className="text-[#0B1E36]" />} 
        />
        <StatCard 
          title="Income (MTD)" 
          amount="Le 45,200.00" 
          trend="+4.2%" 
          isPositive={true} 
          icon={<ArrowUpRight size={20} className="text-emerald-600" />} 
        />
        <StatCard 
          title="Expenses (MTD)" 
          amount="Le 18,450.00" 
          trend="-2.1%" 
          isPositive={false} 
          icon={<ArrowDownRight size={20} className="text-rose-600" />} 
        />
        <StatCard 
          title="Mobile Waitlist" 
          amount="Le 3,200.00" 
          trend="Pending clearing" 
          isPositive={true} 
          trendNeutral 
          icon={<Wallet size={20} className="text-orange-600" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Cash Flow</h3>
            <select className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500">
              <option>Last 6 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="p-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="income" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expenses" stroke="#e11d48" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Recent Activity</h3>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="p-6 flex-1 flex items-center justify-center text-center">
            <div className="space-y-3">
              <Activity size={32} className="mx-auto text-slate-300" />
              <p className="text-sm font-medium text-slate-500">Activity feed will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, amount, trend, isPositive, trendNeutral, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-slate-50 rounded-xl">
          {icon}
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trendNeutral ? 'bg-slate-100 text-slate-600' : isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {trend}
        </span>
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
        <h4 className="text-2xl font-black text-slate-900 tracking-tight">{amount}</h4>
      </div>
    </div>
  );
}
