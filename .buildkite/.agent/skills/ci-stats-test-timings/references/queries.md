# CI Stats Queries

Prefer `scripts/ci_stats_es_search.sh`, which queries ci-stats through the ops Elasticsearch cluster using the shared ops credentials.

Pass full CCS index patterns to the helper:

- `kibana-ci-stats-service-internal:kibana-ci-stats-builds*`
- `kibana-ci-stats-service-internal:kibana-ci-stats-test-groups*`
- `kibana-ci-stats-service-internal:kibana-ci-stats-test-runs*`
- `kibana-ci-stats-service-internal:kibana-ci-stats-timings*`

If a CCS response has `_shards.total: 0`, verify the remote alias and credentials before drawing conclusions from empty results.

## Map Buildkite Build Number To ci-stats buildId

Set `jobName` to the Buildkite pipeline slug or ci-stats job name for the build number.

```bash
.buildkite/.agent/skills/ci-stats-test-timings/scripts/ci_stats_es_search.sh \
  'kibana-ci-stats-service-internal:kibana-ci-stats-builds*' <<'JSON'
{
  "size": 1,
  "sort": [{ "@timestamp": "desc" }],
  "query": {
    "bool": {
      "filter": [
        { "term": { "jobRunner": "buildkite" } },
        { "term": { "jobName": "<pipeline_slug_or_job_name>" } },
        { "term": { "jobId": "390868" } }
      ]
    }
  },
  "_source": ["jobName","jobId","jobUrl","prId","branch","commit","startedAt","completedAt","result"]
}
JSON
```

The returned document `_id` is the `buildId`.

## Rank Top FTR Failures

Use an aggregation on failed `test-runs`. Do not scrape Buildkite artifacts for this question unless ES is unavailable.
Use `@timestamp` for "reported/indexed in the past week"; use `startTime` only when the question specifically means test execution start time.

```bash
.buildkite/.agent/skills/ci-stats-test-timings/scripts/ci_stats_es_search.sh \
  'kibana-ci-stats-service-internal:kibana-ci-stats-test-runs*' <<'JSON'
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "range": { "@timestamp": { "gte": "now-7d" } } },
        { "term": { "groupType": "Functional Tests" } },
        { "term": { "result": "fail" } }
      ]
    }
  },
  "aggs": {
    "top_failures": {
      "multi_terms": {
        "size": 10,
        "terms": [
          { "field": "file" },
          { "field": "fullName" },
          { "field": "type" }
        ]
      },
      "aggs": {
        "builds": { "cardinality": { "field": "buildId" } },
        "latest": {
          "top_hits": {
            "size": 1,
            "sort": [{ "@timestamp": "desc" }],
            "_source": [
              "@timestamp",
              "buildId",
              "groupId",
              "file",
              "fullName",
              "type",
              "error"
            ]
          }
        }
      }
    }
  }
}
JSON
```

If `multi_terms` is unavailable, aggregate first by `fullName` and include `file`/`type` in `top_hits`.

## List Config Durations For A Build

```bash
.buildkite/.agent/skills/ci-stats-test-timings/scripts/ci_stats_es_search.sh \
  'kibana-ci-stats-service-internal:kibana-ci-stats-test-groups*' <<'JSON'
{
  "size": 200,
  "sort": [{ "durationMs": "desc" }],
  "query": {
    "bool": {
      "filter": [
        { "term": { "buildId": "<buildId>" } },
        { "term": { "type": "Jest Integration Tests" } }
      ]
    }
  },
  "_source": [
    "@timestamp",
    "buildId",
    "jobName",
    "branch",
    "prId",
    "commit",
    "name",
    "result",
    "durationMs"
  ]
}
JSON
```

Change `type` to `Jest Unit Tests` or `Functional Tests` as needed.

## Rank Volatile Or Slow Configs

Filter `result=pass` to isolate timing variance from failures.

