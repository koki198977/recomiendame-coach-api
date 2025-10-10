/*
  Warnings:

  - You are about to drop the column `userProfileUserId` on the `UserAllergy` table. All the data in the column will be lost.
  - You are about to drop the column `userProfileUserId` on the `UserCondition` table. All the data in the column will be lost.
  - The primary key for the `UserCuisinePreference` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `UserCuisinePreference` table. All the data in the column will be lost.
  - You are about to drop the column `userProfileUserId` on the `UserCuisinePreference` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."UserAllergy" DROP CONSTRAINT "UserAllergy_allergyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserAllergy" DROP CONSTRAINT "UserAllergy_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserAllergy" DROP CONSTRAINT "UserAllergy_userProfileUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserCondition" DROP CONSTRAINT "UserCondition_conditionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserCondition" DROP CONSTRAINT "UserCondition_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserCondition" DROP CONSTRAINT "UserCondition_userProfileUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserCuisinePreference" DROP CONSTRAINT "UserCuisinePreference_cuisineId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserCuisinePreference" DROP CONSTRAINT "UserCuisinePreference_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserCuisinePreference" DROP CONSTRAINT "UserCuisinePreference_userProfileUserId_fkey";

-- DropIndex
DROP INDEX "public"."UserCuisinePreference_userId_cuisineId_kind_key";

-- AlterTable
ALTER TABLE "UserAllergy" DROP COLUMN "userProfileUserId";

-- AlterTable
ALTER TABLE "UserCondition" DROP COLUMN "userProfileUserId";

-- AlterTable
ALTER TABLE "UserCuisinePreference" DROP CONSTRAINT "UserCuisinePreference_pkey",
DROP COLUMN "id",
DROP COLUMN "userProfileUserId",
ADD CONSTRAINT "UserCuisinePreference_pkey" PRIMARY KEY ("userId", "cuisineId", "kind");

-- CreateIndex
CREATE INDEX "UserAllergy_userId_idx" ON "UserAllergy"("userId");

-- CreateIndex
CREATE INDEX "UserAllergy_allergyId_idx" ON "UserAllergy"("allergyId");

-- CreateIndex
CREATE INDEX "UserCondition_userId_idx" ON "UserCondition"("userId");

-- CreateIndex
CREATE INDEX "UserCondition_conditionId_idx" ON "UserCondition"("conditionId");

-- CreateIndex
CREATE INDEX "UserCuisinePreference_userId_idx" ON "UserCuisinePreference"("userId");

-- CreateIndex
CREATE INDEX "UserCuisinePreference_cuisineId_idx" ON "UserCuisinePreference"("cuisineId");

-- AddForeignKey
ALTER TABLE "UserCondition" ADD CONSTRAINT "UserCondition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCondition" ADD CONSTRAINT "UserCondition_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "HealthCondition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAllergy" ADD CONSTRAINT "UserAllergy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAllergy" ADD CONSTRAINT "UserAllergy_allergyId_fkey" FOREIGN KEY ("allergyId") REFERENCES "Allergy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCuisinePreference" ADD CONSTRAINT "UserCuisinePreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCuisinePreference" ADD CONSTRAINT "UserCuisinePreference_cuisineId_fkey" FOREIGN KEY ("cuisineId") REFERENCES "Cuisine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
