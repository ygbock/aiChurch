import { PayrollProfile, PayrollRun, Payslip, PayrollAllowance, PayrollDeduction, PensionProvider, TaxRule } from '../types';
import { usePayrollStore } from '../stores/usePayrollStore';
import { v4 as uuidv4 } from 'uuid';

export class PayrollEngine {
  
  public static calculateNetPay(
    profile: PayrollProfile, 
    allowances: PayrollAllowance[], 
    deductions: PayrollDeduction[],
    pensionProvider?: PensionProvider,
    metrics?: { units?: number; services?: number },
    taxRule?: TaxRule
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
    
    let computedTax = 0;
    
    // Check if employee is tax exempt explicitly or via override
    if (
        profile.taxProfile?.taxBand === 'exempt' || 
        profile.employmentType === 'volunteer' ||
        profile.taxProfile?.override?.overrideType === 'exempt'
    ) {
       computedTax = 0;
    } else if (profile.taxProfile?.override?.overrideType === 'fixed_amount') {
       computedTax = profile.taxProfile.override.value || 0;
    } else if (profile.taxProfile?.override?.overrideType === 'percentage') {
       computedTax = taxableIncome * (profile.taxProfile.override.value || 0);
    } else if (taxRule && taxRule.isActive) {
        // Calculate Reliefs
        const personalRelief = taxRule.personalReliefAmount || 0;
        const percentageRelief = (taxRule.personalReliefPercentage || 0) * taxableIncome;
        const consolidatedRelief = taxRule.consolidatedReliefAmount || 0;
        
        const totalRelief = personalRelief + percentageRelief + consolidatedRelief;
        const chargeableIncome = Math.max(0, taxableIncome - totalRelief);
        
        // Calculate based on brackets
        let tax = 0;
        const sortedBrackets = [...taxRule.brackets].sort((a,b) => a.minIncome - b.minIncome);
        
        for (const bracket of sortedBrackets) {
            if (chargeableIncome > bracket.minIncome) {
                 const amountInBracket = bracket.maxIncome 
                     ? Math.min(chargeableIncome, bracket.maxIncome) - bracket.minIncome
                     : chargeableIncome - bracket.minIncome;
                     
                 if (amountInBracket > 0) {
                     tax += amountInBracket * bracket.rate;
                 }
            } else {
                 break;
            }
        }
        computedTax = tax;
    } else {
        // Fallback simplistic flat tax if no rule is supplied
        computedTax = taxableIncome * 0.10; 
    }
    
    // Handle reduced rate (legacy band approach, could be superseded by overrides)
    if (profile.taxProfile?.taxBand === 'reduced') {
        computedTax = computedTax * 0.5;
    }
    
    // Pension based on scheme or fallback
    let computedPension = 0;
    let computedEmployerPension = 0;
    let computedPensionProviderId: string | undefined;

    if (profile.pensionDetails || profile.employmentType === 'full_time' || profile.employmentType === 'part_time') {
        let pensionRate = 0;
        let employerPensionRate = 0;
        let basis: string = 'basic_salary';

        if (profile.pensionDetails) {
            pensionRate = profile.pensionDetails.employeeContributionRate || 0;
            employerPensionRate = profile.pensionDetails.employerContributionRate || 0;
            computedPensionProviderId = profile.pensionDetails.providerId;
            basis = profile.pensionDetails.calculationBasisOverride || (pensionProvider ? pensionProvider.calculationBasis : 'basic_salary');
        } else if (pensionProvider && pensionProvider.isActive) {
            pensionRate = pensionProvider.defaultEmployeeRate;
            employerPensionRate = pensionProvider.defaultEmployerRate;
            computedPensionProviderId = pensionProvider.id;
            basis = pensionProvider.calculationBasis;
        } else {
            pensionRate = 0.05; // 5% default fallback
        }
        
        let calculationAmount = profile.baseSalary;
        if (basis === 'gross_pay') {
             calculationAmount = baseComp + totalAllowances;
        } else if (basis === 'basic_plus_taxable_allowances') {
             calculationAmount = baseComp + taxableAllowances;
        }

        computedPension = calculationAmount * pensionRate;
        computedEmployerPension = calculationAmount * employerPensionRate;
    }

    const grossPay = baseComp + totalAllowances;
    const netPay = grossPay - totalDeductions - computedTax - computedPension;

    return {
      grossPay,
      netPay,
      taxes: computedTax,
      pension: computedPension,
      employerPension: computedEmployerPension,
      pensionProviderId: computedPensionProviderId,
      totalAllowances,
      totalDeductions,
      allowanceBreakdown: allowances.map(a => ({ name: a.name, amount: getEffectiveAllowanceAmount(a) })),
      deductionBreakdown: deductions.map(d => ({ name: d.name, amount: getEffectiveDeductionAmount(d) }))
    };
  }

  public static processPayrollRun(name: string, periodStart: string, periodEnd: string, branchId: string, processorId: string) {
      const state = usePayrollStore.getState();
      const activeProfiles = state.profiles.filter(p => p.isActive && p.branchId === branchId);
      const defaultPensionProvider = state.pensionProviders?.[0];

      const payslips: Payslip[] = [];
      let runTotalGross = 0;
      let runTotalAllowances = 0;
      let runTotalDeductions = 0;
      let runTotalNetPay = 0;
      let runTotalTaxes = 0;
      let runTotalPensions = 0;
      let runTotalEmployerPensions = 0;
      
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

          const advanceDeductionsResult: { advanceId: string, amount: number }[] = [];

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
                 advanceDeductionsResult.push({ advanceId: adv.id, amount: deductionAmount });
             }
          });

          // Find active tax rule
          let applicableTaxRule: TaxRule | undefined;
          if (profile.taxProfile?.taxRuleId) {
              applicableTaxRule = state.taxRules?.find(tr => tr.id === profile.taxProfile!.taxRuleId && tr.isActive);
          } else {
              // Try to find a default rule for currency/country context
              // For demonstration assuming we match country = currency map or just a default org rule
              applicableTaxRule = state.taxRules?.find(tr => tr.isActive && (tr.country === profile.currency || tr.country === 'SLE')); 
          }

          const calculation = this.calculateNetPay(profile, personAllowances, personDeductions, defaultPensionProvider, personMetrics, applicableTaxRule);

          runTotalGross += calculation.grossPay;
          runTotalAllowances += calculation.totalAllowances;
          runTotalDeductions += calculation.totalDeductions;
          runTotalNetPay += calculation.netPay;
          runTotalTaxes += calculation.taxes;
          runTotalPensions += calculation.pension;
          runTotalEmployerPensions += calculation.employerPension;

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
              advanceDeductions: advanceDeductionsResult,
              grossPay: calculation.grossPay,
              netPay: calculation.netPay,
              taxes: calculation.taxes,
              pension: calculation.pension,
              employerPension: calculation.employerPension,
              pensionProviderId: calculation.pensionProviderId,
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
          totalEmployerPensions: runTotalEmployerPensions,
          status: 'calculated', // Not approved yet
          branchId,
          processedBy: processorId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
      };

      return { run: newRun, payslips };
  }
}
