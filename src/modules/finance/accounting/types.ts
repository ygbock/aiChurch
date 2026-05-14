export type AccountCategory = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';

export interface Account {
  id: string;
  code: string;
  name: string;
  category: AccountCategory;
  isActive: boolean;
  parentAccountId?: string;
  branchId: string;
}

export interface Fund {
  id: string;
  name: string;
  description: string;
  isRestricted: boolean;
  balanceLimit?: number;
  branchId: string;
}

export interface JournalEntryLine {
  accountId: string;
  debit: number;
  credit: number;
}

export type JournalStatus = 'Draft' | 'Pending Approval' | 'Posted' | 'Reversed';

export interface JournalEntry {
  id: string;
  entryDate: string;
  description: string;
  status: JournalStatus;
  lines: JournalEntryLine[];
  fundId: string;
  branchId: string;
  reference?: string;
  attachments?: string[];
  createdBy: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  branchId: string;
  accountId: string;
  amount: number;
  createdAt: string;
}

export interface BalanceSheetData {
  assets: { account: Account; balance: number }[];
  liabilities: { account: Account; balance: number }[];
  equity: { account: Account; balance: number }[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}
