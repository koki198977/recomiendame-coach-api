import { Inject, Injectable } from '@nestjs/common';
import { RequestResetDto } from '../dto/request-reset.dto';
import { USER_REPOSITORY, UserRepositoryPort } from '../../users/ports/out.user-repository.port';
import { PASSWORD_RESET_REPO, PasswordResetRepoPort } from '../ports/out.password-reset-repo.port';
import { MAILER_PORT, MailerPort } from '../ports/out.mailer.port';
import { TOKEN_GENERATOR, TokenGeneratorPort } from '../ports/out.token-generator.port';
import * as crypto from 'crypto';

@Injectable()
export class RequestResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_RESET_REPO) private readonly resets: PasswordResetRepoPort,
    @Inject(MAILER_PORT) private readonly mailer: MailerPort,
    @Inject(TOKEN_GENERATOR) private readonly tokenGen: TokenGeneratorPort,
  ) {}

  async execute(input: RequestResetDto): Promise<{ ok: true }> {
    // Siempre 200 para no filtrar usuarios
    const user = await this.users.findByEmail(input.email);
    if (!user) return { ok: true };

    const cooldownMin = Number(process.env.RESET_COOLDOWN_MINUTES ?? 5);
    const now = new Date();

    // 1) cooldown: si el último request fue hace menos de X min, no generamos nuevo token
    const last = await this.resets.findLatestForUser(user.id);
    if (last) {
      const msAgo = now.getTime() - new Date(last.requestedAt).getTime();
      const withinCooldown = msAgo < cooldownMin * 60_000;
      if (withinCooldown) {
        // Podrías reenviar el mismo mail si quieres (no recomendado) o simplemente devolver ok.
        return { ok: true };
      }
    }

    // 2) single-active: borra tokens previos no usados
    await this.resets.deleteActiveForUser(user.id);

    // 3) generar token opaco y guardar hash
    const token = this.tokenGen.generate();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(now.getTime() + 1000 * 60 * 30); // 30 min
    await this.resets.create({ userId: user.id, tokenHash, expiresAt });

    // 4) enviar correo
    const baseUrl = process.env.FRONT_URL ?? 'http://localhost:5173';
    const link = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await this.mailer.send(user.email, 'Recuperar contraseña', `
      <p>Hola,</p>
      <p>Usa este enlace para restablecer tu contraseña (expira en 30 minutos):</p>
      <p><a href="${link}">${link}</a></p>
    `);

    return { ok: true };
  }

}
