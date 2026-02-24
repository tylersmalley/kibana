#!/usr/bin/env bash

OPS_ES_DEFAULT_URL="https://kibana-ops.es.us-central1.gcp.cloud.es.io"
OPS_ES_XDG_CONFIG_FILE="${OPS_ES_XDG_CONFIG_FILE:-${XDG_CONFIG_HOME:-$HOME/.config}/kibana/ops_es.env}"
OPS_ES_VAULT_ADDR="${OPS_ES_VAULT_ADDR:-${VAULT_ADDR:-https://secrets.elastic.co}}"
OPS_ES_VAULT_PATH="${OPS_ES_VAULT_PATH:-secret/kibana-issues/dev/ops_es}"
OPS_ES_CURL_TIMEOUT_SECONDS="${OPS_ES_CURL_TIMEOUT_SECONDS:-60}"

OPS_ES_ENV_URL="${OPS_ES_URL:-${ES:-}}"
OPS_ES_ENV_API_KEY="${OPS_ES_API_KEY:-${API_KEY:-}}"
OPS_ES_URL="${OPS_ES_ENV_URL}"
OPS_ES_API_KEY="${OPS_ES_ENV_API_KEY}"

ops_es_file_mode() {
  local file_path="$1"

  stat -f '%Lp' "${file_path}" 2>/dev/null || stat -c '%a' "${file_path}" 2>/dev/null
}

if [[ -z "${OPS_ES_API_KEY}" && -f "${OPS_ES_XDG_CONFIG_FILE}" ]]; then
  OPS_ES_XDG_MODE="$(ops_es_file_mode "${OPS_ES_XDG_CONFIG_FILE}" || true)"

  if [[ "${OPS_ES_XDG_MODE: -2}" == "00" ]]; then
    # shellcheck disable=SC1090
    source "${OPS_ES_XDG_CONFIG_FILE}"

    OPS_ES_URL="${OPS_ES_ENV_URL:-${OPS_ES_URL:-}}"
    OPS_ES_API_KEY="${OPS_ES_ENV_API_KEY:-${OPS_ES_API_KEY:-}}"
  else
    echo "Ignoring ${OPS_ES_XDG_CONFIG_FILE}: expected permissions 600 or stricter." >&2
  fi
fi

if [[ -z "${OPS_ES_API_KEY}" && "$(command -v vault)" ]]; then
  OPS_ES_VAULT_URL="$(
    vault read -address="${OPS_ES_VAULT_ADDR}" -field=url "${OPS_ES_VAULT_PATH}" 2>/dev/null || true
  )"
  OPS_ES_VAULT_API_KEY="$(
    vault read -address="${OPS_ES_VAULT_ADDR}" -field=api_key "${OPS_ES_VAULT_PATH}" 2>/dev/null || true
  )"

  OPS_ES_URL="${OPS_ES_URL:-${OPS_ES_VAULT_URL:-}}"
  OPS_ES_API_KEY="${OPS_ES_API_KEY:-${OPS_ES_VAULT_API_KEY:-}}"
fi

OPS_ES_URL="${OPS_ES_URL:-${OPS_ES_DEFAULT_URL}}"

if [[ -z "${OPS_ES_API_KEY}" ]]; then
  cat >&2 <<EOF
Could not find an encoded Elasticsearch API key for ops.kibana.dev.
Lookup order:
  1. OPS_ES_API_KEY
  2. XDG config: ${OPS_ES_XDG_CONFIG_FILE}
  3. Vault: ${OPS_ES_VAULT_PATH} field api_key

Vault access is optional. To use the shared Vault secret, run:
  export VAULT_ADDR=https://secrets.elastic.co
  vault login -method oidc

For setup instructions, read:
  .buildkite/.agent/skills/kibana-ops-elasticsearch/references/get_api_key.md
EOF
  return 1 2>/dev/null || exit 1
fi

ops_es_curl() {
  local request_path="$1"
  shift

  curl --fail-with-body -sS -m "${OPS_ES_CURL_TIMEOUT_SECONDS}" \
    -H "Authorization: ApiKey ${OPS_ES_API_KEY}" \
    -H 'content-type: application/json' \
    "${OPS_ES_URL%/}/${request_path#/}" \
    "$@"
}

ops_es_search() {
  local index_pattern="$1"
  local body="$2"

  ops_es_curl "${index_pattern}/_search" -X POST -d "${body}"
}

ops_es_esql() {
  local body="$1"

  ops_es_curl "_query" -X POST -d "${body}"
}

ops_es_check() {
  local index_pattern="${1:-}"

  ops_es_curl "_security/_authenticate" -X GET

  if [[ -n "${index_pattern}" ]]; then
    ops_es_search "${index_pattern}" '{"size":0,"track_total_hits":true}'
  fi
}
