import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  AdminContentRepositoryPort,
  AdminNutritionProduct,
  AdminPost,
  AdminChallenge,
} from '../../../core/application/admin/ports/out.admin-content-repository.port';

@Injectable()
export class AdminContentPrismaRepository implements AdminContentRepositoryPort {
  constructor(private prisma: PrismaService) {}

  async listNutritionProducts(params: {
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ items: AdminNutritionProduct[]; total: number }> {
    const { search, page, limit } = params;
    const where = search
      ? {
          OR: [
            { productName: { contains: search, mode: 'insensitive' as const } },
            { brand: { contains: search, mode: 'insensitive' as const } },
            { barcode: { contains: search } },
          ],
        }
      : undefined;

    const [items, total] = await Promise.all([
      this.prisma.nutritionProduct.findMany({
        where,
        select: { id: true, barcode: true, productName: true, brand: true, allergens: true, imageUrl: true, nutritionPer100g: true, createdAt: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.nutritionProduct.count({ where }),
    ]);

    return { items, total };
  }

  async deleteNutritionProduct(id: string): Promise<void> {
    await this.prisma.nutritionProduct.delete({ where: { id } });
  }

  async listPosts(params: { page: number; limit: number }): Promise<{ items: AdminPost[]; total: number }> {
    const { page, limit } = params;
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        include: {
          author: { select: { email: true } },
          _count: { select: { likes: true, comments: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.post.count(),
    ]);

    return {
      items: posts.map((p) => ({
        id: p.id,
        authorId: p.authorId,
        authorEmail: p.author.email,
        caption: p.caption,
        visibility: p.visibility,
        likesCount: p._count.likes,
        commentsCount: p._count.comments,
        createdAt: p.createdAt,
      })),
      total,
    };
  }

  async deletePost(id: string): Promise<void> {
    await this.prisma.post.delete({ where: { id } });
  }

  async listChallenges(params: { page: number; limit: number }): Promise<{ items: AdminChallenge[]; total: number }> {
    const { page, limit } = params;
    const [challenges, total] = await Promise.all([
      this.prisma.challenge.findMany({
        include: { _count: { select: { members: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.challenge.count(),
    ]);

    return {
      items: challenges.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        startDate: c.startDate,
        endDate: c.endDate,
        visibility: c.visibility,
        membersCount: c._count.members,
      })),
      total,
    };
  }
}
