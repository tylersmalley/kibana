/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

type CommitOutcome = 'passing' | 'failing' | 'incomplete';
type ResolvedState = 'success' | 'failure' | null;

interface CliOptions {
  readonly hours: number;
  readonly verbose: boolean;
}

interface CommitInfo {
  readonly sha: string;
  readonly committedAtMs: number;
  readonly ciState: string | null;
}

interface TimeTotals {
  readonly successMs: number;
  readonly failureMs: number;
  readonly unknownMs: number;
}

interface CutoffInfo {
  readonly analysisEndMs: number;
  readonly trailingIncompleteCount: number;
}

interface GraphQlHistoryNode {
  readonly oid: string;
  readonly committedDate: string;
}

interface GraphQlHistoryResponse {
  readonly data?: {
    readonly repository?: {
      readonly ref?: {
        readonly target?: {
          readonly history?: {
            readonly nodes: readonly GraphQlHistoryNode[];
            readonly pageInfo: {
              readonly hasNextPage: boolean;
              readonly endCursor: string | null;
            };
          };
        };
      };
    };
  };
  readonly errors?: readonly { readonly message: string }[];
}

interface CommitStatusContextResponse {
  readonly context: string;
  readonly state: string;
}

const printUsageAndExit = (code: number) => {
  const usage = [
    'Usage: ts-node .buildkite/scripts/main_health.ts [options]',
    '',
    'Hardcoded target: elastic/kibana:main using status context "buildkite/on-merge".',
    'Rules:',
    '1) Walk oldest -> newest in the window.',
    '2) Use completed context states only (success/failure/error).',
    '3) Incomplete commits in-between are ignored and previous state is carried forward.',
    '4) If newest commits are incomplete, stop at the commit before that incomplete tail.',
    '',
    'Options:',
    '  --hours <number>  Lookback window in hours (default: 24)',
    '  --verbose         Print request/progress details',
    '  --help            Show this help message',
  ];

  const log = code === 0 ? console.log : console.error;
  usage.forEach((line) => log(line));
  process.exit(code);
};

