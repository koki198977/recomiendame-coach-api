import { FreeExerciseLog } from '../../../../core/domain/workouts/free-exercise.entity';

export const FREE_EXERCISE_REPOSITORY = 'FREE_EXERCISE_REPOSITORY';

export interface FreeExerciseRepositoryPort {
  save(log: FreeExerciseLog): Promise<FreeExerciseLog>;
  findByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<FreeExerciseLog[]>;
  delete(id: string, userId: string): Promise<void>;
}
