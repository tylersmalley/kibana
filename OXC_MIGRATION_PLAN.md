# OXC Migration Plan

Last updated: 2026-02-07

## Goal

Replace ESLint + Prettier with OXC using OXC conventions and best practices, not a 1:1 rule-for-rule port.

## Success Criteria

- [ ] `eslint` and `prettier` are removed from root `package.json` dependencies.
- [ ] `eslint-*` and `prettier` related scripts are removed or replaced with OXC equivalents.
- [ ] All CI lint/format jobs run on OXC (`oxlint`, `oxfmt`) and pass.
- [x] Pre-commit checks no longer run ESLint/Prettier.
- [ ] Root `.eslintrc.js`, `.eslintignore`, `.prettierrc`, and `.prettierignore` are removed or fully replaced by OXC config/ignores.
- [x] All Kibana custom lint rules have an explicit migration disposition and implemented outcome.

## Current Baseline (Repo Inventory)

- [x] Root lint config: `.eslintrc.js` with 97 overrides, extending `@kbn/eslint-config`.
- [x] ESLint config files in repo (excluding `node_modules`): 40.
- [x] Root formatter config: `.prettierrc` + `.prettierignore`.
- [x] Kibana custom ESLint plugin packages: 5.
- [x] Kibana custom ESLint rules to track: 40 total.
- [x] Typed lint flow exists via `scripts/lint_with_types` (currently ESLint-backed for type-aware `@typescript-eslint` rules).

## OXC Guidance To Follow

- [x] Start from migration tools, then simplify manually:
  - `npx -y @oxlint/migrate@latest .eslintrc.js --output-file .oxlintrc.json --type-aware --js-plugins --details`
  - `npx -y oxfmt@latest --migrate=prettier`
- [x] Expect partial output from migrators and then curate manually.
- [x] Prefer native OXC rules/plugins first for performance and maintainability.
- [x] Use JS plugin compatibility only where native OXC coverage is missing.
- [x] Account for limits called out by OXC docs:
  - `@oxlint/migrate` currently targets ESLint flat config best, so legacy `.eslintrc.js` migration can be sparse.
  - Custom ESLint plugins are not automatically migrated.
  - LSP currently does not support JS plugins.
  - Type-aware checks are handled through the `oxlint-tsgolint` plugin path (needs explicit validation for Kibana use cases).
  - Formatter behavior differs from Prettier in specific edge cases.
- [x] Validate rule availability against OXC source (`/Users/tyler/code/oxc/crates/oxc_linter/src/rules`) and reconcile with pinned `oxlint` version before each migration wave.

## Iterative Rollout Checklist

### Phase 0 - Alignment + Guardrails

- [ ] Agree migration policy: prefer OXC-native behavior when not 1:1 with ESLint/Prettier.
- [ ] Define acceptance thresholds (allowed lint delta, formatter churn budget, CI tolerance).
- [ ] Assign owners for:
  - platform lint pipeline
  - formatter rollout
  - custom rule migration
  - repo-wide cleanup/removal

### Phase 1 - Bootstrap OXC In Parallel

- [x] Generate initial OXC baseline configs (`.oxlintrc.json`, `.oxfmtrc.json`) from current ESLint/Prettier setup and manual curation.
- [x] Add temporary scripts:
  - `lint:oxc` (non-fix)
  - `lint:oxc:fix`
  - `format:oxc:check`
  - `format:oxc:write`
- [x] Keep ESLint/Prettier active during this phase.
- [x] Run OXC in CI as non-blocking and collect rule/format diffs.
- [ ] Build "unsupported/changed behavior" backlog from CI output.

### Phase 2 - Formatter Migration (Prettier -> `oxfmt`)

- [x] Generate `.oxfmtrc.json` from `.prettierrc` via `oxfmt --migrate=prettier`.
- [ ] Validate ignore behavior (`.oxfmtignore`, `.prettierignore`, `.gitignore`) and consolidate to final OXC approach.
- [ ] Run repo-wide `oxfmt --check` and capture differences from current Prettier output.
- [ ] Resolve non-equivalent formatting areas and document accepted behavior changes.
- [ ] Switch formatter CI gate to `oxfmt --check`.
- [ ] Remove Prettier wiring from scripts/tooling once stable.

