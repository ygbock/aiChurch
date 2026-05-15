import { SubscriptionPlan, QuotaUsage } from './types';
import { systemEvents, Events } from '../events/EventBus';

export const DEFAULT_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free Tier',
    maxBranches: 1,
    maxMembers: 50,
    includedModules: ['membership', 'attendance', 'administration'],
  },
  starter: {
    id: 'starter',
    name: 'Starter Plan',
    maxBranches: 3,
    maxMembers: 200,
    includedModules: ['membership', 'attendance', 'finance', 'events', 'administration'],
  },
  professional: {
    id: 'professional',
    name: 'Professional Plan',
    maxBranches: 10,
    maxMembers: 1000,
    includedModules: ['membership', 'attendance', 'finance', 'events', 'communications', 'welfare', 'ministries', 'administration'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Plan',
    maxBranches: 9999,
    maxMembers: 999999,
    includedModules: ['*'], // All modules
  }
};

class QuotaManagementService {
  private static instance: QuotaManagementService;

  private constructor() {}

  public static getInstance(): QuotaManagementService {
    if (!QuotaManagementService.instance) {
      QuotaManagementService.instance = new QuotaManagementService();
    }
    return QuotaManagementService.instance;
  }

  public checkQuota(
    plan: SubscriptionPlan, 
    usage: QuotaUsage, 
    resource: 'branches' | 'members'
  ): boolean {
    if (plan.id === 'enterprise') return true;

    if (resource === 'branches') {
      return usage.branchesCount < plan.maxBranches;
    }

    if (resource === 'members') {
      return usage.membersCount < plan.maxMembers;
    }

    return false;
  }

  public getQuotaStatus(plan: SubscriptionPlan, usage: QuotaUsage) {
    return {
      branches: {
        used: usage.branchesCount,
        limit: plan.maxBranches,
        isNearLimit: usage.branchesCount >= plan.maxBranches * 0.9,
        isAtLimit: usage.branchesCount >= plan.maxBranches
      },
      members: {
        used: usage.membersCount,
        limit: plan.maxMembers,
        isNearLimit: usage.membersCount >= plan.maxMembers * 0.9,
        isAtLimit: usage.membersCount >= plan.maxMembers
      }
    };
  }
}

export const quotaManager = QuotaManagementService.getInstance();
