import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../ports/out.user-repository.port';
import { ListUsersDto } from '../dto/list-users.dto';

@Injectable()
export class ListUsersUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort) {}
  async execute(input: ListUsersDto) {
    const { items, total } = await this.users.list({ skip: input.skip, take: input.take });
    return { total, items: items.map(u => ({ id: u.id, email: u.email })) };
  }
}
