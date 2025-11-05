-- CreateTable
CREATE TABLE `permission_group` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `permission_group_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permission_group` (
    `id` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `permissionGroupId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `role_permission_group_roleId_idx`(`roleId`),
    INDEX `role_permission_group_permissionGroupId_idx`(`permissionGroupId`),
    UNIQUE INDEX `role_permission_group_roleId_permissionGroupId_key`(`roleId`, `permissionGroupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permission_group_permission` (
    `id` VARCHAR(191) NOT NULL,
    `permissionGroupId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `permission_group_permission_permissionGroupId_idx`(`permissionGroupId`),
    INDEX `permission_group_permission_permissionId_idx`(`permissionId`),
    UNIQUE INDEX `permission_group_permission_permissionGroupId_permissionId_key`(`permissionGroupId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `role_permission_group` ADD CONSTRAINT `role_permission_group_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permission_group` ADD CONSTRAINT `role_permission_group_permissionGroupId_fkey` FOREIGN KEY (`permissionGroupId`) REFERENCES `permission_group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permission_group_permission` ADD CONSTRAINT `permission_group_permission_permissionGroupId_fkey` FOREIGN KEY (`permissionGroupId`) REFERENCES `permission_group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permission_group_permission` ADD CONSTRAINT `permission_group_permission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
