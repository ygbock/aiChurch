import React, { useState, useEffect } from 'react';
import { usePayrollStore } from '../stores/usePayrollStore';
import { BrainCircuit, TrendingUp, AlertTriangle, Lightbulb, Users, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function PayrollAIInsights() {
  const { runs, profiles } = usePayrollStore();

  const [isAnalyzing, setIsAnalyzing] = useState(true);

  // Mocked AI analysis data
  const forecastData = [
    { month: 'Jun 2026', predicted: 5600, actual: null },
    { month: 'Jul 2026', predicted: 5650, actual: null },
    { month: 'Aug 2026', predicted: 5800, actual: null },
  ];

  const historicalData = runs.map(r => ({
    month: new Date(r.periodStart).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
    actual: r.totalNetPay,
    predicted: r.totalNetPay + (Math.random() * 200 - 100), // adding tiny noise to historical predicted
  })).reverse(); // Assuming original is newest first, we want chronological

  // Just stitching them together for the chart
  const chartData = [...historicalData, ...forecastData];

  useEffect(() => {
    // Simulate AI processing delay
    const t = setTimeout(() => {
      setIsAnalyzing(false);
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
          <BrainCircuit size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">AI Payroll Intelligence</h2>
          <p className="text-sm text-slate-500">Anomaly detection, forecasting, and compensation insights</p>
        </div>
      </div>

      {isAnalyzing ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-500 space-y-4">
           <BrainCircuit size={48} className="animate-pulse text-indigo-300" />
           <p className="font-medium animate-pulse">Analyzing payroll histories, contracts, and market trends...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
             {/* Predictive Forecasing */}
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp size={18} className="text-indigo-600" />
                  Predictive Payroll Budget (Next Quarter)
                </h3>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-full text-center">
                  92% Confidence
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                Based on active schedules, approved advances, and recent hiring trends, payroll is expected to increase by <strong className="text-slate-900">4.5%</strong> over the next quarter.
              </p>
              
              <div className="min-h-[250px] flex-1">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                      <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="actual" stroke="#10b981" fillOpacity={1} fill="url(#colorActual)" name="Actual Pay" strokeWidth={2} />
                      <Area type="monotone" dataKey="predicted" stroke="#6366f1" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPredicted)" name="Forecast" strokeWidth={2} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              {/* Anomaly Detection */}
              <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 bg-red-500 w-32 h-32 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <AlertTriangle size={18} className="text-red-500" />
                  AI Anomaly Detection
                </h3>
                <div className="space-y-3">
                   <div className="p-3 bg-red-50 border border-red-100 rounded-xl relative z-10">
                     <p className="text-sm font-bold text-red-800">Unusual housing allowance detected</p>
                     <p className="text-xs text-red-600 mt-1">Profile: <strong>John Doe (Senior Pastor)</strong> has a duplicated housing allowance entry in the upcoming scheduled run. Predicted duplication variance: $500.</p>
                     <button className="mt-2 text-xs font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">Review Entry</button>
                   </div>
                   <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl relative z-10">
                     <p className="text-sm font-bold text-amber-800">Tax bracket mismatch possibility</p>
                     <p className="text-xs text-amber-700 mt-1">Recent base salary increase for <strong>Jane Smith</strong> might push her into the 25% tax bracket next month. Adjust PAYE deductions accordingly.</p>
                   </div>
                </div>
              </div>

              {/* Compensation Recommendations */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5 bg-emerald-500 w-32 h-32 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                 <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <Lightbulb size={18} className="text-emerald-500" />
                  Smart Compensation Insights
                </h3>
                <ul className="space-y-4">
                  <li className="flex gap-3 items-start relative z-10">
                    <div className="mt-0.5 p-1 bg-emerald-100 text-emerald-600 rounded">
                      <Users size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Choir Director Stipends Below Average</p>
                      <p className="text-xs text-slate-500 mt-1">Stipends for Choir Directors are currently 15% below the district average for comparable branch sizes. Consider a $100 adjustment.</p>
                    </div>
                  </li>
                  <li className="flex gap-3 items-start relative z-10">
                    <div className="mt-0.5 p-1 bg-blue-100 text-blue-600 rounded">
                      <ArrowUpRight size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Volunteer Retention Risk</p>
                      <p className="text-xs text-slate-500 mt-1">3 key volunteers haven't received a welfare/honorarium bump in over 18 months. Historically, this precedes a 40% drop in availability.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </>
      )}
    </motion.div>
  );
}
