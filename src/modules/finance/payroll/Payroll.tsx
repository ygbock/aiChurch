import React, { useState } from 'react';
import { usePayrollStore } from './stores/usePayrollStore';
import PayrollDashboard from './components/PayrollDashboard';
import PayrollProfiles from './components/PayrollProfiles';
import PayrollSchedules from './components/PayrollSchedules';
import SalaryAdvances from './components/SalaryAdvances';
import PayrollReports from './components/PayrollReports';
import PayrollAIInsights from './components/PayrollAIInsights';
import ContractManagement from './components/ContractManagement';
import PayrollAuditTrail from './components/PayrollAuditTrail';
import { Plus, ArrowRight, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AccountingAutomation } from '../accounting/services/automationRules';
import { toast } from 'sonner';
import { PayrollEngine } from './services/PayrollEngine';
import { systemEvents, Events } from '../../../core/events/EventBus';

export default function Payroll() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profiles' | 'contracts' | 'schedules' | 'advances' | 'reports' | 'ai_insights' | 'audit'>('dashboard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);

  const { createRun, setPayslips, payslips } = usePayrollStore();

  const handleRunPayroll = () => {
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      const { run, payslips: generatedSlips } = PayrollEngine.processPayrollRun(
          'May 2026 Monthly Payroll', 
          '2026-05-01T00:00:00Z', 
          '2026-05-31T23:59:59Z', 
          'b-1', 
          'admin-1'
      );

      createRun(run);
      setPayslips([...payslips, ...generatedSlips]);

      // Using the raw string so compiler doesn't complain about undefined Events maps
      systemEvents.publish('PAYROLL_PROCESSED' as any, { 
          runId: run.id,
          totalAmount: run.totalNetPay,
          branchId: run.branchId
      });

      // Sync to Accounting Ledger directly
      AccountingAutomation.syncPayroll(run.id, run.totalNetPay, new Date().toISOString());

      toast.success('Payroll Processed', { 
        description: `Run ${run.name} calculated successfully. Pending approval.` 
      });
      setIsProcessing(false);
      setShowRunModal(false);
    }, 1500);
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payroll & Stipends</h1>
          <p className="text-slate-500 text-sm mt-1">Manage staff salaries, volunteer stipends, and payout approvals.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowRunModal(true)} className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 text-sm transition-colors shadow-sm flex items-center gap-2">
            <Plus size={16} /> Run Payroll
          </button>
        </div>
      </div>

      <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl w-fit overflow-x-auto max-w-full hover-scrollbar">
        {['dashboard', 'profiles', 'contracts', 'advances', 'schedules', 'reports', 'ai_insights', 'audit'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
          >
            {tab === 'advances' ? 'Salary Advances' : tab === 'ai_insights' ? 'AI Insights' : tab === 'audit' ? 'Audit Logs' : tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && <PayrollDashboard key="dashboard" />}
        {activeTab === 'profiles' && <PayrollProfiles key="profiles" />}
        {activeTab === 'contracts' && <ContractManagement key="contracts" />}
        {activeTab === 'advances' && <SalaryAdvances key="advances" />}
        {activeTab === 'schedules' && <PayrollSchedules key="schedules" />}
        {activeTab === 'reports' && <PayrollReports key="reports" />}
        {activeTab === 'ai_insights' && <PayrollAIInsights key="ai_insights" />}
        {activeTab === 'audit' && <PayrollAuditTrail key="audit" />}
      </AnimatePresence>

      <AnimatePresence>
        {showRunModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900">Process Payroll</h3>
                <p className="text-sm text-slate-500 mt-1">Review and execute the current payroll run.</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center text-sm">
                   <div>
                       <p className="font-bold text-slate-900">May 2026 Salary Budget</p>
                       <p className="text-slate-500">Fund: General Ministry Fund</p>
                   </div>
                   <div className="text-right">
                       <p className="font-bold text-emerald-600">Available: $6,000</p>
                       <p className="text-slate-500">Estimated Run: ~$5,500</p>
                   </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-sm mt-4">
                  <ShieldAlert className="shrink-0" size={18} />
                  <div>
                    <p className="font-bold mb-1">Accounting & Budget Integration</p>
                    <p className="opacity-90 leading-relaxed">Processing this payroll will automatically generate encumbrances against the General Ministry budget and await Treasury workflow before Monime payout execution.</p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex justify-end gap-3">
                <button 
                  onClick={() => setShowRunModal(false)}
                  disabled={isProcessing}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRunPayroll}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing Engine...' : 'Run Payroll Engine'}
                  {!isProcessing && <ArrowRight size={16} />}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
