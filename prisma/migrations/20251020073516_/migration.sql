/*
  Warnings:

  - You are about to drop the column `description` on the `label` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `label` DROP COLUMN `description`,
    ALTER COLUMN `color` DROP DEFAULT;

-- AlterTable
ALTER TABLE `message` ADD COLUMN `faqId` VARCHAR(191) NULL,
    ADD COLUMN `type` ENUM('question', 'answer') NOT NULL DEFAULT 'question';

-- AddForeignKey
ALTER TABLE `message` ADD CONSTRAINT `message_faqId_fkey` FOREIGN KEY (`faqId`) REFERENCES `faq`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
