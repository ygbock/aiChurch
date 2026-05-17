import React from 'react';
import { 
  Building2, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Banknote,
  AlertCircle
} from 'lucide-react';
import { usePayrollStore } from '../payroll/stores/usePayrollStore';
import { Link } from 'react-router-dom';

export default function TreasurerDashboard() {
  const { advances, runs } = usePayrollStore();

  const pendingTreasurerAdvances = advances.filter(a => a.status === 'pending_treasurer');
  const pendingPayrollRuns = runs.filter(r => r.approvalStage === 'treasurer' && r.status === 'pending_approval');

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] flex-col lg:flex-row bg-[#0B1E36] overflow-hidden">
      {/* Action Center (Left Panel) */}
      <div className="flex-1 p-6 lg:p-10 bg-slate-50 rounded-tr-[2.5rem] overflow-y-auto">
        <div className="max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <ShieldCheck className="text-indigo-600" size={32} />
              Treasurer's Desk
            </h1>
            <p className="text-slate-500 mt-2 text-sm max-w-xl">
              Secure environment for final financial approvals, cash flow management, and reviewing organizational liquidity.
            </p>
          </div>

          <div className="space-y-6">
            {/* Action Required: Payroll Runs */}
            <div className="bg-white border-2 border-indigo-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Banknote className="text-indigo-600" size={20} />
                  Payroll Approvals
                  <span className="ml-2 bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full text-xs">
                    {pendingPayrollRuns.length} pending
                  </span>
                </h2>
                <Link to="/finance/payroll" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                  Go to Payroll <ArrowRight size={14} />
                </Link>
              </div>
              
              {pendingPayrollRuns.length > 0 ? (
                <div className="space-y-4">
                  {pendingPayrollRuns.map(run => (
                    <div key={run.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="mb-3 sm:mb-0">
                        <p className="font-bold text-slate-900">{run.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">ID: {run.id} • Processed by: {run.processedBy}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-rose-600">-${run.totalGross.toLocaleString()}</p>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Total Liability</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 text-slate-500 bg-slate-50 p-4 rounded-xl">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                  <p className="text-sm font-medium">All payroll runs are approved.</p>
                </div>
              )}
            </div>

            {/* Action Required: Salary Advances */}
            <div className="bg-white border-2 border-amber-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="text-amber-600" size={20} />
                  Salary Advances
                  <span className="ml-2 bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full text-xs">
                    {pendingTreasurerAdvances.length} pending
                  </span>
                </h2>
                <Link to="/finance/payroll" className="text-sm font-medium text-amber-600 hover:text-amber-800 flex items-center gap-1">
                  Go to Advances <ArrowRight size={14} />
                </Link>
              </div>
              
              {pendingTreasurerAdvances.length > 0 ? (
                <div className="space-y-4">
                  {pendingTreasurerAdvances.map(adv => (
                    <div key={adv.id} className="flex items-center justify-between p-4 bg-amber-50/50 rounded-xl">
                      <div>
                        <p className="font-bold text-slate-900">{adv.employeeName}</p>
                        <p className="text-xs text-slate-500 mt-0.5 flex gap-2">
                          <span className="bg-white border text-slate-600 px-1 rounded">{adv.isEmergency ? 'Emergency' : 'Standard'}</span>
                          {adv.purpose}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-amber-700">${adv.amountRequested.toLocaleString()}</p>
                        <p className="text-[10px] uppercase font-bold text-amber-600/70">{adv.repaymentMonths} Mo. Repayment</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 text-slate-500 bg-slate-50 p-4 rounded-xl">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                  <p className="text-sm font-medium">No pending advances for approval.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Liquidity Sidebar (Right Panel) */}
      <div className="w-full lg:w-[380px] p-6 lg:p-10 flex flex-col gap-8 text-white relative">
        <div className="flex items-center gap-3 text-emerald-400">
          <Building2 size={24} />
          <h2 className="text-lg font-bold">Liquidity Control</h2>
        </div>

        <div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Total Operating Cash</p>
          <div className="text-4xl font-black tracking-tight text-white">$425,800.00</div>
          <div className="mt-2 flex items-center gap-2 text-emerald-400 text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Healthy Reserves (+5.2% MTD)
          </div>
        </div>

        <div className="border-t border-slate-700 pt-6">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">Accounts</p>
          <div className="space-y-4">
            <div className="bg-[#152a4a] border border-slate-700 p-4 rounded-xl flex justify-between items-center hover:border-slate-500 transition-colors cursor-pointer">
              <div>
                <p className="font-bold text-white text-sm">Main Checking</p>
                <p className="text-xs text-slate-400 font-mono mt-1">...4402</p>
              </div>
              <p className="font-bold font-mono text-emerald-400">$185,250.00</p>
            </div>
            
            <div className="bg-[#152a4a] border border-slate-700 p-4 rounded-xl flex justify-between items-center hover:border-slate-500 transition-colors cursor-pointer">
              <div>
                <p className="font-bold text-white text-sm">Savings Reserve</p>
                <p className="text-xs text-slate-400 font-mono mt-1">...9931</p>
              </div>
              <p className="font-bold font-mono text-emerald-400">$200,000.00</p>
            </div>

            <div className="bg-[#152a4a] border border-slate-700 p-4 rounded-xl flex justify-between items-center hover:border-slate-500 transition-colors cursor-pointer">
              <div>
                <p className="font-bold text-white text-sm">Petty Cash</p>
                <p className="text-xs text-slate-400 font-mono mt-1">N/A</p>
              </div>
              <p className="font-bold font-mono text-emerald-400">$550.00</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-700 pt-6 mt-auto">
          <button className="w-full py-3 bg-white text-[#0B1E36] rounded-xl font-bold hover:bg-slate-200 transition-colors shadow-lg">
            Download Treasury Report
          </button>
        </div>
      </div>
    </div>
  );
}
