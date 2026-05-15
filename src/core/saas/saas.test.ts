import { describe, it, expect } from 'vitest';
import { quotaManager, DEFAULT_PLANS } from './QuotaManager';
import { subscriptionManager } from './SubscriptionManager';
import { QuotaUsage, SubscriptionPlan } from './types';

describe('SaaS Infrastructure', () => {
  describe('QuotaManager', () => {
    it('should correctly enforce branch limits based on plan', () => {
      const usage: QuotaUsage = {
        organizationId: 'org-1',
        branchesCount: 1,
        membersCount: 10,
        storageBytes: 0,
      };

      const freePlan = DEFAULT_PLANS['free'];
      
      expect(quotaManager.checkQuota(freePlan, usage, 'branches')).toBe(false); // 1 branch is max for free
      expect(quotaManager.checkQuota(freePlan, { ...usage, branchesCount: 0 }, 'branches')).toBe(true);

      const proPlan = DEFAULT_PLANS['professional'];
      expect(quotaManager.checkQuota(proPlan, usage, 'branches')).toBe(true); // Pro allows 10
    });

    it('should correctly enforce member limits', () => {
      const freePlan = DEFAULT_PLANS['free'];
      
      expect(quotaManager.checkQuota(freePlan, { organizationId: 'org', branchesCount: 1, membersCount: 49, storageBytes: 0 }, 'members')).toBe(true);
      expect(quotaManager.checkQuota(freePlan, { organizationId: 'org', branchesCount: 1, membersCount: 50, storageBytes: 0 }, 'members')).toBe(false);
    });
    
    it('should calculate quota status correctly', () => {
        const starterPlan = DEFAULT_PLANS['starter'];
        const usage = { organizationId: 'org', branchesCount: 2, membersCount: 190, storageBytes: 0 };
        const status = quotaManager.getQuotaStatus(starterPlan, usage);
        
        expect(status.branches.isAtLimit).toBe(false);
        expect(status.members.isNearLimit).toBe(true); // 190 >= 200 * 0.9 = 180
    });
  });

  describe('SubscriptionManager', () => {
    it('should validate module access based on plan', () => {
      expect(subscriptionManager.isModuleAllowedByPlan('free', 'finance')).toBe(false);
      expect(subscriptionManager.isModuleAllowedByPlan('starter', 'finance')).toBe(true);
      expect(subscriptionManager.isModuleAllowedByPlan('enterprise', 'finance')).toBe(true);
      expect(subscriptionManager.isModuleAllowedByPlan('enterprise', 'unknown-module')).toBe(true);
    });

    it('should deny platform access to canceled subscriptions', () => {
      expect(subscriptionManager.canAccessPlatform({ organizationId: '1', planId: 'free', status: 'canceled', currentPeriodEnd: '', cancelAtPeriodEnd: false })).toBe(false);
      expect(subscriptionManager.canAccessPlatform({ organizationId: '1', planId: 'free', status: 'active', currentPeriodEnd: '', cancelAtPeriodEnd: false })).toBe(true);
      expect(subscriptionManager.canAccessPlatform({ organizationId: '1', planId: 'free', status: 'past_due', currentPeriodEnd: '', cancelAtPeriodEnd: false })).toBe(true);
    });
  });
});
