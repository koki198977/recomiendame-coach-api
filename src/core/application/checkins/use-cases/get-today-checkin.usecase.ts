import { Inject, Injectable } from '@nestjs/common';
import { CHECKIN_REPOSITORY, CheckinRepositoryPort } from '../ports/out.checkin-repository.port';
import { getChileDateString, normalizeToUTCMidnight } from '../../../domain/common/chile-date.util';

@Injectable()
export class GetTodayCheckinUseCase {
  constructor(
    @Inject(CHECKIN_REPOSITORY) private readonly repo: CheckinRepositoryPort,
  ) {}

  async execute(userId: string) {
    const todayString = getChileDateString();
    const today = normalizeToUTCMidnight(todayString);
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
      date: todayString, // YYYY-MM-DD format en hora de Chile
    };
  }
}