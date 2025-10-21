/*
  Warnings:

  - A unique constraint covering the columns `[jobId]` on the table `document` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `document` ADD COLUMN `jobId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `document_jobId_key` ON `document`(`jobId`);

-- AddForeignKey
ALTER TABLE `document` ADD CONSTRAINT `document_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `job`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
