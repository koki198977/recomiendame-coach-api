export interface TokenGeneratorPort {
  generate(): string;
}
export const TOKEN_GENERATOR = Symbol('TOKEN_GENERATOR');
