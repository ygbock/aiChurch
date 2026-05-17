export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'volunteer' | 'honorarium';
export type PaymentMethod = 'bank_transfer' | 'mobile_money' | 'cash' | 'wallet' | 'split';
export type CompensationModel = 'fixed_salary' | 'pastor_stipend' | 'volunteer_allowance' | 'per_service' | 'hourly' | 'contract_rate';

export type AdvanceStatus = 'pending_finance' | 'pending_treasurer' | 'approved' | 'paid' | 'repaying' | 'repaid' | 'rejected';
export type ContractStatus = 'active' | 'expired' | 'terminated' | 'pending_renewal';

export interface SplitAllocation {
  method: Exclude<PaymentMethod, 'split'>;
  percentage?: number;
  fixedAmount?: number;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  mobileMoneyDetails?: {
    provider: string;
    phoneNumber: string;
  };
}

export interface EmploymentContract {
  id: string;
  profileId: string;
  employeeName: string;
  contractType: EmploymentType;
  startDate: string;
  endDate?: string;
  documentUrl?: string; // Mock URL for uploaded contract
  status: ContractStatus;
  renewalDate?: string;
  notes?: string;
}

export interface SalaryAdvance {
  id: string;
  profileId: string;
  employeeName: string;
  amountRequested: number;
  remainingBalance: number;
  monthlyDeduction: number;
  repaymentMonths: number;
  purpose: string;
  isEmergency: boolean;
  status: AdvanceStatus;
  requestDate: string;
  financeReviewedAt?: string;
  treasurerApprovedAt?: string;
  paidDate?: string;
}

export type PensionCalculationBasis = 'basic_salary' | 'gross_pay' | 'basic_plus_taxable_allowances';

export interface PensionProvider {
  id: string;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  defaultEmployeeRate: number; // e.g. 0.05
  defaultEmployerRate: number; // e.g. 0.05
  calculationBasis: PensionCalculationBasis;
  isActive: boolean;
}

export interface PayrollProfile {
  id: string;
  memberId?: string; // Optional, linking to membership module
  employeeId?: string;
  firstName: string;
  lastName: string;
  role: string;
  employmentType: EmploymentType;
  departmentId?: string;
  districtId?: string;
  branchId: string;
  currency: string;
  compensationModel?: CompensationModel;
  baseSalary: number; // For non-stipend
  paymentMethod: PaymentMethod;
  splitAllocations?: SplitAllocation[];
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  mobileMoneyDetails?: {
    provider: string;
    phoneNumber: string;
    accountName: string;
  };
  taxProfile?: {
    taxId: string;
    taxBand: string;
    taxRuleId?: string;
    override?: Omit<TaxOverride, 'profileId'>;
  };
  pensionDetails?: {
    providerId: string;
    employeeContributionRate: number;
    employerContributionRate: number;
    pensionNumber: string;
    calculationBasisOverride?: PensionCalculationBasis;
  };
  allowances?: PayrollAllowance[];
  deductions?: PayrollDeduction[];
  isActive: boolean;
}

export type AllowanceType = 'housing' | 'transportation' | 'feeding' | 'communication' | 'welfare' | 'ministry_support' | 'risk_allowance' | 'bonus' | 'overtime' | 'custom';
export type DeductionType = 'tax' | 'pension' | 'loan' | 'advance' | 'welfare' | 'insurance' | 'disciplinary' | 'monthly_contribution' | 'custom';
export type CalculationMethod = 'fixed' | 'percentage_of_basic';

export interface TaxBracket {
  id: string;
  minIncome: number;
  maxIncome: number | null; // null for infinity
  rate: number; // Decimal representing percentage (e.g., 0.10 for 10%)
  baseAmount?: number; // Pre-calculated tax amount for the minIncome tier
}

export interface TaxRule {
  id: string;
  country: string;
  organizationId?: string;
  name: string;
  brackets: TaxBracket[];
  personalReliefAmount?: number; // Fixed exemption/relief amount subtracted from gross before tax
  personalReliefPercentage?: number; // Percentage exemption on gross income
  consolidatedReliefAmount?: number;
  isActive: boolean;
}

export interface TaxOverride {
  profileId: string;
  overrideType: 'fixed_amount' | 'percentage' | 'exempt';
  value: number; // The amount or percentage (0 for exempt)
}

export interface PayrollAllowance {
  id: string;
  profileId: string;
  type: AllowanceType;
  name: string;
  amount: number;
  calculationMethod: CalculationMethod;
  isTaxable: boolean;
  frequency: 'recurring' | 'one_time' | 'conditional';
  conditionExpression?: string; // Optional condition for conditional allowances
}

export interface PayrollDeduction {
  id: string;
  profileId: string;
  type: DeductionType;
  name: string;
  amount: number;
  calculationMethod: CalculationMethod;
  frequency: 'recurring' | 'one_time' | 'conditional';
  conditionExpression?: string; // For formulas
}

export type ScheduleFrequency = 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'event' | 'milestone';

export interface PayrollSchedule {
  id: string;
  name: string;
  frequency: ScheduleFrequency;
  branchId: string;
  nextRunDate: string;
  cutoffDate: string;
  autoGenerate: boolean;
  isLocked: boolean;
  targetRoles?: string[];
  targetEmploymentTypes?: EmploymentType[];
  targetCompensationModels?: CompensationModel[];
  isActive: boolean;
}

export type PayrollRunStatus = 'draft' | 'calculated' | 'pending_approval' | 'approved' | 'paid' | 'reversed' | 'failed';
export type ApprovalStage = 'hr' | 'finance' | 'treasurer' | 'pastor' | 'completed';

export interface ApprovalRecord {
  stage: ApprovalStage;
  approverId: string;
  approverName: string;
  status: 'approved' | 'rejected';
  comment?: string;
  date: string;
}

export interface PayrollRun {
  id: string;
  scheduleId?: string;
  name: string; // e.g. "May 2026 Monthly Payroll"
  periodStart: string;
  periodEnd: string;
  totalGross: number;
  totalAllowances: number;
  totalDeductions: number;
  totalNetPay: number;
  totalTaxes: number;
  totalPensions: number;
  totalEmployerPensions?: number;
  status: PayrollRunStatus;
  isLocked?: boolean;
  approvalStage?: ApprovalStage;
  approvals?: ApprovalRecord[];
  branchId: string;
  processedBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payslip {
  id: string;
  runId: string;
  profileId: string;
  employeeName: string;
  role: string;
  baseSalary: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  advanceDeductions?: { advanceId: string; amount: number }[];
  grossPay: number;
  netPay: number;
  taxes: number;
  pension: number;
  employerPension?: number;
  pensionProviderId?: string;
  currency?: string;
  status: 'pending' | 'paid' | 'failed';
  paymentMethod: PaymentMethod;
  payoutReference?: string;
  splitPayments?: { method: PaymentMethod, amount: number, provider?: string, account?: string, payoutReference?: string }[];
}
