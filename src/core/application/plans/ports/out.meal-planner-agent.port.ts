import { PlanDay } from 'src/core/domain/plans/entities';
import { Macros } from 'src/core/domain/plans/value-objects';

export interface MealPlannerAgentPort {
  draftWeekPlan(input: {
    userId: string;
    weekStart: Date;
    macros: Macros;
    preferences?: {
      allergies?: string[];
      cuisinesLike?: string[];
      cuisinesDislike?: string[];
    };
  }): Promise<{ days: PlanDay[]; notes?: string }>;
}
export const MEAL_PLANNER_AGENT = Symbol('MEAL_PLANNER_AGENT');
