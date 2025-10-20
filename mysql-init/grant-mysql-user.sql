-- grant-mysql-user.sql
-- This script grants all privileges to devuser from any host for local development
GRANT ALL PRIVILEGES ON *.* TO 'devuser'@'%' IDENTIFIED BY 'devuser_password';
FLUSH PRIVILEGES;
