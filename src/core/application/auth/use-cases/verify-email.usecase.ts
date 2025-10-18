import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { EMAIL_VERIF_REPO, EmailVerificationRepoPort } from '../ports/out.email-verification-repo.port';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(EMAIL_VERIF_REPO) private readonly repo: EmailVerificationRepoPort,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: { token: string }) {
    const hash = crypto.createHash('sha256').update(input.token).digest('hex');

    const row = await this.repo.findByTokenHash(hash);
    if (!row) throw new BadRequestException('Token inválido');
    if (row.usedAt) throw new BadRequestException('Token ya utilizado');
    if (row.expiresAt <= new Date()) throw new BadRequestException('Token expirado');

    // marcar como usado
    await this.repo.markUsed(row.id);

    // marcar usuario como verificado (requiere columna emailVerified: Boolean en User)
    await this.prisma.user.update({
      where: { id: row.userId },
      data: { emailVerified: true },
    });

    return { ok: true };
  }
}
