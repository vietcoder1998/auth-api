/*
  Warnings:

  - You are about to drop the column `model` on the `agent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `agent` DROP COLUMN `model`,
    ADD COLUMN `aIModelId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `sso` ADD COLUMN `modelId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `sso` ADD CONSTRAINT `sso_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `ai_model`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent` ADD CONSTRAINT `agent_aIModelId_fkey` FOREIGN KEY (`aIModelId`) REFERENCES `ai_model`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
