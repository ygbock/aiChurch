import React, { useState } from 'react';
import { useExpenseSync } from './stores/useExpenseSync';
import { 
  CreditCard, 
  Plus, 
  LayoutDashboard,
  FileText,
  CheckSquare,
  Users,
  ShoppingCart,
  Receipt,
  Wallet,
  BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ExpenseOverview from './analytics/ExpenseOverview';
import ExpenseRequests from './requests/ExpenseRequests';
import ExpenseApprovals from './approvals/ExpenseApprovals';
import VendorManagement from './vendors/VendorManagement';
import Procurement from './procurement/Procurement';
import Reimbursements from './reimbursements/Reimbursements';
import PettyCash from './petty-cash/PettyCash';
import ExpenseReports from './reports/ExpenseReports';
import CreateExpenseDrawer from './components/CreateExpenseDrawer';

type Tab = 'dashboard' | 'requests' | 'approvals' | 'vendors' | 'procurement' | 'reimbursements' | 'petty-cash' | 'reports';

export default function Expenses() {
  useExpenseSync();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'requests', label: 'Expense Requests', icon: FileText },
    { id: 'approvals', label: 'Approvals', icon: CheckSquare },
    { id: 'vendors', label: 'Vendors', icon: Users },
    { id: 'procurement', label: 'Procurement (POs)', icon: ShoppingCart },
    { id: 'reimbursements', label: 'Reimbursements', icon: Receipt },
    { id: 'petty-cash', label: 'Petty Cash', icon: Wallet },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
  ] as const;

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expenses & Procurement</h1>
          <p className="text-slate-500 text-sm mt-1">Enterprise-grade financial control, procurement workflows, and accountability engine.</p>
        </div>
        <div className="flex gap-3">
          <button 
             onClick={() => setIsDrawerOpen(true)}
             className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 text-sm transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus size={16} /> New Request
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
          {activeTab === 'dashboard' && <ExpenseOverview />}
          {activeTab === 'requests' && <ExpenseRequests />}
          {activeTab === 'approvals' && <ExpenseApprovals />}
          {activeTab === 'vendors' && <VendorManagement />}
          {activeTab === 'procurement' && <Procurement />}
          {activeTab === 'reimbursements' && <Reimbursements />}
          {activeTab === 'petty-cash' && <PettyCash />}
          {activeTab === 'reports' && <ExpenseReports />}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {isDrawerOpen && (
           <CreateExpenseDrawer 
             isOpen={isDrawerOpen} 
             onClose={() => setIsDrawerOpen(false)} 
             prefilledData={null}
           />
        )}
      </AnimatePresence>
    </div>
  );
}
