import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  LayoutDashboard,
  CreditCard,
  Users,
  Tags,
  History,
  Repeat,
  Target,
  FileText,
  Megaphone,
  BarChart3
} from 'lucide-react';
import DonationsDashboard from './dashboard/DonationsDashboard';
import GivingPortal from './giving/GivingPortal';
import DonationTransactions from './transactions/DonationTransactions';
import DonorsList from './donors/DonorsList';
import DonationCategories from './categories/DonationCategories';
import RecurringGiving from './recurring/RecurringGiving';
import PledgeManagement from './pledges/PledgeManagement';
import ContributionStatements from './statements/ContributionStatements';
import CampaignFundraising from './campaigns/CampaignFundraising';
import DonationAnalytics from './analytics/DonationAnalytics';

type Tab = 'dashboard' | 'analytics' | 'giving' | 'transactions' | 'donors' | 'categories' | 'recurring' | 'pledges' | 'statements' | 'campaigns';

export default function Donations() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'AI Analytics', icon: BarChart3 },
    { id: 'giving', label: 'Giving Portal', icon: Heart },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'donors', label: 'Donors', icon: Users },
    { id: 'recurring', label: 'Recurring', icon: Repeat },
    { id: 'pledges', label: 'Pledges', icon: Target },
    { id: 'statements', label: 'Statements', icon: FileText },
    { id: 'categories', label: 'Categories', icon: Tags },
  ];

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Donations & Contributions</h1>
          <p className="text-slate-500 text-sm mt-1">Manage tithes, offerings, campaigns, and donor engagement.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab('giving')}
            className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 text-sm transition-colors shadow-sm flex items-center gap-2"
          >
            <CreditCard size={16} /> Process Donation
          </button>
        </div>
      </div>

      <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl w-full lg:w-fit overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white text-emerald-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'dashboard' && <DonationsDashboard />}
          {activeTab === 'analytics' && <DonationAnalytics />}
          {activeTab === 'giving' && <GivingPortal />}
          {activeTab === 'campaigns' && <CampaignFundraising />}
          {activeTab === 'transactions' && <DonationTransactions />}
          {activeTab === 'donors' && <DonorsList />}
          {activeTab === 'recurring' && <RecurringGiving />}
          {activeTab === 'pledges' && <PledgeManagement />}
          {activeTab === 'statements' && <ContributionStatements />}
          {activeTab === 'categories' && <DonationCategories />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

