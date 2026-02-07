# OXC Custom Rule Migration Matrix

Last updated: 2026-02-07

## Legend

- `native`: Replace with OXC native rule(s) now.
- `native_with_changes`: Replace with OXC native rule(s), but behavior/fix parity changes.
- `script_or_codemod`: Move enforcement to a dedicated script/codemod instead of lint rule runtime.
- `js_plugin_required`: No practical OXC-native equivalent today; keep as JS plugin (or port to OXC Rust rule).

## Summary

- `native`: 3/40
- `native_with_changes`: 9/40
- `script_or_codemod`: 11/40
- `js_plugin_required`: 17/40
- Implemented in current OXC config (warning-only to avoid mass breakage):
  - `@kbn/disable/no_naked_eslint_disable` -> `unicorn/no-abusive-eslint-disable`
  - `@kbn/eslint/no_async_promise_body` -> `no-async-promise-executor`
  - `@kbn/eslint/no_async_foreach` -> `unicorn/no-array-for-each`
  - `@kbn/imports/no_unused_imports` -> `no-unused-vars` (warning-level with conservative options)
  - `@kbn/eslint/no_deprecated_imports` -> `no-restricted-imports` (deprecated import map)
  - `@kbn/eslint/module_migration` -> `no-restricted-imports` (policy-only parity; three include/exclude mappings remain pending)
  - `@kbn/eslint/no_trailing_import_slash` -> `no-restricted-imports` (`regex: ^(?!\\.?\\.?/).+/$`)
  - `@kbn/eslint/scout_expect_import` -> `no-restricted-imports` in Scout API/UI path overrides
  - `@kbn/imports/exports_moved_packages` -> `no-restricted-imports` (`importNames` restrictions)
  - `@kbn/imports/no_direct_handlebars_import` -> `no-restricted-imports`
  - `@kbn/eslint/no_export_all` -> `oxc/no-barrel-file` (`threshold: 0` on target index globs)
- Implemented as dedicated script checks:
  - `@kbn/eslint/disallow-license-headers` -> `scripts/lint_custom_rules` (legacy `.eslintignore` + ESLint-default dotfile ignore semantics preserved)
  - `@kbn/eslint/require-license-header` -> `scripts/lint_custom_rules` (same scoped policy data from root `.eslintrc.js` overrides)
  - `@kbn/eslint/require_kbn_fs` -> `scripts/lint_custom_rules` (scope + options mirrored from `.eslintrc.js` include/exclude policy)
  - `@kbn/eslint/scout_test_file_naming` -> `scripts/lint_custom_rules` (scope derived from `.eslintrc.js` override globs)
  - `@kbn/eslint/require_kibana_feature_privileges_naming` -> `scripts/lint_custom_rules` (ESLint API fallback for compatibility; avoids OXC JS-plugin runtime API mismatch)
  - `@kbn/imports/require_import` -> `scripts/lint_custom_rules` (scope + required modules derived from local evaluation `.eslintrc.json` files)
  - `@kbn/imports/no_unresolvable_imports` -> `scripts/lint_custom_rules` (resolver-backed import resolution via `@kbn/import-resolver`)
  - `@kbn/imports/no_boundary_crossing` -> `scripts/lint_custom_rules` (repo-source classifier + resolver checks)
  - `@kbn/imports/no_group_crossing_imports` -> `scripts/lint_custom_rules` (group/visibility boundary checks)
  - `@kbn/imports/no_group_crossing_manifests` -> `scripts/lint_custom_rules` (plugin manifest dependency checks)
  - `@kbn/imports/uniform_imports` -> `scripts/lint_custom_rules` (canonical import path checks)
