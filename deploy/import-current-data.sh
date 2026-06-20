#!/usr/bin/env bash
set -Eeuo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
backup_path="${1:-}"
replace_mode="${2:-}"

if [[ -z "${backup_path}" || ! -f "${backup_path}" ]]; then
  echo "Uso: $0 /caminho/backup.json [--replace]" >&2
  exit 1
fi

if [[ "${replace_mode}" != '' && "${replace_mode}" != '--replace' ]]; then
  echo 'O segundo argumento permitido e apenas --replace.' >&2
  exit 1
fi

read -r -s -p 'TARGET_DATABASE_URL do PostgreSQL interno: ' TARGET_DATABASE_URL
echo

cleanup() {
  unset TARGET_DATABASE_URL TARGET_DB_SSL IMPORT_CONFIRM IMPORT_REPLACE_EXISTING
}
trap cleanup EXIT

export TARGET_DATABASE_URL
export TARGET_DB_SSL=false
export IMPORT_CONFIRM=IMPORTAR_DADOS

if [[ "${replace_mode}" == '--replace' ]]; then
  export IMPORT_REPLACE_EXISTING=true
  echo 'ATENCAO: os dados atuais do banco de destino serao substituidos.'
fi

cd "${project_dir}"
npm run db:import -- --input="${backup_path}"

echo 'Importacao concluida. Execute o smoke test e confira as contagens.'