const parseNumber = (value: string, optionName: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${optionName} value "${value}". Expected a positive number.`);
  }

  return parsed;
};

const parseCliOptions = (argv: string[]): CliOptions => {
  let hours = 24;
  let verbose = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      printUsageAndExit(0);
    } else if (arg === '--verbose') {
      verbose = true;
    } else if (arg === '--hours') {
      const value = argv[i + 1];
      if (!value) {
        throw new Error('Missing value for --hours.');
      }
      hours = parseNumber(value, '--hours');
      i += 1;
    } else if (arg.startsWith('--hours=')) {
      hours = parseNumber(arg.slice('--hours='.length), '--hours');
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return { hours, verbose };
};

const formatDuration = (durationMs: number): string => {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
};

const runGraphQl = async (
  query: string,
  variables: Record<string, string | number | null>,
  verbose: boolean
): Promise<GraphQlHistoryResponse> => {
  const args = ['api', 'graphql', '-f', `query=${query}`];

  Object.entries(variables).forEach(([key, value]) => {
    if (value !== null) {
      args.push('-F', `${key}=${value}`);
    }
  });

  if (verbose) {
    console.log(`gh ${args.join(' ')}`);
  }

  const { stdout } = await execFileAsync('gh', args, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

  return JSON.parse(stdout) as GraphQlHistoryResponse;
};

const runRestGet = async <T>(
  endpoint: string,
  queryParams: Record<string, number | string | undefined>,
  verbose: boolean
): Promise<T> => {
  const args = ['api', '-X', 'GET', endpoint];

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined) {
      args.push('-f', `${key}=${value}`);
    }
  });

  if (verbose) {
    console.log(`gh ${args.join(' ')}`);
  }

  const { stdout } = await execFileAsync('gh', args, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

  return JSON.parse(stdout) as T;
};

const mapWithConcurrency = async <T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  };

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
};

const getHistoryQuery = () => `
query(
  $owner: String!,
  $name: String!,
  $qualifiedName: String!,
  $first: Int!,
  $after: String,
  $since: GitTimestamp,
  $until: GitTimestamp
) {
  repository(owner: $owner, name: $name) {
    ref(qualifiedName: $qualifiedName) {
      target {
        ... on Commit {
          history(first: $first, after: $after, since: $since, until: $until) {
            nodes {
              oid
              committedDate
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    }
  }
}
`;

const extractHistory = (
  response: GraphQlHistoryResponse
): {
  readonly nodes: readonly GraphQlHistoryNode[];
  readonly hasNextPage: boolean;
  readonly endCursor: string | null;
} => {
  if (response.errors && response.errors.length > 0) {
    throw new Error(response.errors.map((error) => error.message).join('; '));
  }

  const history = response.data?.repository?.ref?.target?.history;
  if (!history) {
    return { nodes: [], hasNextPage: false, endCursor: null };
  }

  return {
    nodes: history.nodes,
    hasNextPage: history.pageInfo.hasNextPage,
    endCursor: history.pageInfo.endCursor,
  };
};

const parseCommitNode = (node: GraphQlHistoryNode): CommitInfo => {
  const committedAtMs = Date.parse(node.committedDate);
  if (!Number.isFinite(committedAtMs)) {
    throw new Error(`Commit ${node.oid} has invalid committedDate "${node.committedDate}".`);
  }

  return {
    sha: node.oid,
    committedAtMs,
    ciState: null,
  };
};

const fetchCommitsSince = async (sinceIso: string, verbose: boolean): Promise<CommitInfo[]> => {
  const query = getHistoryQuery();
  const qualifiedName = 'refs/heads/main';
  const commits: CommitInfo[] = [];
  let after: string | null = null;

  while (true) {
    const response = await runGraphQl(
      query,
      {
        owner: 'elastic',
        name: 'kibana',
        qualifiedName,
        first: 100,
        after,
        since: sinceIso,
        until: null,
      },
      verbose
    );

    const history = extractHistory(response);
    commits.push(...history.nodes.map(parseCommitNode));

    if (!history.hasNextPage || !history.endCursor) {
      break;
    }

    after = history.endCursor;
  }

  return commits;
};

const fetchLatestCommitBefore = async (
  untilIso: string,
  verbose: boolean
): Promise<CommitInfo | undefined> => {
  const query = getHistoryQuery();
  const qualifiedName = 'refs/heads/main';

  const response = await runGraphQl(
    query,
    {
      owner: 'elastic',
      name: 'kibana',
      qualifiedName,
      first: 1,
      after: null,
      since: null,
      until: untilIso,
    },
    verbose
  );

  const history = extractHistory(response);
  return history.nodes.length > 0 ? parseCommitNode(history.nodes[0]) : undefined;
};

const fetchLatestStatusForContext = async (
  sha: string,
  verbose: boolean
): Promise<string | null> => {
  const endpoint = `repos/elastic/kibana/commits/${sha}/statuses`;
  let page = 1;

  while (true) {
    const statuses = await runRestGet<CommitStatusContextResponse[]>(
      endpoint,
      { per_page: 100, page },
      verbose
    );

    const match = statuses.find((status) => status.context === 'buildkite/on-merge');
    if (match) {
      return match.state;
    }

    if (statuses.length < 100) {
      break;
    }

    page += 1;
  }

  return null;
};

const applyStatusContextToCommits = async (
  commits: readonly CommitInfo[],
  verbose: boolean
): Promise<Map<string, string | null>> => {
  const uniqueCommits = Array.from(new Map(commits.map((commit) => [commit.sha, commit])).values());
  const entries = await mapWithConcurrency(
    uniqueCommits,
    12,
    async (commit, index): Promise<readonly [string, string | null]> => {
      if (verbose) {
        console.log(
          `Fetching buildkite/on-merge for ${commit.sha} (${index + 1}/${uniqueCommits.length})`
        );
      }

      const state = await fetchLatestStatusForContext(commit.sha, verbose);
      return [commit.sha, state] as const;
    }
  );

  return new Map(entries);
};

const getCommitOutcome = (ciState: string | null): CommitOutcome => {
  const normalized = ciState?.toUpperCase() ?? null;

  switch (normalized) {
    case 'SUCCESS':
    case 'SUCCESSFUL':
      return 'passing';
    case 'FAILURE':
    case 'FAILED':
    case 'ERROR':
    case 'FAIL':
      return 'failing';
    default:
      return 'incomplete';
  }
};

const isCompletedOutcome = (outcome: CommitOutcome): boolean =>
  outcome === 'passing' || outcome === 'failing';

const getTrailingCutoff = (
  commitsInWindowAsc: readonly CommitInfo[],
  nowMs: number
): CutoffInfo => {
  if (commitsInWindowAsc.length === 0) {
    return { analysisEndMs: nowMs, trailingIncompleteCount: 0 };
  }

  let lastCompletedIndex = commitsInWindowAsc.length - 1;
  while (lastCompletedIndex >= 0) {
    if (isCompletedOutcome(getCommitOutcome(commitsInWindowAsc[lastCompletedIndex].ciState))) {
      break;
    }
    lastCompletedIndex -= 1;
  }

  if (lastCompletedIndex === commitsInWindowAsc.length - 1) {
    return { analysisEndMs: nowMs, trailingIncompleteCount: 0 };
  }

  const trailingStartIndex = lastCompletedIndex + 1;
  return {
    analysisEndMs: commitsInWindowAsc[trailingStartIndex].committedAtMs,
    trailingIncompleteCount: commitsInWindowAsc.length - trailingStartIndex,
  };
};

const addDuration = (
  totals: { successMs: number; failureMs: number; unknownMs: number },
  state: ResolvedState,
  durationMs: number
) => {
  if (durationMs <= 0) {
    return;
  }

  if (state === 'success') {
    totals.successMs += durationMs;
  } else if (state === 'failure') {
    totals.failureMs += durationMs;
  } else {
    totals.unknownMs += durationMs;
  }
};

const getStateAfterCommit = (currentState: ResolvedState, commit: CommitInfo): ResolvedState => {
  const outcome = getCommitOutcome(commit.ciState);

  if (outcome === 'passing') {
    return 'success';
  }
  if (outcome === 'failing') {
    return 'failure';
  }

  return currentState;
};

const calculateTimeTotals = (
  commitsAsc: readonly CommitInfo[],
  windowStartMs: number,
  analysisEndMs: number
): TimeTotals => {
  if (analysisEndMs <= windowStartMs) {
    return { successMs: 0, failureMs: 0, unknownMs: 0 };
  }

  let currentState: ResolvedState = null;
  for (const commit of commitsAsc) {
    if (commit.committedAtMs > windowStartMs) {
      break;
    }
    currentState = getStateAfterCommit(currentState, commit);
  }

  const mutableTotals = { successMs: 0, failureMs: 0, unknownMs: 0 };
  let cursorMs = windowStartMs;

  for (const commit of commitsAsc) {
    if (commit.committedAtMs <= windowStartMs) {
      continue;
    }
    if (commit.committedAtMs >= analysisEndMs) {
      break;
    }

    addDuration(mutableTotals, currentState, commit.committedAtMs - cursorMs);
    currentState = getStateAfterCommit(currentState, commit);
    cursorMs = commit.committedAtMs;
  }

  addDuration(mutableTotals, currentState, analysisEndMs - cursorMs);
  return mutableTotals;
};

const run = async () => {
  const options = parseCliOptions(process.argv.slice(2));
  const nowMs = Date.now();
  const windowDurationMs = options.hours * 60 * 60 * 1000;
  const windowStartMs = nowMs - windowDurationMs;
  const windowStartIso = new Date(windowStartMs).toISOString();

  if (options.verbose) {
    console.log(`Analyzing elastic/kibana:main for ${options.hours} hours`);
  }

  const commitsInWindow = await fetchCommitsSince(windowStartIso, options.verbose);
  const latestBeforeWindow = await fetchLatestCommitBefore(windowStartIso, options.verbose);

  const statusLookupInput = [...commitsInWindow];
  if (latestBeforeWindow) {
    statusLookupInput.push(latestBeforeWindow);
  }

  const statusStateBySha = await applyStatusContextToCommits(statusLookupInput, options.verbose);
  const withState = (commit: CommitInfo): CommitInfo => ({
    ...commit,
    ciState: statusStateBySha.get(commit.sha) ?? null,
  });

  const commitsInWindowUnique = Array.from(
    new Map(commitsInWindow.map((commit) => [commit.sha, withState(commit)])).values()
  ).sort((left, right) => left.committedAtMs - right.committedAtMs);

  const cutoff = getTrailingCutoff(commitsInWindowUnique, nowMs);
  const analysisEndMs = cutoff.analysisEndMs;

  const commitsForTimeline = [...commitsInWindowUnique];
  if (latestBeforeWindow) {
    commitsForTimeline.push(withState(latestBeforeWindow));
  }

  const commitsTimelineUniqueAsc = Array.from(
    new Map(commitsForTimeline.map((commit) => [commit.sha, commit])).values()
  ).sort((left, right) => left.committedAtMs - right.committedAtMs);

  const totals = calculateTimeTotals(commitsTimelineUniqueAsc, windowStartMs, analysisEndMs);
  const analyzedMs = totals.successMs + totals.failureMs;
  const successPct = analyzedMs > 0 ? (totals.successMs / analyzedMs) * 100 : 0;
  const failurePct = analyzedMs > 0 ? (totals.failureMs / analyzedMs) * 100 : 0;

  const consideredCommits = commitsInWindowUnique.filter(
    (commit) => commit.committedAtMs < analysisEndMs
  );
  const completedConsideredCommits = consideredCommits.filter((commit) =>
    isCompletedOutcome(getCommitOutcome(commit.ciState))
  );
  const passingCommitCount = completedConsideredCommits.filter(
    (commit) => getCommitOutcome(commit.ciState) === 'passing'
  ).length;
  const failingCommitCount = completedConsideredCommits.length - passingCommitCount;

  const ignoredInBetweenIncompleteCommits =
    consideredCommits.length - completedConsideredCommits.length;
  const trailingExcludedDurationMs = Math.max(0, nowMs - analysisEndMs);

  console.log(
    `main health in the last ${options.hours}h: ${successPct.toFixed(
      2
    )}% success (buildkite/on-merge, completed timeline only)`
  );
  console.log(`success time: ${formatDuration(totals.successMs)}`);
  console.log(`failure time: ${formatDuration(totals.failureMs)} (${failurePct.toFixed(2)}%)`);
  console.log(`unknown time (no completed baseline yet): ${formatDuration(totals.unknownMs)}`);
  console.log(
    `commits passing/completed: ${passingCommitCount}/${
      completedConsideredCommits.length
    } (${(completedConsideredCommits.length > 0
      ? (passingCommitCount / completedConsideredCommits.length) * 100
      : 0
    ).toFixed(2)}%)`
  );
  console.log(
    `commits failing/completed: ${failingCommitCount}/${
      completedConsideredCommits.length
    } (${(completedConsideredCommits.length > 0
      ? (failingCommitCount / completedConsideredCommits.length) * 100
      : 0
    ).toFixed(2)}%)`
  );
  console.log(
    `ignored in-between incomplete commits: ${ignoredInBetweenIncompleteCommits}/${consideredCommits.length}`
  );
  console.log(
    `trailing incomplete commits excluded: ${cutoff.trailingIncompleteCount}/${
      commitsInWindowUnique.length
    } (${formatDuration(trailingExcludedDurationMs)})`
  );
  console.log(
    `window: ${new Date(windowStartMs).toISOString()} -> ${new Date(
      nowMs
    ).toISOString()} | analyzed until: ${new Date(analysisEndMs).toISOString()}`
  );
};

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to calculate main health: ${message}`);
  process.exit(1);
});
