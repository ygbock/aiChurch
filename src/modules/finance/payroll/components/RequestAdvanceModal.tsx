import React, { useState } from 'react';
import { usePayrollStore } from '../stores/usePayrollStore';
import { motion } from 'motion/react';
import { X, AlertCircle } from 'lucide-react';
import { SalaryAdvance, AdvanceStatus, PayrollProfile } from '../types';

interface RequestAdvanceModalProps {
  onClose: () => void;
}

export default function RequestAdvanceModal({ onClose }: RequestAdvanceModalProps) {
  const { profiles, createAdvance, advances } = usePayrollStore();
  const [formData, setFormData] = useState<Partial<SalaryAdvance>>({
    amountRequested: 0,
    repaymentMonths: 1,
    purpose: '',
    isEmergency: false,
  });

  const [error, setError] = useState('');

  const activeProfiles = profiles.filter(p => p.isActive);
  const selectedProfile = activeProfiles.find(p => p.id === formData.profileId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.profileId || !formData.amountRequested || !formData.purpose) {
      setError('Please fill all required fields');
      return;
    }

    if (formData.amountRequested <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    // Limit check: For non-emergency, max 50% of basic salary
    if (!formData.isEmergency && selectedProfile) {
      const maxAllowed = selectedProfile.baseSalary * 0.5;
      if (formData.amountRequested > maxAllowed) {
        setError(`Non-emergency advance is limited to 50% of basic salary ($${maxAllowed.toLocaleString()})`);
        return;
      }
    }

    // Check if they already have an active un-repaid advance
    const existingActive = advances.find(
      a => a.profileId === formData.profileId && ['pending_finance', 'pending_treasurer', 'approved', 'paid', 'repaying'].includes(a.status)
    );
    if (existingActive) {
      setError('Employee already has an active advance. Cannot request a new one until repaid.');
      return;
    }

    const monthlyDeduction = formData.amountRequested / (formData.repaymentMonths || 1);

    const newAdvance: Omit<SalaryAdvance, 'id'> = {
      profileId: formData.profileId,
      employeeName: selectedProfile ? `${selectedProfile.firstName} ${selectedProfile.lastName}` : 'Unknown',
      amountRequested: formData.amountRequested,
      remainingBalance: formData.amountRequested,
      monthlyDeduction,
      repaymentMonths: formData.repaymentMonths || 1,
      purpose: formData.purpose,
      isEmergency: !!formData.isEmergency,
      status: 'pending_finance',
      requestDate: new Date().toISOString(),
    };

    createAdvance(newAdvance);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">Request Salary Advance</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
               <AlertCircle size={16} className="mt-0.5 shrink-0" />
               <p>{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Employee</label>
            <select
              required
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white"
              value={formData.profileId || ''}
              onChange={e => setFormData({ ...formData, profileId: e.target.value })}
            >
              <option value="">Select Employee</option>
              {activeProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName} (Basic: ${p.baseSalary})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount Requested</label>
              <input
                type="number"
                required
                min="1"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white"
                value={formData.amountRequested || ''}
                onChange={e => setFormData({ ...formData, amountRequested: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Repayment Months</label>
              <input
                type="number"
                required
                min="1"
                max="12"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white"
                value={formData.repaymentMonths || ''}
                onChange={e => setFormData({ ...formData, repaymentMonths: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purpose</label>
            <textarea
              required
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white resize-none h-24"
              value={formData.purpose || ''}
              onChange={e => setFormData({ ...formData, purpose: e.target.value })}
            />
          </div>

          <label className="p-3 border border-amber-200 bg-amber-50 rounded-lg flex items-start gap-3 cursor-pointer select-none hover:bg-amber-100 transition-colors">
            <input
              type="checkbox"
              className="mt-1"
              checked={formData.isEmergency || false}
              onChange={e => setFormData({ ...formData, isEmergency: e.target.checked })}
            />
            <div>
              <p className="text-sm font-bold text-amber-900">Emergency Advance</p>
              <p className="text-xs text-amber-700 mt-0.5">Bypasses the 50% limit. Requires special treasurer approval.</p>
            </div>
          </label>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm">
              Submit Request
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
