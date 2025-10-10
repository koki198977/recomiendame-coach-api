import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../ports/out.user-repository.port';
import { HASH_PORT, HashPort } from '../ports/out.hash.port';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(HASH_PORT) private readonly hasher: HashPort,
  ) {}

  async execute(input: CreateUserDto): Promise<{ id: string; email: string }> {
    const exists = await this.users.findByEmail(input.email);
    if (exists) throw new Error('Email ya registrado');
    const passwordHash = await this.hasher.hash(input.password);
    const u = await this.users.create({ id: input.id, email: input.email, passwordHash });
    return { id: u.id, email: u.email };
  }
}
