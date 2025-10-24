import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../ports/out.user-repository.port';

@Injectable()
export class FollowUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort) {}

  async execute(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('No puedes seguirte a ti mismo');
    }

    // Verificar que ambos usuarios existen
    const [follower, following] = await Promise.all([
      this.userRepo.findById(followerId),
      this.userRepo.findById(followingId),
    ]);

    if (!follower) {
      throw new BadRequestException('Usuario seguidor no encontrado');
    }

    if (!following) {
      throw new BadRequestException('Usuario a seguir no encontrado');
    }

    // Verificar si ya lo sigue
    const isAlreadyFollowing = await this.userRepo.isFollowing(followerId, followingId);
    if (isAlreadyFollowing) {
      throw new BadRequestException('Ya sigues a este usuario');
    }

    await this.userRepo.followUser(followerId, followingId);
    
    return { success: true, message: 'Usuario seguido correctamente' };
  }
}