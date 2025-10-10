import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { COMMENT_REPOSITORY, CommentListItem, CommentRepositoryPort } from '../../../core/application/posts/ports/out.comment-repository.port';

@Injectable()
export class CommentPrismaRepository implements CommentRepositoryPort {
  constructor(private prisma: PrismaService) {}

  async create(input: { postId: string; authorId: string; body: string }) {
    const c = await this.prisma.postComment.create({
      data: { postId: input.postId, authorId: input.authorId, body: input.body },
      select: { id: true, createdAt: true },
    });
    return c;
  }

  async delete(input: { commentId: string; authorId: string }) {
    const existing = await this.prisma.postComment.findUnique({
      where: { id: input.commentId },
      select: { authorId: true },
    });
    if (!existing) return;
    if (existing.authorId !== input.authorId) throw new ForbiddenException('No puedes borrar este comentario');

    await this.prisma.postComment.delete({ where: { id: input.commentId } });
  }

  async list(input: { postId: string; skip: number; take: number }) {
    const [rows, total] = await Promise.all([
      this.prisma.postComment.findMany({
        where: { postId: input.postId },
        include: { author: { select: { id: true, email: true } } },
        orderBy: { createdAt: 'asc' },
        skip: input.skip,
        take: input.take,
      }),
      this.prisma.postComment.count({ where: { postId: input.postId } }),
    ]);

    const items: CommentListItem[] = rows.map(r => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt,
      author: { id: r.author.id, email: r.author.email },
    }));
    return { items, total };
  }
}
