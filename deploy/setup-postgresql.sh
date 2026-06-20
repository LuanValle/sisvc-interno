#!/usr/bin/env bash
set -Eeuo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo 'Execute como root: sudo bash deploy/setup-postgresql.sh' >&2
  exit 1
fi

if [[ ! -f /etc/oracle-release ]]; then
  echo 'Aviso: este script foi preparado para Oracle Linux 9.' >&2
fi

echo 'Instalando os pacotes PostgreSQL aprovados pelo repositorio do servidor...'
dnf install -y postgresql-server postgresql

if [[ ! -f /var/lib/pgsql/data/PG_VERSION ]]; then
  postgresql-setup --initdb
fi

systemctl enable --now postgresql

runuser -u postgres -- psql -v ON_ERROR_STOP=1 <<'SQL'
SELECT 'CREATE ROLE app_user LOGIN'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') \gexec

SELECT 'CREATE DATABASE app_db OWNER app_user'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'app_db') \gexec

ALTER DATABASE app_db OWNER TO app_user;
REVOKE CONNECT ON DATABASE app_db FROM PUBLIC;
GRANT CONNECT ON DATABASE app_db TO app_user;
SQL

runuser -u postgres -- psql -v ON_ERROR_STOP=1 \
  -c "ALTER SYSTEM SET listen_addresses = '127.0.0.1'"
runuser -u postgres -- psql -v ON_ERROR_STOP=1 \
  -c "ALTER SYSTEM SET password_encryption = 'scram-sha-256'"
runuser -u postgres -- psql -v ON_ERROR_STOP=1 -c 'SELECT pg_reload_conf()'

echo 'Defina agora a senha do usuario PostgreSQL app_user (ela nao sera exibida):'
runuser -u postgres -- psql -v ON_ERROR_STOP=1 -c '\password app_user'

data_dir="$(runuser -u postgres -- psql -Atqc 'SHOW data_directory')"
pg_hba="${data_dir}/pg_hba.conf"

if ! grep -Eq '^host[[:space:]]+app_db[[:space:]]+app_user[[:space:]]+127\.0\.0\.1/32[[:space:]]+scram-sha-256' "${pg_hba}"; then
  backup="${pg_hba}.backup-$(date +%Y%m%d%H%M%S)"
  cp --preserve=mode,ownership "${pg_hba}" "${backup}"
  temp_file="$(mktemp)"
  {
    echo 'host    app_db    app_user    127.0.0.1/32    scram-sha-256'
    cat "${pg_hba}"
  } > "${temp_file}"
  install -o postgres -g postgres -m 600 "${temp_file}" "${pg_hba}"
  rm -f "${temp_file}"
  echo "Backup do pg_hba.conf: ${backup}"
fi

systemctl restart postgresql

echo
echo 'PostgreSQL interno preparado:'
echo '  host: 127.0.0.1'
echo '  porta: 5432'
echo '  banco: app_db'
echo '  usuario: app_user'
echo 'A porta 5432 nao deve ser liberada no firewall.'
