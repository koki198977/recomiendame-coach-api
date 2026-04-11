import { Inject, Injectable } from '@nestjs/common';
import {
  ADMIN_PAYMENT_REPOSITORY,
  AdminPaymentRepositoryPort,
  AdminPaymentRecord,
} from '../ports/out.admin-payment-repository.port';

@Injectable()
export class AdminListPaymentsUseCase {
  constructor(
    @Inject(ADMIN_PAYMENT_REPOSITORY)
    private readonly repo: AdminPaymentRepositoryPort,
  ) {}

  async execute(params: {
    status?: string;
    userId?: string;
    page: number;
    limit: number;
  }): Promise<{ items: AdminPaymentRecord[]; total: number }> {
    return this.repo.listPayments(params);
  }
}
