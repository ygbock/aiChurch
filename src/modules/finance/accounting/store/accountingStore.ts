import { create } from 'zustand';
import { Account, Fund, JournalEntry, Budget, AccountCategory } from '../types';

interface AccountingState {
  accounts: Account[];
  funds: Fund[];
  journals: JournalEntry[];
  budgets: Budget[];
  isInitialized: boolean;
  
  // Actions
  setInitialized: (val: boolean) => void;
  setAccounts: (accounts: Account[]) => void;
  setFunds: (funds: Fund[]) => void;
  setJournals: (journals: JournalEntry[]) => void;
  setBudgets: (budgets: Budget[]) => void;

  addAccount: (account: Account) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  addFund: (fund: Fund) => void;
  addJournalEntry: (entry: JournalEntry) => void;
  postJournalEntry: (id: string) => void;
  reverseJournalEntry: (id: string) => void;
  addBudget: (budget: Budget) => void;
}

export const useAccountingStore = create<AccountingState>((set) => ({
  accounts: [],
  funds: [],
  journals: [],
  budgets: [],
  isInitialized: false,

  setInitialized: (val) => set({ isInitialized: val }),
  setAccounts: (accounts) => set({ accounts }),
  setFunds: (funds) => set({ funds }),
  setJournals: (journals) => set({ journals }),
  setBudgets: (budgets) => set({ budgets }),
  
  addAccount: (account) => set((state) => ({ accounts: [...state.accounts, account] })),
  updateAccount: (id, updates) => set((state) => ({
    accounts: state.accounts.map(acc => acc.id === id ? { ...acc, ...updates } : acc)
  })),
  addFund: (fund) => set((state) => ({ funds: [...state.funds, fund] })),
  addJournalEntry: (entry) => set((state) => ({ journals: [entry, ...state.journals] })),
  postJournalEntry: (id) => set((state) => ({
    journals: state.journals.map(j => j.id === id ? { ...j, status: 'Posted' } : j)
  })),
  reverseJournalEntry: (id) => set((state) => ({
    journals: state.journals.map(j => j.id === id ? { ...j, status: 'Reversed' } : j)
  })),
  addBudget: (budget) => set((state) => ({ budgets: [...state.budgets, budget] }))
}));
