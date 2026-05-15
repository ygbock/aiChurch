export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete';

export interface SubscriptionPlan {
  id: string; // e.g., 'free', 'starter', 'professional', 'enterprise'
  name: string;
  maxBranches: number;
  maxMembers: number;
  includedModules: string[];
  stripePriceId?: string;
}

export interface TenantSubscription {
  organizationId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface QuotaUsage {
  organizationId: string;
  branchesCount: number;
  membersCount: number;
  storageBytes: number;
}
