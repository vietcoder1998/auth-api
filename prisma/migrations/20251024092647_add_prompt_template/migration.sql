-- AlterTable
ALTER TABLE `prompt_history` ADD COLUMN `promptTemplateId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `prompt_template` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `content` TEXT NOT NULL,
    `type` VARCHAR(191) NULL,
    `metadata` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `prompt_template_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `prompt_history` ADD CONSTRAINT `prompt_history_promptTemplateId_fkey` FOREIGN KEY (`promptTemplateId`) REFERENCES `prompt_template`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
