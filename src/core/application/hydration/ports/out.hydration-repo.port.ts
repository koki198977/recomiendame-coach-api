import { HydrationLog, HydrationGoal } from '../../../domain/hydration/entities';

export const HYDRATION_REPO = 'HYDRATION_REPO';

export interface HydrationRepoPort {
  // Logs de hidratación
  createLog(log: Omit<HydrationLog, 'id' | 'createdAt'>): Promise<HydrationLog>;
  getLogsByUser(userId: string, startDate?: Date, endDate?: Date): Promise<HydrationLog[]>;
  getLogsByDate(userId: string, date: Date): Promise<HydrationLog[]>;
  updateLog(id: string, ml: number): Promise<HydrationLog>;
  deleteLog(id: string): Promise<void>;

  // Objetivos de hidratación
  setGoal(goal: HydrationGoal): Promise<HydrationGoal>;
  getGoal(userId: string): Promise<HydrationGoal | null>;
  updateGoal(userId: string, updates: Partial<HydrationGoal>): Promise<HydrationGoal>;

  // Estadísticas
  getTotalByDate(userId: string, date: Date): Promise<number>;
  getWeeklyStats(userId: string, weekStart: Date): Promise<Array<{ date: Date; ml: number }>>;
  getMonthlyStats(userId: string, month: number, year: number): Promise<Array<{ date: Date; ml: number }>>;
}