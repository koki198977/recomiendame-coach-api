import { Result } from 'src/core/domain/common/result';
import { Plan } from 'src/core/domain/plans/entities';

export interface PlanRepositoryPort {
  findByUserAndWeek(userId: string, weekStart: Date): Promise<Plan | null>;
  findById(id: string): Promise<Plan | null>;
  delete(id: string): Promise<void>;
  save(plan: Plan): Promise<Result<Plan>>;
  replaceDay(planId: string, dayIndex: number, meals: Plan['days'][number]['meals']): Promise<void>;
  replaceMeal(
    planId: string,
    dayIndex: number,
    mealIndex: number,
    meal: Plan['days'][number]['meals'][number]
  ): Promise<void>;
  regenerateDayWithAgent(input: {
    planId: string;
    dayIndex: number;
    userId: string;
    preferences?: {
      allergies?: string[];
      cuisinesLike?: string[];
      cuisinesDislike?: string[];
      cookTimePerMeal?: number | null;
      nutritionGoal?: string | null;
      targetWeightKg?: number | null;
      timeFrame?: string | null;
      intensity?: string | null;
      currentMotivation?: string | null;
    };
  }): Promise<{ meals: Plan['days'][number]['meals'] }>;

  swapMealWithAgent(input: {
    planId: string;
    dayIndex: number;
    mealIndex: number;
    userId: string;
    preferences?: {
      allergies?: string[];
      cuisinesLike?: string[];
      cuisinesDislike?: string[];
      cookTimePerMeal?: number | null;
      nutritionGoal?: string | null;
      targetWeightKg?: number | null;
      timeFrame?: string | null;
      intensity?: string | null;
      currentMotivation?: string | null;
    };
  }): Promise<{ meal: Plan['days'][number]['meals'][number] }>;
  getShoppingList(planId: string): Promise<Array<{category: string|null, name: string, qty: number|null, unit: string|null}>>;
}
export const PLAN_REPOSITORY = Symbol('PLAN_REPOSITORY');
