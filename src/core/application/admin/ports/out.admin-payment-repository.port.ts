import { AdminPaymentRecord } from './out.admin-user-repository.port';

export type { AdminPaymentRecord };

export interface AdminPaymentRepositoryPort {
  listPayments(params: {
    status?: string;
    userId?: string;
    page: number;
    limit: number;
  }): Promise<{ items: AdminPaymentRecord[]; total: number }>;
}

export const ADMIN_PAYMENT_REPOSITORY = Symbol('ADMIN_PAYMENT_REPOSITORY');
