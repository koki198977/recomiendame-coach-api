-- CreateTable
CREATE TABLE "EmotionalLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,
    "emotion" TEXT NOT NULL,
    "advice" TEXT NOT NULL,
    "actions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmotionalLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmotionalLog_userId_date_idx" ON "EmotionalLog"("userId", "date");

-- AddForeignKey
ALTER TABLE "EmotionalLog" ADD CONSTRAINT "EmotionalLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
