export interface PasswordResetRepoPort {
  create(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  findValidByTokenHash(tokenHash: string, now: Date): Promise<{ id: string; userId: string } | null>;
  markUsed(id: string, usedAt: Date): Promise<void>; 
  findLatestForUser(userId: string): Promise<{ id: string; requestedAt: Date; usedAt: Date | null } | null>;
  deleteActiveForUser(userId: string): Promise<number>;
}
export const PASSWORD_RESET_REPO = Symbol('PASSWORD_RESET_REPO');
