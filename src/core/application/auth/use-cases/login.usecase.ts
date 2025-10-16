import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../../users/ports/out.user-repository.port';
import { HASH_PORT, HashPort } from '../../users/ports/out.hash.port';
import { TOKEN_SIGNER, TokenSignerPort } from '../ports/out.token-signer.port';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(HASH_PORT) private readonly hasher: HashPort,
    @Inject(TOKEN_SIGNER) private readonly tokens: TokenSignerPort,
  ) {}

  async execute(input: LoginDto): Promise<{ access_token: string }> {
    const user = await this.users.findByEmail(input.email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const ok = await this.hasher.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    const access_token = this.tokens.sign({ sub: user.id, email: user.email, role: user.role }, undefined);
    return { access_token };
  }
}
