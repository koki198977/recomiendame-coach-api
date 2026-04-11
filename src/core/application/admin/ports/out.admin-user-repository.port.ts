export interface AdminUserSummary {
  id: string;
  email: string;
  name: string | null;
  lastName: string | null;
  role: 'USER' | 'ADMIN';
  plan: 'FREE' | 'PRO';
  emailVerified: boolean;
  onboardingCompleted: boolean;
  createdAt: Date;
}

export interface AdminPaymentRecord {
  id: string;
  userId: string;
  userEmail: string;
  provider: string;
  providerPaymentId: string | null;
  amount: number;
  currency: string;
  planType: string;
  status: string;
  createdAt: Date;
}

export interface AdminUserUsage {
  feature: string;
  totalCount: number;
  lastUsedAt: Date;
}

export interface AdminUserDetail extends AdminUserSummary {
  planExpiresAt: Date | null;
  payments: AdminPaymentRecord[];
  usageByFeature: AdminUserUsage[];
}

export interface AdminUserRepositoryPort {
  listUsers(params: {
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ items: AdminUserSummary[]; total: number }>;

  getUserDetail(userId: string): Promise<AdminUserDetail | null>;

  deleteUser(userId: string): Promise<void>;

  changeRole(userId: string, role: 'USER' | 'ADMIN'): Promise<AdminUserSummary>;
}

export const ADMIN_USER_REPOSITORY = Symbol('ADMIN_USER_REPOSITORY');
