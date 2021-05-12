#!/usr/bin/env bash

while getopts s: flag
do
    case "${flag}" in
        s) simulations=${OPTARG};;
    esac
done
echo "Simulation classes: $simulations";

cd "$KIBANA_DIR"
source src/dev/ci_setup/setup_env.sh

if [[ ! "$TASK_QUEUE_PROCESS_ID" ]]; then
  ./test/scripts/jenkins_xpack_build_plugins.sh
fi

# doesn't persist, also set in kibanaPipeline.groovy
export KBN_NP_PLUGINS_BUILT=true

echo " -> building and extracting default Kibana distributable for use in functional tests"
cd "$KIBANA_DIR"
node scripts/build --debug --no-oss
linuxBuild="$(find "$KIBANA_DIR/target" -name 'kibana-*-linux-x86_64.tar.gz')"
installDir="$KIBANA_DIR/install/kibana"
mkdir -p "$installDir"
tar -xzf "$linuxBuild" -C "$installDir" --strip=1

mkdir -p "$WORKSPACE/kibana-build"
cp -pR install/kibana/. $WORKSPACE/kibana-build/

echo " -> test setup"
source test/scripts/jenkins_test_setup_xpack.sh

echo " -> run gatling load testing"
export GATLING_SIMULATIONS="$simulations"
node scripts/functional_tests \
  --kibana-install-dir "$KIBANA_INSTALL_DIR" \
  --config test/load/config.ts
