-- AlterTable: add mpPayerId to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mpPayerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_mpPayerId_key" ON "User"("mpPayerId");
