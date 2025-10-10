import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { HashPort } from '../../core/application/users/ports/out.hash.port';

@Injectable()
export class BcryptAdapter implements HashPort {
  hash(plain: string) { return bcrypt.hash(plain, 10); }
  compare(plain: string, hash: string) { return bcrypt.compare(plain, hash); }
}
