workspace(
    name = "kibana",
    managed_directories = { "@npm": ["node_modules"] }
)

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "build_bazel_rules_nodejs",
    sha256 = "ad4be2c6f40f5af70c7edf294955f9d9a0222c8e2756109731b25f79ea2ccea0",
    urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/0.38.3/rules_nodejs-0.38.3.tar.gz"],
)

load("@build_bazel_rules_nodejs//:defs.bzl", "node_repositories", "yarn_install")

node_repositories(
  node_version = "10.15.2",
  yarn_version = "1.19.1",
  node_repositories = {
    "10.15.2-darwin_amd64": (
        "node-v10.15.2-darwin-x64.tar.gz",
        "node-v10.15.2-darwin-x64",
        "8bbb6c15a0572f493d33ef044d06ccd0ff7ead8daa67f9a32df3e863277568e8"
    ),
    "10.15.2-linux_amd64": (
        "node-v10.15.2-linux-x64.tar.xz", 
        "node-v10.15.2-linux-x64", 
        "c10eece562cfeef1627f0d2bde7dc0be810948f6bf9a932e30a8c3b425652015"
    ),
    "10.15.2-windows_amd64": (
        "node-v10.15.2-win-x64.zip", 
        "node-v10.15.2-win-x64", 
        "d97cf4788ccea6deef037ce27c91cc1a814644b878311b71811ab04d0bb8c47f"
    ),
  },
  yarn_repositories = {
    "1.19.1": (
        "yarn-v1.19.1.tar.gz", 
        "yarn-v1.19.1",
        "34293da6266f2aae9690d59c2d764056053ff7eebc56b80b8df05010c3da9343"
    ),
  },
  node_urls = ["https://nodejs.org/dist/v{version}/{filename}"],
  yarn_urls = ["https://github.com/yarnpkg/yarn/releases/download/v{version}/{filename}"],
  package_json = ["//:package.json"]
)

yarn_install(
    name = "npm",
    package_json = "//:package.json",
    yarn_lock = "//:yarn.lock"
)

load("@npm//:install_bazel_dependencies.bzl", "install_bazel_dependencies")
install_bazel_dependencies()

load("@npm_bazel_typescript//:index.bzl", "ts_setup_workspace")
ts_setup_workspace()

