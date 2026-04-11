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

export interface AdminStatsRepositoryPort {
  getAllergyStats(): Promise<AdminAllergyStats[]>;
  getConditionStats(): Promise<AdminConditionStats[]>;
  getCuisineStats(): Promise<AdminCuisineStats[]>;
  getGoalStats(): Promise<AdminGoalStats[]>;
  getActivityLevelStats(): Promise<AdminActivityLevelStats[]>;
  getExtendedMetrics(): Promise<AdminExtendedMetrics>;
  getUserDetailExtra(userId: string): Promise<AdminUserDetailExtra>;
}

export const ADMIN_STATS_REPOSITORY = Symbol('ADMIN_STATS_REPOSITORY');
