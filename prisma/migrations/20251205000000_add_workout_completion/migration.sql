-- AlterTable WorkoutDay: agregar campos de completado
ALTER TABLE "WorkoutDay" ADD COLUMN "completed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WorkoutDay" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "WorkoutDay" ADD COLUMN "durationMinutes" INTEGER;
ALTER TABLE "WorkoutDay" ADD COLUMN "caloriesBurned" INTEGER;

-- AlterTable WorkoutExercise: agregar campo de completado
ALTER TABLE "WorkoutExercise" ADD COLUMN "completed" BOOLEAN NOT NULL DEFAULT false;
