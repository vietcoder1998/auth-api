-- grant-mysql-user.sql
-- This script grants all privileges to admin_user from any host for local development
CREATE USER IF NOT EXISTS 'admin_user'@'%' IDENTIFIED BY 'admin_password';
GRANT ALL PRIVILEGES ON *.* TO 'admin_user'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
