#!/usr/bin/env bash
set -euo pipefail
umask 077
if [[ -e .env ]]; then echo "Refusing to overwrite existing .env" >&2; exit 1; fi
command -v openssl >/dev/null || { echo "openssl is required" >&2; exit 1; }
: "${MARIADB_USER:?Export the existing MARIADB_USER before running this script}"
: "${MARIADB_PASSWORD:?Export the existing MARIADB_PASSWORD before running this script}"
mariadb_database="${MARIADB_DATABASE:-digibail_vamcitydigibilepay}"
socket_gid="${MARIADB_SOCKET_GID:-$(stat -c '%g' /var/lib/mysql/mysql.sock 2>/dev/null || true)}"
: "${socket_gid:?Set MARIADB_SOCKET_GID or make the MariaDB socket available}"
jwt_secret="$(openssl rand -hex 48)"
otp_pepper="$(openssl rand -hex 32)"
captcha_pepper="$(openssl rand -hex 32)"
cat > .env <<EOF
MARIADB_DATABASE=$mariadb_database
MARIADB_USER=$MARIADB_USER
MARIADB_PASSWORD=$MARIADB_PASSWORD
MARIADB_SOCKET=/tmp/mysql.sock
MARIADB_SOCKET_GID=$socket_gid
PORT=1631
HOST=0.0.0.0
JWT_SECRET=$jwt_secret
OTP_PEPPER=$otp_pepper
CAPTCHA_PEPPER=$captcha_pepper
BRAND_NAME=دیجی‌بایل پی
KAVENEGAR_API_KEY=
KAVENEGAR_TEMPLATE=
EOF
chmod 600 .env
echo "Created MariaDB-only .env with mode 600. Existing database credentials were preserved."
echo "Configure KAVENEGAR_API_KEY and KAVENEGAR_TEMPLATE before enabling real OTP."
