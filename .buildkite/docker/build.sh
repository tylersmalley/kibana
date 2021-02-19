#!/bin/bash

set -euxo pipefail

# Enable use of buildkit for all builds. No extra support in the Dockerfile is required.
# See https://docs.docker.com/develop/develop-images/build_enhancements/ for details.
export DOCKER_BUILDKIT=1

# Containers used by Bazel CI
docker build -f Dockerfile --target base -t "tylersmalley/kibana-ci-base" .
