export interface MonimePayoutRequest {
  payslipId: string;
  amount: number;
  currency: string;
  method: 'mobile_money' | 'bank_transfer' | 'wallet';
  recipientDetails: {
    name: string;
    accountReference: string; // phone number, account number, wallet ID
    provider?: string; // e.g. OrangeMoney, Zenith Bank
  };
}

export interface MonimePayoutResponse {
  success: boolean;
  transactionId: string;
  payslipId: string;
  reference?: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  error?: string;
  timestamp: string;
}

export class MonimePayoutService {
  /**
   * Simulates initiating a batch of payouts via Monime APIs.
   * In a real implementation, this would call external HTTP endpoints securely
   * from a backend, not the frontend. Here we simulate the effect.
   */
  public static async executeBatchPayout(requests: MonimePayoutRequest[]): Promise<MonimePayoutResponse[]> {
    console.log(`[Monime Payout] Initiating batch of ${requests.length} payouts...`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const responses: MonimePayoutResponse[] = requests.map(req => {
          // Simulate some failure rate or validation
          const isSuccess = Math.random() > 0.05; // 95% success rate simulation
          const txId = `monime-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          
          return {
            success: isSuccess,
            transactionId: txId,
            payslipId: req.payslipId,
            reference: `REF-${txId}`,
            status: isSuccess ? 'processing' : 'failed',
            error: isSuccess ? undefined : 'Network timeout or invalid account',
            timestamp: new Date().toISOString()
          };
        });
        
        resolve(responses);
      }, 1500); // 1.5s simulated delay
    });
  }
}
