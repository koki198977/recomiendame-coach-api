export interface ProfileRepoPort {
  get(userId: string): Promise<any>; // shape plana para el front
  update(userId: string, patch: {
    sex?: string; birthDate?: string; heightCm?: number; weightKg?: number;
    activityLevel?: string; country?: string; budgetLevel?: number; cookTimePerMeal?: number;
  }): Promise<void>;

  replaceAllergies(userId: string, allergyIds: number[]): Promise<void>;
  replaceConditions(userId: string, conditionIds: number[]): Promise<void>;
  replaceCuisinePrefs(userId: string, likeIds: number[], dislikeIds: number[]): Promise<void>;
}
export const PROFILE_REPO = Symbol('PROFILE_REPO');
