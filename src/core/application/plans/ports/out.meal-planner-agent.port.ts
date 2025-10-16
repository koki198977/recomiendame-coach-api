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

  draftDayPlan(input: {
    userId: string;
    weekStart: Date;
    dayIndex: number;
    macros: Macros;
    preferences?: { allergies?: string[]; cuisinesLike?: string[]; cuisinesDislike?: string[] };
    avoidTitles?: string[];
  }): Promise<{ day: PlanDay }>;

  suggestSwap(input: {
    userId: string;
    weekStart: Date;
    dayIndex: number;
    macros: Macros;
    target: { slot: PlanDay['meals'][number]['slot']; kcal: number };
    preferences?: { allergies?: string[]; cuisinesLike?: string[]; cuisinesDislike?: string[] };
    avoidTitles?: string[];
  }): Promise<{ meal: PlanDay['meals'][number] }>;
}
export const MEAL_PLANNER_AGENT = Symbol('MEAL_PLANNER_AGENT');
