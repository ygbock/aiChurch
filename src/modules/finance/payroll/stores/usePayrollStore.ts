import { create } from 'zustand';
import { PayrollProfile, PayrollRun, PayrollSchedule, Payslip, SalaryAdvance, AdvanceStatus, PensionScheme, EmploymentContract } from '../types';
import { useAuditLogger } from '../../../../core/audit/useAuditLogger';

interface PayrollState {
  profiles: PayrollProfile[];
  runs: PayrollRun[];
  schedules: PayrollSchedule[];
  payslips: Payslip[];
  advances: SalaryAdvance[];
  pensionSchemes: PensionScheme[];
  contracts: EmploymentContract[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setProfiles: (profiles: PayrollProfile[]) => void;
  setRuns: (runs: PayrollRun[]) => void;
  setSchedules: (schedules: PayrollSchedule[]) => void;
  setPayslips: (payslips: Payslip[]) => void;
  setContracts: (contracts: EmploymentContract[]) => void;
  
  overridePayslip: (slipId: string, updates: Partial<Payslip>, reason: string, userId: string) => void;
  recordPayoutReferences: (payouts: {payslipId: string, reference: string}[]) => void;
  reversePayrollRun: (runId: string, reason: string, userId: string) => void;

  createProfile: (profile: PayrollProfile) => void;
  updateProfile: (profile: PayrollProfile) => void;
  
  createAdvance: (advance: Omit<SalaryAdvance, 'id'>) => void;
  updateAdvanceStatus: (id: string, status: AdvanceStatus) => void;

  createContract: (contract: Omit<EmploymentContract, 'id'>) => void;
  updateContract: (contract: EmploymentContract) => void;

  createRun: (run: Partial<PayrollRun>) => void;
  updateRunStatus: (runId: string, status: PayrollRun['status'], approvedBy?: string) => void;
}

export const usePayrollStore = create<PayrollState>((set) => ({
  profiles: [
    {
      id: 'prof-1',
      firstName: 'John',
      lastName: 'Doe',
      role: 'Senior Pastor',
      employmentType: 'full_time',
      branchId: 'b-1',
      currency: 'USD',
      baseSalary: 5000,
      paymentMethod: 'bank_transfer',
      isActive: true,
      bankDetails: {
        bankName: 'Chase Bank',
        accountNumber: '123456789',
        accountName: 'John Doe',
      }
    },
    {
      id: 'prof-2',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'Choir Director',
      employmentType: 'honorarium',
      branchId: 'b-1',
      currency: 'USD',
      baseSalary: 500,
      paymentMethod: 'mobile_money',
      isActive: true,
      mobileMoneyDetails: {
        provider: 'CashApp',
        phoneNumber: '+1234567890',
        accountName: 'Jane Smith'
      }
    }
  ],
  runs: [
    {
        id: 'run-1',
        name: 'April 2026 Payroll',
        periodStart: '2026-04-01T00:00:00Z',
        periodEnd: '2026-04-30T23:59:59Z',
        totalGross: 5500,
        totalAllowances: 200,
        totalDeductions: 500,
        totalNetPay: 5200,
        totalTaxes: 400,
        totalPensions: 100,
        status: 'paid',
        branchId: 'b-1',
        processedBy: 'admin-1',
        approvedBy: 'pastor-1',
        createdAt: '2026-04-28T10:00:00Z',
        updatedAt: '2026-04-30T10:00:00Z'
    }
  ],
  schedules: [
    {
        id: 'sched-1',
        name: 'Monthly Staff Payroll',
        frequency: 'monthly',
        branchId: 'b-1',
        nextRunDate: '2026-05-28T00:00:00Z',
        cutoffDate: '2026-05-25T00:00:00Z',
        isActive: true
    }
  ],
  payslips: [
      {
          id: 'slip-1',
          runId: 'run-1',
          profileId: 'prof-1',
          employeeName: 'John Doe',
          role: 'Senior Pastor',
          baseSalary: 5000,
          allowances: [{ name: 'Housing', amount: 200 }],
          deductions: [{ name: 'Income Tax', amount: 400 }, { name: 'Pension', amount: 100 }],
          grossPay: 5200,
          taxes: 400,
          pension: 100,
          netPay: 4700,
          status: 'paid',
          paymentMethod: 'bank_transfer'
      },
      {
          id: 'slip-2',
          runId: 'run-1',
          profileId: 'prof-2',
          employeeName: 'Jane Smith',
          role: 'Choir Director',
          baseSalary: 500,
          allowances: [],
          deductions: [],
          grossPay: 500,
          taxes: 0,
          pension: 0,
          netPay: 500,
          status: 'paid',
          paymentMethod: 'mobile_money'
      }
  ],
  advances: [
      {
          id: 'adv-1',
          profileId: 'prof-1',
          employeeName: 'John Doe',
          amountRequested: 1000,
          remainingBalance: 500,
          monthlyDeduction: 100,
          purpose: 'Emergency medical expenses',
          status: 'repaying',
          requestDate: '2026-01-15T10:00:00Z',
          approvedDate: '2026-01-16T14:30:00Z',
          paidDate: '2026-01-18T09:00:00Z'
      }
  ],
  pensionSchemes: [
      {
          id: 'pens-1',
          name: 'National Social Security',
          provider: 'NASSIT',
          employeeContributionRate: 0.05,
          employerContributionRate: 0.10
      }
  ],
  contracts: [
      {
          id: 'contract-1',
          profileId: 'prof-1',
          employeeName: 'John Doe',
          contractType: 'full_time',
          startDate: '2023-01-01T00:00:00Z',
          status: 'active',
          renewalDate: '2027-01-01T00:00:00Z'
      },
      {
          id: 'contract-2',
          profileId: 'prof-2',
          employeeName: 'Jane Smith',
          contractType: 'honorarium',
          startDate: '2025-06-01T00:00:00Z',
          endDate: '2026-06-01T00:00:00Z',
          status: 'pending_renewal',
          notes: 'Contract expires soon.'
      }
  ],
  isLoading: false,
  error: null,

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setProfiles: (profiles) => set({ profiles }),
  setRuns: (runs) => set({ runs }),
  setSchedules: (schedules) => set({ schedules }),
  setPayslips: (payslips) => set({ payslips }),
  setContracts: (contracts) => set({ contracts }),

  overridePayslip: (slipId, updates, reason, userId) => {
    useAuditLogger.getState().logAction({
      userId,
      action: 'Payslip Manual Override',
      module: 'Payroll',
      details: `Payslip ${slipId} manually overridden. Reason: ${reason}`
    });
    set((state) => ({
      payslips: state.payslips.map(p => p.id === slipId ? { ...p, ...updates } : p)
    }));
  },

  recordPayoutReferences: (payouts) => {
    useAuditLogger.getState().logAction({
      userId: 'system',
      action: 'Payout References Recorded',
      module: 'Payroll',
      details: `Recorded external payout references for ${payouts.length} payslips.`
    });
    set((state) => {
      let nextPayslips = [...state.payslips];
      payouts.forEach(po => {
        // If it's a split payment, the id might be formatted as `${slipId}-split-${idx}`
        if (po.payslipId.includes('-split-')) {
          const [slipId, _, idxStr] = po.payslipId.split('-split-');
          const idx = parseInt(idxStr);
          const i = nextPayslips.findIndex(p => p.id === slipId);
          if (i > -1 && nextPayslips[i].splitPayments) {
            nextPayslips[i] = { ...nextPayslips[i] };
            const nextSplits = [...nextPayslips[i].splitPayments!];
            nextSplits[idx] = { ...nextSplits[idx], payoutReference: po.reference };
            nextPayslips[i].splitPayments = nextSplits;
          }
        } else {
          const i = nextPayslips.findIndex(p => p.id === po.payslipId);
          if (i > -1) {
             nextPayslips[i] = { ...nextPayslips[i], payoutReference: po.reference };
          }
        }
      });
      return { payslips: nextPayslips };
    });
  },

  reversePayrollRun: (runId, reason, userId) => {
    useAuditLogger.getState().logAction({
      userId,
      action: 'Payroll Run Reversed',
      module: 'Payroll',
      details: `Payroll run ${runId} was reversed. Reason: ${reason}`
    });
    set((state) => ({
      runs: state.runs.map(r => r.id === runId ? { ...r, status: 'reversed' } : r),
      payslips: state.payslips.map(p => p.runId === runId ? { ...p, status: 'failed' } : p)
    }));
  },

  createProfile: (profile) => {
    useAuditLogger.getState().logAction({
      userId: 'system', // or get from auth context if available
      action: 'Profile Created',
      module: 'Payroll',
      details: `Created payroll profile for ${profile.firstName} ${profile.lastName} with base salary ${profile.baseSalary}`
    });
    set((state) => ({ profiles: [...state.profiles, profile] }));
  },
  updateProfile: (profile) => {
    useAuditLogger.getState().logAction({
      userId: 'system',
      action: 'Profile Updated',
      module: 'Payroll',
      details: `Updated payroll profile for ${profile.firstName} ${profile.lastName} Settings (Salary: ${profile.baseSalary}, Role: ${profile.role})`
    });
    set((state) => ({
      profiles: state.profiles.map(p => p.id === profile.id ? profile : p)
    }));
  },

  createAdvance: (advance) => {
    useAuditLogger.getState().logAction({
      userId: 'system',
      action: 'Advance Requested',
      module: 'Payroll',
      details: `Requested ${advance.amountRequested} advance for ${advance.employeeName}`
    });
    set((state) => ({
      advances: [{ ...advance, id: `adv-${Date.now()}` }, ...state.advances]
    }));
  },

  updateAdvanceStatus: (id, status) => {
    useAuditLogger.getState().logAction({
      userId: 'system',
      action: 'Advance Status Changed',
      module: 'Payroll',
      details: `Advance ${id} status changed to ${status}`
    });
    set((state) => ({
      advances: state.advances.map(a => a.id === id ? { ...a, status } : a)
    }));
  },

  createContract: (contract) => {
    useAuditLogger.getState().logAction({
      userId: 'system',
      action: 'Contract Uploaded',
      module: 'Payroll',
      details: `Uploaded ${contract.contractType} contract for ${contract.employeeName}`
    });
    set((state) => ({
      contracts: [{ ...contract, id: `contract-${Date.now()}` }, ...state.contracts]
    }));
  },

  updateContract: (contract) => {
    useAuditLogger.getState().logAction({
      userId: 'system',
      action: 'Contract Updated',
      module: 'Payroll',
      details: `Updated contract ${contract.id} for ${contract.employeeName}`
    });
    set((state) => ({
      contracts: state.contracts.map(c => c.id === contract.id ? contract : c)
    }));
  },

  createRun: (run) => {
    const runId = run.id || `run-${Date.now()}`;
    useAuditLogger.getState().logAction({
      userId: run.processedBy || 'system',
      action: 'Payroll Drafted',
      module: 'Payroll',
      details: `Drafted payroll run ${run.name} (Total Gross: ${run.totalGross})`
    });
    set((state) => ({
    runs: [{
        ...run,
        id: runId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    } as PayrollRun, ...state.runs]
    }));
  },

  updateRunStatus: (runId, status, approvedBy) => {
    useAuditLogger.getState().logAction({
      userId: approvedBy || 'system',
      action: `Payroll ${status}`,
      module: 'Payroll',
      details: `Payroll run ${runId} status changed to ${status} by ${approvedBy || 'system'}`
    });
    set((state) => ({
      runs: state.runs.map(run => {
          if (run.id === runId) {
              return { ...run, status, approvedBy: approvedBy || run.approvedBy, updatedAt: new Date().toISOString() };
          }
          return run;
      })
    }));
  }
}));