### Phase 3 - ESLint Plugin/Rule Family Triage

- [ ] Build explicit mapping for each non-core ESLint rule family:
  - `@typescript-eslint`
  - `react`, `react-hooks`, `react-perf`
  - `import`, `jsx-a11y`, `jest`, `node`
  - `playwright`, `testing-library`, `formatjs`, `mocha`, `depend`, others
- [ ] For each family choose one path:
  - native OXC equivalent
  - OXC JS plugin compatibility
  - drop/replace with different check (type-check, tests, codemod, etc.)
- [ ] Benchmark JS plugin impact before enabling in CI:
  - baseline `oxlint` vs scoped JS plugin vs global JS plugin
  - only keep JS rules where signal justifies measured latency cost
- [ ] Resolve typed lint strategy:
  - evaluate `oxlint-tsgolint` for current `lint_with_types` coverage
  - or replace with explicit `test:type_check`/other checks where appropriate

### Phase 4 - Kibana Custom Rule Migration (40 Rules)

- [x] Complete disposition for every custom rule (native replacement, JS plugin, OXC custom rule, or retire).
- [ ] Keep rule-level test coverage for migrated custom behavior.
- [ ] Roll out migrated rules by package to reduce blast radius.
- [ ] Remove package-by-package ESLint rule wiring as each package is completed.

### Phase 5 - Cutover

- [ ] Make OXC lint/format checks blocking in CI.
- [x] Switch pre-commit hooks from ESLint to OXC.
- [x] Replace `scripts/eslint*`/`scripts/oxlint*` entrypoints with tool-agnostic `scripts/lint*` entrypoints.
- [ ] Remove temporary dual-run logic in CI and local scripts.

### Phase 6 - Remove ESLint + Prettier

- [ ] Remove all ESLint and Prettier dependencies from `package.json`.
- [ ] Remove obsolete config files and migration-only compatibility shims.
- [ ] Remove deprecated docs and replace with OXC usage docs.
- [ ] Run final repo validation (lint, format, type-check, tests).

## Custom Rule Tracker (40 Rules)

Source of truth:

- [x] Detailed disposition and wave plan captured in `OXC_CUSTOM_RULE_MIGRATION_MATRIX.md`.

Tracker fields for execution:

- `status`: `pending` | `in_progress` | `done` | `retired`
- `owner`: GitHub handle or team

Execution checklist:

- [ ] Assign owner + status for each rule in `OXC_CUSTOM_RULE_MIGRATION_MATRIX.md`.
- [x] Implement all `native` rules first (highest leverage, lowest risk).
- [x] Implement `native_with_changes` rules with explicit behavior-delta notes.
- [x] Replace `script_or_codemod` rules with dedicated checks/migrations.
- [x] Keep `js_plugin_required` rules scoped to minimal globs; port hot-path rules to OXC Rust if needed.

### Per-Plugin Disposition

Performance note for all custom plugins:

- JS plugin cost is paid when JS rules run on matched files; it is not purely all-or-nothing from merely declaring `jsPlugins`.
- Kibana benchmark (`oxlint@1.43.0`, 3 runs each): baseline `3.27s`; global single JS rule `4.12s` (`+26%`); global 10 JS rules `4.54s` (`+39%`); narrow-scoped rule stayed near baseline (`3.34s`, `+2%`).
- Real-rule benchmark (`2026-02-07`, `src` tree, 20,906 files): no-JS config `1.95s` vs migrated custom JS-rule config `90.55s` (`~46.4x`).
- Prefer OXC-native rules first, then script/codemod, then JS plugin as last resort; scope unavoidable JS rules to narrow globs and use OXC's alternative JS plugin API (`createOnce`) when possible.

