#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "usage: $0 <index-pattern> [body-file|-]" >&2
  exit 2
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/ci_stats_es_common.sh"

INDEX_PATTERN="$1"
if [[ $# -eq 2 && "$2" != "-" ]]; then
  BODY="$(cat "$2")"
else
  BODY="$(cat)"
fi

ci_stats_es_search "${INDEX_PATTERN}" "${BODY}"
