# Fast FTR PR vs Baseline Via Buildkite Metadata

Use this when you need quick config-level FTR impact and do not need per-test detail from ci-stats.

## Workflow

1. Identify affected FTR config paths.
2. Find the latest PR build on `kibana-pull-request`.
3. Find the merge-base commit between PR head and `main`.
4. Find the `kibana-on-merge` build for that merge-base commit.
5. Fetch `ftr_run_order.json` from `Pick Test Group Run Order` in both builds.
6. Map each config path to `ftr_configs_N`.
7. Convert the key to job name `FTR Configs #(N+1)`.
8. Read job durations from Buildkite job metadata.
9. Use `include_retried_jobs=true` and pick the latest attempt per job name.
10. Report deltas and caveats about group composition changes.

## Commands

Set environment:

```bash
export BUILDKITE_API_TOKEN='<token>'
export BUILDKITE_ORGANIZATION_SLUG='elastic'
```

Find merge-base:

```bash
gh api repos/elastic/kibana/compare/main...<pr_head_sha> --jq '.merge_base_commit.sha'
```

Get build JSON:

```bash
bk api "/pipelines/kibana-pull-request/builds/<pr_build>?include_retried_jobs=true" > /tmp/pr_build.json
bk api "/pipelines/kibana-on-merge/builds/<base_build>?include_retried_jobs=true" > /tmp/base_build.json
```

Get `ftr_run_order.json` download URL:

```bash
PICK_JOB_ID=$(jq -r '.jobs[] | select(.name=="Pick Test Group Run Order") | .id' /tmp/pr_build.json)
bk api "/pipelines/kibana-pull-request/builds/<pr_build>/jobs/$PICK_JOB_ID/artifacts?per_page=200" \
  | jq -r '.[] | select(.filename=="ftr_run_order.json") | .download_url'
```

Map config to `ftr_configs_N`:

```bash
jq -r --arg cfg 'src/platform/test/functional/apps/dashboard/group1/config.ts' '
  to_entries[] | select([.value.names[]] | index($cfg)) | .key
' /tmp/ftr_run_order_pr.json
```

Compute duration in seconds for one config:

```bash
jq -r --arg key 'ftr_configs_51' '
  def ts: sub("\\.[0-9]+Z$";"Z") | fromdateiso8601;
  ($key | split("_")[-1] | tonumber + 1) as $idx
  | ("FTR Configs #\($idx)") as $job
  | .jobs
  | map(select(.type=="script" and .name==$job))
  | sort_by(.started_at)
  | last
  | ((.finished_at | ts) - (.started_at | ts))
' /tmp/pr_build.json
```
