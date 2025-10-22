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

@Module({
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    ListUsersUseCase,
    GetUserUseCase,
    DeleteUserUseCase,
    { provide: USER_REPOSITORY, useClass: UserPrismaRepository },
    { provide: HASH_PORT, useClass: BcryptAdapter },
  ],
})
export class UsersModule {}
