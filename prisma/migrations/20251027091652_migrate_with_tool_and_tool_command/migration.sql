-- DropForeignKey
ALTER TABLE `command` DROP FOREIGN KEY `command_toolId_fkey`;

-- AlterTable
ALTER TABLE `command` ADD COLUMN `exampleParams` TEXT NULL;

-- AddForeignKey
ALTER TABLE `command` ADD CONSTRAINT `command_toolId_fkey` FOREIGN KEY (`toolId`) REFERENCES `tool`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
