import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PLAN_REPOSITORY, PlanRepositoryPort } from '../ports/out.plan-repository.port';

@Injectable()
export class GetPlanByIdUseCase {
  constructor(@Inject(PLAN_REPOSITORY) private readonly plans: PlanRepositoryPort) {}
  async execute(id: string) {
    const plan = await this.plans.findById(id);
    if (!plan) throw new NotFoundException('Plan no encontrado');
    return plan;
  }
}