- Implemented as OXC JS plugin wrappers:
  - `@kbn/disable/no_protected_eslint_disable` -> `src/dev/oxlint/js_plugins/kbn_disable_plugin.cjs`
  - `@kbn/eslint/*` JS-only rules -> `src/dev/oxlint/js_plugins/kbn_eslint_plugin.cjs`
  - `@kbn/i18n/*` JS-only rules -> `src/dev/oxlint/js_plugins/kbn_i18n_plugin.cjs`
  - `@kbn/telemetry/event_generating_elements_should_be_instrumented` -> `src/dev/oxlint/js_plugins/kbn_telemetry_plugin.cjs`

## Source Validation

- Validated against local OXC source tree: `/Users/tyler/code/oxc/crates/oxc_linter/src/rules`.
- Local OXC checkout used for validation:
  - commit: `78607dc415f71b6afc5e22f670ac7b046a2a33e3` (2026-02-07)
  - path checked: `/Users/tyler/code/oxc/crates/oxc_linter/src/generated/rules_enum.rs`
- Parsed current rule registry:
  - total rules: `668`
  - plugin counts: eslint `167`, unicorn `122`, typescript `90`, jest `53`, react `52`, import `32`, jsx-a11y `31`, oxc `26`, nextjs `21`, jsdoc `18`, vue `17`, promise `16`, vitest `15`, react-perf `4`, node `4`.
- Verified native replacement rule availability in current OXC source for all `native` and `native_with_changes` mappings referenced in this matrix (`no-restricted-imports`, `no-unused-vars`, `no-async-promise-executor`, `unicorn/no-array-for-each`, `unicorn/no-abusive-eslint-disable`, `oxc/no-barrel-file`, `typescript/prefer-for-of`).
- Compared to `oxlint@1.43.0` inventory used during initial migration triage:
  - new in source checkout: `typescript/consistent-type-assertions`, `unicorn/relative-url-style`, `vitest/prefer-expect-type-of`.
  - removed in source checkout: none.
- Impact on Kibana custom-rule migration strategy: no disposition changes required.

## JS Plugin Performance Findings

- Reference docs:
  - Linter usage: <https://oxc.rs/docs/guide/usage/linter.html>
  - Formatter usage: <https://oxc.rs/docs/guide/usage/formatter.html>
  - JS plugins guide: <https://oxc.rs/docs/guide/usage/linter/js-plugins>
  - OXC JS plugin benchmark post: <https://oxc.rs/blog/2025-10-09-oxlint-js-plugins>
- OXC benchmark (2025-10-09 JS plugin post, corrected benchmark section):
  - no custom plugin: `48ms`
  - with custom JS plugin: `236ms`
  - ratio: ~`4.9x` for that benchmark workload.
- Kibana repo benchmark (`oxlint@1.43.0` direct binary, same config baseline, 3 runs each):

| Scenario | Avg `real` time | Delta vs baseline |
| --- | ---: | ---: |
| baseline (`.oxlintrc.json`) | `3.27s` | baseline |
| JS plugin loaded, no JS rules enabled | `3.16s` | `-3%` |
| JS rule configured but no files match (`overrides`) | `3.14s` | `-4%` |
| JS rule scoped to narrow glob (`packages/kbn-eslint-plugin-disable/**/*.ts`) | `3.34s` | `+2%` |
| JS rule enabled globally (single no-op rule) | `4.12s` | `+26%` |
| JS rules enabled globally (10 no-op rules) | `4.54s` | `+39%` |

- Kibana real-rule benchmark (2026-02-07, `src` tree, `--quiet`, 20,906 files):

| Scenario | `real` time | Delta vs no-JS |
| --- | ---: | ---: |
| no JS plugins/rules (`.tmp/oxlintrc_no_js_plugins.json`) | `1.95s` | baseline |
| migrated custom JS rules enabled (`.oxlintrc.json`) | `90.55s` | `+4,543%` (`~46.4x`) |

- Post-migration benchmark after moving import architecture rules and `require_kibana_feature_privileges_naming` to `scripts/lint_custom_rules`:
  - `node scripts/lint --skip-custom-rules --quiet src`: `5.59s` real
  - `node scripts/lint --quiet src`: `39.34s` real
  - This removed the OXC JS-plugin hot path bottleneck while keeping policy coverage in script checks.

