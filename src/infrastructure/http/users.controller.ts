import { Body, Controller, Get, Param, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateUserUseCase } from '../../core/application/users/use-cases/create-user.usecase';
import { ListUsersUseCase } from '../../core/application/users/use-cases/list-users.usecase';
import { GetUserUseCase } from '../../core/application/users/use-cases/get-user.usecase';
import { CreateUserDto } from '../../core/application/users/dto/create-user.dto';
import { ListUsersDto } from '../../core/application/users/dto/list-users.dto';

@Controller('users')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class UsersController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly getUser: GetUserUseCase,
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
}
