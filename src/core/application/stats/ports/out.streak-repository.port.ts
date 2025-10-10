export interface StreakRepositoryPort {
  getDays(userId: string): Promise<number>;           // 0 si no existe
  setDays(userId: string, days: number): Promise<void>;
}
export const STREAK_REPOSITORY = Symbol('STREAK_REPOSITORY');
