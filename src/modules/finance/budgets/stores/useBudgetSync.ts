import { useEffect } from 'react';
import { useBudgetStore } from './budgetStore';

const dummyPlans = [
  {
    id: 'bp-1',
    name: 'Media Department Budget 2026',
    fiscalYear: '2026',
    departmentId: 'dept-media',
    departmentName: 'Media',
    branchId: 'b-1',
    fundId: 'f-1',
    annualAllocation: 50000,
    remainingAmount: 5000,
    consumedAmount: 45000,
    status: 'Approved',
    monthlyAllocationStrategy: 'Equal',
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'user-1',
    notes: 'Approved by Senior Pastor'
  },
  {
    id: 'bp-2',
    name: 'Youth Ministry Budget 2026',
    fiscalYear: '2026',
    departmentId: 'dept-youth',
    departmentName: 'Youth',
    branchId: 'b-1',
    fundId: 'f-2',
    annualAllocation: 120000,
    remainingAmount: 85000,
    consumedAmount: 35000,
    status: 'Approved',
    monthlyAllocationStrategy: 'Equal',
    createdAt: '2026-01-05T00:00:00Z',
    createdBy: 'user-2'
  },
  {
    id: 'bp-3',
    name: 'Welfare Fund Budget 2026',
    fiscalYear: '2026',
    departmentId: 'dept-welfare',
    departmentName: 'Welfare',
    branchId: 'b-1',
    fundId: 'f-3',
    annualAllocation: 300000,
    remainingAmount: 280000,
    consumedAmount: 20000,
    status: 'Approved',
    monthlyAllocationStrategy: 'Manual',
    createdAt: '2026-01-10T00:00:00Z',
    createdBy: 'user-1'
  }
];

const dummyCategories = [
  { id: 'cat-1', budgetId: 'bp-1', name: 'Equipment', allocation: 20000, spent: 19500, spendingLimitType: 'Hard' },
  { id: 'cat-2', budgetId: 'bp-1', name: 'Software Licenses', allocation: 10000, spent: 9000, spendingLimitType: 'Hard' },
  { id: 'cat-3', budgetId: 'bp-1', name: 'Repairs & Maintenance', allocation: 20000, spent: 16500, spendingLimitType: 'Soft' },
  
  { id: 'cat-4', budgetId: 'bp-2', name: 'Camps & Retreats', allocation: 80000, spent: 15000, spendingLimitType: 'Hard' },
  { id: 'cat-5', budgetId: 'bp-2', name: 'Outreach', allocation: 40000, spent: 20000, spendingLimitType: 'Soft' },
];

const dummyAlerts = [
  {
    id: 'al-1',
    budgetId: 'bp-1',
    message: 'Media Department Budget has reached 90% utilization.',
    type: 'Warning',
    status: 'Unread',
    createdAt: '2026-05-12T10:00:00Z'
  },
  {
    id: 'al-2',
    budgetId: 'bp-1',
    message: 'Equipment category is near hard limit.',
    type: 'Critical',
    status: 'Unread',
    createdAt: '2026-05-13T14:30:00Z'
  }
];

export function useBudgetSync() {
  const { setPlans, setCategories, setAlerts } = useBudgetStore();

  useEffect(() => {
    // In a real app we'd subscribe to Firebase collections here.
    // Setting dummy data for immediate hydration.
    setPlans(dummyPlans as any);
    setCategories(dummyCategories as any);
    setAlerts(dummyAlerts as any);
  }, [setPlans, setCategories, setAlerts]);
}