| Custom plugin | Total rules | `native` | `native_with_changes` | `script_or_codemod` | `js_plugin_required` |
| --- | ---: | ---: | ---: | ---: | ---: |
| `@kbn/eslint-plugin-disable` | 2 | 1 | 0 | 0 | 1 |
| `@kbn/eslint-plugin-eslint` | 24 | 1 | 7 | 5 | 11 |
| `@kbn/eslint-plugin-i18n` | 4 | 0 | 0 | 0 | 4 |
| `@kbn/eslint-plugin-imports` | 9 | 1 | 2 | 6 | 0 |
| `@kbn/eslint-plugin-telemetry` | 1 | 0 | 0 | 0 | 1 |

### Per-Plugin Migration Profile

| Plugin | Current JS-only concerns | Best non-JS alternatives | Keep as JS now? | Perf strategy |
| --- | --- | --- | --- | --- |
| `@kbn/eslint-plugin-disable` | Protected disable-comment policy (`no_protected_eslint_disable`) | none exact; keep policy as linter rule | Yes | Keep scoped to files with disable comments. |
| `@kbn/eslint-plugin-eslint` | Mix of security/architecture + Scout policy rules (13 JS-only) | `no-restricted-imports`, `no-async-promise-executor`, `unicorn/no-array-for-each`, `oxc/no-barrel-file`, Scout runner checks, license/header scripts | Partially | Keep security/architecture rules first; migrate Scout/policy checks to dedicated tooling to reduce JS lint load. |
| `@kbn/eslint-plugin-i18n` | i18n ID and string-translation guidance (4 JS-only, mostly warn) | i18n extraction/validation script, codemod-based autofix flow | Prefer no | Move out of lint runtime unless strict gating is required. |
| `@kbn/eslint-plugin-imports` | Repository boundary/group/canonical import policy (4 custom architecture rules) | no exact native equivalent; implemented in `scripts/lint_custom_rules` today | No | Keep in script checks now; port to OXC Rust for native speed + CI ergonomics. |
| `@kbn/eslint-plugin-telemetry` | JSX telemetry instrumentation policy (1 JS-only) | telemetry-specific checker or codemod | Maybe | Keep narrow solution globs only; avoid repo-wide JS lint activation. |

#### `@kbn/eslint-plugin-disable` (2)

- [x] `native`: `@kbn/disable/no_naked_eslint_disable` -> `unicorn/no-abusive-eslint-disable`.
- [x] `js_plugin_required`: `@kbn/disable/no_protected_eslint_disable` (migrated via scoped OXC JS plugin wrapper).

#### `@kbn/eslint-plugin-eslint` (24)

- [x] `native`: `@kbn/eslint/no_deprecated_imports` -> `no-restricted-imports`.
- [x] `native_with_changes`:
  - `@kbn/eslint/module_migration` -> `no-restricted-imports` + codemod
  - `@kbn/eslint/no_async_foreach` -> `unicorn/no-array-for-each` (optionally `prefer-for-of`)
  - `@kbn/eslint/no_async_promise_body` -> `no-async-promise-executor`
  - `@kbn/eslint/no_export_all` -> `oxc/no-barrel-file` (targeted globs)
  - `@kbn/eslint/no_trailing_import_slash` -> `no-restricted-imports` pattern
  - `@kbn/eslint/no_unsafe_console` -> kept as JS plugin for now (target replacement remains `no-restricted-imports` with known behavior delta)
  - `@kbn/eslint/scout_expect_import` -> `no-restricted-imports` (path-scoped overrides)
- [x] `script_or_codemod`:
  - `@kbn/eslint/disallow-license-headers` (migrated to `scripts/lint_custom_rules`)
  - `@kbn/eslint/require-license-header` (migrated to `scripts/lint_custom_rules`)
  - `@kbn/eslint/require_kbn_fs` (migrated to `scripts/lint_custom_rules`)
  - `@kbn/eslint/require_kibana_feature_privileges_naming` (migrated to `scripts/lint_custom_rules`)
  - `@kbn/eslint/scout_test_file_naming` (migrated to `scripts/lint_custom_rules`)
