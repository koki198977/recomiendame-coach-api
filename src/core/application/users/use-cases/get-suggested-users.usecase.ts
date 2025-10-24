import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../ports/out.user-repository.port';

@Injectable()
export class GetSuggestedUsersUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort) {}

  async execute(userId: string, params: { skip?: number; take?: number }) {
    const skip = params.skip ?? 0;
    const take = Math.min(params.take ?? 10, 50); // Máximo 50 sugerencias
    
    return this.userRepo.getSuggestedUsers(userId, { skip, take });
  }
}