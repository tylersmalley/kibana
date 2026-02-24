---
name: kibana-ops-elasticsearch
description: Shared access and query helper for the ops.kibana.dev Elasticsearch cluster and its CCS remotes. Use for ops cluster endpoint details, API key auth, CCS remote aliases, dataset discovery, and the ops_es_curl/ops_es_search shell helpers used by Buildkite, ci-stats, and Scout timing skills.
---

# Kibana Ops Elasticsearch

Use this shared skill before any skill that queries the ops.kibana.dev Elasticsearch cluster.
Domain skills should keep their dataset-specific fields and query recipes in their own folders and link here for access mechanics.

## Access

- Kibana: `https://ops.kibana.dev`
- Elasticsearch endpoint: `https://kibana-ops.es.us-central1.gcp.cloud.es.io`
- Auth: Elasticsearch API key only.
- Credential lookup order:
  - `OPS_ES_API_KEY` and optional `OPS_ES_URL`
  - `${XDG_CONFIG_HOME:-$HOME/.config}/kibana/ops_es.env`
  - Vault path `secret/kibana-issues/dev/ops_es`

Never commit API keys or paste them into skill files.
If credentials are missing, read [`references/get_api_key.md`](references/get_api_key.md).

## Shell Helper

Source the shared helper from scripts that query ops:

```bash
REPO_ROOT="$(git rev-parse --show-toplevel)"
source "$REPO_ROOT/.buildkite/.agent/skills/kibana-ops-elasticsearch/scripts/ops_es_common.sh"
```

After sourcing:

- `ops_es_curl <path> [curl args...]` calls the ops Elasticsearch endpoint with API key auth.
- `ops_es_search <ccs-index-pattern> <json-body>` runs `_search`.
- `ops_es_esql <json-body>` runs `_query` for ES|QL.
- `ops_es_check [ccs-index-pattern]` verifies auth and optionally runs a zero-size search against an index pattern.

The helper accepts legacy `ES` and `API_KEY` variables as fallbacks, but new docs and scripts should prefer `OPS_ES_URL` and `OPS_ES_API_KEY`.
Use `OPS_ES_XDG_CONFIG_FILE`, `OPS_ES_VAULT_ADDR`, or `OPS_ES_VAULT_PATH` only when overriding the default credential locations.
The helper is bash-oriented; run it from bash scripts rather than sourcing it into arbitrary interactive shells.

## CCS Remotes

Open [`references/datasets.md`](references/datasets.md) when choosing an index pattern or remote alias.

Common aliases:

- `buildkite-stats`
- `kibana-ci-stats-service-internal`
- `appex-qa`

Use CCS-prefixed sources, for example `buildkite-stats:buildkite-jobs-*`.
