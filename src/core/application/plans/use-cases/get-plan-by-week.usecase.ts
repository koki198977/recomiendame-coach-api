import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PLAN_REPOSITORY, PlanRepositoryPort } from '../ports/out.plan-repository.port';
import { Week } from '../../../domain/plans/value-objects';

@Injectable()
export class GetPlanByWeekUseCase {
  constructor(@Inject(PLAN_REPOSITORY) private readonly plans: PlanRepositoryPort) {}
  async execute(userId: string, isoWeek: string) {
    const week = Week.fromISOWeek(isoWeek);
    const plan = await this.plans.findByUserAndWeek(userId, week.start);
    if (!plan) throw new NotFoundException('Plan no encontrado para esa semana');
    return plan;
  }
}
