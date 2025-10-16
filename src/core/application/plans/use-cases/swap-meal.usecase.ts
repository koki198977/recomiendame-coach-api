import { Inject, Injectable } from '@nestjs/common';
import { PLAN_REPOSITORY, PlanRepositoryPort } from '../ports/out.plan-repository.port';
import { PROFILE_REPO, ProfileRepoPort } from '../../profile/ports/out.profile-repo.port';

@Injectable()
export class SwapMealUseCase {
  constructor(
    @Inject(PLAN_REPOSITORY) private readonly plans: PlanRepositoryPort,
    @Inject(PROFILE_REPO) private readonly profiles: ProfileRepoPort,
  ) {}

  async execute(input: { planId: string; dayIndex: number; mealIndex: number; userId: string }) {
    const { planId, dayIndex, mealIndex, userId } = input;

    const prefs = await this.profiles.get(userId);

    const { meal } = await this.plans.swapMealWithAgent({
      planId,
      dayIndex,
      mealIndex,
      userId,
      preferences: {
        allergies: (prefs.allergies ?? []).map(a => a.name),
        cuisinesLike: (prefs.cuisinesLike ?? []).map(c => c.name),
        cuisinesDislike: (prefs.cuisinesDislike ?? []).map(c => c.name),
      },
    });

    return { planId, dayIndex, mealIndex, meal };
  }
}
