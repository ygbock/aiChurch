import React from 'react';
import { useExpenseStore } from '../stores/expenseStore';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { FileText, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

const spendingData = [
  { name: 'Jan', Admin: 400, Media: 240, Youth: 240 },
  { name: 'Feb', Admin: 300, Media: 139, Youth: 221 },
  { name: 'Mar', Admin: 200, Media: 980, Youth: 229 },
  { name: 'Apr', Admin: 278, Media: 390, Youth: 200 },
  { name: 'May', Admin: 189, Media: 480, Youth: 218 },
  { name: 'Jun', Admin: 239, Media: 380, Youth: 250 },
];

export default function ExpenseOverview() {
  const { requests, vendors } = useExpenseStore();

  const pendingRequests = requests.filter(r => r.status === 'Pending Approval' || r.status === 'Pending Review');
  const thisMonthSpending = 12500; // Mock

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Approvals', value: pendingRequests.length, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50', isCount: true },
          { label: 'Spending (This Month)', value: thisMonthSpending, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Total Vendors', value: vendors.length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', isCount: true },
          { label: 'Failed Payouts', value: 0, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', isCount: true },
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
               <h3 className="font-bold text-slate-900">Recent Expense Requests</h3>
             </div>
             <table className="w-full text-left max-w-full">
               <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-widest border-b border-slate-100">
                 <tr>
                   <th className="px-6 py-4">Title</th>
                   <th className="px-6 py-4">Department</th>
                   <th className="px-6 py-4 text-right">Amount</th>
                   <th className="px-6 py-4">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 text-sm">
                 {requests.slice(0, 5).map((req) => (
                   <tr key={req.id} className="hover:bg-slate-50">
                     <td className="px-6 py-4 font-bold text-slate-900">{req.title}</td>
                     <td className="px-6 py-4 text-slate-500">{req.departmentName}</td>
                     <td className="px-6 py-4 text-emerald-600 font-bold text-right">Le {req.amount.toLocaleString()}</td>
                     <td className="px-6 py-4">
                       <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold border ${
                         req.status.includes('Pending') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                         req.status === 'Approved' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                         req.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                         'bg-slate-50 text-slate-700 border-slate-200'
                       }`}>
                         {req.status}
                       </span>
                     </td>
                   </tr>
                 ))}
                 {requests.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        No recent requests.
                      </td>
                    </tr>
                 )}
               </tbody>
             </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-96">
            <h3 className="font-bold text-slate-900 mb-6">Spending Trend</h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={spendingData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="Admin" stackId="a" fill="#059669" radius={[0,0,4,4]} />
                <Bar dataKey="Media" stackId="a" fill="#3b82f6" />
                <Bar dataKey="Youth" stackId="a" fill="#8b5cf6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
