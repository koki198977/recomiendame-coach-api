export interface EmailVerificationRepoPort {
  /** Crea un token (hash) para verificación de email */
  create(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void>;

  /** Borra tokens activos (no usados y no vencidos) del usuario (opcional pero recomendado) */
  deleteActiveForUser(userId: string): Promise<void>;

  /** Busca por hash (para el /verify) */
  findByTokenHash(tokenHash: string): Promise<{ id: string; userId: string; usedAt: Date | null; expiresAt: Date } | null>;

  /** Marca como usado */
  markUsed(id: string): Promise<void>;
}
export const EMAIL_VERIF_REPO = Symbol('EMAIL_VERIF_REPO');
