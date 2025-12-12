import { Inject, Injectable } from '@nestjs/common';
import { PLAN_REPOSITORY, PlanRepositoryPort } from '../ports/out.plan-repository.port';
import { MEAL_PLANNER_AGENT, MealPlannerAgentPort } from '../ports/out.meal-planner-agent.port'; // si no lo usas aquí, puedes quitarlo
import { PROFILE_REPO, ProfileRepoPort } from '../../profile/ports/out.profile-repo.port';

@Injectable()
export class RegeneratePlanDayUseCase {
  constructor(
    @Inject(PLAN_REPOSITORY) private readonly plans: PlanRepositoryPort,
    @Inject(PROFILE_REPO) private readonly profiles: ProfileRepoPort,
    // @Inject(MEAL_PLANNER_AGENT) private readonly agent: MealPlannerAgentPort, // opcional si el repo ya lo usa
  ) {}

  async execute(input: { planId: string; dayIndex: number; userId: string }) {
    const { planId, dayIndex, userId } = input;

    // preferencias del perfil para pasar al agente
    const prefs = await this.profiles.get(userId);

    const { meals } = await this.plans.regenerateDayWithAgent({
      planId,
      dayIndex,
      userId,
      preferences: {
        allergies: (prefs.allergies ?? []).map(a => a.name),
        cuisinesLike: (prefs.cuisinesLike ?? []).map(c => c.name),
        cuisinesDislike: (prefs.cuisinesDislike ?? []).map(c => c.name),
        cookTimePerMeal: prefs.cookTimePerMeal,
        nutritionGoal: prefs.nutritionGoal,
        targetWeightKg: prefs.targetWeightKg,
        timeFrame: prefs.timeFrame,
        intensity: prefs.intensity,
        currentMotivation: prefs.currentMotivation,
      },
    });

    return { planId, dayIndex, meals };
  }
}
