export interface HashPort {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}
export const HASH_PORT = Symbol('HASH_PORT');
