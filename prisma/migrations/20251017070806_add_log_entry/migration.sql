-- CreateTable
CREATE TABLE `log_entry` (
    `id` VARCHAR(191) NOT NULL,
    `level` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `metadata` TEXT NULL,
    `userId` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `endpoint` VARCHAR(191) NULL,
    `method` VARCHAR(191) NULL,
    `statusCode` INTEGER NULL,
    `responseTime` INTEGER NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `log_entry_level_idx`(`level`),
    INDEX `log_entry_userId_idx`(`userId`),
    INDEX `log_entry_timestamp_idx`(`timestamp`),
    INDEX `log_entry_endpoint_idx`(`endpoint`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `log_entry` ADD CONSTRAINT `log_entry_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
