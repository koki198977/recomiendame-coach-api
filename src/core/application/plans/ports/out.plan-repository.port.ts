import { Result } from 'src/core/domain/common/result';
import { Plan } from 'src/core/domain/plans/entities';

export interface PlanRepositoryPort {
  findByUserAndWeek(userId: string, weekStart: Date): Promise<Plan | null>;
  findById(id: string): Promise<Plan | null>;
  save(plan: Plan): Promise<Result<Plan>>;
}
export const PLAN_REPOSITORY = Symbol('PLAN_REPOSITORY');
