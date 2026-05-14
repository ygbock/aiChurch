export const initializeCheckout = async (amount: number, msisdn: string, description: string = 'Church Donation / Remittance') => {
  console.log(`Initializing checkout for ${amount} SLL to ${msisdn}`);
  
  const apiKey = import.meta.env.VITE_MONIME_API_KEY;
  const baseUrl = import.meta.env.VITE_MONIME_BASE_URL || 'https://api.monime.io/v1';

  if (!apiKey) {
    console.warn("VITE_MONIME_API_KEY is not defined. Falling back to simulated checkout.");
    return { checkoutUrl: 'https://checkout.monime.io/simulated', txId: 'TX-SIM-' + Math.random().toString(36).substr(2, 9) };
  }

  try {
    const response = await fetch(`${baseUrl}/payments/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        currency: 'SLL',
        customer: { msisdn },
        description,
        success_url: window.location.origin + '/finance/dashboard?success=true',
        cancel_url: window.location.origin + '/finance/dashboard?cancel=true',
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to initialize Monime Checkout');
    }

    const data = await response.json();
    return {
      checkoutUrl: data.checkout_url || data.url,
      txId: data.transaction_id || data.id,
      data
    };
  } catch (err: any) {
    console.error("Monime integration error:", err);
    throw err;
  }
};
