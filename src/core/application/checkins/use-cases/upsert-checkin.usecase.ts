import { Inject, Injectable } from '@nestjs/common';
import { CHECKIN_REPOSITORY, CheckinRepositoryPort } from '../ports/out.checkin-repository.port';
import { UpsertCheckinDto } from '../dto/upsert-checkin.dto';
import { OnCheckinConfirmedUseCase } from '../../gamification/use-cases/on-checkin-confirmed.usecase';
import { getChileDateString, normalizeToUTCMidnight } from '../../../domain/common/chile-date.util';

@Injectable()
export class UpsertCheckinUseCase {
  constructor(
    @Inject(CHECKIN_REPOSITORY) private readonly repo: CheckinRepositoryPort,
    private readonly onCheckinConfirmed: OnCheckinConfirmedUseCase,
  ) {}

  async execute(userId: string, dto: UpsertCheckinDto) {
    // Si no se envía fecha, usar la fecha actual en zona horaria de Chile
    const dateString = dto.date || getChileDateString();
    const date = normalizeToUTCMidnight(dateString);

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
