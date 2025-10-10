import { Inject, Injectable } from '@nestjs/common';
import { POST_REPOSITORY, PostRepositoryPort } from '../ports/out.post-repository.port';

@Injectable()
export class UnlikePostUseCase {
  constructor(@Inject(POST_REPOSITORY) private readonly repo: PostRepositoryPort) {}
  async execute(userId: string, postId: string) {
    const already = await this.repo.hasLike({ userId, postId });
    if (already) await this.repo.unlike({ userId, postId });
    return { ok: true };
  }
}
