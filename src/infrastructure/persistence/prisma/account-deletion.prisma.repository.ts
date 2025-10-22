import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AccountDeletionRepoPort } from '../../../core/application/auth/ports/out.account-deletion-repo.port';

@Injectable()
export class AccountDeletionPrismaRepository implements AccountDeletionRepoPort {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.accountDeletion.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  async findByToken(tokenHash: string): Promise<{ userId: string; expiresAt: Date; usedAt: Date | null } | null> {
    const record = await this.prisma.accountDeletion.findUnique({
      where: { tokenHash },
      select: { userId: true, expiresAt: true, usedAt: true },
    });
    return record;
  }

  async markAsUsed(tokenHash: string): Promise<void> {
    await this.prisma.accountDeletion.update({
      where: { tokenHash },
      data: { usedAt: new Date() },
    });
  }

  async deleteExpired(): Promise<void> {
    await this.prisma.accountDeletion.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.accountDeletion.deleteMany({
      where: { userId },
    });
  }
}