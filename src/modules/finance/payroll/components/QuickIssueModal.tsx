import React, { useState } from 'react';
import { usePayrollStore } from '../stores/usePayrollStore';
import { X, DollarSign, Send, User } from 'lucide-react';
import { PayrollProfile, Payslip } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

interface QuickIssueModalProps {
  onClose: () => void;
  recipients: PayrollProfile[];
}

export default function QuickIssueModal({ onClose, recipients }: QuickIssueModalProps) {
  const { createRun, setPayslips, payslips } = usePayrollStore();
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleIssue = async () => {
    if (!selectedProfileId || amount <= 0) {
      toast.error('Please select a recipient and enter a valid amount');
      return;
    }

    setIsProcessing(true);
    const profile = recipients.find(p => p.id === selectedProfileId);
    if (!profile) return;

    try {
      // Simulate creating a one-off run for this single person
      const runId = `run-manual-${uuidv4().slice(0, 8)}`;
      const now = new Date().toISOString();

      const newRun = {
        id: runId,
        name: `Quick Issue: ${profile.firstName} ${profile.lastName} - ${reason || 'One-time Honorarium'}`,
        periodStart: now,
        periodEnd: now,
        totalGross: amount,
        totalNetPay: amount,
        totalAllowances: 0,
        totalDeductions: 0,
        totalTaxes: 0,
        totalPensions: 0,
        status: 'approved' as const, // Auto-approved for quick issue
        branchId: profile.branchId,
        processedBy: 'System Admin',
        createdAt: now
      };

      const newSlip: Payslip = {
        id: `slip-${uuidv4().slice(0, 8)}`,
        runId: runId,
        profileId: profile.id,
        employeeName: `${profile.firstName} ${profile.lastName}`,
        role: profile.role,
        baseSalary: amount,
        allowances: [],
        deductions: [],
        grossPay: amount,
        netPay: amount,
        taxes: 0,
        pension: 0,
        paymentMethod: profile.paymentMethod,
        currency: profile.currency,
        status: 'paid' as const,
      };

      createRun(newRun);
      setPayslips([newSlip, ...payslips]);
      
      toast.success(`Successfully issued ${profile.currency} ${amount.toLocaleString()} to ${profile.firstName}`);
      onClose();
    } catch (err) {
      toast.error('Failed to issue payment');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative z-10 flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Quick Issue Stipend</h2>
            <p className="text-sm text-slate-500">One-time payment for honorariums or allowances</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Recipient</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                value={selectedProfileId}
                onChange={e => setSelectedProfileId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white appearance-none"
              >
                <option value="">-- Search or Select Recipient --</option>
                {recipients.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.role})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="number"
                value={amount || ''}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Reason / Memo</label>
            <textarea 
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Guest Speaker Honorarium, Sunday Service Transport..."
              className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white h-24 resize-none"
            />
          </div>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
             <p className="text-xs text-amber-800">
               <strong>Note:</strong> This payment will be finalized and marked as "Paid" immediately upon issuance. It will appear in the current month's reports.
             </p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            Cancel
          </button>
          <button 
            onClick={handleIssue}
            disabled={isProcessing || !selectedProfileId || amount <= 0}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : <><Send size={18} /> Issue Payment</>}
          </button>
        </div>
      </div>
    </div>
  );
}
