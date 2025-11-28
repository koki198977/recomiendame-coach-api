import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PLAN_REPOSITORY, PlanRepositoryPort } from '../ports/out.plan-repository.port';

@Injectable()
export class DeleteMealPlanUseCase {
  constructor(
    @Inject(PLAN_REPOSITORY)
    private readonly planRepo: PlanRepositoryPort,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const plan = await this.planRepo.findById(id);
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    if (plan.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this plan');
    }

    await this.planRepo.delete(id);
  }
}
