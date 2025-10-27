import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../../users/ports/out.user-repository.port';
import { ACCOUNT_DELETION_REPO, AccountDeletionRepoPort } from '../ports/out.account-deletion-repo.port';
import { TOKEN_GENERATOR, TokenGeneratorPort } from '../ports/out.token-generator.port';
import { MAILER_PORT, MailerPort } from '../ports/out.mailer.port';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { ConfirmAccountDeletionDto } from '../dto/confirm-account-deletion.dto';
import * as crypto from 'crypto';

@Injectable()
export class ConfirmAccountDeletionUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private userRepo: UserRepositoryPort,
    @Inject(ACCOUNT_DELETION_REPO) private deletionRepo: AccountDeletionRepoPort,
    @Inject(TOKEN_GENERATOR) private tokenGen: TokenGeneratorPort,
    @Inject(MAILER_PORT) private mailer: MailerPort,
    private prisma: PrismaService,
  ) {}

  async execute(dto: ConfirmAccountDeletionDto): Promise<{ message: string }> {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
    
    // Buscar token
    const deletionRecord = await this.deletionRepo.findByToken(tokenHash);
    if (!deletionRecord) {
      throw new NotFoundException('Token de eliminación no válido');
    }

    // Verificar si ya fue usado
    if (deletionRecord.usedAt) {
      throw new BadRequestException('Este enlace ya fue utilizado');
    }

    // Verificar si expiró
    if (deletionRecord.expiresAt < new Date()) {
      throw new BadRequestException('El enlace de eliminación ha expirado');
    }

    // Obtener datos del usuario antes de eliminar
    const user = await this.userRepo.findById(deletionRecord.userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    try {
      // Marcar token como usado y eliminar usuario en transacción
      await this.prisma.$transaction(async (tx) => {
        // Marcar token como usado
        await this.deletionRepo.markAsUsed(tokenHash);
        
        // Eliminar usuario (cascada automática para todas las relaciones)
        await tx.user.delete({
          where: { id: deletionRecord.userId }
        });
      });

      // Enviar email de confirmación
      await this.mailer.sendEmailVerification(
        user.email,
        'Cuenta eliminada exitosamente - Recomiéndame',
        'account-deleted',
        {
          email: user.email,
          deletedAt: new Date().toLocaleString('es-ES')
        }
      );

      return {
        message: 'Tu cuenta ha sido eliminada exitosamente. Lamentamos verte partir.'
      };
    } catch (error) {
      throw new BadRequestException('Error al eliminar la cuenta. Inténtalo de nuevo.');
    }
  }
}