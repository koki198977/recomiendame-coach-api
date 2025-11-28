import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Week } from '../../../domain/plans/value-objects';
import { WorkoutPlan } from '../../../domain/workouts/entities';
import {
  WORKOUT_REPOSITORY,
  WorkoutRepositoryPort,
} from '../ports/out.workout-repository.port';

@Injectable()
export class GetWorkoutPlanUseCase {
  constructor(
    @Inject(WORKOUT_REPOSITORY) private readonly workouts: WorkoutRepositoryPort,
  ) {}

  async execute(userId: string, isoWeek: string): Promise<WorkoutPlan> {
    const week = Week.fromISOWeek(isoWeek);
    const plan = await this.workouts.findByUserAndWeek(userId, week.start);

    if (!plan) {
      throw new NotFoundException('No workout plan found for this week');
    }

    return plan;
  }
}
