import { Inject, Injectable } from '@nestjs/common';
import { CHECKIN_REPOSITORY, CheckinRepositoryPort } from '../ports/out.checkin-repository.port';

function normalizeUTC(date: Date) {
  return new Date(date.toISOString().slice(0, 10) + 'T00:00:00.000Z');
}

@Injectable()
export class GetTodayCheckinUseCase {
  constructor(
    @Inject(CHECKIN_REPOSITORY) private readonly repo: CheckinRepositoryPort,
  ) {}

  async execute(userId: string) {
    const today = normalizeUTC(new Date());
    const checkins = await this.repo.listInRange(userId, today, today);
    
    const todayCheckin = checkins.length > 0 ? checkins[0] : null;
    
    return {
      checkin: todayCheckin ? {
        id: todayCheckin.props.id,
        date: todayCheckin.props.date,
        weightKg: todayCheckin.props.weightKg,
        adherencePct: todayCheckin.props.adherencePct,
        hungerLvl: todayCheckin.props.hungerLvl,
        notes: todayCheckin.props.notes,
      } : null,
      hasCheckin: todayCheckin !== null,
      date: today.toISOString().split('T')[0], // YYYY-MM-DD format
    };
  }
}