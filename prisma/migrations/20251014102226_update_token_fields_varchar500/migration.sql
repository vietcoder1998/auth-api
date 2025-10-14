-- AlterTable
ALTER TABLE `Token` MODIFY `accessToken` VARCHAR(500) NOT NULL,
    MODIFY `refreshToken` VARCHAR(500) NOT NULL;
