export const MEAL_DETAILS_AGENT = Symbol('MEAL_DETAILS_AGENT');

export interface MealDetailsAgentPort {
  generateDetails(input: {
    title: string;
    slot: string;
  }): Promise<{
    ingredients: Array<{ name: string; qty?: number; unit?: string; category?: string }>;
    instructions: string;
  }>;
}
