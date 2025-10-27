-- CreateTable
CREATE TABLE `command` (
    `id` VARCHAR(191) NOT NULL,
    `toolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `repository` VARCHAR(191) NULL,
    `script` TEXT NULL,
    `params` TEXT NULL,
    `description` TEXT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `timeout` INTEGER NULL DEFAULT 30000,
    `retries` INTEGER NULL DEFAULT 0,
    `metadata` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `command_toolId_idx`(`toolId`),
    INDEX `command_action_idx`(`action`),
    UNIQUE INDEX `command_toolId_name_key`(`toolId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `command_execution` (
    `id` VARCHAR(191) NOT NULL,
    `commandId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `input` TEXT NULL,
    `output` TEXT NULL,
    `error` TEXT NULL,
    `executedBy` VARCHAR(191) NULL,
    `duration` INTEGER NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `command_execution_commandId_idx`(`commandId`),
    INDEX `command_execution_status_idx`(`status`),
    INDEX `command_execution_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `command` ADD CONSTRAINT `command_toolId_fkey` FOREIGN KEY (`toolId`) REFERENCES `tool`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `command_execution` ADD CONSTRAINT `command_execution_commandId_fkey` FOREIGN KEY (`commandId`) REFERENCES `command`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
