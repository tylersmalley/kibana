# Ops CCS Datasets

All index patterns below are queried through the ops Elasticsearch endpoint with CCS prefixes.

## buildkite-stats

Use for Buildkite build and job analytics.

- `buildkite-stats:buildkite-builds-*`
- `buildkite-stats:buildkite-jobs-*`

Typical questions:

- build counts and duration trends
- job fanout and job duration trends
- retry and spot/preemption behavior
- queue and machine-type mix
- build or job cost analysis

## kibana-ci-stats-service-internal

Use for Jest, Jest Integration, and FTR timings from ci-stats.
The ci-stats timing skill uses these CCS index patterns through `../../ci-stats-test-timings/scripts/ci_stats_es_search.sh`.
If a CCS query returns `_shards.total: 0`, verify the remote alias and credentials before drawing conclusions from empty results.

- `kibana-ci-stats-service-internal:kibana-ci-stats-builds*`
- `kibana-ci-stats-service-internal:kibana-ci-stats-test-groups*`
- `kibana-ci-stats-service-internal:kibana-ci-stats-test-runs*`
- `kibana-ci-stats-service-internal:kibana-ci-stats-timings*`

Typical questions:

- map Buildkite build numbers to ci-stats build IDs
- config-level test duration
- individual Jest/FTR test duration
- slow or volatile configs
- PR vs baseline timing comparisons

## appex-qa

Use for Scout reporter events.

- `appex-qa:scout-test-events-*`

The Scout reporter defaults are defined in `src/platform/packages/private/kbn-scout-info/src/reporting.ts`:

- template/index pattern: `scout-test-events-*`
- data stream: `scout-test-events-kibana`

Typical questions:

- Scout config runtime
- Scout individual test runtime
- target breakdowns by `test_run.target.type` and `test_run.target.mode`
- Buildkite branch, pipeline, build, step, and group filters
