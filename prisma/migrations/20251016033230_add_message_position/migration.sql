-- AlterTable
ALTER TABLE `message` ADD COLUMN `position` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `message_conversationId_position_idx` ON `message`(`conversationId`, `position`);
