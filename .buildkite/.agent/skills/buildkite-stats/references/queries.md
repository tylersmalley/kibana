# Buildkite Stats Queries

Use `buildkite-stats` as the CCS alias.
Source [`../../kibana-ops-elasticsearch/scripts/ops_es_common.sh`](../../kibana-ops-elasticsearch/scripts/ops_es_common.sh) before running shell examples.

## Monthly Build Cost And Duration

```json
POST buildkite-stats:buildkite-builds-*/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "term": { "pipeline.slug.keyword": "kibana-pull-request" } },
        {
          "range": {
            "created_at": {
              "gte": "now-12M/M",
              "lt": "now",
              "time_zone": "America/Los_Angeles"
            }
          }
        }
      ]
    }
  },
  "aggs": {
    "months": {
      "date_histogram": {
        "field": "created_at",
        "calendar_interval": "month",
        "time_zone": "America/Los_Angeles",
        "min_doc_count": 0
      },
      "aggs": {
        "sum_cost_discounted": { "sum": { "field": "agentCostDiscounted" } },
        "avg_cost_discounted": { "avg": { "field": "agentCostDiscounted" } },
        "avg_duration_mins": { "avg": { "field": "durationMins" } },
        "p95_duration_mins": { "percentiles": { "field": "durationMins", "percents": [95] } },
        "retry_builds": {
          "filter": { "term": { "buildStatus.hasRetries": true } }
        },
        "non_preempt_retry_builds": {
          "filter": { "term": { "buildStatus.hasNonPreemptionRetries": true } }
        }
      }
    }
  }
}
```

## Monthly Job Composition

```json
POST buildkite-stats:buildkite-jobs-*/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "term": { "pipeline.slug.keyword": "kibana-pull-request" } },
        {
          "range": {
            "created_at": {
              "gte": "now-12M/M",
              "lt": "now",
              "time_zone": "America/Los_Angeles"
            }
          }
        }
      ]
    }
  },
  "aggs": {
    "months": {
      "date_histogram": {
        "field": "created_at",
        "calendar_interval": "month",
        "time_zone": "America/Los_Angeles",
        "min_doc_count": 0
      },
      "aggs": {
        "unique_builds": { "cardinality": { "field": "build.id.keyword" } },
        "sum_job_mins": { "sum": { "field": "durationMins" } },
        "avg_job_mins": { "avg": { "field": "durationMins" } },
        "retried_jobs": { "filter": { "term": { "retried": true } } },
        "spot_jobs": { "filter": { "term": { "isSpot": true } } },
        "spot_fail_jobs": { "filter": { "term": { "isSpotFailure": true } } }
      }
    }
  }
}
```

## Agent Queue And Machine Mix

```json
POST buildkite-stats:buildkite-jobs-*/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "term": { "pipeline.slug.keyword": "kibana-pull-request" } },
        {
          "range": {
            "created_at": {
              "gte": "now-30d",
              "lt": "now"
            }
          }
        }
      ]
    }
  },
  "aggs": {
    "meta": {
      "terms": {
        "field": "agent.meta_data.keyword",
        "size": 40
      }
    }
  }
}
```

Look for values like:

- `queue=gobld`
- `provider=gcp`
- `gcp:preemptible=true`
- `gcp:machine-type=n2-standard-4`
- `gcp:machine-type=c4d-standard-16`

## Current Story Spot/Preemption By Zone

Use the exact current story data stream, not a wildcard:

```json
POST buildkite-stats:buildkite-stories/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "term": { "buildkite.pipeline.slug.keyword": "kibana-pull-request" } },
        { "term": { "buildkite.agent.meta_data.gcp:preemptible.keyword": "true" } },
        {
          "range": {
            "buildkite.build.created_at": {
              "gte": "now-30d",
              "lt": "now"
            }
          }
        }
      ]
    }
  },
  "aggs": {
    "zones": {
      "terms": {
        "field": "buildkite.agent.meta_data.gcp:zone.keyword",
        "size": 50
      },
      "aggs": {
        "preemption_like": {
          "filter": {
            "bool": {
              "filter": [
                { "term": { "buildkite.job.state.keyword": "failed" } },
                { "term": { "buildkite.job.retry_type.keyword": "automatic" } },
                { "term": { "buildkite.job.exit_status": -1 } }
              ]
            }
          }
        },
        "failed_auto": {
          "filter": {
            "bool": {
              "filter": [
                { "term": { "buildkite.job.state.keyword": "failed" } },
                { "term": { "buildkite.job.retry_type.keyword": "automatic" } }
              ]
            }
          }
        },
        "canceled": {
          "filter": { "term": { "buildkite.job.state.keyword": "canceled" } }
        }
      }
    }
  }
}
```

Replace `kibana-pull-request` with the requested pipeline before running the story query.
Interpret `preemption_like.doc_count / zones.doc_count` as the story-based preemption-like rate. Compare it with `buildkite-jobs-*` `isSpotFailure` when the user asks for a broader spot failure check.

## Field Discovery

```json
POST buildkite-stats:buildkite-builds-*/_field_caps?fields=agentCost,agentCostDiscounted,buildStatus.*,pipeline.slug.keyword,created_at,durationMins
```

```json
POST buildkite-stats:buildkite-jobs-*/_field_caps?fields=build.id*,build.number,step_key,retried,retries_count,isSpot,isSpotFailure,durationMins,agent.meta_data*,pipeline.slug.keyword,created_at
```

```json
POST buildkite-stats:buildkite-stories/_field_caps?fields=@timestamp,buildkite.build.created_at,buildkite.pipeline.slug.keyword,buildkite.job.state.keyword,buildkite.job.retry_type.keyword,buildkite.job.exit_status,buildkite.job.retried,buildkite.agent.meta_data.gcp%3Apreemptible.keyword,buildkite.agent.meta_data.gcp%3Azone.keyword,buildkite.worker.instance.zone.keyword
```
