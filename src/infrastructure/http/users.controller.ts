import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateUserUseCase } from '../../core/application/users/use-cases/create-user.usecase';
import { ListUsersUseCase } from '../../core/application/users/use-cases/list-users.usecase';
import { GetUserUseCase } from '../../core/application/users/use-cases/get-user.usecase';
import { DeleteUserUseCase } from '../../core/application/users/use-cases/delete-user.usecase';
import { CreateUserDto } from '../../core/application/users/dto/create-user.dto';
import { ListUsersDto } from '../../core/application/users/dto/list-users.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class UsersController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly deleteUser: DeleteUserUseCase,
  ) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.createUser.execute(dto);
  }

  @Get()
  list(@Query() q: ListUsersDto) {
    return this.listUsers.execute(q);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.getUser.execute(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async delete(@Param('id') id: string, @Body() dto?: { confirmation?: string }) {
    return this.deleteUser.execute(id, dto?.confirmation);
  }
}
