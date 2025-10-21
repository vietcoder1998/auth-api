-- AlterTable
ALTER TABLE `agent` ADD COLUMN `platformId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `conversation` ADD COLUMN `aiKeyId` VARCHAR(191) NULL,
    ADD COLUMN `platformId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `ai_key_agent` (
    `id` VARCHAR(191) NOT NULL,
    `aiKeyId` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ai_key_agent_aiKeyId_agentId_key`(`aiKeyId`, `agentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ai_key_agent` ADD CONSTRAINT `ai_key_agent_aiKeyId_fkey` FOREIGN KEY (`aiKeyId`) REFERENCES `ai_key`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_key_agent` ADD CONSTRAINT `ai_key_agent_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `agent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent` ADD CONSTRAINT `agent_platformId_fkey` FOREIGN KEY (`platformId`) REFERENCES `ai_platform`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation` ADD CONSTRAINT `conversation_aiKeyId_fkey` FOREIGN KEY (`aiKeyId`) REFERENCES `ai_key`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation` ADD CONSTRAINT `conversation_platformId_fkey` FOREIGN KEY (`platformId`) REFERENCES `ai_platform`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
