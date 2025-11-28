import { WorkoutDay } from '../../../domain/workouts/entities';

export const WORKOUT_PLANNER_AGENT = 'WORKOUT_PLANNER_AGENT';

export interface WorkoutPlannerAgentPort {
  draftWeekWorkoutPlan(params: {
    userId: string;
    weekStart: Date;
    userProfile: any; // TODO: Define a cleaner profile type or reuse existing
    goal: string; // e.g. "GAIN_MUSCLE", "LOSE_WEIGHT"
    daysAvailable: number; // e.g. 3, 4, 5 days
  }): Promise<{ days: WorkoutDay[]; notes?: string }>;
}
