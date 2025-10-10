import { Inject, Injectable } from '@nestjs/common';
import { GAMIFICATION_REPO, GamificationRepoPort } from '../ports/out.gamification-repo.port';

@Injectable()
export class OnCheckinConfirmedUseCase {
  constructor(@Inject(GAMIFICATION_REPO) private repo: GamificationRepoPort) {}

  async execute(input: { userId: string; date: Date }) {
    return this.repo.onDailyCheckin(input);
  }
}
