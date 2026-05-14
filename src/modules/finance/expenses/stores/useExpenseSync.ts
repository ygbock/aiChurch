import { useEffect } from 'react';
import { useExpenseStore } from './expenseStore';

const dummyRequests = [
  {
    id: 'EXP-1001',
    title: 'New Camera Lens',
    departmentId: 'dept-media',
    departmentName: 'Media',
    branchId: 'b-1',
    fundId: 'f-1',
    expenseType: 'Equipment',
    amount: 4500,
    priority: 'Normal',
    description: 'Replacing the broken 50mm lens.',
    expenseDate: '2026-05-13T10:00:00Z',
    status: 'Pending Approval',
    requestedBy: 'John Doe',
    createdAt: '2026-05-13T09:00:00Z'
  },
  {
    id: 'EXP-1002',
    title: 'Conference Catering Deposit',
    departmentId: 'dept-youth',
    departmentName: 'Youth',
    branchId: 'b-1',
    fundId: 'f-2',
    expenseType: 'Events',
    amount: 2000,
    priority: 'High',
    description: '50% deposit for youth summit catering.',
    expenseDate: '2026-05-12T14:30:00Z',
    status: 'Pending Review',
    requestedBy: 'Jane Smith',
    createdAt: '2026-05-12T14:00:00Z'
  },
  {
    id: 'EXP-1003',
    title: 'Office Supplies',
    departmentId: 'dept-admin',
    departmentName: 'Admin',
    branchId: 'b-1',
    fundId: 'f-1',
    expenseType: 'Office Supplies',
    amount: 500,
    priority: 'Low',
    description: 'Printer ink and paper.',
    expenseDate: '2026-05-10T11:15:00Z',
    status: 'Approved',
    requestedBy: 'Mark Wilson',
    createdAt: '2026-05-10T10:00:00Z'
  }
];

const dummyVendors = [
  {
    id: 'ven-1',
    name: 'TechGear Solutions',
    type: 'Equipment',
    contactPerson: 'David Chen',
    phone: '077123456',
    email: 'sales@techgear.sl',
    address: '15 Tech Lane, Freetown',
    status: 'Active',
    createdAt: '2026-01-10T00:00:00Z'
  },
  {
    id: 'ven-2',
    name: 'Catering Pro',
    type: 'Services',
    contactPerson: 'Sarah Johnson',
    phone: '078987654',
    email: 'bookings@cateringpro.sl',
    address: '42 Food Street, Freetown',
    status: 'Active',
    createdAt: '2026-02-15T00:00:00Z'
  }
];

export function useExpenseSync() {
  const { setRequests, setVendors } = useExpenseStore();

  useEffect(() => {
    setRequests(dummyRequests as any);
    setVendors(dummyVendors as any);
  }, [setRequests, setVendors]);
}
