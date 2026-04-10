export type FeatureKey =
  | 'photo_meal_log'
  | 'plan_generate'
  | 'workout_generate'
  | 'chapi_basic'
  | 'chapi_v2'
  | 'chapi_insights'
  | 'barcode_scan'
  | 'view_recipe'
  | 'regenerate_meal'
  | 'weekly_analysis'
  | 'exercise_video';

export type FeatureTier = 'FREE' | 'FREE_LIMITED' | 'PRO' | 'INACTIVE';
export type Window = 'daily' | 'weekly' | 'monthly';

export interface FeatureGateConfig {
  tier: FeatureTier;
  limit?: number;
  window?: Window;
}

export const FEATURE_GATES: Record<FeatureKey, FeatureGateConfig> = {
  photo_meal_log:   { tier: 'FREE_LIMITED', limit: 1, window: 'daily'   },
  plan_generate:    { tier: 'FREE_LIMITED', limit: 1, window: 'monthly' },
  workout_generate: { tier: 'FREE_LIMITED', limit: 1, window: 'monthly' },
  chapi_basic:      { tier: 'FREE_LIMITED', limit: 3, window: 'daily'   },
  chapi_v2:         { tier: 'PRO' },
  chapi_insights:   { tier: 'FREE_LIMITED', limit: 2, window: 'daily' },
  barcode_scan:     { tier: 'FREE_LIMITED', limit: 2, window: 'daily' },
  view_recipe:      { tier: 'PRO' },
  regenerate_meal:  { tier: 'PRO' },
  weekly_analysis:  { tier: 'PRO' },
  exercise_video:   { tier: 'PRO' },
};
