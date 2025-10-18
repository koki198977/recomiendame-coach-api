import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { USER_REPOSITORY, UserRecord, UserRepositoryPort } from '../../../core/application/users/ports/out.user-repository.port';
import { UserEntity } from '../../../core/domain/users/entities';

@Injectable()
export class UserPrismaRepository implements UserRepositoryPort {
  constructor(private prisma: PrismaService) {}

  async create(data: { id?: string; email: string; passwordHash: string }): Promise<UserEntity> {
    const u = await this.prisma.user.create({
      data: { id: data.id, email: data.email, password: data.passwordHash },
    });
    return new UserEntity({
      id: u.id, email: u.email, passwordHash: u.password,
      createdAt: u.createdAt, updatedAt: u.updatedAt,
    });
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const u = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true, role: true, emailVerified: true },
    });
    if (!u) return null;
    return { id: u.id, email: u.email, passwordHash: u.password, role: u.role as any, emailVerified: u.emailVerified };
  }

  async findById(id: string): Promise<UserEntity | null> {
    const u = await this.prisma.user.findUnique({ where: { id } });
    return u ? new UserEntity({
      id: u.id, email: u.email, passwordHash: u.password,
      createdAt: u.createdAt, updatedAt: u.updatedAt,
    }) : null;
  }

  async list(params: { skip?: number; take?: number }) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip: params.skip, take: params.take,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, password: true, createdAt: true, updatedAt: true },
      }),
      this.prisma.user.count(),
    ]);

    return {
      total,
      items: items.map(u => new UserEntity({
        id: u.id, email: u.email, passwordHash: u.password,
        createdAt: u.createdAt, updatedAt: u.updatedAt,
      })),
    };
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    });
  }

}
