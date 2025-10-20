-- CreateTable
CREATE TABLE `job` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'backup',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `payload` TEXT NULL,
    `result` TEXT NULL,
    `error` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `startedAt` DATETIME(3) NULL,
    `finishedAt` DATETIME(3) NULL,
    `description` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_conversation` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `job_conversation_jobId_idx`(`jobId`),
    INDEX `job_conversation_conversationId_idx`(`conversationId`),
    UNIQUE INDEX `job_conversation_jobId_conversationId_key`(`jobId`, `conversationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `job` ADD CONSTRAINT `job_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_conversation` ADD CONSTRAINT `job_conversation_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_conversation` ADD CONSTRAINT `job_conversation_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