- Practical implication for Kibana:
  - JS plugin cost is **not** paid merely because `jsPlugins` is declared.
  - Cost is paid when JS rules execute on matched files, and heavy architecture rules can dominate runtime.
  - For this repo, global JS rules can be far beyond no-op benchmarks; migrating hot-path rules to native OXC (Rust) is required for acceptable full-repo runtime.
- For unavoidable JS rules:
  - scope with `overrides[].files` aggressively,
  - keep JS rule count minimal,
  - implement rules with OXC's alternative JS plugin API (`createOnce`) where applicable,
  - prioritize Rust-porting high-frequency architecture rules (`no_boundary_crossing`, `uniform_imports`, `no_group_crossing_*`).

## Rule-by-Rule Disposition

### @kbn/disable (2)

- [x] `@kbn/disable/no_naked_eslint_disable`
  - Decision: `native`
  - OXC path: `unicorn/no-abusive-eslint-disable`
  - Notes: Same intent (forbid naked `eslint-disable*` comments).

- [x] `@kbn/disable/no_protected_eslint_disable`
  - Decision: `js_plugin_required`
  - OXC path: none
  - Notes: Needs Kibana-specific protected-rule allowlist logic for disable comments.

### @kbn/eslint (24)

- [x] `@kbn/eslint/deployment_agnostic_test_context`
  - Decision: `js_plugin_required`
  - OXC path: none
  - Notes: Custom AST + test-fixture semantics.

- [x] `@kbn/eslint/disallow-license-headers`
  - Decision: `script_or_codemod`
  - OXC path: none
  - Notes: Enforced via `scripts/lint_custom_rules` using root header policy mapping and respecting legacy ignore semantics.

- [x] `@kbn/eslint/module_migration`
  - Decision: `native_with_changes`
  - OXC path: `no-restricted-imports` + codemod for rewrites
  - Notes: Keep policy in lint; perform replacements via codemod (no native autofix parity). Current OXC migration intentionally skipped three include/exclude mappings (`react-intl`, `zod`, `styled-components`) pending scoped override parity.

- [x] `@kbn/eslint/no_async_foreach`
  - Decision: `native_with_changes`
  - OXC path: `unicorn/no-array-for-each` (and optionally `prefer-for-of`)
  - Notes: Broader policy than current rule, but aligned with OXC best practices.

- [x] `@kbn/eslint/no_async_promise_body`
  - Decision: `native_with_changes`
  - OXC path: `no-async-promise-executor`
  - Notes: Stricter than current Kibana rule (which allows guarded cases).

- [x] `@kbn/eslint/no_constructor_args_in_property_initializers`
  - Decision: `js_plugin_required`
  - OXC path: none
  - Notes: TS class initialization ordering nuance; no native equivalent found.

- [x] `@kbn/eslint/no_deprecated_imports`
  - Decision: `native`
  - OXC path: `no-restricted-imports`
  - Notes: Current Kibana rule is already a wrapper around ESLint `no-restricted-imports`.

- [x] `@kbn/eslint/no_export_all`
  - Decision: `native_with_changes`
  - OXC path: `oxc/no-barrel-file` with `threshold: 0` on target globs
  - Notes: Enforces anti-barrel policy, but behavior differs from exact `export *` semantics.

- [x] `@kbn/eslint/no_this_in_property_initializers`
  - Decision: `js_plugin_required`
  - OXC path: none
  - Notes: No native rule for this class-field safety check.

- [x] `@kbn/eslint/no_trailing_import_slash`
  - Decision: `native_with_changes`
  - OXC path: `no-restricted-imports` with regex pattern (e.g. non-relative paths ending in `/`)
  - Notes: Native replacement works, but configure carefully to avoid false positives.

