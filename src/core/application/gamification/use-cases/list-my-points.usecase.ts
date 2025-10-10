import { Inject, Injectable } from '@nestjs/common';
import { GAMIFICATION_REPO, GamificationRepoPort } from '../ports/out.gamification-repo.port';

@Injectable()
export class ListMyPointsUseCase {
  constructor(@Inject(GAMIFICATION_REPO) private repo: GamificationRepoPort) {}
  execute(userId: string, take = 20, cursor?: string) {
    return this.repo.listMyPoints(userId, { take, cursor });
  }
}
