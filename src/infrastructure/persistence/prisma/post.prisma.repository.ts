import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { POST_REPOSITORY, PostRepositoryPort, CreatePostResult } from '../../../core/application/posts/ports/out.post-repository.port';

@Injectable()
export class PostPrismaRepository implements PostRepositoryPort {
  constructor(private prisma: PrismaService) {}

  async create(input: { authorId: string; caption?: string; challengeId?: string | null; mediaUrl?: string | null }): Promise<CreatePostResult> {
    const created = await this.prisma.$transaction(async (tx) => {
      let mediaId: string | undefined;
      if (input.mediaUrl) {
        const m = await tx.mediaAsset.create({
          data: { url: input.mediaUrl },
          select: { id: true },
        });
        mediaId = m.id;
      }
      const p = await tx.post.create({
        data: {
          authorId: input.authorId,
          caption: input.caption ?? null,
          challengeId: input.challengeId ?? null,
          mediaId: mediaId ?? null,
          visibility: 'FOLLOWERS', // default segura
        },
        select: { id: true, createdAt: true },
      });
      return p;
    });

    return { id: created.id, createdAt: created.createdAt };
  }

  async like(input: { userId: string; postId: string }): Promise<void> {
    await this.prisma.postLike.create({ data: { userId: input.userId, postId: input.postId } });
  }

  async unlike(input: { userId: string; postId: string }): Promise<void> {
    await this.prisma.postLike.delete({ where: { userId_postId: { userId: input.userId, postId: input.postId } } });
  }

  async hasLike(input: { userId: string; postId: string }): Promise<boolean> {
    const r = await this.prisma.postLike.findUnique({ where: { userId_postId: { userId: input.userId, postId: input.postId } } });
    return !!r;
  }
}
