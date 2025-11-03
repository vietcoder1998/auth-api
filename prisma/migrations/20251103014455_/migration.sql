/*
  Warnings:

  - You are about to drop the `Entity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EntityMethod` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Entity` DROP FOREIGN KEY `Entity_commandId_fkey`;

-- DropForeignKey
ALTER TABLE `EntityMethod` DROP FOREIGN KEY `EntityMethod_entityId_fkey`;

-- AlterTable
ALTER TABLE `command` ADD COLUMN `type` ENUM('execute', 'query', 'update', 'create', 'delete', 'transform', 'planning') NULL DEFAULT 'execute';

-- DropTable
DROP TABLE `Entity`;

-- DropTable
DROP TABLE `EntityMethod`;

-- CreateTable
CREATE TABLE `context` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `context_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tool_context` (
    `id` VARCHAR(191) NOT NULL,
    `toolId` VARCHAR(191) NOT NULL,
    `contextId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tool_context_toolId_idx`(`toolId`),
    INDEX `tool_context_contextId_idx`(`contextId`),
    UNIQUE INDEX `tool_context_toolId_contextId_key`(`toolId`, `contextId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tool_step` (
    `id` VARCHAR(191) NOT NULL,
    `commandId` VARCHAR(191) NOT NULL,
    `stepIndex` INTEGER NOT NULL,
    `tool` VARCHAR(191) NOT NULL,
    `toolType` VARCHAR(191) NULL,
    `commandName` VARCHAR(191) NOT NULL,
    `params` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tool_step_commandId_idx`(`commandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `entity` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `commandId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `entity_method` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` TEXT NULL,
    `description` VARCHAR(191) NULL,
    `entityId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `command_entity_method` (
    `id` VARCHAR(191) NOT NULL,
    `commandId` VARCHAR(191) NOT NULL,
    `entityMethodId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `command_entity_method_commandId_idx`(`commandId`),
    INDEX `command_entity_method_entityMethodId_idx`(`entityMethodId`),
    UNIQUE INDEX `command_entity_method_commandId_entityMethodId_key`(`commandId`, `entityMethodId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Result` (
    `id` VARCHAR(191) NOT NULL,
    `content` TEXT NULL,
    `toolId` VARCHAR(191) NULL,
    `resultType` ENUM('tool_execute_result', 'command_execute_result', 'tool_explain_result', 'adjust_tool_result') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ToolExecuteResult` (
    `id` VARCHAR(191) NOT NULL,
    `toolId` VARCHAR(191) NOT NULL,
    `result` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ToolCommand` (
    `id` VARCHAR(191) NOT NULL,
    `toolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ToolExplainResult` (
    `id` VARCHAR(191) NOT NULL,
    `toolContextId` VARCHAR(191) NOT NULL,
    `result` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tool_context` ADD CONSTRAINT `tool_context_toolId_fkey` FOREIGN KEY (`toolId`) REFERENCES `tool`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tool_context` ADD CONSTRAINT `tool_context_contextId_fkey` FOREIGN KEY (`contextId`) REFERENCES `context`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tool_step` ADD CONSTRAINT `tool_step_commandId_fkey` FOREIGN KEY (`commandId`) REFERENCES `command`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `entity` ADD CONSTRAINT `entity_commandId_fkey` FOREIGN KEY (`commandId`) REFERENCES `command`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `entity_method` ADD CONSTRAINT `entity_method_entityId_fkey` FOREIGN KEY (`entityId`) REFERENCES `entity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `command_entity_method` ADD CONSTRAINT `command_entity_method_commandId_fkey` FOREIGN KEY (`commandId`) REFERENCES `command`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `command_entity_method` ADD CONSTRAINT `command_entity_method_entityMethodId_fkey` FOREIGN KEY (`entityMethodId`) REFERENCES `entity_method`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Result` ADD CONSTRAINT `Result_toolId_fkey` FOREIGN KEY (`toolId`) REFERENCES `tool`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ToolExecuteResult` ADD CONSTRAINT `ToolExecuteResult_toolId_fkey` FOREIGN KEY (`toolId`) REFERENCES `tool`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ToolCommand` ADD CONSTRAINT `ToolCommand_toolId_fkey` FOREIGN KEY (`toolId`) REFERENCES `tool`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ToolExplainResult` ADD CONSTRAINT `ToolExplainResult_toolContextId_fkey` FOREIGN KEY (`toolContextId`) REFERENCES `tool_context`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
