import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenSignerPort } from '../../core/application/auth/ports/out.token-signer.port';

@Injectable()
export class JwtTokenAdapter implements TokenSignerPort {
  constructor(private readonly jwt: JwtService) {}
  sign(payload: any, options?: { expiresIn?: string | number }): string {
    return this.jwt.sign(payload, options);
  }
}
