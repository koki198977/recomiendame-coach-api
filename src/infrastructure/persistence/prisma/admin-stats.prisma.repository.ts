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
  AdminRetentionStats,
  AdminChapiStats,
  AdminFitnessStats,
  AdminNutritionStats,
  AdminWellnessStats,
  AdminSocialStats,
  AdminGamificationStats,
  AdminOpsStats,
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

  async getRetentionStats(): Promise<AdminRetentionStats> {
    const now = new Date();
    const d14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const d7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const d15 = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    const [lastActivity14, lastActivity30, expiringPro15, totalUsers, paidUsers, usersWithTrial] =
      await Promise.all([
        this.prisma.usageLog.groupBy({
          by: ['userId'],
          _max: { date: true },
          having: { date: { _max: { lt: d14 } } },
        }),
        this.prisma.usageLog.groupBy({
          by: ['userId'],
          _max: { date: true },
          having: { date: { _max: { lt: d30 } } },
        }),
        this.prisma.user.findMany({
          where: { plan: 'PRO', planExpiresAt: { gte: now, lte: d15 } },
          select: { id: true, email: true, planExpiresAt: true },
        }),
        this.prisma.user.count(),
        this.prisma.payment.groupBy({ by: ['userId'], where: { status: 'approved' } }).then((r) => r.length),
        this.prisma.user.count({ where: { trialStartedAt: { not: null } } }),
      ]);

    const userIds14 = lastActivity14.map((r) => r.userId);
    const userIds30 = lastActivity30.map((r) => r.userId);

    const [churnUsers14, churnUsers30] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: userIds14 } },
        select: { id: true, email: true, plan: true },
        take: 50,
      }),
      this.prisma.user.findMany({
        where: { id: { in: userIds30 } },
        select: { id: true, email: true, plan: true },
        take: 50,
      }),
    ]);

    const lastActivityMap14 = new Map(lastActivity14.map((r) => [r.userId, r._max.date]));
    const lastActivityMap30 = new Map(lastActivity30.map((r) => [r.userId, r._max.date]));

    const toChurnUser = (u: { id: string; email: string; plan: string }, lastAt: Date | null) => ({
      id: u.id,
      email: u.email,
      plan: u.plan,
      lastActivityAt: lastAt,
      daysSinceLastActivity: lastAt ? Math.floor((now.getTime() - lastAt.getTime()) / 86400000) : 999,
    });

    return {
      churnRisk14Days: churnUsers14.map((u) => toChurnUser(u, lastActivityMap14.get(u.id) ?? null)),
      churnRisk30Days: churnUsers30.map((u) => toChurnUser(u, lastActivityMap30.get(u.id) ?? null)),
      expiringPro7Days: expiringPro15
        .filter((u) => u.planExpiresAt! <= d7)
        .map((u) => ({
          id: u.id,
          email: u.email,
          planExpiresAt: u.planExpiresAt!,
          daysUntilExpiry: Math.floor((u.planExpiresAt!.getTime() - now.getTime()) / 86400000),
        })),
      expiringPro15Days: expiringPro15.map((u) => ({
        id: u.id,
        email: u.email,
        planExpiresAt: u.planExpiresAt!,
        daysUntilExpiry: Math.floor((u.planExpiresAt!.getTime() - now.getTime()) / 86400000),
      })),
      usersWithTrial,
      conversionRate: totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 10000) / 100 : 0,
    };
  }

  async getChapiStats(): Promise<AdminChapiStats> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalMessages, byType, topUsersRaw, topEmotions, last7DaysRaw] = await Promise.all([
      this.prisma.conversationMessage.count(),
      this.prisma.conversationMessage.groupBy({
        by: ['messageType'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.conversationMessage.groupBy({
        by: ['userId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.emotionalLog.groupBy({
        by: ['emotion'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.conversationMessage.findMany({
        where: { timestamp: { gte: sevenDaysAgo } },
        select: { timestamp: true },
      }),
    ]);

    const topUserIds = topUsersRaw.map((r) => r.userId);
    const topUserEmails = await this.prisma.user.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, email: true },
    });
    const emailMap = new Map(topUserEmails.map((u) => [u.id, u.email]));

    // Agrupar mensajes por día
    const dayMap = new Map<string, number>();
    for (const m of last7DaysRaw) {
      const day = m.timestamp.toISOString().slice(0, 10);
      dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
    }

    return {
      totalMessages,
      messagesByType: byType.map((r) => ({ messageType: r.messageType, count: r._count.id })),
      topChapiUsers: topUsersRaw.map((r) => ({
        userId: r.userId,
        email: emailMap.get(r.userId) ?? '',
        messageCount: r._count.id,
      })),
      topEmotions: topEmotions.map((r) => ({ emotion: r.emotion, count: r._count.id })),
      messagesLast7Days: [...dayMap.entries()].map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  async getFitnessStats(): Promise<AdminFitnessStats> {
    const [completed, pending, activityTypes, caloriesAgg, streaks] = await Promise.all([
      this.prisma.workoutDay.count({ where: { completed: true } }),
      this.prisma.workoutDay.count({ where: { completed: false } }),
      this.prisma.freeExerciseLog.groupBy({
        by: ['activityType'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.freeExerciseLog.aggregate({ _sum: { caloriesBurned: true } }),
      this.prisma.streak.findMany({ select: { days: true } }),
    ]);

    const usersWithActiveStreak = streaks.filter((s) => s.days > 0).length;
    const ranges = [
      { range: '1-7', min: 1, max: 7 },
      { range: '8-30', min: 8, max: 30 },
      { range: '31-90', min: 31, max: 90 },
      { range: '90+', min: 91, max: Infinity },
    ];
    const streakDistribution = ranges.map(({ range, min, max }) => ({
      range,
      userCount: streaks.filter((s) => s.days >= min && s.days <= max).length,
    }));

    return {
      workoutDaysCompleted: completed,
      workoutDaysPending: pending,
      activityTypeDistribution: activityTypes.map((r) => ({ activityType: r.activityType, count: r._count.id })),
      totalCaloriesBurned: caloriesAgg._sum.caloriesBurned ?? 0,
      usersWithActiveStreak,
      streakDistribution,
    };
  }

  async getNutritionStats(): Promise<AdminNutritionStats> {
    const [topMeals, slotDist, kcalAgg, totalLogs, uniqueDays] = await Promise.all([
      this.prisma.mealLog.groupBy({
        by: ['title'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.mealLog.groupBy({
        by: ['slot'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.mealLog.aggregate({ _sum: { kcal: true } }),
      this.prisma.mealLog.count(),
      this.prisma.mealLog.groupBy({ by: ['userId', 'date'] }).then((r) => r.length),
    ]);

    const avgKcalPerUserPerDay = uniqueDays > 0 ? Math.round((kcalAgg._sum.kcal ?? 0) / uniqueDays) : 0;

    return {
      topMeals: topMeals.map((r) => ({ title: r.title, logCount: r._count.id })),
      mealSlotDistribution: slotDist.map((r) => ({ slot: r.slot, count: r._count.id })),
      avgKcalPerUserPerDay,
    };
  }

  async getWellnessStats(): Promise<AdminWellnessStats> {
    const [hydrationAgg, hydrationDays, usersLoggingSleep, sleepAgg] = await Promise.all([
      this.prisma.hydrationLog.aggregate({ _sum: { ml: true } }),
      this.prisma.hydrationLog.groupBy({ by: ['userId', 'date'] }).then((r) => r.length),
      this.prisma.sleepLog.groupBy({ by: ['userId'] }).then((r) => r.length),
      this.prisma.sleepLog.aggregate({ _avg: { hours: true, quality: true } }),
    ]);

    return {
      avgHydrationMlPerDay: hydrationDays > 0 ? Math.round((hydrationAgg._sum.ml ?? 0) / hydrationDays) : 0,
      usersLoggingSleep,
      avgSleepHours: sleepAgg._avg.hours ? Number(sleepAgg._avg.hours.toFixed(1)) : 0,
      avgSleepQuality: sleepAgg._avg.quality ? Math.round(Number(sleepAgg._avg.quality) * 10) / 10 : null,
    };
  }

  async getSocialStats(): Promise<AdminSocialStats> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [recentPosts, topUsersRaw, visibilityDist] = await Promise.all([
      this.prisma.post.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
      this.prisma.post.groupBy({
        by: ['authorId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.post.groupBy({
        by: ['visibility'],
        _count: { id: true },
      }),
    ]);

    const topUserIds = topUsersRaw.map((r) => r.authorId);
    const topUserEmails = await this.prisma.user.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, email: true },
    });
    const emailMap = new Map(topUserEmails.map((u) => [u.id, u.email]));

    const dayMap = new Map<string, number>();
    for (const p of recentPosts) {
      const day = p.createdAt.toISOString().slice(0, 10);
      dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
    }

    return {
      postsLast7Days: [...dayMap.entries()].map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
      topSocialUsers: topUsersRaw.map((r) => ({
        userId: r.authorId,
        email: emailMap.get(r.authorId) ?? '',
        postCount: r._count.id,
      })),
      visibilityDistribution: visibilityDist.map((r) => ({ visibility: r.visibility, count: r._count.id })),
    };
  }

  async getGamificationStats(): Promise<AdminGamificationStats> {
    const [topAchievementsRaw, topChallengesRaw, allPoints] = await Promise.all([
      this.prisma.userAchievement.groupBy({
        by: ['achievementId'],
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
      this.prisma.challengeMembership.groupBy({
        by: ['challengeId'],
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 5,
      }),
      this.prisma.pointsLedger.groupBy({
        by: ['userId'],
        _sum: { delta: true },
      }),
    ]);

    const achievementIds = topAchievementsRaw.map((r) => r.achievementId);
    const challengeIds = topChallengesRaw.map((r) => r.challengeId);

    const [achievements, challenges] = await Promise.all([
      this.prisma.achievement.findMany({ where: { id: { in: achievementIds } }, select: { id: true, code: true, title: true } }),
      this.prisma.challenge.findMany({ where: { id: { in: challengeIds } }, select: { id: true, title: true } }),
    ]);

    const achMap = new Map(achievements.map((a) => [a.id, a]));
    const chalMap = new Map(challenges.map((c) => [c.id, c]));

    const pointsValues = allPoints.map((r) => r._sum.delta ?? 0).sort((a, b) => a - b);
    const pct = (p: number) => pointsValues[Math.floor((p / 100) * pointsValues.length)] ?? 0;

    return {
      topAchievements: topAchievementsRaw.map((r) => ({
        code: achMap.get(r.achievementId)?.code ?? '',
        title: achMap.get(r.achievementId)?.title ?? '',
        unlockedCount: r._count.userId,
      })),
      topChallengesByMembers: topChallengesRaw.map((r) => ({
        id: r.challengeId,
        title: chalMap.get(r.challengeId)?.title ?? '',
        membersCount: r._count.userId,
      })),
      pointsPercentiles: { p25: pct(25), p50: pct(50), p75: pct(75), p90: pct(90) },
    };
  }

  async getOpsStats(): Promise<AdminOpsStats> {
    const [pendingDeletions, unverifiedUsers, incompleteProfiles, pushTokens] = await Promise.all([
      this.prisma.accountDeletion.count({ where: { usedAt: null, expiresAt: { gte: new Date() } } }),
      this.prisma.user.count({ where: { emailVerified: false } }),
      this.prisma.userProfile.count({
        where: { OR: [{ weightKg: null }, { heightCm: null }] },
      }),
      this.prisma.userPushToken.groupBy({
        by: ['platform'],
        _count: { id: true },
      }),
    ]);

    return {
      pendingAccountDeletions: pendingDeletions,
      unverifiedUsers,
      usersWithIncompleteProfile: incompleteProfiles,
      pushTokensByPlatform: pushTokens.map((r) => ({ platform: r.platform, count: r._count.id })),
    };
  }
}
