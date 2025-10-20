-- CreateTable
CREATE TABLE `faq` (
    `id` VARCHAR(191) NOT NULL,
    `question` TEXT NOT NULL,
    `answer` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'manual',
    `promptId` VARCHAR(191) NULL,
    `conversationId` VARCHAR(191) NULL,
    `aiAgentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `faq` ADD CONSTRAINT `faq_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `prompt_history`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `faq` ADD CONSTRAINT `faq_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `faq` ADD CONSTRAINT `faq_aiAgentId_fkey` FOREIGN KEY (`aiAgentId`) REFERENCES `agent`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
