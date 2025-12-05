import { Result } from '../../../domain/common/result';
import { WorkoutPlan } from '../../../domain/workouts/entities';

export const WORKOUT_REPOSITORY = 'WORKOUT_REPOSITORY';

export interface WorkoutRepositoryPort {
  save(plan: WorkoutPlan): Promise<Result<WorkoutPlan>>;
  findByUserAndWeek(userId: string, weekStart: Date | string): Promise<WorkoutPlan | null>;
  findById(id: string): Promise<WorkoutPlan | null>;
  delete(id: string): Promise<void>;
  update(id: string, updates: Partial<WorkoutPlan>): Promise<void>;
  completeWorkoutDay(params: {
    workoutDayId: string;
    completed: boolean;
    completedAt: Date;
    durationMinutes: number;
    caloriesBurned: number;
  }): Promise<any>;
  updateExerciseCompletion(exerciseId: string, completed: boolean, notes?: string): Promise<void>;
  updateExercise(exerciseId: string, updates: {
    completed?: boolean;
    sets?: number;
    reps?: string;
    weight?: string;
    notes?: string;
  }): Promise<void>;
  logActivity(params: {
    userId: string;
    date: Date;
    minutes: number;
    kcal: number;
  }): Promise<void>;
  getActivityStats(userId: string, startDate: Date, endDate: Date): Promise<any[]>;
}