- [x] `@kbn/eslint/no_unsafe_console`
  - Decision: `native_with_changes`
  - OXC path: `no-restricted-imports` (`importNames: ["unsafeConsole"]` from `@kbn/security-hardening`)
  - Notes: Target state is import-policy enforcement; current migration keeps this as an OXC JS plugin rule for behavior compatibility with existing disable/comment usage.

- [x] `@kbn/eslint/no_unsafe_hash`
  - Decision: `js_plugin_required`
  - OXC path: none
  - Notes: Algorithm allowlist analysis on `createHash` calls is custom.

- [x] `@kbn/eslint/no_wrapped_error_in_logger`
  - Decision: `js_plugin_required`
  - OXC path: none
  - Notes: Custom object-shape constraint in logger metadata.

- [x] `@kbn/eslint/require-license-header`
  - Decision: `script_or_codemod`
  - OXC path: none
  - Notes: Enforced via `scripts/lint_custom_rules`; validates required header presence and placement.

- [x] `@kbn/eslint/require_include_in_check_a11y`
  - Decision: `js_plugin_required`
  - OXC path: none
  - Notes: Custom call-shape rule (`checkA11y({ include: ... })`).

- [x] `@kbn/eslint/require_kbn_fs`
  - Decision: `script_or_codemod`
  - OXC path: none exact
  - Notes: Enforced via `scripts/lint_custom_rules`; include/exclude scope and restricted method options mirror `.eslintrc.js` policy.

- [x] `@kbn/eslint/require_kibana_feature_privileges_naming`
  - Decision: `script_or_codemod`
  - OXC path: none
  - Notes: Enforced via `scripts/lint_custom_rules` using ESLint API fallback because OXC JS-plugin compatibility does not provide `context.getAncestors`.

- [x] `@kbn/eslint/scout_expect_import`
  - Decision: `native_with_changes`
  - OXC path: `no-restricted-imports` in Scout path-specific overrides
  - Notes: Enforce allowed sources per path; current custom autofix behavior not native.

- [x] `@kbn/eslint/scout_max_one_describe`
  - Decision: `js_plugin_required`
  - OXC path: none exact for `apiTest.describe`/`test.describe`
  - Notes: Jest rules target `describe(...)`, not Scout method-style describe calls.

- [x] `@kbn/eslint/scout_no_describe_configure`
  - Decision: `js_plugin_required`
  - OXC path: none
  - Notes: Needs custom Scout DSL pattern check.

- [x] `@kbn/eslint/scout_no_es_archiver_in_parallel_tests`
  - Decision: `js_plugin_required`
  - OXC path: none
  - Notes: Custom fixture/destructuring check in Scout parallel tests.

- [x] `@kbn/eslint/scout_require_api_client_in_api_test`
  - Decision: `js_plugin_required`
  - OXC path: none
  - Notes: Dataflow-ish local analysis for fixture usage.

- [x] `@kbn/eslint/scout_require_global_setup_hook_in_parallel_tests`
  - Decision: `js_plugin_required`
  - OXC path: none
  - Notes: File-level structural check for `global.setup.ts`.

- [x] `@kbn/eslint/scout_test_file_naming`
  - Decision: `script_or_codemod`
  - OXC path: none
  - Notes: Enforced via `scripts/lint_custom_rules` using the same scoped file globs as the previous ESLint override.

### @kbn/i18n (4)

- [x] `@kbn/i18n/formatted_message_should_start_with_the_right_id`
  - Decision: `js_plugin_required`
  - OXC path: none
  - Notes: Kibana i18n id prefixing + autofix logic is custom.

- [x] `@kbn/i18n/i18n_translate_should_start_with_the_right_id`
  - Decision: `js_plugin_required`
  - OXC path: none
  - Notes: Repo-aware id computation from `i18nrc.json` is custom.

- [x] `@kbn/i18n/strings_should_be_translated_with_formatted_message`
  - Decision: `js_plugin_required`
  - OXC path: none
  - Notes: JSX text extraction + translation insertion autofix is custom.

