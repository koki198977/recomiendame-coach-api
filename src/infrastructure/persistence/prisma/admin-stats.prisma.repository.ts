import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  AdminStatsRepositoryPort,
  AdminAllergyStats,
  AdminConditionStats,
  AdminCuisineStats,
  AdminGoalStats,
  AdminActivityLevelStats,
  AdminExtendedMetrics,
  AdminUserDetailExtra,
} from '../../../core/application/admin/ports/out.admin-stats-repository.port';

@Injectable()
export class AdminStatsPrismaRepository implements AdminStatsRepositoryPort {
  constructor(private prisma: PrismaService) {}

  async getAllergyStats(): Promise<AdminAllergyStats[]> {
    const rows = await this.prisma.userAllergy.groupBy({
      by: ['allergyId'],
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
    });
    const allergies = await this.prisma.allergy.findMany({
      where: { id: { in: rows.map((r) => r.allergyId) } },
    });
    const map = new Map(allergies.map((a) => [a.id, a.name]));
    return rows.map((r) => ({ allergyName: map.get(r.allergyId) ?? '', userCount: r._count.userId }));
  }

  async getConditionStats(): Promise<AdminConditionStats[]> {
    const rows = await this.prisma.userCondition.groupBy({
      by: ['conditionId'],
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
    });
    const conditions = await this.prisma.healthCondition.findMany({
      where: { id: { in: rows.map((r) => r.conditionId) } },
    });
    const map = new Map(conditions.map((c) => [c.id, c.label]));
    return rows.map((r) => ({ conditionLabel: map.get(r.conditionId) ?? '', userCount: r._count.userId }));
  }

  async getCuisineStats(): Promise<AdminCuisineStats[]> {
    const rows = await this.prisma.userCuisinePreference.groupBy({
      by: ['cuisineId', 'kind'],
      _count: { userId: true },
    });
    const cuisines = await this.prisma.cuisine.findMany({
      where: { id: { in: [...new Set(rows.map((r) => r.cuisineId))] } },
    });
    const nameMap = new Map(cuisines.map((c) => [c.id, c.name]));
    const result = new Map<number, AdminCuisineStats>();
    for (const r of rows) {
      if (!result.has(r.cuisineId)) {
        result.set(r.cuisineId, { cuisineName: nameMap.get(r.cuisineId) ?? '', likeCount: 0, dislikeCount: 0 });
      }
      const entry = result.get(r.cuisineId)!;
      if (r.kind === 'LIKE') entry.likeCount = r._count.userId;
      else entry.dislikeCount = r._count.userId;
    }
    return [...result.values()].sort((a, b) => b.likeCount - a.likeCount);
  }

  async getGoalStats(): Promise<AdminGoalStats[]> {
    const rows = await this.prisma.goal.groupBy({
      by: ['goalType'],
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
    });
    return rows.map((r) => ({ goalType: r.goalType, userCount: r._count.userId }));
  }

  async getActivityLevelStats(): Promise<AdminActivityLevelStats[]> {
    const rows = await this.prisma.userProfile.groupBy({
      by: ['activityLevel'],
      _count: { userId: true },
      where: { activityLevel: { not: null } },
      orderBy: { _count: { userId: 'desc' } },
    });
    return rows.map((r) => ({ activityLevel: r.activityLevel ?? 'UNKNOWN', userCount: r._count.userId }));
  }

  async getExtendedMetrics(): Promise<AdminExtendedMetrics> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      onboardingCompleted,
      onboardingPending,
      totalPlansGenerated,
      totalCheckins,
      totalWorkoutPlans,
      activeUsersLast7Days,
      activeUsersLast30Days,
      topFeaturesRaw,
    ] = await Promise.all([
      this.prisma.user.count({ where: { onboardingCompleted: true } }),
      this.prisma.user.count({ where: { onboardingCompleted: false } }),
      this.prisma.plan.count(),
      this.prisma.checkin.count(),
      this.prisma.workoutPlan.count(),
      this.prisma.usageLog.groupBy({ by: ['userId'], where: { date: { gte: sevenDaysAgo } } }).then((r) => r.length),
      this.prisma.usageLog.groupBy({ by: ['userId'], where: { date: { gte: thirtyDaysAgo } } }).then((r) => r.length),
      this.prisma.usageLog.groupBy({
        by: ['feature'],
        _sum: { count: true },
        orderBy: { _sum: { count: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      onboardingCompleted,
      onboardingPending,
      totalPlansGenerated,
      totalCheckins,
      totalWorkoutPlans,
      activeUsersLast7Days,
      activeUsersLast30Days,
      topFeatures: topFeaturesRaw.map((r) => ({ feature: r.feature, totalUses: r._sum.count ?? 0 })),
    };
  }

  async getUserDetailExtra(userId: string): Promise<AdminUserDetailExtra> {
    const [streak, pointsAgg, workoutPlansCount, mealLogsCount, emotionalLogsCount] = await Promise.all([
      this.prisma.streak.findUnique({ where: { userId }, select: { days: true } }),
      this.prisma.pointsLedger.aggregate({ where: { userId }, _sum: { delta: true } }),
      this.prisma.workoutPlan.count({ where: { userId } }),
      this.prisma.mealLog.count({ where: { userId } }),
      this.prisma.emotionalLog.count({ where: { userId } }),
    ]);

    return {
      streak: streak?.days ?? null,
      totalPoints: pointsAgg._sum.delta ?? 0,
      workoutPlansCount,
      mealLogsCount,
      emotionalLogsCount,
    };
  }
}
