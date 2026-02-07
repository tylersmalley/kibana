#!/usr/bin/env bash

set -euo pipefail

source .buildkite/scripts/common/util.sh

.buildkite/scripts/bootstrap.sh

echo '--- Lint: stylelint'
node scripts/stylelint
echo "stylelint ✅"

echo '--- Lint: js/ts'
# disable "Exit immediately" mode so that we can run lint, capture its exit code, and respond appropriately
# after possibly commiting fixed files to the repo
set +e;
if is_pr && ! is_auto_commit_disabled; then
  desc="node scripts/lint_all_files --no-cache --fix"
  node scripts/lint_all_files --no-cache --fix
else
  desc="node scripts/lint_all_files --no-cache"
  node scripts/lint_all_files --no-cache
fi

lint_exit=$?
# re-enable "Exit immediately" mode
set -e;

check_for_changed_files "$desc" true

if [[ "${lint_exit}" != "0" ]]; then
  exit 1
fi

echo "lint ✅"
