/*
  Warnings:

  - You are about to drop the column `embedding` on the `agent_memory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `File` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `agent_memory` DROP COLUMN `embedding`,
    ADD COLUMN `vectorId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `label` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `notification` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `role` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `ui_config` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
