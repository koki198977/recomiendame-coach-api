export interface TokenSignerPort {
  sign(payload: any, options?: { expiresIn?: string | number }): string;
}
export const TOKEN_SIGNER = Symbol('TOKEN_SIGNER');
