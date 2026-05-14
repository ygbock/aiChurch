import React, { useState } from 'react';
import { useBudgetStore } from '../stores/budgetStore';
import { AlertCircle, ChevronDown, ChevronUp, Search, ShieldAlert } from 'lucide-react';

export default function BudgetTracking() {
  const { plans, categories } = useBudgetStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBudgets, setExpandedBudgets] = useState<Set<string>>(new Set(plans.map(p => p.id)));

  const toggleBudget = (id: string) => {
    const newSet = new Set(expandedBudgets);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedBudgets(newSet);
  };

  const filteredPlans = plans.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search budgets..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-white w-full sm:w-80"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredPlans.map(plan => {
          const planCategories = categories.filter(c => c.budgetId === plan.id);
          const isExpanded = expandedBudgets.has(plan.id);
          const overallRatio = plan.annualAllocation > 0 ? (plan.consumedAmount / plan.annualAllocation) : 0;

          return (
            <div key={plan.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div 
                className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleBudget(plan.id)}
              >
                <div className="flex items-center gap-4">
                  <button className="p-1 text-slate-400 hover:text-slate-600 rounded">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  <div>
                    <h3 className="font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-slate-500">{plan.departmentName} • {plan.fiscalYear}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status</p>
                    <p className="text-sm font-medium text-slate-900">{plan.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Spent</p>
                    <p className="text-sm font-bold text-slate-900">Le {plan.consumedAmount.toLocaleString()} <span className="text-slate-400 font-normal">/ {plan.annualAllocation.toLocaleString()}</span></p>
                  </div>
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:flex shrink-0">
                    <div 
                      className={`h-full ${overallRatio > 0.9 ? 'bg-rose-500' : overallRatio > 0.7 ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                      style={{ width: `${Math.min(overallRatio * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-6">
                  <h4 className="text-sm font-bold text-slate-900 mb-4">Category Tracking</h4>
                  {planCategories.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No specific categories defined for this budget. Tracking is pooled.</p>
                  ) : (
                    <div className="space-y-4">
                      {planCategories.map(cat => {
                        const catRatio = cat.allocation > 0 ? (cat.spent / cat.allocation) : 0;
                        const isOverLimit = cat.spent > cat.allocation;
                        
                        return (
                          <div key={cat.id} className="bg-white p-4 rounded-xl border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-sm">{cat.name}</span>
                                {cat.spendingLimitType === 'Hard' && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 flex items-center gap-1">
                                    <ShieldAlert size={10} /> Hard Limit
                                  </span>
                                )}
                              </div>
                              <span className="font-medium text-sm text-slate-600">
                                Le {cat.spent.toLocaleString()} / <span className="text-slate-400">Le {cat.allocation.toLocaleString()}</span>
                              </span>
                            </div>
                            
                            <div className="w-full flex items-center gap-3">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                <div 
                                  className={`h-full ${isOverLimit ? 'bg-rose-500' : catRatio > 0.8 ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                                  style={{ width: `${Math.min(catRatio * 100, 100)}%` }}
                                />
                              </div>
                              <span className={`text-xs font-bold w-10 text-right ${isOverLimit ? 'text-rose-600' : 'text-slate-500'}`}>
                                {Math.round(catRatio * 100)}%
                              </span>
                            </div>
                            
                            {isOverLimit && (
                              <p className="text-xs text-rose-600 mt-2 flex items-center gap-1">
                                <AlertCircle size={12} /> Over budget by Le {(cat.spent - cat.allocation).toLocaleString()}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredPlans.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500">No matching budgets found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
