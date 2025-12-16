import { WeightAnalysis, CheckinPattern, HealthAlert, ProactiveNotification } from '../../../domain/chapi/health-monitoring.entities';

export const HEALTH_MONITOR = 'HEALTH_MONITOR';

export interface HealthMonitorPort {
  analyzeWeightProgress(params: {
    userId: string;
    days?: number; // Análisis de los últimos N días (default: 30)
  }): Promise<WeightAnalysis>;

  analyzeCheckinPattern(params: {
    userId: string;
    days?: number; // Análisis de los últimos N días (default: 60)
  }): Promise<CheckinPattern>;

  generateHealthAlerts(params: {
    userId: string;
  }): Promise<HealthAlert[]>;

  generateProactiveNotifications(params: {
    userId: string;
  }): Promise<ProactiveNotification[]>;

  // Análisis masivo para todos los usuarios (para cron jobs)
  analyzeAllUsers(): Promise<{
    usersAnalyzed: number;
    alertsGenerated: number;
    notificationsScheduled: number;
  }>;
}