import { create } from 'zustand';
import { 
  ExpenseRequest, 
  ExpenseApproval,
  Vendor,
  PurchaseOrder,
  POItem,
  Reimbursement,
  PettyCashAccount,
  PettyCashTransaction
} from '../types';

interface ExpenseState {
  requests: ExpenseRequest[];
  approvals: ExpenseApproval[];
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  poItems: POItem[];
  reimbursements: Reimbursement[];
  pettyCashAccounts: PettyCashAccount[];
  pettyCashTransactions: PettyCashTransaction[];

  setRequests: (requests: ExpenseRequest[]) => void;
  setApprovals: (approvals: ExpenseApproval[]) => void;
  setVendors: (vendors: Vendor[]) => void;
  setPurchaseOrders: (purchaseOrders: PurchaseOrder[]) => void;
  setPoItems: (poItems: POItem[]) => void;
  setReimbursements: (reimbursements: Reimbursement[]) => void;
  setPettyCashAccounts: (pettyCashAccounts: PettyCashAccount[]) => void;
  setPettyCashTransactions: (pettyCashTransactions: PettyCashTransaction[]) => void;

  addRequest: (req: ExpenseRequest) => void;
  updateRequest: (id: string, updates: Partial<ExpenseRequest>) => void;
  addVendor: (vendor: Vendor) => void;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  requests: [],
  approvals: [],
  vendors: [],
  purchaseOrders: [],
  poItems: [],
  reimbursements: [],
  pettyCashAccounts: [],
  pettyCashTransactions: [],

  setRequests: (requests) => set({ requests }),
  setApprovals: (approvals) => set({ approvals }),
  setVendors: (vendors) => set({ vendors }),
  setPurchaseOrders: (purchaseOrders) => set({ purchaseOrders }),
  setPoItems: (poItems) => set({ poItems }),
  setReimbursements: (reimbursements) => set({ reimbursements }),
  setPettyCashAccounts: (pettyCashAccounts) => set({ pettyCashAccounts }),
  setPettyCashTransactions: (pettyCashTransactions) => set({ pettyCashTransactions }),

  addRequest: (req) => set((state) => ({ requests: [...state.requests, req] })),
  updateRequest: (id, updates) => set((state) => ({
    requests: state.requests.map(r => r.id === id ? { ...r, ...updates } : r)
  })),
  addVendor: (vendor) => set((state) => ({ vendors: [...state.vendors, vendor] })),
  updateVendor: (id, updates) => set((state) => ({
    vendors: state.vendors.map(v => v.id === id ? { ...v, ...updates } : v)
  }))
}));
