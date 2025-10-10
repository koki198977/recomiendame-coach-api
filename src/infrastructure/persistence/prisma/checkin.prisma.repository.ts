import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CHECKIN_REPOSITORY, CheckinRepositoryPort } from '../../../core/application/checkins/ports/out.checkin-repository.port';
import { CheckinEntity } from '../../../core/domain/checkins/entities';
import { Prisma } from '@prisma/client';

const dec = (v: Prisma.Decimal | null | undefined): number | null =>
  v == null ? null : v.toNumber();

@Injectable()
export class CheckinPrismaRepository implements CheckinRepositoryPort {
  constructor(private prisma: PrismaService) {}

  async upsertForDate(input: Omit<CheckinEntity['props'], 'id'>): Promise<CheckinEntity> {
    const c = await this.prisma.checkin.upsert({
      where: { userId_date: { userId: input.userId, date: input.date } },
      update: {
        weightKg: input.weightKg,
        adherencePct: input.adherencePct,
        hungerLvl: input.hungerLvl,
        notes: input.notes,
      },
      create: {
        userId: input.userId,
        date: input.date,
        weightKg: input.weightKg ?? null,
        adherencePct: input.adherencePct ?? null,
        hungerLvl: input.hungerLvl ?? null,
        notes: input.notes ?? null,
      },
    });
    return new CheckinEntity({
      id: c.id, userId: c.userId, date: c.date,
      weightKg: dec(c.weightKg),    
      adherencePct: c.adherencePct ?? null,
      hungerLvl: c.hungerLvl ?? null,
      notes: c.notes ?? null,
    });
  }

  async listInRange(userId: string, from: Date, to: Date): Promise<CheckinEntity[]> {
    const rows = await this.prisma.checkin.findMany({
      where: { userId, date: { gte: from, lte: to } },
      orderBy: { date: 'asc' },
    });
    return rows.map(c => new CheckinEntity({
      id: c.id, userId: c.userId, date: c.date,
      weightKg: dec(c.weightKg),
      adherencePct: c.adherencePct ?? null,
      hungerLvl: c.hungerLvl ?? null,
      notes: c.notes ?? null,
    }));
  }
}
