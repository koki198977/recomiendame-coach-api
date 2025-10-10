import { Inject, Injectable } from '@nestjs/common';
import {
  GenerateWeeklyPlanInput,
  GenerateWeeklyPlanOutput,
} from '../dto/generate-weekly-plan.dto';
import {
  PLAN_REPOSITORY,
  PlanRepositoryPort,
} from '../ports/out.plan-repository.port';
import {
  MEAL_PLANNER_AGENT,
  MealPlannerAgentPort,
} from '../ports/out.meal-planner-agent.port';
import {
  NOTIFICATION_PORT,
  NotificationPort,
} from '../ports/out.notification.port';
import { Macros, Week } from '../../../domain/plans/value-objects';
import { ok, err, Result } from '../../../domain/common/result';
import { Plan } from '../../../domain/plans/entities';

@Injectable()
export class GenerateWeeklyPlanUseCase {
  constructor(
    @Inject(PLAN_REPOSITORY) private readonly plans: PlanRepositoryPort,
    @Inject(MEAL_PLANNER_AGENT) private readonly agent: MealPlannerAgentPort,
    @Inject(NOTIFICATION_PORT) private readonly notifier: NotificationPort,
  ) {}

  async execute(
    input: GenerateWeeklyPlanInput,
  ): Promise<Result<GenerateWeeklyPlanOutput>> {
    const week = Week.fromISOWeek(input.isoWeek);
    const macros = new Macros(
      input.protein_g,
      input.carbs_g,
      input.fat_g,
      input.kcalTarget,
    );

    const exists = await this.plans.findByUserAndWeek(input.userId, week.start);
    if (exists) {
      return ok({ planId: exists.id!, created: false });
    }

    // Llama al agente (IA u otro motor) para proponer comidas
    const draft = await this.agent.draftWeekPlan({
      userId: input.userId,
      weekStart: week.start,
      macros,
    });

    const plan: Plan = {
      userId: input.userId,
      weekStart: week.start,
      macros,
      notes: draft.notes,
      days: draft.days,
    };
    const saved = await this.plans.save(plan);
    if (!saved.ok) return err(saved.error);

    await this.notifier.notify(
      input.userId,
      'Plan semanal creado',
      `Tu plan para la semana ${input.isoWeek} está listo ✨`,
    );
    return ok({ planId: saved.value.id!, created: true });
  }
}
