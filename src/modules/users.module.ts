import { Module } from '@nestjs/common';
import { UsersController } from '../infrastructure/http/users.controller';
import { CreateUserUseCase } from '../core/application/users/use-cases/create-user.usecase';
import { ListUsersUseCase } from '../core/application/users/use-cases/list-users.usecase';
import { GetUserUseCase } from '../core/application/users/use-cases/get-user.usecase';
import { DeleteUserUseCase } from '../core/application/users/use-cases/delete-user.usecase';
import { USER_REPOSITORY } from '../core/application/users/ports/out.user-repository.port';
import { UserPrismaRepository } from '../infrastructure/persistence/prisma/user.prisma.repository';
import { HASH_PORT } from '../core/application/users/ports/out.hash.port';
import { BcryptAdapter } from '../infrastructure/crypto/bcrypt.adapter';
import { FollowUserUseCase } from '../core/application/users/use-cases/follow-user.usecase';
import { UnfollowUserUseCase } from '../core/application/users/use-cases/unfollow-user.usecase';
import { SearchUsersUseCase } from '../core/application/users/use-cases/search-users.usecase';
import { GetSuggestedUsersUseCase } from '../core/application/users/use-cases/get-suggested-users.usecase';
import { GetUserFollowersUseCase } from '../core/application/users/use-cases/get-user-followers.usecase';
import { GetUserFollowingUseCase } from '../core/application/users/use-cases/get-user-following.usecase';
import { GetUserProfileUseCase } from '../core/application/users/use-cases/get-user-profile.usecase';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { RequestEmailVerificationUseCase } from '../core/application/auth/use-cases/request-email-verification.usecase';
import { EMAIL_VERIF_REPO } from '../core/application/auth/ports/out.email-verification-repo.port';
import { EmailVerificationPrismaRepository } from '../infrastructure/persistence/prisma/email-verification.prisma.repository';
import { MAILER_PORT } from '../core/application/auth/ports/out.mailer.port';
import { EmailAdapter } from '../infrastructure/mailer/email.adapter';
import { TOKEN_GENERATOR } from '../core/application/auth/ports/out.token-generator.port';
import { CryptoTokenGenerator } from '../infrastructure/security/token-generator.adapter';
import { ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { existsSync } from 'fs';

const templateDirCandidates = [
  join(process.cwd(), 'src', 'infrastructure', 'mailer', 'templates'),
  join(__dirname, '..', 'infrastructure', 'mailer', 'templates'),
  join(process.cwd(), 'dist', 'src', 'infrastructure', 'mailer', 'templates'),
  join(process.cwd(), 'dist', 'infrastructure', 'mailer', 'templates'),
];
const templateDir = templateDirCandidates.find((dir) => existsSync(dir)) ?? templateDirCandidates[0];

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT ?? 587),
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
      defaults: {
        from: process.env.MAIL_FROM ?? '"Recomiéndame" <no-reply@recomiendameapp.cl>',
      },
      template: {
        dir: templateDir,
        adapter: new HandlebarsAdapter(),
        options: { strict: true },
      },
    }),
  ],
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    ListUsersUseCase,
    GetUserUseCase,
    DeleteUserUseCase,
    FollowUserUseCase,
    UnfollowUserUseCase,
    SearchUsersUseCase,
    GetSuggestedUsersUseCase,
    GetUserFollowersUseCase,
    GetUserFollowingUseCase,
    GetUserProfileUseCase,
    RequestEmailVerificationUseCase,
    { provide: USER_REPOSITORY, useClass: UserPrismaRepository },
    { provide: HASH_PORT, useClass: BcryptAdapter },
    { provide: EMAIL_VERIF_REPO, useClass: EmailVerificationPrismaRepository },
    { provide: MAILER_PORT, useClass: EmailAdapter },
    { provide: TOKEN_GENERATOR, useClass: CryptoTokenGenerator },
    PrismaService,
    ConfigService,
  ],
})
export class UsersModule {}
