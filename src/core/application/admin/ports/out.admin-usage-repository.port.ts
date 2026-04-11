import { AdminUserUsage } from './out.admin-user-repository.port';

export type { AdminUserUsage };

export interface AdminFeatureSummary {
  feature: string;
  totalUses: number;
  uniqueUsers: number;
}

export interface AdminMetrics {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  approvedPayments: number;
  totalRevenue: number;
  newUsersLast30Days: number;
}

export interface AdminUsageRepositoryPort {
  getUserUsage(userId: string): Promise<AdminUserUsage[]>;
  getUsageSummary(): Promise<AdminFeatureSummary[]>;
  getMetrics(): Promise<AdminMetrics>;
}

export const ADMIN_USAGE_REPOSITORY = Symbol('ADMIN_USAGE_REPOSITORY');
