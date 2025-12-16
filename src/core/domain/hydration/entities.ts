export interface HydrationLog {
  id: string;
  userId: string;
  date: Date;
  ml: number;
  createdAt?: Date;
}

export interface HydrationGoal {
  userId: string;
  dailyTargetMl: number;
  reminderIntervalMinutes: number;
  startTime: string; // "07:00"
  endTime: string;   // "22:00"
  isActive: boolean;
}

export interface HydrationAnalysis {
  userId: string;
  date: Date;
  totalMl: number;
  targetMl: number;
  achievementPercentage: number;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';
  remainingMl: number;
  averagePerHour: number;
  recommendedNextIntake: number;
  insights: string[];
}

export interface HydrationPattern {
  userId: string;
  weeklyAverage: number;
  bestDay: { date: Date; ml: number };
  worstDay: { date: Date; ml: number };
  consistency: 'EXCELLENT' | 'GOOD' | 'INCONSISTENT' | 'POOR';
  streak: number; // días consecutivos alcanzando objetivo
  missedDays: number;
  peakHours: string[]; // horas donde más toma agua
}

export interface HydrationReminder {
  userId: string;
  scheduledFor: Date;
  message: string;
  type: 'REGULAR' | 'MORNING' | 'AFTERNOON' | 'EVENING' | 'URGENT';
  ml: number; // cantidad sugerida
}

export interface HydrationNotification {
  userId: string;
  type: 'DEHYDRATION_RISK' | 'GOAL_ACHIEVED' | 'STREAK_MILESTONE' | 'REMINDER' | 'ENCOURAGEMENT';
  title: string;
  body: string;
  data: any;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  actionButtons?: Array<{
    id: string;
    label: string;
    action: 'LOG_WATER' | 'SET_REMINDER' | 'ADJUST_GOAL' | 'VIEW_STATS';
    data?: any;
  }>;
}