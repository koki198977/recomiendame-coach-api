import { Inject, Injectable } from '@nestjs/common';
import { GAMIFICATION_REPO, GamificationRepoPort } from '../ports/out.gamification-repo.port';

@Injectable()
export class GetMyGamificationUseCase {
  constructor(@Inject(GAMIFICATION_REPO) private repo: GamificationRepoPort) {}
  execute(userId: string) {
    return this.repo.getMyGamification(userId);
  }
}
