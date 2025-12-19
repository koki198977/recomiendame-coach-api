import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from '../../../domain/common/result';
import { Week } from '../../../domain/plans/value-objects'; // Reusing Week logic
import { WorkoutPlan } from '../../../domain/workouts/entities';
import {
  WORKOUT_REPOSITORY,
  WorkoutRepositoryPort,
} from '../ports/out.workout-repository.port';
import {
  WORKOUT_PLANNER_AGENT,
  WorkoutPlannerAgentPort,
} from '../ports/out.workout-planner-agent.port';
import { PROFILE_REPO, ProfileRepoPort } from '../../profile/ports/out.profile-repo.port';

export interface GenerateWeeklyWorkoutPlanInput {
  userId: string;
  isoWeek: string; // "2023-W40"
  daysAvailable: number;
  goal: string; // "HYPERTROPHY", "STRENGTH", "ENDURANCE", etc.
  environment?: string; // "HOME", "GYM"
  equipmentImageUrls?: string[]; // URLs de imágenes del equipamiento (opcional)
}

export interface GenerateWeeklyWorkoutPlanOutput {
  planId: string;
  created: boolean;
}

@Injectable()
export class GenerateWeeklyWorkoutPlanUseCase {
  constructor(
    @Inject(WORKOUT_REPOSITORY) private readonly workouts: WorkoutRepositoryPort,
    @Inject(WORKOUT_PLANNER_AGENT) private readonly agent: WorkoutPlannerAgentPort,
    @Inject(PROFILE_REPO) private readonly profiles: ProfileRepoPort,
  ) {}

  async execute(
    input: GenerateWeeklyWorkoutPlanInput,
  ): Promise<Result<GenerateWeeklyWorkoutPlanOutput>> {
    const week = Week.fromISOWeek(input.isoWeek);

    // Idempotency check
    const exists = await this.workouts.findByUserAndWeek(input.userId, week.start);
    if (exists) {
      return ok({ planId: exists.id!, created: false });
    }

    // Get user profile for context (age, sex, experience, etc.)
    const profile = await this.profiles.get(input.userId);

    // Call AI Agent
    const draft = await this.agent.draftWeekWorkoutPlan({
      userId: input.userId,
      weekStart: week.start,
      userProfile: profile,
      goal: input.goal,
      daysAvailable: input.daysAvailable,
      environment: input.environment,
      equipmentImageUrls: input.equipmentImageUrls,
    });

    // Save Plan
    const plan: WorkoutPlan = {
      userId: input.userId,
      weekStart: week.start,
      notes: draft.notes,
      days: draft.days,
    };

    const saved = await this.workouts.save(plan);
    if (!saved.ok) return err(saved.error);

    return ok({ planId: saved.value.id!, created: true });
  }
}
