-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('RUNNING', 'WALKING', 'CYCLING', 'SWIMMING', 'ELLIPTICAL', 'ROWING', 'JUMP_ROPE', 'OTHER');

-- CreateTable
CREATE TABLE "FreeExerciseLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "distanceKm" DECIMAL(6,2),
    "caloriesBurned" INTEGER NOT NULL,
    "caloriesEstimated" BOOLEAN NOT NULL,
    "customActivityName" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreeExerciseLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FreeExerciseLog" ADD CONSTRAINT "FreeExerciseLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "FreeExerciseLog_userId_date_idx" ON "FreeExerciseLog"("userId", "date");
