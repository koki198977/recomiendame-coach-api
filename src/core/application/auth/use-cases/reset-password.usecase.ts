import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { PASSWORD_RESET_REPO, PasswordResetRepoPort } from '../ports/out.password-reset-repo.port';
import { USER_REPOSITORY, UserRepositoryPort } from '../../users/ports/out.user-repository.port';
import { HASH_PORT, HashPort } from '../../users/ports/out.hash.port';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(PASSWORD_RESET_REPO) private readonly resets: PasswordResetRepoPort,
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(HASH_PORT) private readonly hasher: HashPort,
  ) {}

  async execute(input: ResetPasswordDto): Promise<{ ok: true }> {
    // 1) hash del token opaco (debe coincidir con lo guardado)
    const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex');

    // 2) buscar reset válido (no usado, no expirado)
    const found = await this.resets.findValidByTokenHash(tokenHash, new Date());
    if (!found) throw new BadRequestException('Token inválido o expirado');

    // 3) actualizar password del usuario
    const passwordHash = await this.hasher.hash(input.newPassword);
    await this.users.updatePassword(found.userId, passwordHash);

    // 4) marcar token como usado
    await this.resets.markUsed(found.id, new Date());

    return { ok: true };
  }
}
