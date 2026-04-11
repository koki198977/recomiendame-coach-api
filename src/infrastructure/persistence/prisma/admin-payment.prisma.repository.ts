import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  AdminPaymentRepositoryPort,
  AdminPaymentRecord,
} from '../../../core/application/admin/ports/out.admin-payment-repository.port';

@Injectable()
export class AdminPaymentPrismaRepository implements AdminPaymentRepositoryPort {
  constructor(private prisma: PrismaService) {}

  async listPayments(params: {
    status?: string;
    userId?: string;
    page: number;
    limit: number;
  }): Promise<{ items: AdminPaymentRecord[]; total: number }> {
    const { status, userId, page, limit } = params;

    const where: Record<string, unknown> = {};
    if (status) where['status'] = status;
    if (userId) where['userId'] = userId;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: { user: { select: { email: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      items: payments.map((p) => ({
        id: p.id,
        userId: p.userId,
        userEmail: p.user.email,
        provider: p.provider,
        providerPaymentId: p.providerPaymentId,
        amount: p.amount,
        currency: p.currency,
        planType: p.planType,
        status: p.status,
        createdAt: p.createdAt,
      })),
      total,
    };
  }
}
