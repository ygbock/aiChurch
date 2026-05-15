import { describe, it, expect } from 'vitest';
import { PayrollEngine } from './PayrollEngine';
import { usePayrollStore } from '../stores/usePayrollStore';
import { PayrollProfile } from '../types';

describe('PayrollEngine', () => {
    it('should calculate net pay correctly for full_time employee with taxes and pension', () => {
        const profile: PayrollProfile = {
            id: 'p1',
            firstName: 'John',
            lastName: 'Doe',
            role: 'Pastor',
            employmentType: 'full_time',
            branchId: 'b-1',
            currency: 'USD',
            baseSalary: 5000,
            paymentMethod: 'bank_transfer',
            isActive: true
        };

        // 10% tax on base, 5% pension on base
        // Allowances: 500 non-taxable
        // Deductions: 100
        const { grossPay, netPay, taxes, pension, totalAllowances, totalDeductions } = PayrollEngine.calculateNetPay(
            profile,
            [{ id: 'a1', profileId: 'p1', name: 'Housing', amount: 500, type: 'housing', isTaxable: false, frequency: 'recurring' }],
            [{ id: 'd1', profileId: 'p1', name: 'Loan', amount: 100, type: 'loan', frequency: 'recurring' }]
        );

        expect(totalAllowances).toBe(500);
        expect(totalDeductions).toBe(100);
        expect(grossPay).toBe(5500); // 5000 + 500
        
        expect(taxes).toBe(500); // 10% of 5000 (allowance is non-taxable)
        expect(pension).toBe(250); // 5% of 5000

        // 5500 - 500 (tax) - 250 (pension) - 100 (deductions) = 4650
        expect(netPay).toBe(4650);
    });

    it('should skip taxes and pension for volunteers', () => {
        const profile: PayrollProfile = {
            id: 'p2',
            firstName: 'Jane',
            lastName: 'Doe',
            role: 'Volunteer',
            employmentType: 'volunteer',
            branchId: 'b-1',
            currency: 'USD',
            baseSalary: 0,
            paymentMethod: 'mobile_money',
            isActive: true
        };

        const { grossPay, netPay, taxes, pension } = PayrollEngine.calculateNetPay(
            profile,
            [{ id: 'a1', profileId: 'p2', name: 'Transport Stipend', amount: 100, type: 'transport', isTaxable: true, frequency: 'recurring' }],
            []
        );

        expect(grossPay).toBe(100);
        expect(taxes).toBe(0); // Volunteers typically don't have PAYE on transport stipend in this simplest model
        expect(pension).toBe(0);
        expect(netPay).toBe(100);
    });

    it('should process a payroll run and generate a calculated status', () => {
        const { run, payslips } = PayrollEngine.processPayrollRun('Test Run', '2026-05-01', '2026-05-31', 'b-1', 'admin');
        
        expect(run).toBeDefined();
        expect(run.status).toBe('calculated');
        expect(run.branchId).toBe('b-1');
        expect(payslips.length).toBeGreaterThan(0);
        // The profiles in the default store include John Doe (base 5000) and Jane Smith (base 500)
        // John Doe is full_time (Pastor), Jane is honorarium.
        
        const johnSlip = payslips.find(s => s.employeeName.includes('John'));
        expect(johnSlip).toBeDefined();
        
        if (johnSlip) {
            // According to PayrollEngine, Senior Pastor gets $500 housing allowance automatically added for testing
            expect(johnSlip.allowances.length).toBe(1);
            expect(johnSlip.baseSalary).toBe(5000);
            expect(johnSlip.netPay).toBe(4650); // 5000 + 500 - 500(tax) - 250(pension) - 100(advance deduction)
        }
    });
});
