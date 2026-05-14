import React, { useState } from 'react';
import { X, Upload, Plus, FileText, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useExpenseStore } from '../stores/expenseStore';

interface CreateExpenseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledData: any; // We can use OCR data here
}

export default function CreateExpenseDrawer({ isOpen, onClose, prefilledData }: CreateExpenseDrawerProps) {
  const { addRequest } = useExpenseStore();

  const [title, setTitle] = useState(prefilledData?.description || '');
  const [amount, setAmount] = useState<number>(prefilledData?.amount || 0);
  const [vendor, setVendor] = useState(prefilledData?.vendorName || '');

  // Add more states as needed...

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate generic creation
    addRequest({
      id: `EXP-${Math.floor(Math.random() * 10000)}`,
      title,
      departmentId: 'dept-1',
      departmentName: 'General',
      branchId: 'b-1',
      fundId: 'f-1',
      expenseType: 'Misc',
      amount,
      priority: 'Normal',
      description: 'Newly created request',
      expenseDate: new Date().toISOString(),
      status: 'Pending Review',
      requestedBy: 'Current User',
      createdAt: new Date().toISOString()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
       <motion.div 
         initial={{ x: '100%' }}
         animate={{ x: 0 }}
         exit={{ x: '100%' }}
         transition={{ type: 'spring', damping: 25, stiffness: 200 }}
         className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col"
       >
         <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
           <div>
             <h2 className="text-lg font-bold text-slate-900">New Expense Request</h2>
             <p className="text-sm text-slate-500">Submit a new request for approval</p>
           </div>
           <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
             <X size={20} />
           </button>
         </div>

         <div className="flex-1 overflow-y-auto p-6">
            <form id="create-expense-form" onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Basic Details</h3>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Expense Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500"
                    placeholder="e.g. Monthly Internet Bill"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Amount (Le)</label>
                    <input 
                      type="number" 
                      value={amount || ''}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      required
                      min={1}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Priority</label>
                    <select className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500 bg-white">
                      <option>Normal</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Allocation</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                    <select className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500 bg-white">
                      <option>Administration</option>
                      <option>Media</option>
                      <option>Youth Ministry</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Fund</label>
                    <select className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500 bg-white">
                      <option>General Fund</option>
                      <option>Building Fund</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Vendor & Documentation</h3>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Vendor</label>
                  <input 
                    type="text" 
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500"
                    placeholder="Enter vendor name..."
                  />
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase">Supporting Documents</label>
                   <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                      <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                      <p className="text-sm font-medium text-slate-700">Click to upload invoice or receipts</p>
                      <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG up to 10MB</p>
                   </div>
                </div>
              </div>

            </form>
         </div>

         <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
           <button 
             type="button" 
             onClick={onClose}
             className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
           >
             Cancel
           </button>
           <button 
             type="submit" 
             form="create-expense-form"
             className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
           >
             Submit Request
           </button>
         </div>
       </motion.div>
    </div>
  );
}