- [x] `js_plugin_required`:
  - `@kbn/eslint/deployment_agnostic_test_context`
  - `@kbn/eslint/no_constructor_args_in_property_initializers`
  - `@kbn/eslint/no_this_in_property_initializers`
  - `@kbn/eslint/no_unsafe_hash`
  - `@kbn/eslint/no_wrapped_error_in_logger`
  - `@kbn/eslint/require_include_in_check_a11y`
  - `@kbn/eslint/scout_max_one_describe`
  - `@kbn/eslint/scout_no_describe_configure`
  - `@kbn/eslint/scout_no_es_archiver_in_parallel_tests`
  - `@kbn/eslint/scout_require_api_client_in_api_test`
  - `@kbn/eslint/scout_require_global_setup_hook_in_parallel_tests`

#### `@kbn/eslint-plugin-i18n` (4)

- [x] `js_plugin_required`:
  - `@kbn/i18n/formatted_message_should_start_with_the_right_id`
  - `@kbn/i18n/i18n_translate_should_start_with_the_right_id`
  - `@kbn/i18n/strings_should_be_translated_with_formatted_message`
  - `@kbn/i18n/strings_should_be_translated_with_i18n`

#### `@kbn/eslint-plugin-imports` (9)

- [x] `native`: `@kbn/imports/no_direct_handlebars_import` -> `no-restricted-imports`.
- [x] `native_with_changes`:
  - `@kbn/imports/exports_moved_packages` -> `no-restricted-imports` + codemod
  - `@kbn/imports/no_unused_imports` -> `no-unused-vars` (fix behavior delta, warning-level in `.oxlintrc.json`)
- [x] `script_or_codemod`:
  - `@kbn/imports/no_boundary_crossing` (migrated to `scripts/lint_custom_rules`)
  - `@kbn/imports/no_group_crossing_imports` (migrated to `scripts/lint_custom_rules`)
  - `@kbn/imports/no_group_crossing_manifests` (migrated to `scripts/lint_custom_rules`)
  - `@kbn/imports/uniform_imports` (migrated to `scripts/lint_custom_rules`)
  - `@kbn/imports/no_unresolvable_imports` (migrated to `scripts/lint_custom_rules`)
  - `@kbn/imports/require_import` (migrated to `scripts/lint_custom_rules`)

#### `@kbn/eslint-plugin-telemetry` (1)

- [x] `js_plugin_required`: `@kbn/telemetry/event_generating_elements_should_be_instrumented` (migrated via scoped OXC JS plugin wrapper).

### Concern Validity Review (2026-02-07)

This is a pragmatic review of whether each JS-only concern is still worth paying JS-plugin cost in linting.

| Plugin | Validity | Evidence | Recommendation |
| --- | --- | --- | --- |
| `@kbn/eslint-plugin-disable` | High | `no_protected_eslint_disable` protects non-disableable architectural rules. | Keep as JS rule, but scope to files where disable comments are used. |
| `@kbn/eslint-plugin-imports` | High | Core architecture boundaries and import policy rules are `error`; real-code disable counts are high for `no_boundary_crossing` (`44`) and `uniform_imports` (`7`), showing active enforcement pressure. | Keep enforced via script checks now; prioritize OXC Rust ports for native performance. |
| `@kbn/eslint-plugin-eslint` (security/architecture subset) | High | `no_unsafe_hash`, `no_wrapped_error_in_logger`, `require_kbn_fs`, `deployment_agnostic_test_context` encode security/test-correctness constraints; real-code disable counts include `deployment_agnostic_test_context` (`11`) and `no_unsafe_hash` (`8`). | Keep constraints, but migrate out of JS lint where possible (dedicated checks or Rust rules). |
| `@kbn/eslint-plugin-eslint` (Scout subset) | Medium | Rules are mostly test-structure policy for Scout; all are scoped to Scout paths. | Move to Scout test runner validation where feasible; keep lint fallback temporarily. |
| `@kbn/eslint-plugin-eslint` (low-signal subset) | Low-Medium | `no_constructor_args_in_property_initializers`, `no_this_in_property_initializers`, and `require_include_in_check_a11y` have low repository signal and include `warn` severity cases. | Consider retiring or downgrading before keeping as JS lint rules. |
| `@kbn/eslint-plugin-i18n` | Medium-Low | Rules are currently `warn`-oriented translation quality/autofix guidance, not safety-critical correctness checks. | Prefer dedicated i18n validation/codemod tooling; avoid broad JS-plugin lint cost. |
| `@kbn/eslint-plugin-telemetry` | Medium | Instrumentation rule is business-observability policy, scoped to selected solution paths (`warn`/`error` mix). | Keep only in narrow globs or shift to telemetry-specific checker. |

