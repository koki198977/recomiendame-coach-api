export interface HealthAlert {
  id: string;
  userId: string;
  type: HealthAlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  data: any;
  createdAt: Date;
  acknowledged: boolean;
  actionTaken?: string;
}

export enum HealthAlertType {
  RAPID_WEIGHT_LOSS = 'RAPID_WEIGHT_LOSS',
  RAPID_WEIGHT_GAIN = 'RAPID_WEIGHT_GAIN',
  STAGNANT_PROGRESS = 'STAGNANT_PROGRESS',
  MISSING_CHECKINS = 'MISSING_CHECKINS',
  GOAL_DEVIATION = 'GOAL_DEVIATION',
  UNHEALTHY_PATTERN = 'UNHEALTHY_PATTERN',
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface WeightAnalysis {
  currentWeight: number;
  targetWeight: number;
  weeklyChange: number;
  monthlyTrend: 'LOSING' | 'GAINING' | 'STABLE';
  isHealthyPace: boolean;
  recommendedWeeklyPace: number;
  daysToGoal: number;
  riskLevel: AlertSeverity;
  insights: string[];
}

export interface CheckinPattern {
  lastCheckinDate: Date | null;
  daysSinceLastCheckin: number;
  averageFrequency: number; // days between checkins
  consistency: 'EXCELLENT' | 'GOOD' | 'POOR' | 'CRITICAL';
  missedCheckins: number;
}

export interface ProactiveNotification {
  userId: string;
  type: 'HEALTH_ALERT' | 'MOTIVATION' | 'PLAN_ADJUSTMENT' | 'CHECK_IN_REMINDER';
  title: string;
  body: string;
  data: any;
  scheduledFor: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  actionButtons?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  action: 'ADJUST_PLAN' | 'SCHEDULE_CHECKIN' | 'CONTACT_SUPPORT' | 'VIEW_PROGRESS';
  data?: any;
}