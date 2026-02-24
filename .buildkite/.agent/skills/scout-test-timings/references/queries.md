# Scout Timing Queries

Use `appex-qa:scout-test-events-*` as the CCS source.
The examples use ES|QL through the ops Elasticsearch `_query` endpoint.

## Config Runtime By Path And Target

```json
POST /_query
{
  "query": "FROM appex-qa:scout-test-events-* | WHERE @timestamp >= NOW() - 7 day AND event.action == \"run-end\" AND buildkite.pipeline.slug == \"kibana-pull-request\" | STATS run_count = COUNT(*), avg_ms = AVG(test_run.duration), median_ms = MEDIAN(test_run.duration), p95_ms = PERCENTILE(test_run.duration, 95), p99_ms = PERCENTILE(test_run.duration, 99), max_ms = MAX(test_run.duration) BY test_run.config.file.path, test_run.target.type, test_run.target.mode | SORT p95_ms DESC | LIMIT 50"
}
```

## Config Runtime For One Buildkite Build

```json
POST /_query
{
  "query": "FROM appex-qa:scout-test-events-* | WHERE event.action == \"run-end\" AND buildkite.pipeline.slug == \"kibana-pull-request\" AND buildkite.build.number == 390868 | KEEP @timestamp, buildkite.build.number, buildkite.step.label, test_run.config.file.path, test_run.target.type, test_run.target.mode, test_run.status, test_run.duration | SORT test_run.duration DESC | LIMIT 100"
}
```

## Slow Individual Tests

```json
POST /_query
{
  "query": "FROM appex-qa:scout-test-events-* | WHERE @timestamp >= NOW() - 7 day AND event.action == \"test-end\" AND test.status == \"passed\" AND buildkite.pipeline.slug == \"kibana-pull-request\" | STATS run_count = COUNT(*), avg_ms = AVG(test.duration), p95_ms = PERCENTILE(test.duration, 95), max_ms = MAX(test.duration) BY test.id, test.file.path, test_run.config.file.path, test_run.target.type, test_run.target.mode | SORT p95_ms DESC | LIMIT 50"
}
```

## Target Breakdown

```json
POST /_query
{
  "query": "FROM appex-qa:scout-test-events-* | WHERE @timestamp >= NOW() - 14 day AND event.action == \"run-end\" AND buildkite.pipeline.slug == \"kibana-pull-request\" | STATS runs = COUNT(*), avg_ms = AVG(test_run.duration), p95_ms = PERCENTILE(test_run.duration, 95) BY test_run.target.type, test_run.target.mode | SORT p95_ms DESC"
}
```

## Field Discovery

Use `_field_caps` if a query fails because a field has changed:

```json
POST appex-qa:scout-test-events-*/_field_caps?fields=event.*,reporter.*,test_run.*,test.*,buildkite.*
```
