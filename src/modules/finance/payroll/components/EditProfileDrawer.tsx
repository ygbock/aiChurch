import React, { useState } from 'react';
import { usePayrollStore } from '../stores/usePayrollStore';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { PayrollProfile, EmploymentType, PaymentMethod } from '../types';

interface EditProfileDrawerProps {
  profile: PayrollProfile;
  onClose: () => void;
}

export default function EditProfileDrawer({ profile, onClose }: EditProfileDrawerProps) {
  const { updateProfile } = usePayrollStore();
  const [formData, setFormData] = useState<PayrollProfile>({ ...profile });

  const handleChange = (field: keyof PayrollProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateProfile(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Drawer */}
      <div className="w-full max-w-md bg-white h-full shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-right">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Edit Profile</h2>
            <p className="text-sm text-slate-500">{formData.firstName} {formData.lastName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Employment Details</h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
              <select 
                value={formData.isActive ? 'active' : 'inactive'} 
                onChange={e => handleChange('isActive', e.target.value === 'active')}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Role / Job Title</label>
              <input 
                type="text" 
                value={formData.role} 
                onChange={e => handleChange('role', e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Employment Type</label>
              <select 
                value={formData.employmentType} 
                onChange={e => handleChange('employmentType', e.target.value as EmploymentType)}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contractor</option>
                <option value="volunteer">Volunteer</option>
                <option value="honorarium">Honorarium (Event-based)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Compensation & Config</h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Base Salary / Primary Stipend</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                <input 
                  type="number" 
                  value={formData.baseSalary} 
                  onChange={e => handleChange('baseSalary', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Method</label>
              <select 
                value={formData.paymentMethod} 
                onChange={e => handleChange('paymentMethod', e.target.value as PaymentMethod)}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money / Wallet</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            {formData.paymentMethod === 'mobile_money' && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                <p className="text-xs font-bold text-slate-700">Mobile Money Configuration</p>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Provider</label>
                  <input 
                    type="text" 
                    value={formData.mobileMoneyDetails?.provider || ''} 
                    onChange={e => handleChange('mobileMoneyDetails', { ...formData.mobileMoneyDetails, provider: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                    placeholder="e.g. M-Pesa, Orange Money"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={formData.mobileMoneyDetails?.phoneNumber || ''} 
                    onChange={e => handleChange('mobileMoneyDetails', { ...formData.mobileMoneyDetails, phoneNumber: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                  />
                </div>
              </div>
            )}
            
            {formData.paymentMethod === 'bank_transfer' && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                <p className="text-xs font-bold text-slate-700">Bank Configuration</p>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Bank Name</label>
                  <input 
                    type="text" 
                    value={formData.bankDetails?.bankName || ''} 
                    onChange={e => handleChange('bankDetails', { ...formData.bankDetails, bankName: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Account Number</label>
                  <input 
                    type="text" 
                    value={formData.bankDetails?.accountNumber || ''} 
                    onChange={e => handleChange('bankDetails', { ...formData.bankDetails, accountNumber: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
             <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
               <h3 className="font-bold text-slate-900">Custom Allowances</h3>
               <button className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1">
                 <Plus size={14} /> Add
               </button>
             </div>
             <p className="text-xs text-slate-500 italic">Allowances configured globally or via structures can be overridden here.</p>
          </div>

          <div className="space-y-4">
             <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
               <h3 className="font-bold text-slate-900">Custom Deductions</h3>
               <button className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1">
                 <Plus size={14} /> Add
               </button>
             </div>
             <p className="text-xs text-slate-500 italic">Deductions configured globally (e.g. taxes, union dues) apply automatically.</p>
          </div>

        </div>

        <div className="p-6 border-t border-slate-100 bg-white">
          <button 
            onClick={handleSave} 
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save size={18} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
