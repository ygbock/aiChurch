import React, { useState } from 'react';
import { useBudgetStore } from '../stores/budgetStore';
import { Plus, Search, Filter, MoreVertical, FileText, CheckCircle2, Clock } from 'lucide-react';
import BudgetWizardModal from '../components/BudgetWizardModal';

export default function BudgetPlans() {
  const { plans } = useBudgetStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const filteredPlans = plans.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.departmentName.toLowerCase().includes(searchTerm.toLowerCase()));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Pending Approval': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Draft': return 'text-slate-700 bg-slate-50 border-slate-200';
      case 'Rejected': return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'Archived': return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle2 size={14} className="mr-1 inline" />;
      case 'Pending Approval': return <Clock size={14} className="mr-1 inline" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search budgets..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-white w-64"
            />
          </div>
          <button className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 bg-white">
            <Filter size={18} />
          </button>
        </div>
        
        <button 
           onClick={() => setIsWizardOpen(true)}
           className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 text-sm transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus size={16} /> Create Budget Plan
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left max-w-full">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Budget Name</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Fiscal Year</th>
                <th className="px-6 py-4 text-right">Allocation</th>
                <th className="px-6 py-4 text-right">Remaining</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredPlans.map((plan) => (
                <tr key={plan.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{plan.name}</p>
                    <p className="text-xs text-slate-500">{plan.id}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{plan.departmentName}</td>
                  <td className="px-6 py-4 text-slate-600">{plan.fiscalYear}</td>
                  <td className="px-6 py-4 text-emerald-600 font-bold text-right">Le {plan.annualAllocation.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-900 font-medium text-right">Le {plan.remainingAmount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(plan.status)}`}>
                        {getStatusIcon(plan.status)} {plan.status}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 text-slate-400 hover:text-slate-600 rounded">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPlans.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <FileText size={32} className="mx-auto mb-3 text-slate-300" />
                    <p>No budget plans found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BudgetWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
    </div>
  );
}
