# Ops Elasticsearch Credentials

Use this only when the shared helper cannot find credentials.

## Default Shared Secret

The default shared read key is stored in Vault:

```text
secret/kibana-issues/dev/ops_es
```

Fields:

- `url`
- `api_key`

Validate without printing the secret:

```bash
export VAULT_ADDR='https://secrets.elastic.co'
vault login -method oidc

vault read -field=url secret/kibana-issues/dev/ops_es
vault read -field=api_key secret/kibana-issues/dev/ops_es >/dev/null && echo 'api_key present'
```

To update the shared secret:

```bash
read -rsp 'Ops ES API key: ' OPS_ES_API_KEY
printf '\n'

export VAULT_ADDR='https://secrets.elastic.co'
vault login -method oidc

vault write secret/kibana-issues/dev/ops_es \
  url='https://kibana-ops.es.us-central1.gcp.cloud.es.io' \
  api_key="$OPS_ES_API_KEY"

unset OPS_ES_API_KEY
```

## Local Override

Use XDG config only for a personal key, write-capable key, or non-Vault setup.
The helper reads this file before Vault when `OPS_ES_API_KEY` is unset.
It does not write this file automatically.
Use this path when you do not have Vault access.

```bash
mkdir -p "${XDG_CONFIG_HOME:-$HOME/.config}/kibana"
chmod 700 "${XDG_CONFIG_HOME:-$HOME/.config}/kibana"

cat > "${XDG_CONFIG_HOME:-$HOME/.config}/kibana/ops_es.env" <<'EOF'
OPS_ES_API_KEY='<encoded-api-key>'
OPS_ES_URL='https://kibana-ops.es.us-central1.gcp.cloud.es.io'
EOF

chmod 600 "${XDG_CONFIG_HOME:-$HOME/.config}/kibana/ops_es.env"
```

## Vault Setup

Vault access is optional. If you have access and want to use the shared key:

```bash
export VAULT_ADDR='https://secrets.elastic.co'
vault login -method oidc
```

If Vault is not installed, not logged in, or the user lacks access to `secret/kibana-issues/dev/ops_es`, use the env or XDG options above instead.

## Request Or Create A New Key

Use an Elasticsearch API key for the ops cluster. Do not use username/password auth.

Recommended request parameters:

- Name: `<username>-ops-kibana-dev-read`
- Expiration: `30d` for short investigations, or the shortest duration that covers the work
- Scope: read-only access to Kibana CI analytics data over CCS
- Needed datasets:
  - `buildkite-stats:buildkite-builds-*`
  - `buildkite-stats:buildkite-jobs-*`
  - `kibana-ci-stats-service-internal:kibana-ci-stats-*`
  - `appex-qa:scout-test-events-*`

If creating the key in the ops Kibana UI, start from:

```text
https://ops.kibana.dev/s/ci/app/management/security/api_keys
```

If the UI asks for privileges, request or use a read-only role with:

- Local cluster privileges: `monitor` and `cross_cluster_search`
- Local index privilege: `read` on `names: [""]`
- Remote index privileges: `read`, `view_index_metadata`, and `read_cross_cluster` for the needed datasets above

If the UI does not accept CCS-prefixed index names, ask the Kibana operations owner for a read-capable ops API key with CCS access to the listed remotes.

## Temporary Env Override

Use the encoded API key value:

```bash
export OPS_ES_API_KEY='<encoded-api-key>'
```

Optionally override the endpoint:

```bash
export OPS_ES_URL='https://kibana-ops.es.us-central1.gcp.cloud.es.io'
```

Validate access with:

```bash
REPO_ROOT="$(git rev-parse --show-toplevel)"
source "$REPO_ROOT/.buildkite/.agent/skills/kibana-ops-elasticsearch/scripts/ops_es_common.sh"
ops_es_curl /
```
