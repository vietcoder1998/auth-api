/*
  Warnings:

  - A unique constraint covering the columns `[ssoKey]` on the table `sso` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `sso` ADD COLUMN `ssoKey` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `sso_ssoKey_key` ON `sso`(`ssoKey`);
