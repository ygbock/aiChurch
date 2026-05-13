export const initializeCheckout = async (amount: number, msisdn: string) => {
  // Simulate Monime API call
  console.log(`Initializing checkout for ${amount} SLL to ${msisdn}`);
  return { checkoutUrl: 'https://checkout.monime.io/simulated', txId: 'TX-123' };
};
