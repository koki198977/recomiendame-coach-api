import { Inject, Injectable } from '@nestjs/common';
import { CHECKIN_REPOSITORY, CheckinRepositoryPort } from '../ports/out.checkin-repository.port';
import { ListCheckinsDto } from '../dto/list-checkins.dto';

@Injectable()
export class ListCheckinsUseCase {
  constructor(@Inject(CHECKIN_REPOSITORY) private readonly repo: CheckinRepositoryPort) {}

  async execute(userId: string, dto: ListCheckinsDto) {
    const from = new Date(dto.from + 'T00:00:00.000Z');
    const to = new Date(dto.to + 'T23:59:59.999Z');
    const items = await this.repo.listInRange(userId, from, to);
    return {
      items: items.map(c => ({
        id: c.props.id,
        date: c.props.date,
        weightKg: c.props.weightKg,
        adherencePct: c.props.adherencePct,
        hungerLvl: c.props.hungerLvl,
        notes: c.props.notes,
      })),
    };
  }
}
