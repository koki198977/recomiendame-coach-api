import { HydrationAnalysis, HydrationPattern, HydrationNotification } from '../../../domain/hydration/entities';

export const HYDRATION_ANALYZER = 'HYDRATION_ANALYZER';

export interface HydrationAnalyzerPort {
  analyzeDailyHydration(params: {
    userId: string;
    date?: Date;
  }): Promise<HydrationAnalysis>;

  analyzeHydrationPattern(params: {
    userId: string;
    days?: number; // Análisis de los últimos N días (default: 30)
  }): Promise<HydrationPattern>;

  generateHydrationNotifications(params: {
    userId: string;
  }): Promise<HydrationNotification[]>;

  calculateOptimalGoal(params: {
    userId: string;
    weightKg?: number;
    activityLevel?: string;
    climate?: 'HOT' | 'MODERATE' | 'COLD';
  }): Promise<number>; // ml por día

  predictDehydrationRisk(params: {
    userId: string;
    currentTime?: Date;
  }): Promise<{
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    hoursUntilDehydration: number;
    recommendedAction: string;
  }>;
}