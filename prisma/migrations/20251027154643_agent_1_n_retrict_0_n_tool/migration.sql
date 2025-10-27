/*
  Warnings:

  - You are about to drop the column `agentId` on the `tool` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `tool` DROP FOREIGN KEY `tool_agentId_fkey`;

-- AlterTable
ALTER TABLE `tool` DROP COLUMN `agentId`;

-- CreateTable
CREATE TABLE `agent_tool` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `toolId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `agent_tool_agentId_toolId_key`(`agentId`, `toolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `agent_tool` ADD CONSTRAINT `agent_tool_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `agent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_tool` ADD CONSTRAINT `agent_tool_toolId_fkey` FOREIGN KEY (`toolId`) REFERENCES `tool`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
