import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  USER_REPOSITORY,
  UserRepositoryPort,
} from '../../users/ports/out.user-repository.port';
import {
  ACCOUNT_DELETION_REPO,
  AccountDeletionRepoPort,
} from '../ports/out.account-deletion-repo.port';
import {
  TOKEN_GENERATOR,
  TokenGeneratorPort,
} from '../ports/out.token-generator.port';
import { MAILER_PORT, MailerPort } from '../ports/out.mailer.port';
import { RequestAccountDeletionDto } from '../dto/request-account-deletion.dto';
import * as crypto from 'crypto';

@Injectable()
export class RequestAccountDeletionUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private userRepo: UserRepositoryPort,
    @Inject(ACCOUNT_DELETION_REPO)
    private deletionRepo: AccountDeletionRepoPort,
    @Inject(TOKEN_GENERATOR) private tokenGen: TokenGeneratorPort,
    @Inject(MAILER_PORT) private mailer: MailerPort,
  ) {}

  async execute(dto: RequestAccountDeletionDto): Promise<{ message: string }> {
    // Buscar usuario por email
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('No se encontró una cuenta con ese email');
    }

    // Limpiar tokens anteriores del usuario
    await this.deletionRepo.deleteByUserId(user.id);

    // Generar nuevo token
    const token = this.tokenGen.generate();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Guardar token
    await this.deletionRepo.create(user.id, tokenHash, expiresAt);

    // Enviar email
    const apiUrl = process.env.FRONT_URL || 'http://localhost:3000';
    const deletionUrl = `${apiUrl}/confirm-account-deletion?token=${token}`;

    await this.mailer.sendEmailVerification(
      user.email,
      'Confirmación de eliminación de cuenta - Recomiéndame',
      'account-deletion',
      {
        email: user.email,
        deletionUrl,
        expiresIn: '24 horas',
      },
    );

    return {
      message:
        'Se ha enviado un enlace de confirmación a tu email. El enlace expira en 24 horas.',
    };
  }
}
