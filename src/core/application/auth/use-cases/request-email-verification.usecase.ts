import { Inject, Injectable } from '@nestjs/common';
import { MAILER_PORT, MailerPort } from '../ports/out.mailer.port';
import { TOKEN_GENERATOR, TokenGeneratorPort } from '../ports/out.token-generator.port';
import { EMAIL_VERIF_REPO, EmailVerificationRepoPort } from '../ports/out.email-verification-repo.port';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RequestEmailVerificationUseCase {
  constructor(
    @Inject(EMAIL_VERIF_REPO) private readonly verifs: EmailVerificationRepoPort,
    @Inject(MAILER_PORT) private readonly mailer: MailerPort,
    @Inject(TOKEN_GENERATOR) private readonly tokenGen: TokenGeneratorPort,
    private readonly config: ConfigService,
  ) {}

  async execute(input: { userId: string; email: string; fullName?: string }) {
    await this.verifs.deleteActiveForUser(input.userId);

    const token = this.tokenGen.generate();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 min

    await this.verifs.create({ userId: input.userId, tokenHash, expiresAt });

    // enviar mail
    const apiUrl    = this.config.get<string>('API_URL');
    const frontUrl = this.config.get<string>('FRONT_URL', 'http://localhost:3000');
    const verifyUrl = `${frontUrl}/auth/verify-email?token=${token}`;
    const fullName = input.fullName ?? input.email;
    const logoUrl = `${apiUrl}/static/assets/logo.png`;
    await this.mailer.sendEmailVerification(
      input.email,
      'Confirma tu correo en Coach Recomiéndame',
      'welcome',
      { fullName, logoUrl, verifyUrl },
    );

    return { ok: true };
  }
}