Decision framing:

- Keep as JS lint now: architecture/security constraints that would materially regress safety or package boundaries.
- Migrate out of JS lint soon: Scout/i18n/telemetry/policy checks that can run in domain-specific tooling.
- Drop or demote: low-signal style/policy rules without strong correctness impact.

## Operational Migration Backlog (Files/Scripts)

- [x] Replace `lint:es` in `package.json` with OXC lint command(s).
- [x] Remove `scripts/eslint.js`, `scripts/eslint_all_files.js`, `scripts/eslint_with_types.js`, `scripts/oxlint.js`, and `scripts/oxlint_all_files.js` in favor of `scripts/lint*`.
- [ ] Replace `src/dev/eslint/*` utilities with OXC equivalents.
- [x] Replace ESLint path filtering in pre-commit flow (`src/dev/run_precommit_hook.js` + `src/dev/eslint/*`).
- [x] Replace `scripts/prettier_topology_check.js` and `src/dev/run_prettier_topology_check.ts` with OXC formatter topology checks (if still needed).
- [ ] Update docs that currently instruct ESLint/Prettier usage.

## Exit Checklist (Hard Stop Before Completion)

- [ ] `rg -n "eslint|prettier" package.json scripts src/dev` returns only intentional historical references.
- [ ] No CI job invokes ESLint or Prettier binaries.
- [ ] `yarn lint` path is fully OXC-backed.
- [ ] Contributor docs and onboarding instructions are OXC-only.

## Current Execution State (2026-02-07)

