import { Inject, Injectable } from '@nestjs/common';
import { PROFILE_REPO, ProfileRepoPort } from '../ports/out.profile-repo.port';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Injectable()
export class UpdateMyProfileUseCase {
  constructor(@Inject(PROFILE_REPO) private readonly repo: ProfileRepoPort) {}

  async execute(userId: string, dto: UpdateProfileDto) {
    await this.repo.update(userId, dto as any);
    return { ok: true };
  }
}
