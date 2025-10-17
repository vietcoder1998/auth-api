-- CreateTable
CREATE TABLE `database_connection` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type` VARCHAR(191) NOT NULL,
    `host` VARCHAR(191) NOT NULL,
    `port` INTEGER NOT NULL DEFAULT 3306,
    `database` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `ssl` BOOLEAN NOT NULL DEFAULT false,
    `timeout` INTEGER NOT NULL DEFAULT 30000,
    `options` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastTested` DATETIME(3) NULL,
    `testStatus` VARCHAR(191) NULL,
    `testError` TEXT NULL,
    `backupEnabled` BOOLEAN NOT NULL DEFAULT false,
    `backupPath` VARCHAR(191) NULL,
    `lastBackup` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `database_connection_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
