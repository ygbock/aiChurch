import React from 'react';
import { useBudgetStore } from '../stores/budgetStore';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AlertCircle, Target, TrendingDown, ArrowUpRight } from 'lucide-react';

const budgetData = [
  { name: 'Jan', Admin: 4000, Media: 2400, Youth: 2400 },
  { name: 'Feb', Admin: 3000, Media: 1398, Youth: 2210 },
  { name: 'Mar', Admin: 2000, Media: 9800, Youth: 2290 },
  { name: 'Apr', Admin: 2780, Media: 3908, Youth: 2000 },
  { name: 'May', Admin: 1890, Media: 4800, Youth: 2181 },
  { name: 'Jun', Admin: 2390, Media: 3800, Youth: 2500 },
  { name: 'Jul', Admin: 3490, Media: 4300, Youth: 2100 },
];

export default function BudgetOverview() {
  const { plans, alerts } = useBudgetStore();

  const totalAllocation = plans.reduce((acc, p) => acc + p.annualAllocation, 0);
  const totalConsumed = plans.reduce((acc, p) => acc + p.consumedAmount, 0);
  const totalRemaining = totalAllocation - totalConsumed;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Allocated', value: totalAllocation, icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Total Consumed', value: totalConsumed, icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Remaining Budget', value: totalRemaining, icon: ArrowUpRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending Approvals', value: 3, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', isCount: true },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 font-medium text-sm">{stat.label}</span>
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {stat.isCount ? stat.value : `Le ${stat.value.toLocaleString()}`}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Department Budgets Overview</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left max-w-full">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Department / Ministry</th>
                    <th className="px-6 py-4 relative z-10 hidden sm:table-cell">Fund</th>
                    <th className="px-6 py-4 text-right">Allocated</th>
                    <th className="px-6 py-4 text-right">Spent</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {plans.map((row, i) => {
                    const ratio = row.annualAllocation > 0 ? row.consumedAmount / row.annualAllocation : 0;
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">{row.departmentName}</td>
                        <td className="px-6 py-4 text-slate-500 hidden sm:table-cell">{row.name}</td>
                        <td className="px-6 py-4 text-slate-600 font-medium text-right">Le {row.annualAllocation.toLocaleString()}</td>
                        <td className="px-6 py-4 text-emerald-600 font-medium text-right">Le {row.consumedAmount.toLocaleString()}</td>
                        <td className="px-6 py-4 min-w-[150px]">
                          <div className="w-full flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                              <div 
                                className={`h-full ${ratio > 0.9 ? 'bg-rose-500' : ratio > 0.7 ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 w-8">{Math.round(ratio * 100)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {plans.length === 0 && (
                     <tr>
                       <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                         No budget plans registered.
                       </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-96">
            <h3 className="font-bold text-slate-900 mb-6">Budget Consumption Trend</h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="Admin" stackId="a" fill="#059669" radius={[0,0,4,4]} />
                <Bar dataKey="Media" stackId="a" fill="#3b82f6" />
                <Bar dataKey="Youth" stackId="a" fill="#8b5cf6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white rounded-full text-rose-600 shadow-sm shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="space-y-4 w-full">
                <div>
                  <h3 className="font-bold text-rose-900 mb-1">Active Alerts</h3>
                  <p className="text-sm text-rose-700 leading-snug">You have unread budget alerts requiring attention.</p>
                </div>
                
                {alerts.filter(a => a.status === 'Unread').slice(0, 3).map(alert => (
                   <div key={alert.id} className="bg-white p-3 rounded-xl shadow-sm border border-rose-100 flex flex-col gap-2">
                     <p className="text-sm font-medium text-slate-800">{alert.message}</p>
                     <span className="text-[10px] uppercase font-bold text-slate-400">
                        {new Date(alert.createdAt).toLocaleDateString()}
                     </span>
                   </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
