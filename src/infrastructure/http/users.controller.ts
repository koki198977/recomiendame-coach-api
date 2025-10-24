import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateUserUseCase } from '../../core/application/users/use-cases/create-user.usecase';
import { ListUsersUseCase } from '../../core/application/users/use-cases/list-users.usecase';
import { GetUserUseCase } from '../../core/application/users/use-cases/get-user.usecase';
import { DeleteUserUseCase } from '../../core/application/users/use-cases/delete-user.usecase';
import { CreateUserDto } from '../../core/application/users/dto/create-user.dto';
import { ListUsersDto } from '../../core/application/users/dto/list-users.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FollowUserUseCase } from '../../core/application/users/use-cases/follow-user.usecase';
import { UnfollowUserUseCase } from '../../core/application/users/use-cases/unfollow-user.usecase';
import { SearchUsersUseCase } from '../../core/application/users/use-cases/search-users.usecase';
import { GetSuggestedUsersUseCase } from '../../core/application/users/use-cases/get-suggested-users.usecase';
import { GetUserFollowersUseCase } from '../../core/application/users/use-cases/get-user-followers.usecase';
import { GetUserFollowingUseCase } from '../../core/application/users/use-cases/get-user-following.usecase';
import { GetUserProfileUseCase } from '../../core/application/users/use-cases/get-user-profile.usecase';

@Controller('users')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class UsersController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly deleteUser: DeleteUserUseCase,
    private readonly followUser: FollowUserUseCase,
    private readonly unfollowUser: UnfollowUserUseCase,
    private readonly searchUsers: SearchUsersUseCase,
    private readonly getSuggestedUsers: GetSuggestedUsersUseCase,
    private readonly getUserFollowers: GetUserFollowersUseCase,
    private readonly getUserFollowing: GetUserFollowingUseCase,
    private readonly getUserProfile: GetUserProfileUseCase,
  ) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.createUser.execute(dto);
  }

  @Get()
  list(@Query() q: ListUsersDto) {
    return this.listUsers.execute(q);
  }

  // Buscar usuarios
  @Get('search')
  @UseGuards(JwtAuthGuard)
  search(
    @Query('q') query: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.searchUsers.execute(query, {
      skip: skip ? Number(skip) : 0,
      take: take ? Number(take) : 20,
    });
  }

  // Usuarios sugeridos
  @Get('suggested')
  @UseGuards(JwtAuthGuard)
  suggested(
    @Req() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const userId = req.user.userId;
    return this.getSuggestedUsers.execute(userId, {
      skip: skip ? Number(skip) : 0,
      take: take ? Number(take) : 10,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  get(@Param('id') id: string, @Req() req: any) {
    const viewerId = req.user.userId;
    return this.getUserProfile.execute(id, viewerId);
  }

  // Seguidores del usuario
  @Get(':userId/followers')
  @UseGuards(JwtAuthGuard)
  followers(
    @Param('userId') userId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.getUserFollowers.execute(userId, {
      skip: skip ? Number(skip) : 0,
      take: take ? Number(take) : 20,
    });
  }

  // A quién sigue el usuario
  @Get(':userId/following')
  @UseGuards(JwtAuthGuard)
  following(
    @Param('userId') userId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.getUserFollowing.execute(userId, {
      skip: skip ? Number(skip) : 0,
      take: take ? Number(take) : 20,
    });
  }

  // Seguir usuario
  @Post(':userId/follow')
  @UseGuards(JwtAuthGuard)
  follow(@Param('userId') userId: string, @Req() req: any) {
    const followerId = req.user.userId;
    return this.followUser.execute(followerId, userId);
  }

  // Dejar de seguir usuario
  @Delete(':userId/follow')
  @UseGuards(JwtAuthGuard)
  unfollow(@Param('userId') userId: string, @Req() req: any) {
    const followerId = req.user.userId;
    return this.unfollowUser.execute(followerId, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async delete(@Param('id') id: string, @Body() dto?: { confirmation?: string }) {
    return this.deleteUser.execute(id, dto?.confirmation);
  }
}
