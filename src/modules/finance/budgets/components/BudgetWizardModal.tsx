import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Plus, Trash2, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBudgetStore } from '../stores/budgetStore';

interface BudgetWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FISCAL_YEARS = ['2025', '2026', '2027'];
const FUNDS = [{ id: 'f-1', name: 'General Fund' }, { id: 'f-2', name: 'Welfare Fund' }, { id: 'f-3', name: 'Building Fund' }];
const DEPARTMENTS = [
  { id: 'dept-media', name: 'Media & Tech' },
  { id: 'dept-youth', name: 'Youth Ministry' },
  { id: 'dept-welfare', name: 'Welfare' },
  { id: 'dept-choir', name: 'Choir' },
  { id: 'dept-admin', name: 'Administration' },
];

export default function BudgetWizardModal({ isOpen, onClose }: BudgetWizardModalProps) {
  const { addPlan, setCategories, categories: existingCategories } = useBudgetStore();
  const [step, setStep] = useState(1);

  // Form State
  const [name, setName] = useState('');
  const [fiscalYear, setFiscalYear] = useState('2026');
  const [departmentId, setDepartmentId] = useState('');
  const [fundId, setFundId] = useState('');
  const [annualAllocation, setAnnualAllocation] = useState<number>(0);
  const [strategy, setStrategy] = useState<'Equal' | 'Weighted' | 'Seasonal' | 'Manual'>('Equal');
  const [notes, setNotes] = useState('');

  // Categories State
  const [categories, setLocalCategories] = useState<{ id: string, name: string, allocation: number, limitType: 'Hard'|'Soft' }[]>([]);

  if (!isOpen) return null;

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const handleAddCategory = () => {
    setLocalCategories([...categories, { id: Date.now().toString(), name: '', allocation: 0, limitType: 'Soft' }]);
  };

  const handleUpdateCategory = (id: string, field: string, value: any) => {
    setLocalCategories(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleRemoveCategory = (id: string) => {
    setLocalCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleSubmit = () => {
    const newBudgetId = `bp-${Date.now()}`;
    const departmentName = DEPARTMENTS.find(d => d.id === departmentId)?.name || 'Unknown';

    addPlan({
      id: newBudgetId,
      name,
      fiscalYear,
      departmentId,
      departmentName,
      branchId: 'b-1', // Default branch for now
      fundId,
      annualAllocation,
      remainingAmount: annualAllocation,
      consumedAmount: 0,
      status: 'Pending Approval',
      monthlyAllocationStrategy: strategy,
      createdAt: new Date().toISOString(),
      createdBy: 'currentUser',
      notes
    });

    const newCats = categories.map(c => ({
      id: `cat-${Date.now()}-${Math.random()}`,
      budgetId: newBudgetId,
      name: c.name,
      allocation: c.allocation,
      spent: 0,
      spendingLimitType: c.limitType
    }));

    setCategories([...existingCategories, ...newCats]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create Budget Plan</h2>
            <p className="text-sm text-slate-500">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h3 className="font-bold text-slate-800 text-lg">Budget Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Budget Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      placeholder="e.g. Youth Ministry Operations 2026"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Fiscal Year</label>
                    <select
                      value={fiscalYear}
                      onChange={(e) => setFiscalYear(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white"
                    >
                      {FISCAL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Department / Ministry</label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white"
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Funding Source</label>
                    <select
                      value={fundId}
                      onChange={(e) => setFundId(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white"
                    >
                      <option value="">Select Fund</option>
                      {FUNDS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Annual Allocation (Le)</label>
                    <input 
                      type="number" 
                      value={annualAllocation}
                      onChange={(e) => setAnnualAllocation(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Notes & Justification</label>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm min-h-[100px]"
                      placeholder="Briefly explain the purpose of this budget..."
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Budget Categories</h3>
                    <p className="text-sm text-slate-500">Break down the annual allocation into specific categories.</p>
                  </div>
                  <button onClick={handleAddCategory} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium flex items-center gap-2">
                    <Plus size={14} /> Add Category
                  </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-700">Total Allocation: <span className="font-bold">Le {annualAllocation.toLocaleString()}</span></span>
                    <span className="font-medium text-slate-700">Allocated to Categories: <span className="font-bold text-emerald-600">Le {categories.reduce((a,c) => a + c.allocation, 0).toLocaleString()}</span></span>
                  </div>
                </div>

                {categories.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                    <p className="text-slate-500 text-sm">No categories added yet. You can keep it as a single pool or break it down.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {categories.map((cat, index) => (
                      <div key={cat.id} className="flex flex-col sm:flex-row gap-4 p-4 border border-slate-200 rounded-xl items-end sm:items-center">
                        <div className="flex-1 space-y-1 w-full">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category Name</label>
                          <input 
                            type="text" 
                            value={cat.name}
                            onChange={(e) => handleUpdateCategory(cat.id, 'name', e.target.value)}
                            placeholder="e.g. Transportation"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500"
                          />
                        </div>
                        <div className="w-full sm:w-40 space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount (Le)</label>
                          <input 
                            type="number" 
                            value={cat.allocation}
                            onChange={(e) => handleUpdateCategory(cat.id, 'allocation', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500"
                          />
                        </div>
                        <div className="w-full sm:w-32 space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Limit Type</label>
                          <select 
                            value={cat.limitType}
                            onChange={(e) => handleUpdateCategory(cat.id, 'limitType', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500 bg-white"
                          >
                            <option value="Soft">Soft</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div>
                        <button onClick={() => handleRemoveCategory(cat.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Allocation Strategy & Review</h3>
                  <p className="text-sm text-slate-500">Define how the budget is distributed over the fiscal year.</p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                    <input 
                       type="radio" 
                       name="strategy" 
                       checked={strategy === 'Equal'}
                       onChange={() => setStrategy('Equal')}
                       className="mt-1" 
                    />
                    <div>
                      <span className="block font-bold text-slate-900">Equal Monthly Allocation</span>
                      <span className="block text-sm text-slate-500">Divide the budget equally across all 12 months. Best for consistent operational expenses.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                    <input 
                       type="radio" 
                       name="strategy" 
                       checked={strategy === 'Manual'}
                       onChange={() => setStrategy('Manual')}
                       className="mt-1" 
                    />
                    <div>
                      <span className="block font-bold text-slate-900">Manual / Custom</span>
                      <span className="block text-sm text-slate-500">Define custom amounts for specific months. You will do this after creation.</span>
                    </div>
                  </label>
                </div>

                <div className="bg-slate-100 p-6 rounded-2xl mt-8">
                  <h4 className="font-bold text-slate-900 mb-4">Budget Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Name:</span><span className="font-medium text-slate-900">{name || 'Unnamed Budget'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Department:</span><span className="font-medium text-slate-900">{DEPARTMENTS.find(d => d.id === departmentId)?.name || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Total Allocation:</span><span className="font-bold text-emerald-600">Le {annualAllocation.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Categories Defined:</span><span className="font-medium text-slate-900">{categories.length}</span></div>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between shrink-0">
          <button 
            onClick={step === 1 ? onClose : handlePrev}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {step === 1 ? 'Cancel' : <><ArrowLeft size={16} /> Back</>}
          </button>

          {step < 3 ? (
             <button 
                onClick={handleNext}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors flex items-center gap-2"
                disabled={!name || !departmentId || !annualAllocation}
              >
                Next <ArrowRight size={16} />
              </button>
          ) : (
            <button 
              onClick={handleSubmit}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors flex items-center gap-2"
            >
               Submit for Approval <CheckSquare size={16} />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
