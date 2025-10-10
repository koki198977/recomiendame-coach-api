import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PasswordResetRepoPort } from '../../../core/application/auth/ports/out.password-reset-repo.port';

@Injectable()
export class PasswordResetPrismaRepository implements PasswordResetRepoPort {
  constructor(private prisma: PrismaService) {}
  async create(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    await this.prisma.passwordReset.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
    });
  }

  async findValidByTokenHash(tokenHash: string, now: Date) {
    const pr = await this.prisma.passwordReset.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
      select: { id: true, userId: true },
    });
    return pr ?? null;
  }

  async markUsed(id: string, usedAt: Date) {
    await this.prisma.passwordReset.update({
      where: { id },
      data: { usedAt },
    });
  }

  async findLatestForUser(userId: string) {
  const pr = await this.prisma.passwordReset.findFirst({
    where: { userId },
    orderBy: { requestedAt: 'desc' },
    select: { id: true, requestedAt: true, usedAt: true },
  });
  return pr ?? null;
}

async deleteActiveForUser(userId: string) {
  const res = await this.prisma.passwordReset.deleteMany({
    where: { userId, usedAt: null },
  });
  return res.count;
}

}
