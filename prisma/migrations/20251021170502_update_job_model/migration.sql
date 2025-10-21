-- CreateTable
CREATE TABLE `job_document` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `job_document_jobId_idx`(`jobId`),
    INDEX `job_document_documentId_idx`(`documentId`),
    UNIQUE INDEX `job_document_jobId_documentId_key`(`jobId`, `documentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_database` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `databaseId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `job_database_jobId_idx`(`jobId`),
    INDEX `job_database_databaseId_idx`(`databaseId`),
    UNIQUE INDEX `job_database_jobId_databaseId_key`(`jobId`, `databaseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `job_document` ADD CONSTRAINT `job_document_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_document` ADD CONSTRAINT `job_document_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `File`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_database` ADD CONSTRAINT `job_database_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_database` ADD CONSTRAINT `job_database_databaseId_fkey` FOREIGN KEY (`databaseId`) REFERENCES `database_connection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
