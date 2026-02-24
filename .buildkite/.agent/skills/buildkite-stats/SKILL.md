---
name: buildkite-stats
description: Investigate Buildkite build and job timing data in the buildkite-stats CCS remote. Use for build counts, build durations, job durations, job fanout, retries, spot/preemption behavior, queue mix, machine mix, build cost, job cost, and monthly CI trend analysis for pipelines such as kibana-pull-request.
---

# Buildkite Stats

Do not use this skill for Jest, FTR, or Scout per-test timing analysis.
Use `ci-stats-test-timings` for Jest/FTR and `scout-test-timings` for Scout.

## Shared Access

Use the shared ops skill at [`../kibana-ops-elasticsearch/SKILL.md`](../kibana-ops-elasticsearch/SKILL.md).

- CCS remote alias: `buildkite-stats`
- Build stream: `buildkite-stats:buildkite-builds-*`
- Job stream: `buildkite-stats:buildkite-jobs-*`
- Current story stream: `buildkite-stats:buildkite-stories`

Do not use `appex_pr_builds_enriched` for Buildkite build/job analysis unless the user explicitly asks for that dataset.
For current story data, use the exact `buildkite-stories` data stream. Do not add a wildcard.

## Data Model

Use these streams:

- `buildkite-builds`: one doc per Buildkite build
- `buildkite-jobs`: one doc per Buildkite job
- `buildkite-stories`: current enriched Buildkite job/story data; useful for spot/preemption behavior by zone

Build fields:

- `pipeline.slug.keyword`
- `created_at`
- `number`
- `state`
- `buildStatus.state.keyword`
- `buildStatus.hasRetries`
- `buildStatus.hasNonPreemptionRetries`
- `durationMins`
- `agentCost`
- `agentCostDiscounted`

Job fields:

- `pipeline.slug.keyword`
- `created_at`
- `build.id.keyword`
- `build.number`
- `step_key`
- `state`
- `retried`
- `retries_count`
- `isSpot`
- `isSpotFailure`
- `durationMins`
- `agent.meta_data.keyword`

Story fields:

- `@timestamp`
- `buildkite.build.created_at`
- `buildkite.pipeline.slug.keyword`
- `buildkite.job.state.keyword`
- `buildkite.job.retry_type.keyword`
- `buildkite.job.exit_status`
- `buildkite.job.retried`
- `buildkite.agent.meta_data.gcp:preemptible.keyword`
- `buildkite.agent.meta_data.gcp:zone.keyword`
- `buildkite.worker.instance.zone.keyword`

## Workflow

1. Start with the build stream to confirm build counts, build duration, total cost, and cost/build.
2. If duration or cost grew faster than build volume, switch to the jobs stream.
3. Check jobs/build, total job-minutes/build, retries, spot share, and machine/queue mix.
4. If total job-minutes/build is flat but cost/build rose, inspect `agent.meta_data.keyword`.
5. For spot/preemption-by-zone analysis, prefer the current story stream when the question mentions stories or needs preemption-like automatic retry behavior. Filter `buildkite.pipeline.slug.keyword` to the requested pipeline and `buildkite.agent.meta_data.gcp:preemptible.keyword: true`, group by `buildkite.agent.meta_data.gcp:zone.keyword`, and treat `buildkite.job.state.keyword: failed` + `buildkite.job.retry_type.keyword: automatic` + `buildkite.job.exit_status: -1` as the preemption-like signal.
6. Cross-check `buildkite-jobs` `isSpotFailure` as a broader spot-failure metric when useful; call out if it disagrees with the story signal.
7. Call out whether the increase is volume-driven, duration-driven, fanout-driven, retry-driven, preemption-driven, or machine-mix-driven.

## References

Open [`references/queries.md`](references/queries.md) for monthly cost, duration, and job-composition queries.
