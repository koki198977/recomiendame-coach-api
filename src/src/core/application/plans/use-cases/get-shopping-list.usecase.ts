import { Inject, Injectable } from '@nestjs/common';
import { PLAN_REPOSITORY, PlanRepositoryPort } from 'src/core/application/plans/ports/out.plan-repository.port';

@Injectable()
export class GetShoppingListUseCase {
  constructor(@Inject(PLAN_REPOSITORY) private readonly plans: PlanRepositoryPort) {}

  async execute(planId: string) {
    const items = await this.plans.getShoppingList(planId);
    return { planId, items };
  }
}
