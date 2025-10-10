export interface GamificationRepoPort {
  onDailyCheckin(input: { userId: string; date: Date }): Promise<{
    streakDays: number;
    pointsAdded: number;
    unlocked: string[]; // códigos de achievement
  }>;

  getMyGamification(userId: string): Promise<{
    streakDays: number;
    totalPoints: number;
    achievements: string[];
  }>;

  listMyPoints(userId: string, params: { take: number; cursor?: string }): Promise<{
    items: Array<{ id: string; delta: number; reason: string; meta?: any; createdAt: Date }>;
    nextCursor: string | null;
  }>;
}
export const GAMIFICATION_REPO = Symbol('GAMIFICATION_REPO');
