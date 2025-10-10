export interface PointsLedgerPort {
  add(userId: string, delta: number, reason: string, meta?: any): Promise<void>;
  sum(userId: string): Promise<number>;
}
export const POINTS_LEDGER_PORT = Symbol('POINTS_LEDGER_PORT');
