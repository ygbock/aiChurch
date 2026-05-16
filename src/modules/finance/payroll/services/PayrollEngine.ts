import { PayrollProfile, PayrollRun, Payslip, PayrollAllowance, PayrollDeduction, PensionScheme } from '../types';
import { usePayrollStore } from '../stores/usePayrollStore';
import { v4 as uuidv4 } from 'uuid';

export class PayrollEngine {
  
  public static calculateNetPay(
    profile: PayrollProfile, 
    allowances: PayrollAllowance[], 
    deductions: PayrollDeduction[],
    pensionScheme?: PensionScheme,
    metrics?: { units?: number; services?: number }
  ) {
    let baseComp = profile.baseSalary || 0;
    
    if (profile.compensationModel === 'hourly') {
      baseComp = baseComp * (metrics?.units || 160); // Default 160 hours if unknown
    } else if (profile.compensationModel === 'per_service') {
      baseComp = baseComp * (metrics?.services || 4); // Default 4 services
    }

    // Helper for effective amount
    const getEffectiveAllowanceAmount = (a: PayrollAllowance) => {
      if (a.calculationMethod === 'percentage_of_basic') {
        return baseComp * a.amount;
      }
      return a.amount;
    };

    const getEffectiveDeductionAmount = (d: PayrollDeduction) => {
      // Allow custom formulas conceptually here handled via UI or expression evaluation later.
      // For now, support fixed and percentage
      if (d.calculationMethod === 'percentage_of_basic') {
        return baseComp * d.amount;
      }
      return d.amount;
    };

    const totalAllowances = allowances.reduce((sum, a) => sum + getEffectiveAllowanceAmount(a), 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + getEffectiveDeductionAmount(d), 0);
    
    // Simplistic tax calculation for demonstration (10% on base + taxable allowances)
    const taxableAllowances = allowances.filter(a => a.isTaxable).reduce((sum, a) => sum + getEffectiveAllowanceAmount(a), 0);
    const taxableIncome = baseComp + taxableAllowances;
    
    // Localized progressive tax table simulation based on currency
    let computedTax = 0;
    
    // Check if employee is tax exempt
    if (profile.taxProfile?.taxBand === 'exempt' || profile.employmentType === 'volunteer') {
       computedTax = 0;
    } else if (profile.employmentType === 'full_time' || profile.employmentType === 'part_time') {
       if (profile.currency === 'USD') {
           // USA Brackets (Simplified Monthly)
           // 10% up to $833, 12% up to $3500, 22% up to $7000
           if (taxableIncome > 7000) {
               computedTax = (833 * 0.10) + ((3500 - 833) * 0.12) + ((7000 - 3500) * 0.22) + ((taxableIncome - 7000) * 0.24);
           } else if (taxableIncome > 3500) {
               computedTax = (833 * 0.10) + ((3500 - 833) * 0.12) + ((taxableIncome - 3500) * 0.22);
           } else if (taxableIncome > 833) {
               computedTax = (833 * 0.10) + ((taxableIncome - 833) * 0.12);
           } else {
               computedTax = taxableIncome * 0.10;
           }
       } else if (profile.currency === 'NGN') {
           // Nigeria PAYE (Simplified Monthly)
           // CRA (Consolidated Relief Allowance)
           const cra = 200000 / 12 + (0.2 * taxableIncome);
           const chargeableIncome = Math.max(0, taxableIncome - cra);
           // 7% on first 300k, 11% on next 300k, 15% on next 500k, 19% on next 500k, 21% on next 1.6M, 24% above
           if (chargeableIncome > 3200000) {
               computedTax = (300000 * 0.07) + (300000 * 0.11) + (500000 * 0.15) + (500000 * 0.19) + (1600000 * 0.21) + ((chargeableIncome - 3200000) * 0.24);
           } else if (chargeableIncome > 1600000) {
               computedTax = (300000 * 0.07) + (300000 * 0.11) + (500000 * 0.15) + (500000 * 0.19) + ((chargeableIncome - 1600000) * 0.21);
           } else {
               computedTax = chargeableIncome * 0.10; // simplistic fallback for mid ranges
           }
           // Minimum tax check (1% of gross)
           if (computedTax < taxableIncome * 0.01) {
               computedTax = taxableIncome * 0.01;
           }
       } else if (profile.currency === 'GBP') {
           // UK Standard Monthly
           // P.A. 1047 / mo tax free, 20% basic, 40% higher
           if (taxableIncome > 4189) {
               computedTax = ((4189 - 1047) * 0.20) + ((taxableIncome - 4189) * 0.40);
           } else if (taxableIncome > 1047) {
               computedTax = (taxableIncome - 1047) * 0.20;
           } else {
               computedTax = 0;
           }
       } else if (profile.currency === 'KES') {
           // Kenya PAYE Monthly 2023
           // 10% on first 24000, 25% on next 8333, 30% above 32333
           if (taxableIncome > 32333) {
               computedTax = (24000 * 0.10) + (8333 * 0.25) + ((taxableIncome - 32333) * 0.30);
           } else if (taxableIncome > 24000) {
               computedTax = (24000 * 0.10) + ((taxableIncome - 24000) * 0.25);
           } else {
               computedTax = taxableIncome * 0.10;
           }
           // Personal Relief
           computedTax = Math.max(0, computedTax - 2400); 
       } else if (profile.currency === 'SLE') {
           // Sierra Leone PAYE Monthly (Simplified)
           // First 600 Le exempt, next 600 at 15%, next 600 at 20%, above 1800 at 30%
           if (taxableIncome > 1800) {
               computedTax = (600 * 0.15) + (600 * 0.20) + ((taxableIncome - 1800) * 0.30);
           } else if (taxableIncome > 1200) {
               computedTax = (600 * 0.15) + ((taxableIncome - 1200) * 0.20);
           } else if (taxableIncome > 600) {
               computedTax = (taxableIncome - 600) * 0.15;
           } else {
               computedTax = 0;
           }
       } else {
           computedTax = taxableIncome * 0.10; // Fallback flat 10%
       }
       
       // Handle reduced rate
       if (profile.taxProfile?.taxBand === 'reduced') {
           computedTax = computedTax * 0.5;
       }
    }
    
    // Pension based on scheme or fallback
    let computedPension = 0;
    if (profile.employmentType === 'full_time' || profile.employmentType === 'part_time') {
        const pensionRate = pensionScheme ? pensionScheme.employeeContributionRate : 0.05;
        computedPension = profile.baseSalary * pensionRate;
    }

    const grossPay = baseComp + totalAllowances;
    const netPay = grossPay - totalDeductions - computedTax - computedPension;

    return {
      grossPay,
      netPay,
      taxes: computedTax,
      pension: computedPension,
      totalAllowances,
      totalDeductions,
      allowanceBreakdown: allowances.map(a => ({ name: a.name, amount: getEffectiveAllowanceAmount(a) })),
      deductionBreakdown: deductions.map(d => ({ name: d.name, amount: getEffectiveDeductionAmount(d) }))
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
          
          const personMetrics = { units: 160, services: 4, attendance: 100 }; // Mock injected metrics for this run per profile
          
          let personAllowances: PayrollAllowance[] = profile.allowances ? [...profile.allowances] : [];
          
          // Evaluate conditional allowances
          personAllowances = personAllowances.filter(alw => {
              if (alw.frequency === 'conditional' && alw.conditionExpression) {
                  try {
                      // Very basic/safe evaluation mock based on variables. In production use a safe expression parser.
                      let expression = alw.conditionExpression.replace(/hours|units/g, String(personMetrics.units));
                      expression = expression.replace(/services/g, String(personMetrics.services));
                      expression = expression.replace(/attendance/g, String(personMetrics.attendance));
                      // eslint-disable-next-line no-new-func
                      return new Function(`return ${expression}`)();
                  } catch (e) {
                      return false; // Safely fail the condition
                  }
              }
              return true;
          });
          
          const personDeductions: PayrollDeduction[] = profile.deductions ? [...profile.deductions] : [];

          if (profile.role === 'Senior Pastor') {
              personAllowances.push({ 
                id: 'a1', 
                profileId: profile.id, 
                type: 'housing', 
                name: 'Housing Allowance', 
                amount: 500, 
                isTaxable: false, 
                frequency: 'recurring',
                calculationMethod: 'fixed'
              });
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
                     frequency: 'recurring',
                     calculationMethod: 'fixed'
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
              allowances: calculation.allowanceBreakdown,
              deductions: calculation.deductionBreakdown,
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
