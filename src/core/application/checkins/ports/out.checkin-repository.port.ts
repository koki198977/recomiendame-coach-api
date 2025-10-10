import { CheckinEntity } from '../../../domain/checkins/entities';

export interface CheckinRepositoryPort {
  upsertForDate(input: Omit<CheckinEntity['props'], 'id'>): Promise<CheckinEntity>;
  listInRange(userId: string, from: Date, to: Date): Promise<CheckinEntity[]>;
}
export const CHECKIN_REPOSITORY = Symbol('CHECKIN_REPOSITORY');
