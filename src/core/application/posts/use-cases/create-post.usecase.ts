import { Inject, Injectable } from '@nestjs/common';
import { CreatePostDto } from '../dto/create-post.dto';
import { POST_REPOSITORY, PostRepositoryPort } from '../ports/out.post-repository.port';

@Injectable()
export class CreatePostUseCase {
  constructor(@Inject(POST_REPOSITORY) private readonly repo: PostRepositoryPort) {}
  async execute(authorId: string, dto: CreatePostDto) {
    const res = await this.repo.create({
      authorId,
      caption: dto.caption,
      challengeId: dto.challengeId ?? null,
      mediaUrl: dto.mediaUrl ?? null,
    });
    return { id: res.id, createdAt: res.createdAt };
  }
}
