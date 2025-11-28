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
}

export class WorkoutDay {
  id?: string;
  dayIndex: number; // 1..7
  exercises: WorkoutExercise[];
}

export class WorkoutPlan {
  id?: string;
  userId: string;
  weekStart: Date;
  notes?: string;
  days: WorkoutDay[];
}
