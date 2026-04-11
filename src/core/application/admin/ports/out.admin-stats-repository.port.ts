export interface AdminAllergyStats {
  allergyName: string;
  userCount: number;
}

export interface AdminConditionStats {
  conditionLabel: string;
  userCount: number;
}

export interface AdminCuisineStats {
  cuisineName: string;
  likeCount: number;
  dislikeCount: number;
}

export interface AdminGoalStats {
  goalType: string;
  userCount: number;
}

export interface AdminActivityLevelStats {
  activityLevel: string;
  userCount: number;
}

export interface AdminExtendedMetrics {
  onboardingCompleted: number;
  onboardingPending: number;
  totalPlansGenerated: number;
  totalCheckins: number;
  totalWorkoutPlans: number;
  activeUsersLast7Days: number;
  activeUsersLast30Days: number;
  topFeatures: { feature: string; totalUses: number }[];
}

export interface AdminUserDetailExtra {
  streak: number | null;
  totalPoints: number;
  workoutPlansCount: number;
  mealLogsCount: number;
  emotionalLogsCount: number;
}

// ── Retención ────────────────────────────────────────────────────────────────

export interface AdminChurnRiskUser {
  id: string;
  email: string;
  plan: string;
  lastActivityAt: Date | null;
  daysSinceLastActivity: number;
}

export interface AdminExpiringProUser {
  id: string;
  email: string;
  planExpiresAt: Date;
  daysUntilExpiry: number;
}

export interface AdminRetentionStats {
  churnRisk14Days: AdminChurnRiskUser[];
  churnRisk30Days: AdminChurnRiskUser[];
  expiringPro7Days: AdminExpiringProUser[];
  expiringPro15Days: AdminExpiringProUser[];
  usersWithTrial: number;
  conversionRate: number; // % FREE que alguna vez pagaron
}

// ── Chapi ────────────────────────────────────────────────────────────────────

export interface AdminChapiStats {
  totalMessages: number;
  messagesByType: { messageType: string; count: number }[];
  topChapiUsers: { userId: string; email: string; messageCount: number }[];
  topEmotions: { emotion: string; count: number }[];
  messagesLast7Days: { date: string; count: number }[];
}

// ── Fitness ──────────────────────────────────────────────────────────────────

export interface AdminFitnessStats {
  workoutDaysCompleted: number;
  workoutDaysPending: number;
  activityTypeDistribution: { activityType: string; count: number }[];
  totalCaloriesBurned: number;
  usersWithActiveStreak: number;
  streakDistribution: { range: string; userCount: number }[];
}

// ── Nutrición ────────────────────────────────────────────────────────────────

export interface AdminNutritionStats {
  topMeals: { title: string; logCount: number }[];
  mealSlotDistribution: { slot: string; count: number }[];
  avgKcalPerUserPerDay: number;
}

// ── Bienestar ────────────────────────────────────────────────────────────────

export interface AdminWellnessStats {
  avgHydrationMlPerDay: number;
  usersLoggingSleep: number;
  avgSleepHours: number;
  avgSleepQuality: number | null;
}

// ── Social ───────────────────────────────────────────────────────────────────

export interface AdminSocialStats {
  postsLast7Days: { date: string; count: number }[];
  topSocialUsers: { userId: string; email: string; postCount: number }[];
  visibilityDistribution: { visibility: string; count: number }[];
}

// ── Gamificación ─────────────────────────────────────────────────────────────

export interface AdminGamificationStats {
  topAchievements: { code: string; title: string; unlockedCount: number }[];
  topChallengesByMembers: { id: string; title: string; membersCount: number }[];
  pointsPercentiles: { p25: number; p50: number; p75: number; p90: number };
}

// ── Operaciones / Seguridad ──────────────────────────────────────────────────

export interface AdminOpsStats {
  pendingAccountDeletions: number;
  unverifiedUsers: number;
  usersWithIncompleteProfile: number;
  pushTokensByPlatform: { platform: string; count: number }[];
}

export interface AdminStatsRepositoryPort {
  getAllergyStats(): Promise<AdminAllergyStats[]>;
  getConditionStats(): Promise<AdminConditionStats[]>;
  getCuisineStats(): Promise<AdminCuisineStats[]>;
  getGoalStats(): Promise<AdminGoalStats[]>;
  getActivityLevelStats(): Promise<AdminActivityLevelStats[]>;
  getExtendedMetrics(): Promise<AdminExtendedMetrics>;
  getUserDetailExtra(userId: string): Promise<AdminUserDetailExtra>;

  getRetentionStats(): Promise<AdminRetentionStats>;
  getChapiStats(): Promise<AdminChapiStats>;
  getFitnessStats(): Promise<AdminFitnessStats>;
  getNutritionStats(): Promise<AdminNutritionStats>;
  getWellnessStats(): Promise<AdminWellnessStats>;
  getSocialStats(): Promise<AdminSocialStats>;
  getGamificationStats(): Promise<AdminGamificationStats>;
  getOpsStats(): Promise<AdminOpsStats>;
}

export const ADMIN_STATS_REPOSITORY = Symbol('ADMIN_STATS_REPOSITORY');
