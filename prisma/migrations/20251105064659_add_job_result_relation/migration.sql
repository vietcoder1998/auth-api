/*
  Warnings:

  - You are about to drop the `job_queue` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `billing` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `faq` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- DropTable
DROP TABLE `job_queue`;

-- CreateTable
CREATE TABLE `job_result` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `result` TEXT NULL,
    `error` TEXT NULL,
    `processingTime` INTEGER NULL,
    `metadata` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `job_result_jobId_idx`(`jobId`),
    INDEX `job_result_status_idx`(`status`),
    INDEX `job_result_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `job_result` ADD CONSTRAINT `job_result_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
