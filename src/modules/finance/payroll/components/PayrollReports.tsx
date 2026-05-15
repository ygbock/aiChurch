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
      
    </motion.div>
  );
}
