-- AlterTable
ALTER TABLE `mail_template` MODIFY `body` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `notification_template` MODIFY `body` TEXT NOT NULL;

-- CreateTable
CREATE TABLE `mail` (
    `id` VARCHAR(191) NOT NULL,
    `to` VARCHAR(191) NOT NULL,
    `from` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `templateId` VARCHAR(191) NULL,
    `sentAt` DATETIME(3) NULL,
    `failedReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `mail` ADD CONSTRAINT `mail_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `mail_template`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
