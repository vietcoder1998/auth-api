-- AlterTable
ALTER TABLE `agent_memory` ADD COLUMN `conversationId` VARCHAR(191) NULL,
    ADD COLUMN `messageId` VARCHAR(191) NULL,
    ADD COLUMN `promptId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `agent_memory` ADD CONSTRAINT `agent_memory_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `prompt_history`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_memory` ADD CONSTRAINT `agent_memory_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_memory` ADD CONSTRAINT `agent_memory_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `message`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
