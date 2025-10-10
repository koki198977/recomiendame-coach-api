export interface AchievementPort {
  has(userId: string, code: string): Promise<boolean>;
  unlock(userId: string, code: string): Promise<void>;
  listUnlockedCodes(userId: string): Promise<string[]>;
}
export const ACHIEVEMENT_PORT = Symbol('ACHIEVEMENT_PORT');
