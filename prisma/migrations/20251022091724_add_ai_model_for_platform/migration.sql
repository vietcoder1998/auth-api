-- CreateTable
CREATE TABLE `ai_model` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `platformId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ai_model_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ai_model` ADD CONSTRAINT `ai_model_platformId_fkey` FOREIGN KEY (`platformId`) REFERENCES `ai_platform`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
