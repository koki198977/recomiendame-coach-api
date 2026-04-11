import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  AdminUserRepositoryPort,
  AdminUserSummary,
  AdminUserDetail,
} from '../../../core/application/admin/ports/out.admin-user-repository.port';

@Injectable()
export class AdminUserPrismaRepository implements AdminUserRepositoryPort {
  constructor(private prisma: PrismaService) {}

  async listUsers(params: {
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ items: AdminUserSummary[]; total: number }> {
    const { search, page, limit } = params;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          lastName: true,
          role: true,
          plan: true,
          emailVerified: true,
          onboardingCompleted: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((u) => ({
        ...u,
        role: u.role as 'USER' | 'ADMIN',
        plan: u.plan as 'FREE' | 'PRO',
      })),
      total,
    };
  }

  async getUserDetail(userId: string): Promise<AdminUserDetail | null> {
    const [user, usageGroups] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { payments: true },
      }),
      this.prisma.usageLog.groupBy({
        by: ['feature'],
        where: { userId },
        _sum: { count: true },
        _max: { date: true },
      }),
    ]);

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      lastName: user.lastName,
      role: user.role as 'USER' | 'ADMIN',
      plan: user.plan as 'FREE' | 'PRO',
      emailVerified: user.emailVerified,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt,
      planExpiresAt: user.planExpiresAt,
      payments: user.payments.map((p) => ({
        id: p.id,
        userId: p.userId,
        userEmail: user.email,
        provider: p.provider,
        providerPaymentId: p.providerPaymentId,
        amount: p.amount,
        currency: p.currency,
        planType: p.planType,
        status: p.status,
        createdAt: p.createdAt,
      })),
      usageByFeature: usageGroups.map((g) => ({
        feature: g.feature,
        totalCount: g._sum.count ?? 0,
        lastUsedAt: g._max.date as Date,
      })),
    };
  }

  async deleteUser(userId: string): Promise<void> {
    await this.prisma.user.delete({ where: { id: userId } });
  }

  async changeRole(
    userId: string,
    role: 'USER' | 'ADMIN',
  ): Promise<AdminUserSummary> {
    const u = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        role: true,
        plan: true,
        emailVerified: true,
        onboardingCompleted: true,
        createdAt: true,
      },
    });

    return {
      ...u,
      role: u.role as 'USER' | 'ADMIN',
      plan: u.plan as 'FREE' | 'PRO',
    };
  }
}
