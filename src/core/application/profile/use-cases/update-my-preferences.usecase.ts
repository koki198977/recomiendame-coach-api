import { Inject, Injectable } from '@nestjs/common';
import { PROFILE_REPO, ProfileRepoPort } from '../ports/out.profile-repo.port';
import { UpdatePreferencesDto } from '../dto/update-preferences.dto';

@Injectable()
export class UpdateMyPreferencesUseCase {
  constructor(@Inject(PROFILE_REPO) private readonly repo: ProfileRepoPort) {}

  async execute(userId: string, dto: UpdatePreferencesDto) {
    if (dto.allergyIds) await this.repo.replaceAllergies(userId, dto.allergyIds);
    if (dto.conditionIds) await this.repo.replaceConditions(userId, dto.conditionIds);
    
    // Solo actualizar cuisines si se envían ambos campos o cargar los existentes
    if (dto.cuisinesLike !== undefined || dto.cuisinesDislike !== undefined) {
      // Si solo se envía uno, necesitamos cargar el otro del perfil actual
      let likeIds = dto.cuisinesLike;
      let dislikeIds = dto.cuisinesDislike;
      
      if (likeIds === undefined || dislikeIds === undefined) {
        const currentProfile = await this.repo.get(userId);
        if (likeIds === undefined) {
          likeIds = (currentProfile.cuisinesLike ?? []).map((c: any) => c.id);
        }
        if (dislikeIds === undefined) {
          dislikeIds = (currentProfile.cuisinesDislike ?? []).map((c: any) => c.id);
        }
      }
      
      // Limpiar conflictos: si una cocina está en ambas listas, la nueva preferencia gana
      const likeSet = new Set(likeIds ?? []);
      const dislikeSet = new Set(dislikeIds ?? []);
      
      // Si el usuario envió cuisinesLike, remover esos IDs de dislike
      if (dto.cuisinesLike !== undefined) {
        dto.cuisinesLike.forEach(id => dislikeSet.delete(id));
      }
      
      // Si el usuario envió cuisinesDislike, remover esos IDs de like
      if (dto.cuisinesDislike !== undefined) {
        dto.cuisinesDislike.forEach(id => likeSet.delete(id));
      }
      
      await this.repo.replaceCuisinePrefs(userId, Array.from(likeSet), Array.from(dislikeSet));
    }
    
    return { ok: true };
  }
}
