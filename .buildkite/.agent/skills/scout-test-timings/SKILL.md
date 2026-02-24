---
name: scout-test-timings
description: Investigate Scout reporter timing data in the appex-qa CCS remote. Use for Scout config runtimes, individual Scout test runtimes, run-end and test-end events, target arch/domain breakdowns, Buildkite branch/pipeline/build filters, and Scout timing variance.
---

# Scout Test Timings

Do not use this skill for Jest/FTR ci-stats timing data; use `ci-stats-test-timings`.
Do not use it for Buildkite job fanout, machine mix, or cost analysis; use `buildkite-stats`.

## Shared Access

Use the shared ops skill at [`../kibana-ops-elasticsearch/SKILL.md`](../kibana-ops-elasticsearch/SKILL.md).

- CCS remote alias: `appex-qa`
- Scout events: `appex-qa:scout-test-events-*`

## Data Model

Scout reporter defaults are defined in `src/platform/packages/private/kbn-scout-info/src/reporting.ts`.

Use event action to choose the timing level:

- `event.action == "run-end"`: config/run-level timing in `test_run.duration`
- `event.action == "test-end"`: individual test timing in `test.duration`
- `event.action == "test-step-end"`: Playwright step timing in `test.step.duration`

Common fields:

- `@timestamp`
- `event.action`
- `event.outcome`
- `reporter.type`
- `test_run.id`
- `test_run.target.type`
- `test_run.target.mode`
- `test_run.config.file.path`
- `test_run.config.category`
- `test_run.duration`
- `test_run.status`
- `test.id`
- `test.duration`
- `test.status`
- `test.title`
- `test.file.path`
- `buildkite.branch`
- `buildkite.commit`
- `buildkite.pipeline.slug`
- `buildkite.build.number`
- `buildkite.step.label`
- `buildkite.group.label`

## Workflow

1. Use `run-end` events for config-level analysis.
2. Use `test-end` events only when individual test detail is required.
3. Filter to successful runs or tests when measuring stable duration.
4. Include `test_run.target.type` and `test_run.target.mode` when comparing across Scout targets.
5. Prefer ES|QL for timing aggregates because the Scout stats code already uses ES|QL.

## References

Open [`references/queries.md`](references/queries.md) for Scout timing ES|QL examples.

## Code References

- Scout event constants: `src/platform/packages/private/kbn-scout-info/src/reporting.ts`
- Event shape: `src/platform/packages/private/kbn-scout-reporting/src/reporting/report/events/event.ts`
- Mappings: `src/platform/packages/private/kbn-scout-reporting/src/reporting/report/events/persistence/mappings.ts`
- Existing config stats query: `src/platform/packages/private/kbn-scout-reporting/src/reporting/stats/test_config.ts`
