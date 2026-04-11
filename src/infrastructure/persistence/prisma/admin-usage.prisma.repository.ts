import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  AdminUsageRepositoryPort,
  AdminFeatureSummary,
  AdminMetrics,
} from '../../../core/application/admin/ports/out.admin-usage-repository.port';
import { AdminUserUsage } from '../../../core/application/admin/ports/out.admin-user-repository.port';

@Injectable()
export class AdminUsagePrismaRepository implements AdminUsageRepositoryPort {
  constructor(private prisma: PrismaService) {}

  async getUserUsage(userId: string): Promise<AdminUserUsage[]> {
    const groups = await this.prisma.usageLog.groupBy({
      by: ['feature'],
      where: { userId },
      _sum: { count: true },
      _max: { date: true },
    });

    return groups.map((g) => ({
      feature: g.feature,
      totalCount: g._sum.count ?? 0,
      lastUsedAt: g._max.date as Date,
    }));
  }

  async getUsageSummary(): Promise<AdminFeatureSummary[]> {
    const groups = await this.prisma.usageLog.groupBy({
      by: ['feature'],
      _sum: { count: true },
      _count: { userId: true },
    });

    return groups.map((g) => ({
      feature: g.feature,
      totalUses: g._sum.count ?? 0,
      uniqueUsers: g._count.userId,
    }));
  }

  async getMetrics(): Promise<AdminMetrics> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      proUsers,
      freeUsers,
      approvedPayments,
      revenueAggregate,
      newUsersLast30Days,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { plan: 'PRO' } }),
      this.prisma.user.count({ where: { plan: 'FREE' } }),
      this.prisma.payment.count({ where: { status: 'approved' } }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'approved' },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    return {
      totalUsers,
      proUsers,
      freeUsers,
      approvedPayments,
      totalRevenue: revenueAggregate._sum.amount ?? 0,
      newUsersLast30Days,
    };
  }
}
