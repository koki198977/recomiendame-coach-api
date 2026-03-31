export type ActivityType =
  | 'RUNNING'
  | 'WALKING'
  | 'CYCLING'
  | 'SWIMMING'
  | 'ELLIPTICAL'
  | 'ROWING'
  | 'JUMP_ROPE'
  | 'OTHER';

export interface FreeExerciseLog {
  id?: string;
  userId: string;
  activityType: ActivityType;
  durationMinutes: number;
  distanceKm?: number | null;
  caloriesBurned: number;
  caloriesEstimated: boolean;
  customActivityName?: string | null;
  date: Date;
  createdAt?: Date;
}
