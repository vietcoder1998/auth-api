-- Custom migration to handle datetime issues
-- This migration fixes existing data before applying schema changes

-- First, update any invalid datetime values in existing tables
UPDATE `role` SET 
  createdAt = COALESCE(NULLIF(createdAt, '0000-00-00 00:00:00'), NOW()),
  updatedAt = COALESCE(NULLIF(updatedAt, '0000-00-00 00:00:00'), NOW())
WHERE createdAt = '0000-00-00 00:00:00' 
   OR updatedAt = '0000-00-00 00:00:00';

-- Add columns to role table if they don't exist
ALTER TABLE `role` ADD COLUMN IF NOT EXISTS `description` VARCHAR(191) NULL;
ALTER TABLE `role` ADD COLUMN IF NOT EXISTS `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `role` ADD COLUMN IF NOT EXISTS `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Create api_key table
CREATE TABLE IF NOT EXISTS `api_key` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `key` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `userId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `permissions` TEXT NULL,
    `allowedIPs` TEXT NULL,
    `rateLimit` INTEGER NULL DEFAULT 1000,
    `usageCount` INTEGER NOT NULL DEFAULT 0,
    `lastUsedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(191) NULL,

    UNIQUE INDEX `api_key_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create api_usage_log table
CREATE TABLE IF NOT EXISTS `api_usage_log` (
    `id` VARCHAR(191) NOT NULL,
    `apiKeyId` VARCHAR(191) NOT NULL,
    `endpoint` VARCHAR(191) NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `statusCode` INTEGER NOT NULL,
    `responseTime` INTEGER NULL,
    `requestBody` TEXT NULL,
    `responseBody` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key constraints if they don't exist
ALTER TABLE `api_key` ADD CONSTRAINT IF NOT EXISTS `api_key_userId_fkey` 
    FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `api_usage_log` ADD CONSTRAINT IF NOT EXISTS `api_usage_log_apiKeyId_fkey` 
    FOREIGN KEY (`apiKeyId`) REFERENCES `api_key`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;