import { systemEvents } from '../../../../core/events/EventBus';
import { usePayrollStore } from '../stores/usePayrollStore';
import { PayrollEngine } from './PayrollEngine';
import { v4 as uuidv4 } from 'uuid';

/**
 * StipendAutomation
 * Listens for cross-domain events (e.g., Guest Speaker, Volunteer Shift) 
 * and automatically generations honorarium/stipend payouts.
 */

export class StipendAutomation {
    public static initialize() {
        // Mock event subscription for GUEST_SPEAKER_COMPLETED
        systemEvents.subscribe('GUEST_SPEAKER_COMPLETED' as any, (payload) => {
            console.log("StipendAutomation detected speaker event:", payload);
            this.processAutomatedHonorarium(payload);
        });
    }

    private static processAutomatedHonorarium(payload: any) {
        const state = usePayrollStore.getState();
        const { speakerId, branchId, amountConfigured, currency = 'SLE' } = payload;

        // In a real app we'd look up if there's a profile or create an ad-hoc one
        const runId = uuidv4();
        
        // Single honorarium run
        const run = {
            id: runId,
            name: `Honorarium - ${speakerId} - ${new Date().toISOString().split('T')[0]}`,
            periodStart: new Date().toISOString(),
            periodEnd: new Date().toISOString(),
            status: 'pending_approval' as any,
            totalGross: amountConfigured,
            totalNetPay: amountConfigured, // Assuming honorariums are tax free for simplicity
            totalTaxes: 0,
            totalPensions: 0,
            baseCurrency: currency,
            branchId,
            processedBy: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const payslip = {
            id: uuidv4(),
            runId,
            profileId: speakerId,
            employeeName: `Guest Speaker ${speakerId.slice(0, 4)}`,
            role: 'Guest Speaker',
            currency,
            baseSalary: 0,
            allowances: [{ name: 'Honorarium', amount: amountConfigured }],
            deductions: [],
            grossPay: amountConfigured,
            netPay: amountConfigured,
            taxes: 0,
            pension: 0,
            status: 'pending' as any,
            paymentMethod: 'bank_transfer' as any
        };

        state.createRun(run);
        state.setPayslips([...state.payslips, payslip]);
    }
}
