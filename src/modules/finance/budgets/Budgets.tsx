import React from 'react';
import { PieChart, Plus, Download, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const budgetData = [
  { name: 'Jan', Admin: 4000, Media: 2400, Youth: 2400 },
  { name: 'Feb', Admin: 3000, Media: 1398, Youth: 2210 },
  { name: 'Mar', Admin: 2000, Media: 9800, Youth: 2290 },
  { name: 'Apr', Admin: 2780, Media: 3908, Youth: 2000 },
  { name: 'May', Admin: 1890, Media: 4800, Youth: 2181 },
  { name: 'Jun', Admin: 2390, Media: 3800, Youth: 2500 },
  { name: 'Jul', Admin: 3490, Media: 4300, Youth: 2100 },
];

export default function Budgets() {
  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Budgets & Allocations</h1>
          <p className="text-slate-500 text-sm mt-1">Manage department budgets and prevent overspending.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 text-sm transition-colors shadow-sm flex items-center gap-2">
            <Plus size={16} /> New Budget
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Department Budgets (Q2)</h3>
            </div>
            <table className="w-full text-left max-w-full">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Department / Ministry</th>
                  <th className="px-6 py-4">Allocated</th>
                  <th className="px-6 py-4">Spent</th>
                  <th className="px-6 py-4">Remaining</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {[
                  { dept: 'Media & Tech', alloc: 15000, spent: 12500 },
                  { dept: 'Youth Ministry', alloc: 8000, spent: 2500 },
                  { dept: 'Administration', alloc: 25000, spent: 22000 },
                  { dept: 'Outreach & Missions', alloc: 12000, spent: 11800 },
                ].map((row, i) => {
                  const remaining = row.alloc - row.spent;
                  const ratio = row.spent / row.alloc;
                  return (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-900">{row.dept}</td>
                      <td className="px-6 py-4 text-emerald-600 font-medium">Le {row.alloc.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-500 font-medium">Le {row.spent.toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">Le {remaining.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                          <div 
                            className={`h-full ${ratio > 0.9 ? 'bg-rose-500' : ratio > 0.7 ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${ratio * 100}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
              <div className="p-2 bg-white rounded-full text-rose-600 shadow-sm">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-rose-900 mb-1">Overspending Alert</h3>
                <p className="text-sm text-rose-700 leading-snug">The <strong>Administration</strong> and <strong>Outreach & Missions</strong> departments are within 10% of their Q2 budget limits.</p>
                <div className="mt-4 flex gap-3">
                  <button className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-4 py-2 rounded-lg transition-colors">Review</button>
                  <button className="text-xs font-bold text-rose-600 bg-white hover:bg-rose-100 px-4 py-2 rounded-lg transition-colors">Dismiss</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
