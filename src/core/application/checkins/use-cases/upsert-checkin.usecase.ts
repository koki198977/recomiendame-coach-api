import { Inject, Injectable } from '@nestjs/common';
import { CHECKIN_REPOSITORY, CheckinRepositoryPort } from '../ports/out.checkin-repository.port';
import { UpsertCheckinDto } from '../dto/upsert-checkin.dto';
import { OnCheckinConfirmedUseCase } from '../../gamification/use-cases/on-checkin-confirmed.usecase';

function normalizeUTC(date: Date) {
  return new Date(date.toISOString().slice(0, 10) + 'T00:00:00.000Z');
}

@Injectable()
export class UpsertCheckinUseCase {
  constructor(
    @Inject(CHECKIN_REPOSITORY) private readonly repo: CheckinRepositoryPort,
    private readonly onCheckinConfirmed: OnCheckinConfirmedUseCase,
  ) {}

  async execute(userId: string, dto: UpsertCheckinDto) {
    const date = dto.date ? new Date(dto.date + 'T00:00:00.000Z') : normalizeUTC(new Date());

    const saved = await this.repo.upsertForDate({
      userId, date,
      weightKg: dto.weightKg ?? null,
      adherencePct: dto.adherencePct ?? null,
      hungerLvl: dto.hungerLvl ?? null,
      notes: dto.notes ?? null,
    });

    const effects = await this.onCheckinConfirmed.execute({ userId, date });

    return {
      ok: true,
      id: saved.props.id,
      date: saved.props.date,
      gamification: effects,
    };
  }
}
