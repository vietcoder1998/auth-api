-- Fix invalid datetime values in existing tables before migration
-- This script should be run before applying the migration

USE `auth-system`;

-- First, let's check if there are any invalid datetime values
SELECT * FROM `role` WHERE updatedAt = '0000-00-00 00:00:00' OR updatedAt IS NULL;

-- Update any invalid datetime values to a valid timestamp
UPDATE `role` SET 
  createdAt = COALESCE(createdAt, NOW()),
  updatedAt = COALESCE(updatedAt, NOW())
WHERE createdAt = '0000-00-00 00:00:00' 
   OR createdAt IS NULL 
   OR updatedAt = '0000-00-00 00:00:00' 
   OR updatedAt IS NULL;

-- Check other tables for similar issues
UPDATE `user` SET 
  createdAt = COALESCE(createdAt, NOW()),
  updatedAt = COALESCE(updatedAt, NOW())
WHERE createdAt = '0000-00-00 00:00:00' 
   OR createdAt IS NULL 
   OR updatedAt = '0000-00-00 00:00:00' 
   OR updatedAt IS NULL;

UPDATE `sso` SET 
  createdAt = COALESCE(createdAt, NOW()),
  updatedAt = COALESCE(updatedAt, NOW())
WHERE createdAt = '0000-00-00 00:00:00' 
   OR createdAt IS NULL 
   OR updatedAt = '0000-00-00 00:00:00' 
   OR updatedAt IS NULL;

UPDATE `login_history` SET 
  createdAt = COALESCE(createdAt, NOW()),
  updatedAt = COALESCE(updatedAt, NOW())
WHERE createdAt = '0000-00-00 00:00:00' 
   OR createdAt IS NULL 
   OR updatedAt = '0000-00-00 00:00:00' 
   OR updatedAt IS NULL;