import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { TokenGeneratorPort } from '../../core/application/auth/ports/out.token-generator.port';

// Base64URL sin padding
function toBase64Url(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

@Injectable()
export class CryptoTokenGenerator implements TokenGeneratorPort {
  generate(): string {
    return toBase64Url(randomBytes(32)); // 256-bit
  }
}
