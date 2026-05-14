import React, { useState } from 'react';
import { useBudgetSync } from './stores/useBudgetSync';
import { 
  LayoutDashboard, 
  Map, 
  CheckSquare, 
  TrendingUp, 
  ArrowLeftRight, 
  FileSpreadsheet, 
  AlertCircle,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BudgetOverview from './analytics/BudgetOverview';
import BudgetPlans from './plans/BudgetPlans';
import BudgetTracking from './tracking/BudgetTracking';
import BudgetApprovals from './approvals/BudgetApprovals';
import BudgetTransfers from './transfers/BudgetTransfers';
import BudgetReports from './reports/BudgetReports';

type Tab = 'dashboard' | 'plans' | 'tracking' | 'approvals' | 'transfers' | 'reports';

export default function Budgets() {
  useBudgetSync();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'plans', label: 'Budget Plans', icon: Map },
    { id: 'tracking', label: 'Tracking & Allocations', icon: TrendingUp },
    { id: 'approvals', label: 'Approvals', icon: CheckSquare },
    { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  ] as const;

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Budget Management</h1>
          <p className="text-slate-500 text-sm mt-1">Financial control, ministry allocations, and accountability engine.</p>
        </div>
        <div className="flex gap-3">
          <button 
             onClick={() => setActiveTab('plans')}
             className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 text-sm transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus size={16} /> New Budget Request
          </button>
        </div>
      </div>

      <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl w-fit overflow-x-auto max-w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="w-full"
        >
          {activeTab === 'dashboard' && <BudgetOverview />}
          {activeTab === 'plans' && <BudgetPlans />}
          {activeTab === 'tracking' && <BudgetTracking />}
          {activeTab === 'approvals' && <BudgetApprovals />}
          {activeTab === 'transfers' && <BudgetTransfers />}
          {activeTab === 'reports' && <BudgetReports />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
