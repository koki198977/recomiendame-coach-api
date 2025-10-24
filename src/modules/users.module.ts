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

@Module({
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
    { provide: USER_REPOSITORY, useClass: UserPrismaRepository },
    { provide: HASH_PORT, useClass: BcryptAdapter },
  ],
})
export class UsersModule {}
