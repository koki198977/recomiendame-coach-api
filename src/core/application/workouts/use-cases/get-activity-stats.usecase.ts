import { Inject, Injectable } from '@nestjs/common';
import { WORKOUT_REPOSITORY, WorkoutRepositoryPort } from '../ports/out.workout-repository.port';

@Injectable()
export class GetActivityStatsUseCase {
  constructor(
    @Inject(WORKOUT_REPOSITORY)
    private readonly workoutRepo: WorkoutRepositoryPort,
  ) {}

  async execute(userId: string, startDate: Date, endDate: Date) {
    return await this.workoutRepo.getActivityStats(userId, startDate, endDate);
  }
}
