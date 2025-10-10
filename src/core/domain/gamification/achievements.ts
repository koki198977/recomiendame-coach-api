export const ACHIEVEMENTS = {
  FIRST_CHECKIN: 'first_checkin',
  STREAK_7: 'streak_7',
  STREAK_30: 'streak_30',
} as const;

export type AchievementCode = typeof ACHIEVEMENTS[keyof typeof ACHIEVEMENTS];
