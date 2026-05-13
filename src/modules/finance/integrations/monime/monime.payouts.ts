export const processPayout = async (amount: number, bankOrMsisdn: string, type: 'bank' | 'mobile_money') => {
  // Simulate Monime Payout API call
  console.log(`Processing payout for ${amount} SLL to ${bankOrMsisdn} via ${type}`);
  return { status: 'processing', payoutId: 'PO-123' };
};
