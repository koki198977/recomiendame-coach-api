import { Inject, Injectable } from '@nestjs/common';
import { PROFILE_REPO, ProfileRepoPort } from '../ports/out.profile-repo.port';

@Injectable()
export class GetMyProfileUseCase {
  constructor(@Inject(PROFILE_REPO) private readonly repo: ProfileRepoPort) {}
  execute(userId: string) { return this.repo.get(userId); }
}
