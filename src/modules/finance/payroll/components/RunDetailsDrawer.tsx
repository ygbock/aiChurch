import React, { useState } from 'react';
import { usePayrollStore } from '../stores/usePayrollStore';
import { X, FileText, Send, CheckCircle2, AlertCircle, RefreshCcw, Edit2 } from 'lucide-react';
import { MonimePayoutService } from '../services/MonimePayoutService';
import { toast } from 'sonner';

interface RunDetailsDrawerProps {
  runId: string;
  onClose: () => void;
}

export default function RunDetailsDrawer({ runId, onClose }: RunDetailsDrawerProps) {
  const { runs, payslips, updateRunStatus, profiles, reversePayrollRun, overridePayslip } = usePayrollStore();
  const [isPaying, setIsPaying] = useState(false);
  const [editingSlipId, setEditingSlipId] = useState<string | null>(null);
  const [overrideAmount, setOverrideAmount] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  const run = runs.find(r => r.id === runId);
  const runPayslips = payslips.filter(p => p.runId === runId);

  if (!run) return null;

  const handleInitiatePayout = async () => {
    setIsPaying(true);
    toast.info('Initializing Monime Batch Payout...');

    const payoutRequests = runPayslips.flatMap(slip => {
      if (slip.paymentMethod === 'cash') {
          return []; // Do not process cash through Monime
      }

      if (slip.paymentMethod === 'split' && slip.splitPayments) {
          return slip.splitPayments.filter(sp => sp.method !== 'cash' && sp.method !== 'split').map((sp, idx) => ({
             payslipId: `${slip.id}-split-${idx}`,
             amount: sp.amount,
             currency: slip.currency || 'USD',
             method: sp.method as 'mobile_money' | 'bank_transfer' | 'wallet',
             recipientDetails: {
                 name: slip.employeeName,
                 accountReference: sp.account || 'N/A',
                 provider: sp.provider
             }
          }));
      }

      const profile = profiles.find(p => p.id === slip.profileId);
      const isMobile = slip.paymentMethod === 'mobile_money';
      
      return {
        payslipId: slip.id,
        amount: slip.netPay,
        currency: slip.currency || 'USD',
        method: slip.paymentMethod as 'mobile_money' | 'bank_transfer' | 'wallet',
        recipientDetails: {
          name: slip.employeeName,
          accountReference: isMobile ? (profile?.mobileMoneyDetails?.phoneNumber || 'N/A') : (profile?.bankDetails?.accountNumber || 'N/A'),
          provider: isMobile ? profile?.mobileMoneyDetails?.provider : profile?.bankDetails?.bankName
        }
      };
    });

    const responses = await MonimePayoutService.executeBatchPayout(payoutRequests as any);
    
    // Extract payout references
    const successfulPayouts = responses.filter(r => r.success && r.reference);
    if (successfulPayouts.length > 0) {
      usePayrollStore.getState().recordPayoutReferences(
        successfulPayouts.map(r => ({ payslipId: r.payslipId, reference: r.reference as string }))
      );
    }

    const successes = successfulPayouts.length;
    const failures = responses.length - successes;

    if (failures === 0) {
      toast.success('All payouts processed successfully');
      updateRunStatus(runId, 'paid', 'current-user-id'); // mark run as paid
    } else {
      toast.warning(`Payouts completed with ${failures} failures. Please review.`);
      updateRunStatus(runId, 'paid', 'current-user-id'); // Some states might be partial, simplify to paid
    }
    
    setIsPaying(false);
  };

  const handleReverseRun = () => {
    const reason = window.prompt("Enter reason for reversing this payroll run. This action will be audited.");
    if (reason) {
      reversePayrollRun(runId, reason, 'current-user-id');
      toast.success('Payroll run reversed successfully');
      onClose();
    }
  };

  const handleSaveOverride = (slipId: string) => {
    if (!overrideAmount || isNaN(Number(overrideAmount))) {
      toast.error('Invalid amount');
      return;
    }
    if (!overrideReason) {
      toast.error('You must provide a reason for the override');
      return;
    }
    const newNetPay = Number(overrideAmount);
    overridePayslip(slipId, { netPay: newNetPay }, overrideReason, 'current-user-id');
    toast.success('Payslip overridden successfully');
    setEditingSlipId(null);
    setOverrideAmount('');
    setOverrideReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Drawer */}
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-right">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{run.name} details</h2>
            <p className="text-sm text-slate-500">Run ID: {run.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 border border-slate-200 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Gross Pay</span>
              <p className="text-xl font-black text-slate-900 mt-1">${run.totalGross}</p>
            </div>
            <div className="p-4 border border-slate-200 bg-slate-50 rounded-xl">
              <span className="text-xs text-emerald-600 uppercase font-bold tracking-wider">Net Payout</span>
              <p className="text-xl font-black text-emerald-700 mt-1">${run.totalNetPay}</p>
            </div>
            <div className="p-4 border border-slate-200 bg-slate-50 rounded-xl">
              <span className="text-xs text-orange-600 uppercase font-bold tracking-wider">Deductions/Taxes</span>
              <p className="text-xl font-black text-orange-700 mt-1">${run.totalDeductions + run.totalTaxes}</p>
            </div>
          </div>

          <div className="mb-6 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Generated Payslips ({runPayslips.length})</h3>
            <div className="flex items-center gap-2">
              {run.status !== 'paid' && (
                 <button 
                  onClick={handleInitiatePayout} 
                  disabled={isPaying}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                 >
                   <Send size={16} />
                   {isPaying ? 'Processing via Monime...' : 'Initiate Payouts'}
                 </button>
              )}
              {run.status === 'paid' && (
                 <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold flex items-center gap-2">
                   <CheckCircle2 size={16} /> Paid out
                 </span>
              )}
              <button
                onClick={handleReverseRun}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium text-sm rounded-lg transition-colors"
              >
                Reverse Run
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {runPayslips.map(slip => (
              <div key={slip.id} className="p-4 border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors group">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        {slip.employeeName}
                        {slip.status === 'failed' && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">REVERSED</span>}
                      </p>
                      <p className="text-xs text-slate-500">{slip.role} • {slip.paymentMethod.replace('_', ' ')}</p>
                      {slip.payoutReference && (
                        <p className="text-[10px] text-emerald-600 mt-0.5 font-mono">Ref: {slip.payoutReference}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">${slip.netPay}</p>
                    {slip.taxes > 0 && <p className="text-[10px] text-slate-400">-${slip.taxes} Tax</p>}
                    {slip.payoutReference && <p className="text-[10px] text-emerald-600 font-mono">Ref: {slip.payoutReference}</p>}
                    <button
                      onClick={() => {
                        const newNet = window.prompt(`Override net pay for ${slip.employeeName}:`, slip.netPay.toString());
                        if (newNet && !isNaN(Number(newNet))) {
                           const reason = window.prompt("Reason for manual override:");
                           if (reason) {
                              usePayrollStore.getState().overridePayslip(slip.id, { netPay: Number(newNet) }, reason, 'current-user-id');
                           }
                        }
                      }}
                      className="text-[10px] text-indigo-600 hover:underline mt-1 block"
                    >
                      Override
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
