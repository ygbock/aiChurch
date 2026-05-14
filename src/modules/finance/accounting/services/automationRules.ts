import { useAccountingStore } from '../store/accountingStore';

type DonationPayload = {
  id: string;
  amount: number;
  category: string;
  paymentMethod: string;
  date: string;
  donorName?: string;
  branchId?: string;
};

export const AccountingAutomation = {
  syncDonation: (donation: DonationPayload) => {
    // 1. Map payment method to Asset Account
    let debitAccountId = 'acc-1'; // Default Cash
    if (donation.paymentMethod === 'bank') debitAccountId = 'acc-2'; // Bank
    else if (['orange', 'afrimoney'].includes(donation.paymentMethod)) debitAccountId = 'acc-3'; // Mobile Money

    // 2. Map category to Income Account
    let creditAccountId = 'acc-7'; // Default Offering
    if (donation.category.toLowerCase().includes('tithe')) creditAccountId = 'acc-6';
    if (donation.category.toLowerCase().includes('building')) creditAccountId = 'acc-11'; // Assuming acc-11 is Building Fund Income
    if (donation.category.toLowerCase().includes('mission')) creditAccountId = 'acc-10'; // Mission Income
    if (donation.category.toLowerCase().includes('pledge')) creditAccountId = 'acc-13'; // Pledges
    
    // 3. Determine Fund
    let fundId = 'f-1'; // Default to General Fund
    if (donation.category.toLowerCase().includes('building')) fundId = 'f-3';
    if (donation.category.toLowerCase().includes('youth')) fundId = 'f-5';
    if (donation.category.toLowerCase().includes('welfare')) fundId = 'f-4';
    if (donation.category.toLowerCase().includes('mission')) fundId = 'f-2';

    // 4. Create Journal Entry
    const { addJournalEntry } = useAccountingStore.getState();
    addJournalEntry({
      id: `JE-DON-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      entryDate: donation.date.split('T')[0],
      description: `Donation: ${donation.category} ${donation.donorName ? `- ${donation.donorName}` : '(Anonymous)'}`,
      status: 'Posted',
      fundId,
      branchId: donation.branchId || 'b-1',
      createdBy: 'System Automation',
      createdAt: new Date().toISOString(),
      reference: donation.id,
      lines: [
        { accountId: debitAccountId, debit: donation.amount, credit: 0 },
        { accountId: creditAccountId, debit: 0, credit: donation.amount }
      ]
    });
  },

  syncPayroll: (payrollRunId: string, totalAmount: number, date: string, branchId: string = 'b-1', fundId: string = 'f-1') => {
    const { addJournalEntry } = useAccountingStore.getState();

    // DR Salaries (acc-8)
    // CR Bank Accounts (acc-2)
    addJournalEntry({
        id: `JE-PAY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        entryDate: date.split('T')[0],
        description: `Payroll Run ${payrollRunId}`,
        status: 'Posted',
        fundId,
        branchId,
        createdBy: 'System Automation',
        createdAt: new Date().toISOString(),
        reference: payrollRunId,
        lines: [
          { accountId: 'acc-8', debit: totalAmount, credit: 0 },
          { accountId: 'acc-2', debit: 0, credit: totalAmount }
        ]
    });
  }
};
