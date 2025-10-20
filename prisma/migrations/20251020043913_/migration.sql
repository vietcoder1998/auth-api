/*
  Warnings:

  - You are about to drop the column `uploaderId` on the `File` table. All the data in the column will be lost.
  - You are about to drop the `UiConfig` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `path` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `File` DROP FOREIGN KEY `File_uploaderId_fkey`;

-- DropIndex
DROP INDEX `File_filename_key` ON `File`;

-- AlterTable
ALTER TABLE `File` DROP COLUMN `uploaderId`,
    ADD COLUMN `path` VARCHAR(191) NOT NULL,
    ADD COLUMN `userId` VARCHAR(191) NULL,
    MODIFY `type` VARCHAR(191) NOT NULL DEFAULT 'document',
    ALTER COLUMN `updatedAt` DROP DEFAULT;

-- DropTable
DROP TABLE `UiConfig`;

-- CreateTable
CREATE TABLE `ui_config` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `role` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ui_config_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `File` ADD CONSTRAINT `File_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
