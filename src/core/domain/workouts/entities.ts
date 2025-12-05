export class WorkoutExercise {
  id?: string;
  name: string;
  sets?: number;
  reps?: string;
  weight?: string;
  rpe?: number;
  restSeconds?: number;
  notes?: string;
  order: number;
  muscleGroup?: string;
  equipment?: string;
  instructions?: string;
  videoQuery?: string;
  completed?: boolean;
}

export class WorkoutDay {
  id?: string;
  dayIndex: number; // 1..7
  exercises: WorkoutExercise[];
  completed?: boolean;
  completedAt?: Date;
  durationMinutes?: number;
  caloriesBurned?: number;
}

export class WorkoutPlan {
  id?: string;
  userId: string;
  weekStart: Date;
  notes?: string;
  days: WorkoutDay[];
}
