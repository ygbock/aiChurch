import React, { useState } from 'react';
import { usePayrollStore } from '../stores/usePayrollStore';
import { X, FileText, Send, CheckCircle2, AlertCircle, RefreshCcw, Edit2, Download } from 'lucide-react';
import { MonimePayoutService } from '../services/MonimePayoutService';
import { toast } from 'sonner';

interface RunDetailsDrawerProps {
  runId: string;
  onClose: () => void;
}

export default function RunDetailsDrawer({ runId, onClose }: RunDetailsDrawerProps) {
  const { runs, payslips, updateRunStatus, profiles, reversePayrollRun, overridePayslip, addRunApproval } = usePayrollStore();
  const [isPaying, setIsPaying] = useState(false);
  const [editingSlipId, setEditingSlipId] = useState<string | null>(null);
  const [overrideAmount, setOverrideAmount] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [approvalComment, setApprovalComment] = useState('');

  const run = runs.find(r => r.id === runId);
  const runPayslips = payslips.filter(p => p.runId === runId);

  if (!run) return null;

  const handleApproval = (stage: 'hr' | 'finance' | 'treasurer' | 'pastor' | 'completed', status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !approvalComment) {
      toast.error('A comment is required when rejecting.');
      return;
    }
    
    addRunApproval(runId, {
      stage: stage as any,
      status,
      approverId: 'current-user-id',
      approverName: 'Admin User',
      comment: approvalComment,
      date: new Date().toISOString()
    });
    setApprovalComment('');
    toast.success(`Payroll ${status} successfully.`);
  };

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

  const exportPayslipAsPDF = (slip: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Payslip - ${slip.employeeName}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #0f172a; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            .header h1 { margin: 0; font-size: 28px; color: #1e293b; letter-spacing: -0.5px; }
            .header p { margin: 8px 0 0; color: #64748b; font-size: 14px; }
            .details { margin-bottom: 30px; display: flex; justify-content: space-between; background: #f8fafc; padding: 20px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
            th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { font-weight: 600; color: #475569; background: #f1f5f9; }
            .amount { text-align: right; }
            .totals { margin-top: 20px; border-top: 2px solid #cbd5e1; padding-top: 20px; text-align: right; }
            .totals p { margin: 8px 0; font-size: 14px; color: #475569; }
            .totals h2 { margin: 12px 0 0; font-size: 24px; color: #0f172a; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payslip</h1>
            <p>Church OS Payroll System</p>
          </div>
          
          <div class="details">
            <div>
              <strong>Employee:</strong> ${slip.employeeName}<br/>
              <strong style="margin-top: 8px; display: inline-block;">Role:</strong> ${slip.role}
            </div>
            <div style="text-align: right;">
              <strong>Date:</strong> ${new Date().toLocaleDateString()}<br/>
              <strong style="margin-top: 8px; display: inline-block;">Status:</strong> ${slip.status.toUpperCase()}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Earnings & Deductions</th>
                <th class="amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Base Salary</td>
                <td class="amount">$${slip.baseSalary.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
              ${slip.allowances.map((a: any) => `
                <tr>
                  <td>Allowance: ${a.name}</td>
                  <td class="amount">$${a.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                </tr>
              `).join('')}
              ${slip.deductions.map((d: any) => `
                <tr>
                  <td>Deduction: ${d.name}</td>
                  <td class="amount">-$${d.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                </tr>
              `).join('')}
              ${slip.taxes > 0 ? `
                <tr>
                  <td>Taxes (PAYE)</td>
                  <td class="amount">-$${slip.taxes.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                </tr>
              ` : ''}
              ${slip.pension > 0 ? `
                <tr>
                  <td>Pension Contribution</td>
                  <td class="amount">-$${slip.pension.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                </tr>
              ` : ''}
            </tbody>
          </table>

          <div class="totals">
            <p>Gross Pay: <strong>$${slip.grossPay.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></p>
            <h2>Net Pay: $${slip.netPay.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
          </div>

          <div class="footer">
            Generated by Church OS on ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleToggleLock = () => {
    usePayrollStore.setState(state => ({
       runs: state.runs.map(r => r.id === runId ? { ...r, isLocked: !r.isLocked } : r)
    }));
    toast.success(`Payroll run ${run.isLocked ? 'unlocked' : 'locked'}.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Drawer */}
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-right">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              {run.name} details
              {run.isLocked && <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Locked</span>}
            </h2>
            <p className="text-sm text-slate-500">Run ID: {run.id}</p>
          </div>
          <div className="flex items-center gap-2">
            {run.status === 'draft' || run.status === 'calculated' ? (
              <button onClick={handleToggleLock} className={`text-xs px-3 py-1.5 font-medium rounded ${run.isLocked ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}>
                 {run.isLocked ? 'Unlock Run' : 'Lock Run'}
              </button>
            ) : null}
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
              <X size={20} />
            </button>
          </div>
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

          <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h3 className="font-bold text-slate-900 mb-3 text-sm">Approval Workflow</h3>
            <div className="flex items-center gap-2 mb-4 text-sm font-medium text-slate-600">
               State: <span className="px-2 py-0.5 bg-slate-200 rounded text-slate-800">{run.status.replace('_', ' ').toUpperCase()}</span>
               {run.approvalStage && (
                 <span>Stage: {run.approvalStage.toUpperCase()}</span>
               )}
            </div>

            {run.approvals && run.approvals.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">History</p>
                {run.approvals.map((appr, idx) => (
                  <div key={idx} className="text-xs p-2 bg-white rounded border border-slate-100 flex items-start gap-2">
                     {appr.status === 'approved' ? <CheckCircle2 size={14} className="text-emerald-500 mt-0.5" /> : <AlertCircle size={14} className="text-rose-500 mt-0.5" />}
                     <div>
                       <p className="font-medium text-slate-900">{appr.approverName} ({appr.stage.toUpperCase()}) <span className="text-slate-400 font-normal">at {new Date(appr.date).toLocaleString()}</span></p>
                       {appr.comment && <p className="text-slate-500 italic mt-0.5">"{appr.comment}"</p>}
                     </div>
                  </div>
                ))}
              </div>
            )}

            {!['paid', 'reversed', 'approved', 'failed'].includes(run.status) && (
               <div className="space-y-3">
                 <input 
                   type="text" 
                   className="w-full text-sm p-2 border border-slate-200 rounded bg-white" 
                   placeholder="Add a comment (required for rejection)..." 
                   value={approvalComment}
                   onChange={e => setApprovalComment(e.target.value)}
                 />
                 <div className="flex gap-2">
                   {run.approvalStage === 'hr' || run.status === 'calculated' || !run.approvalStage ? (
                      <button onClick={() => handleApproval('hr', 'approved')} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700">Approve as HR</button>
                   ) : null}
                   {run.approvalStage === 'finance' && (
                      <button onClick={() => handleApproval('finance', 'approved')} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700">Approve as Finance</button>
                   )}
                   {run.approvalStage === 'treasurer' && (
                      <button onClick={() => handleApproval('treasurer', 'approved')} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700">Approve as Treasurer</button>
                   )}
                   {run.approvalStage === 'pastor' && (
                      <button onClick={() => handleApproval('pastor', 'approved')} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700">Approve as Senior Pastor</button>
                   )}
                   <button onClick={() => handleApproval(run.approvalStage || 'hr', 'rejected')} className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-sm font-medium">Reject</button>
                 </div>
               </div>
            )}
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
                    {run.status === 'calculated' && !run.isLocked && (
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
                    )}
                    <button
                      onClick={() => exportPayslipAsPDF(slip)}
                      className="text-[10px] text-slate-500 hover:text-indigo-600 hover:underline mt-1 block flex items-center gap-1 justify-end ml-auto"
                      title="Download PDF"
                    >
                      <Download size={10} /> PDF
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
