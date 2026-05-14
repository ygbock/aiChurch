export type ExpenseStatus = 'Draft' | 'Submitted' | 'Pending Review' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Paid' | 'Cancelled';
export type ExpensePriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export interface ExpenseRequest {
  id: string;
  title: string;
  departmentId: string;
  departmentName: string;
  branchId: string;
  fundId: string;
  budgetPlanId?: string;
  budgetCategoryId?: string;
  vendorId?: string;
  expenseType: string;
  amount: number;
  priority: ExpensePriority;
  description: string;
  expenseDate: string;
  status: ExpenseStatus;
  requestedBy: string;
  createdAt: string;
  attachments?: string[];
  receiptUrl?: string;
  invoiceUrl?: string;
}

export interface ExpenseApproval {
  id: string;
  expenseId: string;
  approverId: string;
  role: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  comment?: string;
  date?: string;
  stepOrder: number;
}

export type VendorStatus = 'Active' | 'Inactive' | 'Suspended';

export interface Vendor {
  id: string;
  name: string;
  type: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  taxId?: string;
  bankDetails?: string;
  mobileMoneyDetails?: string;
  status: VendorStatus;
  createdAt: string;
}

export type POStatus = 'Draft' | 'Submitted' | 'Approved' | 'Ordered' | 'Delivered' | 'Completed' | 'Cancelled';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  departmentId: string;
  branchId: string;
  fundId: string;
  totalAmount: number;
  deliveryDate: string;
  status: POStatus;
  createdAt: string;
  createdBy: string;
}

export interface POItem {
  id: string;
  poId: string;
  description: string;
  quantity: number;
  unitCost: number;
  taxes: number;
}

export interface Reimbursement {
  id: string;
  userId: string;
  userName: string;
  expenseId?: string;
  amount: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
  createdAt: string;
}

export interface PettyCashAccount {
  id: string;
  name: string;
  branchId: string;
  departmentId?: string;
  custodianId: string;
  balance: number;
  maxLimit: number;
}

export interface PettyCashTransaction {
  id: string;
  accountId: string;
  type: 'Replenish' | 'Expense';
  amount: number;
  description: string;
  date: string;
  receiptUrl?: string;
}
