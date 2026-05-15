import { SubscriptionPlan, TenantSubscription } from './types';
import { DEFAULT_PLANS } from './QuotaManager';
import { useTenant } from '../tenant/useTenant';
import { useFeatureFlags } from '../feature-flags/useFeatureFlags';

class SubscriptionManagementService {
  private static instance: SubscriptionManagementService;

  private constructor() {}

  public static getInstance(): SubscriptionManagementService {
    if (!SubscriptionManagementService.instance) {
      SubscriptionManagementService.instance = new SubscriptionManagementService();
    }
    return SubscriptionManagementService.instance;
  }

  public isModuleAllowedByPlan(planId: string, moduleId: string): boolean {
    const plan = DEFAULT_PLANS[planId];
    if (!plan) return false;

    if (plan.includedModules.includes('*')) return true;
    
    return plan.includedModules.includes(moduleId);
  }

  public enforceModuleAccess(subscription: TenantSubscription) {
    // In a real app this would map standard modules against subscription
    // Since useFeatureFlags handles our front-end toggles, we can sync plan state to it
    const flags = useFeatureFlags.getState();
    const modules = flags.modules;

    modules.forEach(mod => {
      const isAllowed = this.isModuleAllowedByPlan(subscription.planId, mod.id);
      if (isAllowed && !flags.isModuleEnabled(mod.id)) {
        // Technically depends on tenant context whether we auto-enable it, 
        // but this shows the integration direction
      } else if (!isAllowed && flags.isModuleEnabled(mod.id)) {
        // Tenant lost access
        flags.disableModule(mod.id, { organizationId: subscription.organizationId });
      }
    });
  }

  public canAccessPlatform(subscription: TenantSubscription | null): boolean {
    if (!subscription) return false;
    // For grace periods
    if (subscription.status === 'past_due') return true; 
    
    return ['active', 'trialing'].includes(subscription.status);
  }
}

export const subscriptionManager = SubscriptionManagementService.getInstance();
