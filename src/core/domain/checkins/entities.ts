export interface CheckinProps {
  id?: string;
  userId: string;
  date: Date;                // día del check-in
  weightKg?: number | null;
  adherencePct?: number | null;
  hungerLvl?: number | null; // 1..10
  notes?: string | null;
}
export class CheckinEntity {
  constructor(public readonly props: CheckinProps) {}
}
