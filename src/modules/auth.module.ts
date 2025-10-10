import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from '../infrastructure/http/auth.controller';
import { LoginUseCase } from '../core/application/auth/use-cases/login.usecase';
import { TOKEN_SIGNER } from '../core/application/auth/ports/out.token-signer.port';
import { JwtTokenAdapter } from '../infrastructure/auth/jwt-token.adapter';
import { JwtStrategy } from '../infrastructure/auth/jwt.strategy';
import { USER_REPOSITORY } from '../core/application/users/ports/out.user-repository.port';
import { UserPrismaRepository } from '../infrastructure/persistence/prisma/user.prisma.repository';
import { HASH_PORT } from '../core/application/users/ports/out.hash.port';
import { BcryptAdapter } from '../infrastructure/crypto/bcrypt.adapter';
import { RequestResetPasswordUseCase } from 'src/core/application/auth/use-cases/request-reset-password.usecase';
import { PASSWORD_RESET_REPO } from 'src/core/application/auth/ports/out.password-reset-repo.port';
import { PasswordResetPrismaRepository } from 'src/infrastructure/persistence/prisma/password-reset.prisma.repository';
import { MAILER_PORT } from 'src/core/application/auth/ports/out.mailer.port';
import { ConsoleMailerAdapter } from 'src/infrastructure/mailer/console-mailer.adapter';
import { TOKEN_GENERATOR } from 'src/core/application/auth/ports/out.token-generator.port';
import { CryptoTokenGenerator } from 'src/infrastructure/security/token-generator.adapter';
import { ResetPasswordUseCase } from 'src/core/application/auth/use-cases/reset-password.usecase';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RequestResetPasswordUseCase,
    ResetPasswordUseCase,
    JwtStrategy,
    { provide: TOKEN_SIGNER, useClass: JwtTokenAdapter },
    { provide: USER_REPOSITORY, useClass: UserPrismaRepository },
    { provide: HASH_PORT, useClass: BcryptAdapter },
    { provide: PASSWORD_RESET_REPO, useClass: PasswordResetPrismaRepository },
    { provide: MAILER_PORT, useClass: ConsoleMailerAdapter },
    { provide: TOKEN_GENERATOR, useClass: CryptoTokenGenerator },
  ],
  exports: [],
})
export class AuthModule {}
