import { create } from 'zustand';

export interface DonationCategory {
  id: string;
  name: string;
  description: string;
  fundId: string;
}

export interface DonorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalGiven: number;
}

export interface DonationTransaction {
  id: string;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
  donorName: string;
  donorId?: string;
  categoryId: string;
  categoryName: string;
  method: string;
  reference: string;
  amount: number;
  currency: string;
  receiptUrl?: string;
}

export interface RecurringDonation {
  id: string;
  donorId: string;
  donorName: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  currency: string;
  frequency: 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  status: 'Active' | 'Paused' | 'Cancelled';
  nextBillingDate: string;
  paymentMethod: string;
}

export interface Pledge {
  id: string;
  donorId: string;
  donorName: string;
  campaignId: string;
  campaignName: string;
  totalPledged: number;
  totalPaid: number;
  currency: string;
  status: 'Active' | 'Completed' | 'Overdue';
  dueDate: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  raisedAmount: number;
  currency: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Completed' | 'Draft';
  imageUrl?: string;
}

interface DonationState {
  categories: DonationCategory[];
  donors: DonorProfile[];
  transactions: DonationTransaction[];
  recurring: RecurringDonation[];
  pledges: Pledge[];
  campaigns: Campaign[];
  currencies: { code: string; symbol: string; rate: number }[];
  addTransaction: (transaction: DonationTransaction) => void;
  updateTransactionStatus: (id: string, status: 'Completed' | 'Pending' | 'Failed') => void;
  addDonor: (donor: DonorProfile) => void;
  addCategory: (category: DonationCategory) => void;
  addRecurring: (recurring: RecurringDonation) => void;
  updateRecurringStatus: (id: string, status: 'Active' | 'Paused' | 'Cancelled') => void;
  addPledge: (pledge: Pledge) => void;
  recordPledgePayment: (id: string, amount: number) => void;
  addCampaign: (campaign: Campaign) => void;
}

export const useDonationStore = create<DonationState>((set) => ({
  categories: [
    { id: 'cat-1', name: 'Tithe', description: 'Tenth of income', fundId: 'fund-general' },
    { id: 'cat-2', name: 'Offering', description: 'General offering', fundId: 'fund-general' },
    { id: 'cat-3', name: 'Building Fund', description: 'For church construction', fundId: 'fund-building' },
    { id: 'cat-4', name: 'Thanksgiving', description: 'Special thanksgiving', fundId: 'fund-general' },
  ],
  donors: [
    { id: 'donor-1', name: 'James Koroma', email: 'james@example.com', phone: '076123456', totalGiven: 1500 },
    { id: 'donor-2', name: 'Sarah Bangura', email: 'sarah.b@example.com', phone: '077987654', totalGiven: 5000 },
  ],
  transactions: [
    { id: 'TX-1234812', date: '2026-05-14T10:42:00Z', status: 'Completed', donorName: 'James Koroma', donorId: 'donor-1', categoryId: 'cat-1', categoryName: 'Tithe', method: 'Orange Money', reference: 'OM-9921', amount: 1500, currency: 'SLE', receiptUrl: '/receipts/tx-1234812.pdf' },
    { id: 'MAN-9912', date: '2026-05-14T09:15:00Z', status: 'Completed', donorName: 'Anonymous', categoryId: 'cat-2', categoryName: 'Offering', method: 'Cash', reference: 'CSH-1', amount: 200, currency: 'SLE' },
  ],
  recurring: [
    { id: 'rec-1', donorId: 'donor-1', donorName: 'James Koroma', categoryId: 'cat-1', categoryName: 'Tithe', amount: 1500, currency: 'SLE', frequency: 'Monthly', status: 'Active', nextBillingDate: '2026-06-14T10:42:00Z', paymentMethod: 'Orange Money' },
    { id: 'rec-2', donorId: 'donor-2', donorName: 'Sarah Bangura', categoryId: 'cat-3', categoryName: 'Building Fund', amount: 500, currency: 'SLE', frequency: 'Weekly', status: 'Paused', nextBillingDate: '2026-05-21T09:00:00Z', paymentMethod: 'Bank Transfer' }
  ],
  pledges: [
    { id: 'pl-1', donorId: 'donor-2', donorName: 'Sarah Bangura', campaignId: 'camp-1', campaignName: 'New Church Roof', totalPledged: 20000, totalPaid: 5000, currency: 'SLE', status: 'Active', dueDate: '2026-12-31T23:59:59Z' },
    { id: 'pl-2', donorId: 'donor-1', donorName: 'James Koroma', campaignId: 'camp-2', campaignName: 'Youth Summer Retreat', totalPledged: 5000, totalPaid: 5000, currency: 'SLE', status: 'Completed', dueDate: '2026-06-30T23:59:59Z' }
  ],
  campaigns: [
    { id: 'camp-1', name: 'New Church Roof', description: 'Re-roofing the main auditorium before rainy season.', targetAmount: 50000, raisedAmount: 32500, currency: 'SLE', startDate: '2026-01-01T00:00:00Z', endDate: '2026-06-01T00:00:00Z', status: 'Active' },
    { id: 'camp-2', name: 'Youth Summer Retreat', description: 'Annual retreat for the youth ministry.', targetAmount: 15000, raisedAmount: 14200, currency: 'SLE', startDate: '2026-03-01T00:00:00Z', endDate: '2026-05-30T00:00:00Z', status: 'Active' }
  ],
  currencies: [
    { code: 'SLE', symbol: 'Le', rate: 1 },
    { code: 'USD', symbol: '$', rate: 22.5 },
    { code: 'GBP', symbol: '£', rate: 28.1 },
    { code: 'EUR', symbol: '€', rate: 24.3 }
  ],
  addTransaction: (transaction) => set((state) => ({ transactions: [transaction, ...state.transactions] })),
  updateTransactionStatus: (id, status) => set((state) => ({
    transactions: state.transactions.map(tx => tx.id === id ? { ...tx, status } : tx)
  })),
  addDonor: (donor) => set((state) => ({ donors: [...state.donors, donor] })),
  addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
  addRecurring: (recurring) => set((state) => ({ recurring: [...state.recurring, recurring] })),
  updateRecurringStatus: (id, status) => set((state) => ({
    recurring: state.recurring.map(r => r.id === id ? { ...r, status } : r)
  })),
  addPledge: (pledge) => set((state) => ({ pledges: [...state.pledges, pledge] })),
  recordPledgePayment: (id, amount) => set((state) => ({
    pledges: state.pledges.map(p => p.id === id ? { 
      ...p, 
      totalPaid: p.totalPaid + amount,
      status: (p.totalPaid + amount) >= p.totalPledged ? 'Completed' : p.status
    } : p)
  })),
  addCampaign: (campaign) => set((state) => ({ campaigns: [...state.campaigns, campaign] }))
}));
