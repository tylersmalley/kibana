#!/usr/bin/env bash
set -euo pipefail

# Map a Buildkite build number (jobId) to a ci-stats buildId by querying the ci-stats builds data stream.
#
# Example:
#   ./scripts/map_buildkite_build_to_ci_stats_build_id.sh 390868
#   ./scripts/map_buildkite_build_to_ci_stats_build_id.sh 123456 kibana-on-merge

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "usage: $0 <buildkite_build_number> [pipeline_slug_or_job_name]" >&2
  exit 2
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

BUILD_NUM="$1"
JOB_NAME="${2:-kibana-pull-request}"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to parse ci-stats search results." >&2
  exit 1
fi

BODY="$(jq -n --arg build_num "${BUILD_NUM}" --arg job_name "${JOB_NAME}" '{
  size: 1,
  sort: [{ "@timestamp": { order: "desc" } }],
  query: {
    bool: {
      filter: [
        { term: { jobRunner: "buildkite" } },
        { term: { jobName: $job_name } },
        { term: { jobId: $build_num } }
      ]
    }
  },
  _source: ["jobUrl", "prId", "branch", "commit", "jobName", "jobId", "startedAt", "completedAt", "result"]
}'
)"

print_zero_shard_hint() {
  cat >&2 <<EOF
ci-stats is queried through the ops Elasticsearch CCS remote.

Credential lookup uses:
  1. ${XDG_CONFIG_HOME:-$HOME/.config}/kibana/ops_es.env
  2. Vault path secret/kibana-issues/dev/ops_es

If credentials are valid, verify CI_STATS_ES_BUILDS_INDEX. The default is kibana-ci-stats-service-internal:kibana-ci-stats-builds*.
EOF
}

run_search() {
  local source_name="$1"
  shift

  if ! SEARCH_OUTPUT="$("$@" 2>&1)"; then
    printf '%s\n' "${SEARCH_OUTPUT}" >&2
    exit 1
  fi

  if jq -e '.error != null' >/dev/null <<<"${SEARCH_OUTPUT}"; then
    printf '%s\n' "${SEARCH_OUTPUT}" >&2
    exit 1
  fi

  if [[ "${source_name}" == "ops CCS" ]] && [[ "$(jq -r '._shards.total // empty' <<<"${SEARCH_OUTPUT}")" == "0" ]]; then
    echo "ci-stats CCS returned zero shards for ${CI_STATS_ES_BUILDS_INDEX}." >&2
    print_zero_shard_hint
    exit 1
  fi
}

CI_STATS_ES_BUILDS_INDEX="${CI_STATS_ES_BUILDS_INDEX:-kibana-ci-stats-service-internal:kibana-ci-stats-builds*}"

source "${SCRIPT_DIR}/ci_stats_es_common.sh"
run_search "ops CCS" ci_stats_es_search "${CI_STATS_ES_BUILDS_INDEX}" "${BODY}"

if [[ "$(jq '.hits.hits | length' <<<"${SEARCH_OUTPUT}")" == "0" ]]; then
  echo "No ci-stats build found for Buildkite build ${BUILD_NUM} in ${JOB_NAME}." >&2
  exit 1
fi

jq -r '
  .hits.hits[0] as $hit
  | ($hit._source // {}) as $source
  | $hit._id,
    "jobUrl=\($source.jobUrl // "")",
    "prId=\($source.prId // "") branch=\($source.branch // "") commit=\($source.commit // "")"
' <<<"${SEARCH_OUTPUT}"
