import { PayrollProfile, PayrollRun, Payslip, PayrollAllowance, PayrollDeduction, PensionScheme } from '../types';
import { usePayrollStore } from '../stores/usePayrollStore';
import { v4 as uuidv4 } from 'uuid';

export class PayrollEngine {
  
  public static calculateNetPay(
    profile: PayrollProfile, 
    allowances: PayrollAllowance[], 
    deductions: PayrollDeduction[],
    pensionScheme?: PensionScheme
  ) {
    const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    
    // Simplistic tax calculation for demonstration (10% on base + taxable allowances)
    const taxableAllowances = allowances.filter(a => a.isTaxable).reduce((sum, a) => sum + a.amount, 0);
    const taxableIncome = profile.baseSalary + taxableAllowances;
    
    // Localized tax table simulation based on currency
    let computedTax = 0;
    if (profile.employmentType === 'full_time' || profile.employmentType === 'part_time') {
       if (profile.currency === 'USD') {
           // USA Brackets (Simplified)
           if (taxableIncome > 5000) computedTax = taxableIncome * 0.20;
           else computedTax = taxableIncome * 0.10;
       } else if (profile.currency === 'NGN') {
           // Nigeria PAYE (Simplified)
           if (taxableIncome > 300000) computedTax = taxableIncome * 0.15;
           else computedTax = taxableIncome * 0.07;
       } else {
           computedTax = taxableIncome * 0.10; // Fallback
       }
    }
    
    // Pension based on scheme or fallback
    let computedPension = 0;
    if (profile.employmentType === 'full_time' || profile.employmentType === 'part_time') {
        const pensionRate = pensionScheme ? pensionScheme.employeeContributionRate : 0.05;
        computedPension = profile.baseSalary * pensionRate;
    }

    const grossPay = profile.baseSalary + totalAllowances;
    const netPay = grossPay - totalDeductions - computedTax - computedPension;

    return {
      grossPay,
      netPay,
      taxes: computedTax,
      pension: computedPension,
      totalAllowances,
      totalDeductions
    };
  }

  public static processPayrollRun(name: string, periodStart: string, periodEnd: string, branchId: string, processorId: string) {
      const state = usePayrollStore.getState();
      const activeProfiles = state.profiles.filter(p => p.isActive && p.branchId === branchId);
      const defaultPensionScheme = state.pensionSchemes[0];

      const payslips: Payslip[] = [];
      let runTotalGross = 0;
      let runTotalAllowances = 0;
      let runTotalDeductions = 0;
      let runTotalNetPay = 0;
      let runTotalTaxes = 0;
      let runTotalPensions = 0;
      
      const runId = uuidv4();

      activeProfiles.forEach(profile => {
          // Find any active advances
          const activeAdvances = state.advances.filter(a => a.profileId === profile.id && a.status === 'repaying');
          
          const personAllowances: PayrollAllowance[] = [];
          const personDeductions: PayrollDeduction[] = [];

          if (profile.role === 'Senior Pastor') {
              personAllowances.push({ id: 'a1', profileId: profile.id, type: 'housing', name: 'Housing Allowance', amount: 500, isTaxable: false, frequency: 'recurring' });
          }

          // Add advances to deductions
          activeAdvances.forEach(adv => {
             // Calculate how much we can reasonably deduct (up to the remaining balance or max monthly)
             const deductionAmount = Math.min(adv.monthlyDeduction, adv.remainingBalance);
             if (deductionAmount > 0) {
                 personDeductions.push({
                     id: `ded-adv-${adv.id}`,
                     profileId: profile.id,
                     type: 'advance',
                     name: `Salary Advance Deduction (${adv.purpose})`,
                     amount: deductionAmount,
                     frequency: 'recurring'
                 });
                 // NOTE: In a complete system, we would also reduce the remainingBalance on the store here
                 // or fire an event to track it via the accounting ledger.
             }
          });

          const calculation = this.calculateNetPay(profile, personAllowances, personDeductions, defaultPensionScheme);

          runTotalGross += calculation.grossPay;
          runTotalAllowances += calculation.totalAllowances;
          runTotalDeductions += calculation.totalDeductions;
          runTotalNetPay += calculation.netPay;
          runTotalTaxes += calculation.taxes;
          runTotalPensions += calculation.pension;

          // Compute split payments if applicable
          let splitPayments: { method: any, amount: number, provider?: string, account?: string }[] | undefined = undefined;
          if (profile.paymentMethod === 'split' && profile.splitAllocations && profile.splitAllocations.length > 0) {
              splitPayments = [];
              let remainingNet = calculation.netPay;
              
              profile.splitAllocations.forEach((alloc, index) => {
                  let allocAmount = 0;
                  if (alloc.fixedAmount) {
                      allocAmount = alloc.fixedAmount;
                  } else if (alloc.percentage) {
                      allocAmount = calculation.netPay * alloc.percentage;
                  }
                  
                  // Don't allocate more than remaining net
                  allocAmount = Math.min(allocAmount, remainingNet);
                  
                  if (allocAmount > 0) {
                      // Last allocation gets whatever is remaining if it's percentage based to avoid rounding issues
                      if (index === profile.splitAllocations!.length - 1 && alloc.percentage) {
                          allocAmount = remainingNet;
                      }

                      remainingNet -= allocAmount;

                      splitPayments!.push({
                          method: alloc.method,
                          amount: Number(allocAmount.toFixed(2)),
                          provider: alloc.mobileMoneyDetails?.provider || alloc.bankDetails?.bankName,
                          account: alloc.mobileMoneyDetails?.phoneNumber || alloc.bankDetails?.accountNumber
                      });
                  }
              });

              // If there's still left over after allocations, add to the first method or default cash
              if (remainingNet > 0 && splitPayments!.length > 0) {
                  splitPayments![0].amount += Number(remainingNet.toFixed(2));
              }
          }

          payslips.push({
              id: uuidv4(),
              runId,
              profileId: profile.id,
              employeeName: `${profile.firstName} ${profile.lastName}`,
              role: profile.role,
              currency: profile.currency,
              baseSalary: profile.baseSalary,
              allowances: personAllowances.map(a => ({ name: a.name, amount: a.amount })),
              deductions: personDeductions.map(d => ({ name: d.name, amount: d.amount })),
              grossPay: calculation.grossPay,
              netPay: calculation.netPay,
              taxes: calculation.taxes,
              pension: calculation.pension,
              status: 'pending',
              paymentMethod: profile.paymentMethod,
              splitPayments
          });
      });

      const newRun: PayrollRun = {
          id: runId,
          name,
          periodStart,
          periodEnd,
          totalGross: runTotalGross,
          totalAllowances: runTotalAllowances,
          totalDeductions: runTotalDeductions,
          totalNetPay: runTotalNetPay,
          totalTaxes: runTotalTaxes,
          totalPensions: runTotalPensions,
          status: 'calculated', // Not approved yet
          branchId,
          processedBy: processorId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
      };

      return { run: newRun, payslips };
  }
}
