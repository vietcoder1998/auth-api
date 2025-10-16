-- CreateTable
CREATE TABLE `label` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL DEFAULT '#007bff',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `label_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `entity_label` (
    `id` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `labelId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `entity_label_entityId_entityType_idx`(`entityId`, `entityType`),
    INDEX `entity_label_labelId_idx`(`labelId`),
    INDEX `entity_label_entityType_idx`(`entityType`),
    UNIQUE INDEX `entity_label_entityId_entityType_labelId_key`(`entityId`, `entityType`, `labelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `entity_label` ADD CONSTRAINT `entity_label_labelId_fkey` FOREIGN KEY (`labelId`) REFERENCES `label`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
