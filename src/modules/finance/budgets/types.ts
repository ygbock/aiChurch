export interface BudgetPlan {
  id: string;
  name: string;
  fiscalYear: string;
  departmentId: string;
  departmentName: string;
  branchId: string;
  fundId: string;
  annualAllocation: number;
  remainingAmount: number;
  consumedAmount: number;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Archived';
  monthlyAllocationStrategy: 'Equal' | 'Weighted' | 'Seasonal' | 'Manual';
  createdAt: string;
  createdBy: string;
  notes?: string;
}

export interface BudgetCategory {
  id: string;
  budgetId: string;
  name: string;
  parentCategoryId?: string;
  allocation: number;
  spent: number;
  spendingLimitType: 'Hard' | 'Soft';
}

export interface BudgetAllocation {
  id: string;
  budgetId: string;
  month: number; // 1-12
  amount: number;
}

export interface BudgetAdjustment {
  id: string;
  budgetId: string;
  amount: number;
  type: 'Increase' | 'Decrease' | 'Reallocation';
  reason: string;
  date: string;
  approvedBy?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface BudgetConsumption {
  id: string;
  budgetId: string;
  categoryId?: string;
  amount: number;
  expenseId?: string;
  payrollRunId?: string;
  journalEntryId?: string;
  date: string;
  description: string;
}

export interface BudgetApproval {
  id: string;
  budgetId: string;
  approverId: string;
  role: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  comment?: string;
  date?: string;
  stepOrder: number;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  message: string;
  type: 'Warning' | 'Critical' | 'Info';
  status: 'Unread' | 'Read' | 'Resolved';
  createdAt: string;
}

export interface BudgetTransfer {
  id: string;
  fromBudgetId: string;
  toBudgetId: string;
  amount: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  date: string;
  requestedBy: string;
  approvedBy?: string;
}