```bash
.buildkite/.agent/skills/ci-stats-test-timings/scripts/ci_stats_es_search.sh \
  'kibana-ci-stats-service-internal:kibana-ci-stats-test-groups*' <<'JSON'
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "range": { "@timestamp": { "gte": "now-7d" } } },
        { "term": { "type": "Jest Integration Tests" } },
        { "term": { "jobName": "kibana-pull-request" } },
        { "term": { "result": "pass" } }
      ]
    }
  },
  "aggs": {
    "by_config": {
      "terms": { "field": "name", "size": 250 },
      "aggs": {
        "p": {
          "percentiles": {
            "field": "durationMs",
            "percents": [50, 90, 95, 99]
          }
        },
        "max_ms": { "max": { "field": "durationMs" } },
        "p95_over_p50": {
          "bucket_script": {
            "buckets_path": {
              "p50": "p[50.0]",
              "p95": "p[95.0]"
            },
            "script": "params.p50 != null && params.p50 > 0 ? params.p95 / params.p50 : 0"
          }
        },
        "min_samples": {
          "bucket_selector": {
            "buckets_path": { "c": "_count" },
            "script": "params.c >= 10"
          }
        },
        "sort": {
          "bucket_sort": {
            "sort": [
              { "p95_over_p50": { "order": "desc" } },
              { "p[95.0]": { "order": "desc" } },
              { "max_ms": { "order": "desc" } }
            ],
            "size": 25
          }
        }
      }
    }
  }
}
JSON
```

## Drill Into Slowest Tests In One Config Run

Step A, find the group doc:

```bash
.buildkite/.agent/skills/ci-stats-test-timings/scripts/ci_stats_es_search.sh \
  'kibana-ci-stats-service-internal:kibana-ci-stats-test-groups*' <<'JSON'
{
  "size": 1,
  "sort": [{ "durationMs": "desc" }],
  "query": {
    "bool": {
      "filter": [
        { "term": { "buildId": "<buildId>" } },
        { "term": { "type": "Jest Integration Tests" } },
        { "term": { "name": "<config path>" } }
      ]
    }
  },
  "_source": ["@timestamp", "buildId", "name", "result", "durationMs"]
}
JSON
```

Use the returned `_id` as `groupId`.

Step B, fetch slowest tests:

```bash
.buildkite/.agent/skills/ci-stats-test-timings/scripts/ci_stats_es_search.sh \
  'kibana-ci-stats-service-internal:kibana-ci-stats-test-runs*' <<'JSON'
{
  "size": 20,
  "sort": [{ "durationMs": "desc" }],
  "query": {
    "bool": {
      "filter": [
        { "term": { "buildId": "<buildId>" } },
        { "term": { "groupId": "<groupId>" } },
        { "term": { "groupType": "Jest Integration Tests" } },
        { "term": { "type": "test" } }
      ]
    }
  },
  "_source": ["file", "fullName", "durationMs", "result", "seq"]
}
JSON
```

If the group is slow but no test dominates, call out suite overhead.

## High-Level Runner Timings

```bash
.buildkite/.agent/skills/ci-stats-test-timings/scripts/ci_stats_es_search.sh \
  'kibana-ci-stats-service-internal:kibana-ci-stats-timings*' <<'JSON'
{
  "size": 20,
  "sort": [{ "@timestamp": "desc" }],
  "query": {
    "bool": {
      "filter": [
        { "range": { "@timestamp": { "gte": "now-7d" } } },
        { "terms": { "group": ["scripts/jest", "scripts/jest_all"] } },
        { "term": { "id": "total" } }
      ]
    }
  },
  "_source": ["@timestamp", "buildId", "group", "id", "ms", "meta", "upstreamBranch"]
}
JSON
```

## FTR

Use the same `test-groups` and `test-runs` queries, but replace:

- `type` with `Functional Tests`
- `groupType` with `Functional Tests`
