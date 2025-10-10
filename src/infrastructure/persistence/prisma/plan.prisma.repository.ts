import { Injectable } from '@nestjs/common';
import {
  PLAN_REPOSITORY,
  PlanRepositoryPort,
} from '../../../core/application/plans/ports/out.plan-repository.port';
import { PlanMapper } from './mappers/plan.mapper';
import { Plan } from '../../../core/domain/plans/entities';
import { Result, ok, err } from '../../../core/domain/common/result';
import { PrismaService } from 'src/infrastructure/database/prisma.service';

@Injectable()
export class PlanPrismaRepository implements PlanRepositoryPort {
  constructor(private prisma: PrismaService) {}

  async findByUserAndWeek(
    userId: string,
    weekStart: Date,
  ): Promise<Plan | null> {
    const p = await this.prisma.plan.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
      include: {
        days: { include: { meals: { include: { ingredients: true } } } },
      },
    });
    return p ? PlanMapper.fromPrisma(p) : null;
  }

  async save(plan: Plan): Promise<Result<Plan>> {
    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const data = PlanMapper.toPrismaData(plan);
        const p = await tx.plan.create({
          data,
          include: {
            days: { include: { meals: { include: { ingredients: true } } } },
          },
        });
        return p;
      });
      return ok(PlanMapper.fromPrisma(created));
    } catch (e) {
      return err(e as Error);
    }
  }

  async findById(id: string) {
    const p = await this.prisma.plan.findUnique({
        where: { id },
        include: { days: { include: { meals: { include: { ingredients: true } } } } },
    });
    return p ? PlanMapper.fromPrisma(p) : null;
    }
}
