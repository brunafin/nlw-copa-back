/*
  Warnings:

  - A unique constraint covering the columns `[gameId]` on the table `Guess` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Guess_participantId_gameId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Guess_gameId_key" ON "Guess"("gameId");
