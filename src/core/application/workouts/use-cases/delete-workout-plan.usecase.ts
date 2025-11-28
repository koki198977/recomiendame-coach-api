import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from '../../../domain/common/result';
import { WORKOUT_REPOSITORY, WorkoutRepositoryPort } from '../ports/out.workout-repository.port';

export interface DeleteWorkoutPlanInput {
  userId: string;
  planId: string;
}

@Injectable()
export class DeleteWorkoutPlanUseCase {
  constructor(
    @Inject(WORKOUT_REPOSITORY) private readonly repository: WorkoutRepositoryPort,
  ) {}

  async execute(input: DeleteWorkoutPlanInput): Promise<Result<void>> {
    const plan = await this.repository.findById(input.planId);

    if (!plan) {
      return err(new Error('Plan not found'));
    }

    if (plan.userId !== input.userId) {
      return err(new Error('Unauthorized'));
    }

    await this.repository.delete(input.planId);
    return ok(void 0);
  }
}
