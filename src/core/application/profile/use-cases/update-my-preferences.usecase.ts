import { Inject, Injectable } from '@nestjs/common';
import { PROFILE_REPO, ProfileRepoPort } from '../ports/out.profile-repo.port';
import { UpdatePreferencesDto } from '../dto/update-preferences.dto';

@Injectable()
export class UpdateMyPreferencesUseCase {
  constructor(@Inject(PROFILE_REPO) private readonly repo: ProfileRepoPort) {}

  async execute(userId: string, dto: UpdatePreferencesDto) {
    if (dto.allergyIds) await this.repo.replaceAllergies(userId, dto.allergyIds);
    if (dto.conditionIds) await this.repo.replaceConditions(userId, dto.conditionIds);
    if (dto.cuisinesLike || dto.cuisinesDislike) {
      await this.repo.replaceCuisinePrefs(userId, dto.cuisinesLike ?? [], dto.cuisinesDislike ?? []);
    }
    return { ok: true };
  }
}
