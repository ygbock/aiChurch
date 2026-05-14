import { create } from 'zustand';
import { 
  BudgetPlan, 
  BudgetCategory, 
  BudgetAllocation, 
  BudgetAdjustment, 
  BudgetConsumption,
  BudgetApproval,
  BudgetAlert,
  BudgetTransfer 
} from '../types';

interface BudgetState {
  plans: BudgetPlan[];
  categories: BudgetCategory[];
  allocations: BudgetAllocation[];
  adjustments: BudgetAdjustment[];
  consumptions: BudgetConsumption[];
  approvals: BudgetApproval[];
  alerts: BudgetAlert[];
  transfers: BudgetTransfer[];

  setPlans: (plans: BudgetPlan[]) => void;
  setCategories: (categories: BudgetCategory[]) => void;
  setAllocations: (allocations: BudgetAllocation[]) => void;
  setAdjustments: (adjustments: BudgetAdjustment[]) => void;
  setConsumptions: (consumptions: BudgetConsumption[]) => void;
  setApprovals: (approvals: BudgetApproval[]) => void;
  setAlerts: (alerts: BudgetAlert[]) => void;
  setTransfers: (transfers: BudgetTransfer[]) => void;

  addPlan: (plan: BudgetPlan) => void;
  updatePlan: (id: string, updates: Partial<BudgetPlan>) => void;
  addConsumption: (consumption: BudgetConsumption) => void;
  markAlertRead: (id: string) => void;
}

export const useBudgetStore = create<BudgetState>((set) => ({
  plans: [],
  categories: [],
  allocations: [],
  adjustments: [],
  consumptions: [],
  approvals: [],
  alerts: [],
  transfers: [],

  setPlans: (plans) => set({ plans }),
  setCategories: (categories) => set({ categories }),
  setAllocations: (allocations) => set({ allocations }),
  setAdjustments: (adjustments) => set({ adjustments }),
  setConsumptions: (consumptions) => set({ consumptions }),
  setApprovals: (approvals) => set({ approvals }),
  setAlerts: (alerts) => set({ alerts }),
  setTransfers: (transfers) => set({ transfers }),

  addPlan: (plan) => set((state) => ({ plans: [...state.plans, plan] })),
  updatePlan: (id, updates) => set((state) => ({
    plans: state.plans.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
  addConsumption: (consumption) => set((state) => ({
    consumptions: [...state.consumptions, consumption]
  })),
  markAlertRead: (id) => set((state) => ({
    alerts: state.alerts.map(a => a.id === id ? { ...a, status: 'Read' } : a)
  }))
}));
