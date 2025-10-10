export interface GenerateWeeklyPlanInput {
  userId: string;
  isoWeek: string;
  kcalTarget: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}
export interface GenerateWeeklyPlanOutput {
  planId: string;
  created: boolean;
}
