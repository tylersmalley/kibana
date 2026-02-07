#!/usr/bin/env bash

set -euo pipefail

source .buildkite/scripts/common/util.sh

echo --- Check OXC Formatter Configuration Topology
retry 3 3 node scripts/prettier_topology_check
