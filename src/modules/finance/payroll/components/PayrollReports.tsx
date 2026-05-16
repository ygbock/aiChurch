import React from 'react';
import { usePayrollStore } from '../stores/usePayrollStore';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function PayrollReports() {
  const { runs, payslips } = usePayrollStore();

  // Sort runs by date
  const sortedRuns = [...runs].sort((a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime());

  // Trend Data
  const trendData = sortedRuns.map(r => ({
    name: r.name,
    NetPay: r.totalNetPay,
    Taxes: r.totalTaxes,
    Pensions: r.totalPensions,
    GrossPay: r.totalGross
  }));

  // Simple distribution data for the latest run
  const latestRun = sortedRuns[sortedRuns.length - 1];
  let distributionData: any[] = [];
  
  if (latestRun) {
      const slips = payslips.filter(p => p.runId === latestRun.id);
      
      const distribution = slips.reduce((acc, slip) => {
          if (!acc[slip.role]) acc[slip.role] = 0;
          acc[slip.role] += slip.netPay;
          return acc;
      }, {} as Record<string, number>);

      distributionData = Object.keys(distribution).map(key => ({
          name: key,
          value: distribution[key]
      }));
  }

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payroll Trends */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6">Payroll Costs Over Time</h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                        <Tooltip 
                            cursor={{ fill: '#F8FAFC' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                        <Bar dataKey="NetPay" fill="#6366f1" radius={[4, 4, 0, 0]} name="Net Payroll" />
                        <Bar dataKey="Taxes" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Taxes" />
                        <Bar dataKey="Pensions" fill="#10b981" radius={[4, 4, 0, 0]} name="Pensions" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </div>

          {/* Role Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-900 mb-2">Compensation by Role</h3>
            <p className="text-sm text-slate-500 mb-6">Latest Run: {latestRun?.name}</p>
            
            {distributionData.length > 0 ? (
                <div className="flex-1 min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={distributionData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {distributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                    No data available
                </div>
            )}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm">
          <h4 className="text-slate-400 text-sm font-medium mb-1">YTD Gross Payroll</h4>
          <p className="text-3xl font-black">${runs.reduce((sum, r) => sum + r.totalGross, 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="text-slate-500 text-sm font-medium mb-1">YTD Taxes Withheld</h4>
          <p className="text-3xl font-black text-slate-900">${runs.reduce((sum, r) => sum + r.totalTaxes, 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="text-slate-500 text-sm font-medium mb-1">YTD Pension Contributions</h4>
          <p className="text-3xl font-black text-slate-900">${runs.reduce((sum, r) => sum + r.totalPensions, 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Multi-Currency Distribution Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        <h3 className="font-bold text-slate-900 mb-4">Multi-Currency Liabilities (Current Period)</h3>
        <p className="text-sm text-slate-500 mb-6">Aggregated net pay obligations split by local currencies across all branches.</p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
           {(() => {
              // Simulated dynamic exchange & distribution logic for demonstration
              return (
                 <>
                   <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                     <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">USD (HQ)</div>
                     <div className="text-xl font-black text-slate-900">
                        ${latestRun ? (latestRun.totalNetPay * 0.75).toLocaleString() : '0.00'}
                     </div>
                   </div>
                   <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                     <div className="text-xs text-emerald-700 font-bold uppercase tracking-wider mb-1">NGN (Nigeria)</div>
                     <div className="text-xl font-black text-emerald-900">
                        ₦{(latestRun ? (latestRun.totalNetPay * 0.15 * 1200) : 0).toLocaleString()}
                     </div>
                   </div>
                   <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                     <div className="text-xs text-blue-700 font-bold uppercase tracking-wider mb-1">GBP (UK)</div>
                     <div className="text-xl font-black text-blue-900">
                        £{(latestRun ? (latestRun.totalNetPay * 0.03 * 0.8) : 0).toLocaleString()}
                     </div>
                   </div>
                   <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                     <div className="text-xs text-purple-700 font-bold uppercase tracking-wider mb-1">KES (Kenya)</div>
                     <div className="text-xl font-black text-purple-900">
                        KSh{(latestRun ? (latestRun.totalNetPay * 0.02 * 130) : 0).toLocaleString()}
                     </div>
                   </div>
                   <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                     <div className="text-xs text-orange-700 font-bold uppercase tracking-wider mb-1">SLE (Sierra Leone)</div>
                     <div className="text-xl font-black text-orange-900">
                        Le{(latestRun ? (latestRun.totalNetPay * 0.05 * 22) : 0).toLocaleString()}
                     </div>
                   </div>
                 </>
              )
           })()}
        </div>
      </div>
      
      {/* Detailed Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Historical Payroll Runs</h3>
            <button className="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Run Name</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Period</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Gross Pay</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Taxes</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Pensions</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Net Pay</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm font-bold text-slate-900">{run.name}</td>
                    <td className="p-4 text-sm text-slate-500">{new Date(run.periodStart).toLocaleDateString()} - {new Date(run.periodEnd).toLocaleDateString()}</td>
                    <td className="p-4 text-sm font-medium text-slate-900 text-right">${run.totalGross.toLocaleString()}</td>
                    <td className="p-4 text-sm text-slate-500 text-right">${run.totalTaxes.toLocaleString()}</td>
                    <td className="p-4 text-sm text-slate-500 text-right">${run.totalPensions.toLocaleString()}</td>
                    <td className="p-4 text-sm font-black text-indigo-600 text-right">${run.totalNetPay.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        run.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        run.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {run.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {sortedRuns.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">No payroll runs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>
      
    </motion.div>
  );
}
