import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from '../../../domain/common/result';
import { WORKOUT_REPOSITORY, WorkoutRepositoryPort } from '../ports/out.workout-repository.port';
import { WorkoutPlan } from '../../../domain/workouts/entities';

export interface UpdateWorkoutPlanInput {
  userId: string;
  planId: string;
  notes?: string;
  // Add other updatable fields here as needed
}

@Injectable()
export class UpdateWorkoutPlanUseCase {
  constructor(
    @Inject(WORKOUT_REPOSITORY) private readonly repository: WorkoutRepositoryPort,
  ) {}

  async execute(input: UpdateWorkoutPlanInput): Promise<Result<void>> {
    const plan = await this.repository.findById(input.planId);

    if (!plan) {
      return err(new Error('Plan not found'));
    }

    if (plan.userId !== input.userId) {
      return err(new Error('Unauthorized'));
    }

    // Update fields
    const updates: Partial<WorkoutPlan> = {};
    if (input.notes !== undefined) {
      updates.notes = input.notes;
    }

    await this.repository.update(input.planId, updates);
    return ok(void 0);
  }
}
