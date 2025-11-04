-- Migration to implement many-to-many relationships for Permission Groups

-- Step 1: Create junction tables
CREATE TABLE IF NOT EXISTS `role_permission_group` (
    `id` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `permissionGroupId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `role_permission_group_roleId_permissionGroupId_key` (`roleId`, `permissionGroupId`),
    INDEX `role_permission_group_roleId_idx` (`roleId`),
    INDEX `role_permission_group_permissionGroupId_idx` (`permissionGroupId`)
);

CREATE TABLE IF NOT EXISTS `permission_group_permission` (
    `id` VARCHAR(191) NOT NULL,
    `permissionGroupId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `permission_group_permission_permissionGroupId_permissionId_key` (`permissionGroupId`, `permissionId`),
    INDEX `permission_group_permission_permissionGroupId_idx` (`permissionGroupId`),
    INDEX `permission_group_permission_permissionId_idx` (`permissionId`)
);

-- Step 2: Migrate existing data from permission_group table to junction tables

-- Migrate permission group -> role relationships (if roleId exists)
INSERT INTO `role_permission_group` (`id`, `roleId`, `permissionGroupId`, `createdAt`)
SELECT UUID(), `roleId`, `id`, NOW()
FROM `permission_group`
WHERE `roleId` IS NOT NULL;

-- Migrate permission -> permission group relationships (if permissionGroupId exists)
INSERT INTO `permission_group_permission` (`id`, `permissionGroupId`, `permissionId`, `createdAt`)
SELECT UUID(), `permissionGroupId`, `id`, NOW()
FROM `permission`
WHERE `permissionGroupId` IS NOT NULL;

-- Step 3: Add foreign key constraints for junction tables
ALTER TABLE `role_permission_group`
ADD CONSTRAINT `role_permission_group_roleId_fkey` 
FOREIGN KEY (`roleId`) REFERENCES `role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `role_permission_group`
ADD CONSTRAINT `role_permission_group_permissionGroupId_fkey` 
FOREIGN KEY (`permissionGroupId`) REFERENCES `permission_group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `permission_group_permission`
ADD CONSTRAINT `permission_group_permission_permissionGroupId_fkey` 
FOREIGN KEY (`permissionGroupId`) REFERENCES `permission_group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `permission_group_permission`
ADD CONSTRAINT `permission_group_permission_permissionId_fkey` 
FOREIGN KEY (`permissionId`) REFERENCES `permission` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 4: Remove old foreign key constraints and columns

-- Remove permissionGroupId from permission table
ALTER TABLE `permission` DROP FOREIGN KEY `permission_permissionGroupId_fkey`;
ALTER TABLE `permission` DROP COLUMN `permissionGroupId`;

-- Remove roleId from permission_group table
ALTER TABLE `permission_group` DROP FOREIGN KEY `permission_group_roleId_fkey`;
ALTER TABLE `permission_group` DROP COLUMN `roleId`;

-- Migration complete: 
-- - Permission groups and roles now have many-to-many relationship via role_permission_group
-- - Permission groups and permissions now have many-to-many relationship via permission_group_permission