export interface AccountDeletionRepoPort {
  create(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  findByToken(tokenHash: string): Promise<{ userId: string; expiresAt: Date; usedAt: Date | null } | null>;
  markAsUsed(tokenHash: string): Promise<void>;
  deleteExpired(): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}

export const ACCOUNT_DELETION_REPO = Symbol('ACCOUNT_DELETION_REPO');