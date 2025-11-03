/*
  Warnings:

  - You are about to drop the column `promptHistoryId` on the `message` table. All the data in the column will be lost.
  - You are about to drop the `Result` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ToolCommand` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ToolExecuteResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ToolExplainResult` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[messageId]` on the table `prompt_history` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `Result` DROP FOREIGN KEY `Result_toolId_fkey`;

-- DropForeignKey
ALTER TABLE `ToolCommand` DROP FOREIGN KEY `ToolCommand_toolId_fkey`;

-- DropForeignKey
ALTER TABLE `ToolExecuteResult` DROP FOREIGN KEY `ToolExecuteResult_toolId_fkey`;

-- DropForeignKey
ALTER TABLE `ToolExplainResult` DROP FOREIGN KEY `ToolExplainResult_toolContextId_fkey`;

-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `message_promptHistoryId_fkey`;

-- AlterTable
ALTER TABLE `message` DROP COLUMN `promptHistoryId`;

-- AlterTable
ALTER TABLE `prompt_history` ADD COLUMN `messageId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `Result`;

-- DropTable
DROP TABLE `ToolCommand`;

-- DropTable
DROP TABLE `ToolExecuteResult`;

-- DropTable
DROP TABLE `ToolExplainResult`;

-- CreateTable
CREATE TABLE `result` (
    `id` VARCHAR(191) NOT NULL,
    `content` TEXT NULL,
    `toolId` VARCHAR(191) NULL,
    `resultType` ENUM('tool_execute_result', 'command_execute_result', 'tool_explain_result', 'adjust_tool_result') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tool_execute_result` (
    `id` VARCHAR(191) NOT NULL,
    `toolId` VARCHAR(191) NOT NULL,
    `result` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tool_command` (
    `id` VARCHAR(191) NOT NULL,
    `toolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tool_explain_result` (
    `id` VARCHAR(191) NOT NULL,
    `toolContextId` VARCHAR(191) NOT NULL,
    `result` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `prompt_history_messageId_key` ON `prompt_history`(`messageId`);

-- AddForeignKey
ALTER TABLE `prompt_history` ADD CONSTRAINT `prompt_history_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `message`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `result` ADD CONSTRAINT `result_toolId_fkey` FOREIGN KEY (`toolId`) REFERENCES `tool`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tool_execute_result` ADD CONSTRAINT `tool_execute_result_toolId_fkey` FOREIGN KEY (`toolId`) REFERENCES `tool`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tool_command` ADD CONSTRAINT `tool_command_toolId_fkey` FOREIGN KEY (`toolId`) REFERENCES `tool`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tool_explain_result` ADD CONSTRAINT `tool_explain_result_toolContextId_fkey` FOREIGN KEY (`toolContextId`) REFERENCES `tool_context`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