- Completed in this wave:
  - canonical lint entrypoints are now tool-agnostic (`scripts/lint`, `scripts/lint_all_files`, `scripts/lint_with_types`)
  - root lint path switched to OXC (`lint` -> `lint:oxc`)
  - CI lint step switched to OXC (`.buildkite/scripts/steps/lint.sh`)
  - pre-commit JS/TS lint switched from ESLint to OXlint (`src/dev/run_precommit_hook.js`)
  - formatter topology check now validates `.oxfmtrc` (while keeping script path stable)
  - generator helpers that previously shelled out to `prettier`/`eslint` now use OXC-backed formatting/linting entrypoints
  - native custom-rule wave enabled in OXC config as warnings:
    - `no-async-promise-executor`
    - `unicorn/no-abusive-eslint-disable`
    - `no-restricted-imports` (direct handlebars imports)
    - `oxc/no-barrel-file` on plugin/core index globs
  - non-JS custom-rule wave expanded in OXC config (warning-level):
    - `unicorn/no-array-for-each` (`@kbn/eslint/no_async_foreach`)
    - `no-unused-vars` (`@kbn/imports/no_unused_imports`, behavior-delta accepted)
    - `no-restricted-imports` migration entries for:
      - deprecated imports (`@kbn/eslint/no_deprecated_imports`)
      - module migration policy (`@kbn/eslint/module_migration`, partial parity)
      - moved export policy (`@kbn/imports/exports_moved_packages`)
      - trailing package slash imports (`@kbn/eslint/no_trailing_import_slash`)
    - Scout `expect` import path policy via path-scoped `no-restricted-imports` overrides (`@kbn/eslint/scout_expect_import`)
  - introduced `scripts/lint_custom_rules` and wired it into `scripts/lint` / `scripts/lint_all_files` for non-JS script checks:
    - Scout test naming enforcement (`@kbn/eslint/scout_test_file_naming`) with ESLint-equivalent scope from `.eslintrc.js`
    - Kibana feature privilege API naming checks (`@kbn/eslint/require_kibana_feature_privileges_naming`) via ESLint API fallback
    - Required triple-slash type references for evaluation specs (`@kbn/imports/require_import`) from local evaluation `.eslintrc.json` configs
    - License header policy enforcement (`@kbn/eslint/require-license-header`, `@kbn/eslint/disallow-license-headers`) using root policy mappings with legacy ignore semantics
    - `@kbn/fs` write-method policy (`@kbn/eslint/require_kbn_fs`) with `.eslintrc.js` include/exclude parity
    - Resolver-backed import validation (`@kbn/imports/no_unresolvable_imports`) using `@kbn/import-resolver`
    - Import architecture rules (`@kbn/imports/no_boundary_crossing`, `@kbn/imports/no_group_crossing_imports`, `@kbn/imports/no_group_crossing_manifests`, `@kbn/imports/uniform_imports`) migrated off OXC JS plugins
  - migrated remaining JS-only custom rules to OXC JS plugins via local wrappers:
    - `src/dev/oxlint/js_plugins/kbn_disable_plugin.cjs`
    - `src/dev/oxlint/js_plugins/kbn_eslint_plugin.cjs`
    - `src/dev/oxlint/js_plugins/kbn_i18n_plugin.cjs`
    - `src/dev/oxlint/js_plugins/kbn_telemetry_plugin.cjs`
  - restored ESLint ignore parity in `.oxlintrc.json` by anchoring ignore patterns (leading `/`) to avoid unintended over-ignoring of nested `plugins/` paths
  - restored `require_kbn_fs` exclusion parity in `scripts/lint_custom_rules` (scripts/test/e2e/storybook/schema paths)
  - fixed generated file handling in `scripts/lint_custom_rules`:
    - now respects `.gitignore` for untracked path discovery
    - excludes `.d.ts` declaration files from custom checks

- Open blockers:
  - OXC `--type-aware` path (`oxlint-tsgolint`) is not yet compatible with current Kibana tsconfig usage; `scripts/lint_with_types` remains ESLint-backed.
  - ESLint/Prettier dependencies cannot be removed yet because custom ESLint plugin packages and typed-lint flow still depend on ESLint runtime/types.
  - `@kbn/eslint/module_migration` exclude/include parity still needs targeted scoped handling for `react-intl`, `zod`, and `styled-components`.
  - `scripts/lint_custom_rules` runtime remains high on full-repo runs (`~157.61s` vs `~13.87s` with `--skip-custom-rules`); import architecture checks should move to OXC Rust for native performance.

## Rust Port Priority (Architecture Rules)

Measured on `src` (20,905 files):

| Scenario | Real time | Notes |
| --- | ---: | --- |
| Pre-migration (import architecture via OXC JS plugins) | `~104s` (`node scripts/lint --skip-custom-rules --quiet src`) | `@kbn/imports/*` in OXC JS plugin hot path |
| Current OXC only (`--skip-custom-rules`) | `~5.59s` | JS-plugin hot path removed for imports |
| Current full lint (`scripts/lint`, includes custom script checks) | `~39.34s` | import architecture now enforced in `scripts/lint_custom_rules` |

Execution order:

1. Port `no_group_crossing_imports` to OXC Rust.
2. Port `uniform_imports` to OXC Rust (with autofix parity as feasible).
3. Port `no_boundary_crossing` to OXC Rust.
4. Port `no_group_crossing_manifests` to OXC Rust.

Acceptance target:

- Reduce `scripts/lint --quiet src` from ~`39.34s` toward `<20s` with architecture checks still enabled.
