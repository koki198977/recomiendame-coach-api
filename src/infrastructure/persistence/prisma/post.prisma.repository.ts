import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { POST_REPOSITORY, PostRepositoryPort, CreatePostResult, PostItem } from '../../../core/application/posts/ports/out.post-repository.port';
import { Visibility } from '@prisma/client';

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

  async getPostsByUser(userId: string, params: { skip: number; take: number; date?: string }) {
    const where: any = { authorId: userId };
    
    // Filtro por fecha si se proporciona
    if (params.date) {
      const startDate = new Date(params.date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      where.createdAt = {
        gte: startDate,
        lt: endDate,
      };
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, profile: { select: { userId: true } } } },
          media: { select: { url: true } },
          _count: { select: { likes: true, comments: true } },
          likes: { where: { userId }, select: { userId: true } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    const items = posts.map(p => ({
      id: p.id,
      caption: p.caption,
      createdAt: p.createdAt,
      authorId: p.authorId,
      authorName: p.author.profile?.userId || p.authorId, // Fallback al ID si no hay perfil
      mediaUrl: p.media?.url || null,
      likesCount: p._count.likes,
      commentsCount: p._count.comments,
      isLikedByMe: p.likes.length > 0,
      challengeId: p.challengeId,
    }));

    return { items, total };
  }

  async getPublicPosts(userId: string, params: { skip: number; take: number }) {
    // Obtener posts públicos y de seguidores, ordenados por fecha
    const where = {
      OR: [
        { visibility: Visibility.PUBLIC }, // Posts públicos de cualquier usuario
        { 
          AND: [
            { visibility: Visibility.FOLLOWERS },
            { 
              OR: [
                { authorId: userId }, // Mis propios posts
                { 
                  author: {
                    followers: { some: { followerId: userId } }
                  }
                } // Posts de usuarios que sigo
              ]
            }
          ]
        }
      ]
    };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { 
            select: { 
              id: true, 
              email: true,
              profile: { select: { userId: true } }
            } 
          },
          media: { select: { url: true } },
          _count: { select: { likes: true, comments: true } },
          likes: { where: { userId }, select: { userId: true } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    const items = posts.map(p => ({
      id: p.id,
      caption: p.caption,
      createdAt: p.createdAt,
      authorId: p.authorId,
      authorName: p.author.email, // Usamos email como nombre por ahora
      mediaUrl: p.media?.url || null,
      likesCount: p._count.likes,
      commentsCount: p._count.comments,
      isLikedByMe: p.likes.length > 0,
      challengeId: p.challengeId,
    }));

    return { items, total };
  }
}