- [x] `@kbn/i18n/strings_should_be_translated_with_i18n`
  - Decision: `js_plugin_required`
  - OXC path: none
  - Notes: JSX text extraction + `i18n.translate` autofix is custom.

### @kbn/imports (9)

- [x] `@kbn/imports/exports_moved_packages`
  - Decision: `native_with_changes`
  - OXC path: `no-restricted-imports` + codemod
  - Notes: Keep policy in lint; use codemod for moved-export rewrite flow.

- [x] `@kbn/imports/no_boundary_crossing`
  - Decision: `script_or_codemod`
  - OXC path: none
  - Notes: Enforced via `scripts/lint_custom_rules`; repo-source classifier + module-type boundary policy remains custom.

- [x] `@kbn/imports/no_direct_handlebars_import`
  - Decision: `native`
  - OXC path: `no-restricted-imports` (`paths` + `patterns`)
  - Notes: Straight import-source restriction.

- [x] `@kbn/imports/no_group_crossing_imports`
  - Decision: `script_or_codemod`
  - OXC path: none
  - Notes: Enforced via `scripts/lint_custom_rules`; group/visibility policy resolution is Kibana-specific.

- [x] `@kbn/imports/no_group_crossing_manifests`
  - Decision: `script_or_codemod`
  - OXC path: none
  - Notes: Enforced via `scripts/lint_custom_rules`; `kibana.jsonc` manifest dependency policy is Kibana-specific.

- [x] `@kbn/imports/no_unresolvable_imports`
  - Decision: `script_or_codemod`
  - OXC path: none exact
  - Notes: Enforced via `scripts/lint_custom_rules` with `@kbn/import-resolver`; checks static import/require/import()/jest mock requests.

- [x] `@kbn/imports/no_unused_imports`
  - Decision: `native_with_changes`
  - OXC path: `no-unused-vars`
  - Notes: Detection exists natively; current Kibana autofix/suggestion behavior does not.

- [x] `@kbn/imports/require_import`
  - Decision: `script_or_codemod`
  - OXC path: none
  - Notes: Enforced via `scripts/lint_custom_rules` by reading local evaluation ESLint config overrides and checking required `/// <reference types="..."/>` directives.

- [x] `@kbn/imports/uniform_imports`
  - Decision: `script_or_codemod`
  - OXC path: none
  - Notes: Enforced via `scripts/lint_custom_rules`; resolver-backed canonical import policy remains custom.

### @kbn/telemetry (1)

- [x] `@kbn/telemetry/event_generating_elements_should_be_instrumented`
  - Decision: `js_plugin_required`
  - OXC path: none
  - Notes: JSX instrumentation naming/autofix policy is custom.

## Suggested Iteration Order

### Phase A: remove high-confidence custom rules first

- [x] Migrate `no_naked_eslint_disable` to `unicorn/no-abusive-eslint-disable`.
- [x] Migrate `no_deprecated_imports` to `no-restricted-imports`.
- [x] Migrate `no_direct_handlebars_import` to `no-restricted-imports`.

### Phase B: adopt native-with-change replacements

- [x] Replace policy-style import rules via `no-restricted-imports` and document behavior deltas.
- [x] Replace `no_async_promise_body` and `no_async_foreach` with OXC-native async rules.
- [x] Replace `no_export_all` with `oxc/no-barrel-file` for target index globs.

### Phase C: move migration-style rules to codemods/scripts

- [ ] Convert `module_migration` and `exports_moved_packages` into codemods + lint restrictions.
- [x] Move license header checks to a dedicated script.
- [x] Move naming/path-only checks (`scout_test_file_naming`, `require_import`) to scripts.

### Phase D: minimize and scope unavoidable JS plugins

- [x] Keep only `js_plugin_required` rules as JS plugins.
- [x] Scope JS rule execution to the smallest `overrides[].files` globs.
- [ ] Prioritize Rust-porting high-churn rules (`uniform_imports`, group/boundary rules) if perf is still insufficient.
