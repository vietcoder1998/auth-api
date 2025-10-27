-- CreateIndex
-- Add ssoKey column to SSO table

-- Add the ssoKey column
ALTER TABLE `sso` ADD COLUMN `ssoKey` VARCHAR(191) NULL;

-- Create unique index on ssoKey
CREATE UNIQUE INDEX `sso_ssoKey_key` ON `sso`(`ssoKey`);

-- Update existing records to have ssoKey values (optional - generate from key)
UPDATE `sso` SET `ssoKey` = CONCAT('sso_', SUBSTRING(MD5(CONCAT(`id`, `key`)), 1, 16)) WHERE `ssoKey` IS NULL;