import { SetMetadata } from '@nestjs/common';
import { UserPlan } from '@prisma/client';
import { FeatureKey, Window } from '../plan/feature-gates';

export const PLAN_KEY = 'requiredPlan';
export const FEATURE_KEY = 'requiredFeature';

export interface FeatureMetadata {
  feature: FeatureKey;
  limit: number;
  window: Window;
}

export const RequiresPlan = (plan: UserPlan) => SetMetadata(PLAN_KEY, plan);

export const RequiresFeature = (feature: FeatureKey, limit: number, window: Window) =>
  SetMetadata(FEATURE_KEY, { feature, limit, window });
