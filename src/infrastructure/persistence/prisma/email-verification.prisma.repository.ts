import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailVerificationRepoPort } from 'src/core/application/auth/ports/out.email-verification-repo.port';

@Injectable()
export class EmailVerificationPrismaRepository implements EmailVerificationRepoPort {
  constructor(private prisma: PrismaService) {}

  async create(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    await this.prisma.emailVerificationToken.create({
      data: { userId: input.userId, tokenHash: input.tokenHash, expiresAt: input.expiresAt },
    });
  }

  async deleteActiveForUser(userId: string): Promise<void> {
    await this.prisma.emailVerificationToken.deleteMany({
      where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  async findByTokenHash(tokenHash: string) {
    const t = await this.prisma.emailVerificationToken.findFirst({ where: { tokenHash } });
    return t ? { id: t.id, userId: t.userId, usedAt: t.usedAt, expiresAt: t.expiresAt } : null;
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.emailVerificationToken.update({ where: { id }, data: { usedAt: new Date() } });
  }
}
