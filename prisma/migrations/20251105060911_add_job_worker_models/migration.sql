-- AlterTable
ALTER TABLE `job` ADD COLUMN `maxRetries` INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN `metadata` TEXT NULL,
    ADD COLUMN `priority` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `progress` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `queueName` VARCHAR(191) NULL,
    ADD COLUMN `retries` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `timeout` INTEGER NULL DEFAULT 300000,
    ADD COLUMN `workerId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `job_queue` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `maxConcurrency` INTEGER NOT NULL DEFAULT 1,
    `maxRetries` INTEGER NOT NULL DEFAULT 3,
    `timeout` INTEGER NOT NULL DEFAULT 300000,
    `totalJobs` INTEGER NOT NULL DEFAULT 0,
    `completedJobs` INTEGER NOT NULL DEFAULT 0,
    `failedJobs` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `job_queue_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `worker` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `pid` INTEGER NULL,
    `hostname` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'idle',
    `queues` TEXT NOT NULL,
    `maxJobs` INTEGER NOT NULL DEFAULT 10,
    `processedJobs` INTEGER NOT NULL DEFAULT 0,
    `failedJobs` INTEGER NOT NULL DEFAULT 0,
    `lastHeartbeat` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `stoppedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `worker_status_idx`(`status`),
    INDEX `worker_lastHeartbeat_idx`(`lastHeartbeat`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_log` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `level` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `metadata` TEXT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `job_log_jobId_idx`(`jobId`),
    INDEX `job_log_level_idx`(`level`),
    INDEX `job_log_timestamp_idx`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `job_status_idx` ON `job`(`status`);

-- CreateIndex
CREATE INDEX `job_type_idx` ON `job`(`type`);

-- CreateIndex
CREATE INDEX `job_queueName_idx` ON `job`(`queueName`);

-- CreateIndex
CREATE INDEX `job_workerId_idx` ON `job`(`workerId`);

-- CreateIndex
CREATE INDEX `job_createdAt_idx` ON `job`(`createdAt`);
