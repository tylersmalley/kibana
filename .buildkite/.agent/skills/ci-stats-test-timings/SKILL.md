---
name: ci-stats-test-timings
description: Investigate Kibana Jest, Jest Integration, and FTR timings in ci-stats. Use for test groups, individual test runs, top failures, slow configs, flaky timing variance, Buildkite build number to ci-stats buildId mapping, and PR vs baseline timing analysis.
---

# CI Stats Test Timings

Do not use this skill for Buildkite build/job cost or queue analysis; use `buildkite-stats`.
Do not use it for Scout reporter events; use `scout-test-timings`.

## Access

Preferred path: query ci-stats through the ops Elasticsearch CCS remote with the helper. Auth and credential setup are owned by [`../kibana-ops-elasticsearch/SKILL.md`](../kibana-ops-elasticsearch/SKILL.md).

```bash
.buildkite/.agent/skills/ci-stats-test-timings/scripts/ci_stats_es_search.sh \
  'kibana-ci-stats-service-internal:kibana-ci-stats-test-runs*' <<'JSON'
{"size":0,"track_total_hits":true}
JSON
```

Pass full CCS index patterns to the helper. If a CCS query returns zero shards, do not infer that ci-stats has no data; verify the remote alias or credentials.

- CCS remote alias: `kibana-ci-stats-service-internal`
- Builds: `kibana-ci-stats-service-internal:kibana-ci-stats-builds*`
- Test groups: `kibana-ci-stats-service-internal:kibana-ci-stats-test-groups*`
- Test runs: `kibana-ci-stats-service-internal:kibana-ci-stats-test-runs*`
- Timings: `kibana-ci-stats-service-internal:kibana-ci-stats-timings*`

## Data Model

Use these streams:

- `kibana-ci-stats-builds`: one doc per CI build
- `kibana-ci-stats-test-groups`: one doc per Jest or FTR config run
- `kibana-ci-stats-test-runs`: one doc per individual test or hook
- `kibana-ci-stats-timings`: arbitrary timing events

Important `test-groups` fields:

- `@timestamp`: ingest/report time
- `buildId`, `branch`, `prId`, `jobName`, `commit`
- `type`: `Jest Unit Tests`, `Jest Integration Tests`, or `Functional Tests`
- `name`: config path or config group name
- `result`: `pass`, `fail`, or `skip`
- `startTime`, `durationMs`

Important `test-runs` fields:

- `@timestamp`: ingest/report time
- `buildId`, `groupId`, `groupType`
- `type`: `test`, `before all hook`, `before each hook`, `after each hook`, or `after all hook`
- `result`: `pass`, `fail`, or `skip`
- `suites`, `name`, `fullName`, `file`
- `durationMs`, `error`, `stdout`

For "past week" questions, use `@timestamp` for "reported/indexed in the past week" and `startTime` only when the question specifically asks when the test execution started.

Key joins:

- build `_id` is the ci-stats `buildId`
- test-group `_id` is the `groupId` used by test-runs

Group types:

- `Jest Unit Tests`
- `Jest Integration Tests`
- `Functional Tests`

## Workflow

1. If starting from a Buildkite build, map build number to ci-stats `buildId`.
2. Use `test-groups` for config-level timing.
3. Use `test-runs` for top failures, per-test failures, per-hook failures, or slow tests inside a group.
4. For top failures, aggregate failed `test-runs`; do not scrape Buildkite artifacts unless ES is unavailable or artifact contents are explicitly needed.
5. Filter to `result=pass` when measuring variance rather than failures.
6. Call out when suite overhead, retries, or config composition make comparisons noisy.

## References

Open these only as needed:

- [`references/queries.md`](references/queries.md) for ci-stats query patterns
- [`references/buildkite-ftr-baseline.md`](references/buildkite-ftr-baseline.md) for fast PR vs baseline FTR comparisons using Buildkite metadata

Helper script:

- [`scripts/map_buildkite_build_to_ci_stats_build_id.sh`](scripts/map_buildkite_build_to_ci_stats_build_id.sh) maps a Buildkite build number to a ci-stats `buildId` through ops CCS with zero-shard detection; pass the pipeline/job name as the second argument for non-PR pipelines
- [`scripts/ci_stats_es_search.sh`](scripts/ci_stats_es_search.sh) runs ci-stats searches through the shared ops Elasticsearch helper

## Code References

Data path:

- Jest reporter: `src/platform/packages/shared/kbn-test/src/jest/ci_stats_jest_reporter.ts`
- FTR reporter: `src/platform/packages/shared/kbn-test/src/functional_test_runner/lib/mocha/reporter/ci_stats_ftr_reporter.ts`
- HTTP client: `src/platform/packages/private/kbn-ci-stats-reporter/src/ci_stats_reporter.ts`
- Picker logic: `.buildkite/pipeline-utils/ci-stats/pick_test_group_run_order.ts`
