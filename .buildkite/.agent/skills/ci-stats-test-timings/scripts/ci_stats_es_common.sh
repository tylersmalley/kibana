#!/usr/bin/env bash

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/../../kibana-ops-elasticsearch/scripts/ops_es_common.sh"

ci_stats_es_curl() {
  local request_path="$1"
  shift

  ops_es_curl "${request_path}" "$@"
}

ci_stats_es_search() {
  local index_pattern="$1"
  local body="$2"

  ops_es_search "${index_pattern}" "${body}"
}

ci_stats_es_check() {
  local index_pattern="${1:-}"

  ops_es_curl "_security/_authenticate" -X GET

  if [[ -n "${index_pattern}" ]]; then
    ci_stats_es_search "${index_pattern}" '{"size":0,"track_total_hits":true}'
  fi
}
