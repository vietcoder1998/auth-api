#!/bin/bash
# grant-mysql-user.sh
# Usage: bash grant-mysql-user.sh [container_name] [user] [password]
# Example: bash grant-mysql-user.sh db devuser devuser_password

CONTAINER_NAME=${1:-db}
USER=${2:-devuser}
PASSWORD=${3:-devuser_password}

SQL="GRANT ALL PRIVILEGES ON *.* TO '${USER}'@'%' IDENTIFIED BY '${PASSWORD}'; FLUSH PRIVILEGES;"

echo "Granting privileges to user '${USER}' on MySQL container '${CONTAINER_NAME}'..."
docker exec -i "$CONTAINER_NAME" mysql -u root -p${MYSQL_ROOT_PASSWORD:-root_password} -e "$SQL"
echo "Done."
