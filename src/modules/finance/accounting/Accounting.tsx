import React, { useState } from 'react';
import { BookOpen, FileText, Download, Plus, ArrowRight, LayoutDashboard, ListTree, Repeat2, FolderHeart, FileSpreadsheet, ShieldAlert, ArrowRightLeft, Lock, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AccountingDashboard from './components/AccountingDashboard';
import ChartOfAccounts from './components/ChartOfAccounts';
import Journals from './components/Journals';
import GeneralLedger from './components/GeneralLedger';
import Funds from './components/Funds';
import AccountingReports from './components/AccountingReports';
import AuditTrail from './components/AuditTrail';
import BankReconciliation from './components/BankReconciliation';
import PeriodClosing from './components/PeriodClosing';
import Budgets from './components/Budgets';
import { useAccountingSync } from './store/useAccountingSync';

type Tab = 'dashboard' | 'coa' | 'journals' | 'ledger' | 'reconciliation' | 'funds' | 'budgets' | 'reports' | 'periods' | 'audit';

export default function Accounting() {
  useAccountingSync();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'coa', label: 'Chart of Accounts', icon: ListTree },
    { id: 'journals', label: 'Journals', icon: Plus },
    { id: 'ledger', label: 'General Ledger', icon: BookOpen },
    { id: 'reconciliation', label: 'Reconciliation', icon: ArrowRightLeft },
    { id: 'funds', label: 'Fund Accounting', icon: FolderHeart },
    { id: 'budgets', label: 'Budgets', icon: Target },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'periods', label: 'Period Closing', icon: Lock },
    { id: 'audit', label: 'Audit Trail', icon: ShieldAlert },
  ] as const;

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Accounting & Ledger</h1>
          <p className="text-slate-500 text-sm mt-1">Double-entry accounting, statements, and chart of accounts.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab('periods')}
            className="px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-sm transition-colors"
          >
            Close Period
          </button>
          <button 
            onClick={() => setActiveTab('journals')}
            className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 text-sm transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus size={16} /> New Journal Entry
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
          {activeTab === 'dashboard' && <AccountingDashboard />}
          {activeTab === 'coa' && <ChartOfAccounts />}
          {activeTab === 'journals' && <Journals />}
          {activeTab === 'ledger' && <GeneralLedger />}
          {activeTab === 'reconciliation' && <BankReconciliation />}
          {activeTab === 'funds' && <Funds />}
          {activeTab === 'budgets' && <Budgets />}
          {activeTab === 'reports' && <AccountingReports />}
          {activeTab === 'periods' && <PeriodClosing />}
          {activeTab === 'audit' && <AuditTrail />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

