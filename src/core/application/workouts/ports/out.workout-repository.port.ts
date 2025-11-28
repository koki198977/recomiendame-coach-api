import { Result } from '../../../domain/common/result';
import { WorkoutPlan } from '../../../domain/workouts/entities';

export const WORKOUT_REPOSITORY = 'WORKOUT_REPOSITORY';

export interface WorkoutRepositoryPort {
  save(plan: WorkoutPlan): Promise<Result<WorkoutPlan>>;
  findByUserAndWeek(userId: string, weekStart: Date): Promise<WorkoutPlan | null>;
}
