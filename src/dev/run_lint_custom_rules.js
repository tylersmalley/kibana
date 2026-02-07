/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import fs from 'fs';
import path from 'path';
import execa from 'execa';
import minimatch from 'minimatch';
import ignore from 'ignore';
import Ts from 'typescript';
import { Linter } from 'eslint';

import { run } from '@kbn/dev-cli-runner';
import {
  ImportResolver,
  getPackageRelativeImportReq,
  getRelativeImportReq,
} from '@kbn/import-resolver';
import { RepoSourceClassifier } from '@kbn/repo-source-classifier';
import { getPackages, getPluginPackagesFilter } from '@kbn/repo-packages';
import { REPO_ROOT } from '@kbn/repo-info';
import requireKibanaFeaturePrivilegesNamingRule from '@kbn/eslint-plugin-eslint/rules/require_kibana_feature_privileges_naming';
import requireKbnFsRule from '@kbn/eslint-plugin-eslint/rules/require_kbn_fs';

const SUPPORTED_EXTENSIONS = /\.(?:js|mjs|ts|tsx)$/;
const SCOUT_TEST_PATH_PATTERN = /\/test\/scout(_[^/]+)?\/(?:ui|api)\/(?:parallel_)?tests\//;
const SCOUT_TEST_PATH_DESCRIPTION = '{scout,scout_*}/{ui,api}/{tests,parallel_tests}';
const RULE_NO_BOUNDARY_CROSSING = '@kbn/imports/no_boundary_crossing';
const RULE_NO_GROUP_CROSSING_IMPORTS = '@kbn/imports/no_group_crossing_imports';
const RULE_NO_GROUP_CROSSING_MANIFESTS = '@kbn/imports/no_group_crossing_manifests';
const RULE_UNIFORM_IMPORTS = '@kbn/imports/uniform_imports';
const RULE_NO_UNRESOLVABLE_IMPORTS = '@kbn/imports/no_unresolvable_imports';
const RULE_REQUIRE_LICENSE_HEADER = '@kbn/eslint/require-license-header';
const RULE_DISALLOW_LICENSE_HEADERS = '@kbn/eslint/disallow-license-headers';
const RULE_REQUIRE_KIBANA_FEATURE_PRIVILEGES_NAMING =
  '@kbn/eslint/require_kibana_feature_privileges_naming';
const RULE_REQUIRE_KBN_FS = '@kbn/eslint/require_kbn_fs';
const REQUIRE_KBN_FS_INCLUDE_GLOBS = [
  'src/platform/plugins/shared/**/*.ts',
  'x-pack/solutions/**/*.ts',
  'x-pack/plugins/**/*.ts',
  'x-pack/platform/plugins/shared/**/*.ts',
];
const REQUIRE_KBN_FS_EXCLUDE_GLOBS = [
  '**/*.{test,spec}.ts',
  '**/*.test.ts',
  '**/test/**',
  '**/tests/**',
  '**/__tests__/**',
  '**/scripts/**',
  '**/e2e/**',
  '**/cypress/**',
  '**/ftr_e2e/**',
  '**/.storybook/**',
  '**/json_schemas/**',
  'src/platform/plugins/shared/telemetry/**',
  'x-pack/solutions/security/packages/test-api-clients/**',
  'x-pack/platform/plugins/shared/automatic_import/**',
];
const REQUIRE_KBN_FS_OPTIONS = {
  restrictedMethods: ['writeFile', 'writeFileSync', 'createWriteStream', 'appendFile', 'appendFileSync'],
  disallowedMessage: 'Use `@kbn/fs` for file write operations instead of direct `fs` in production code',
};
const REQUIRE_IMPORT_CONFIGS = [
  'x-pack/platform/plugins/shared/inference/scripts/evaluation/.eslintrc.json',
  'x-pack/solutions/observability/plugins/observability_ai_assistant_app/scripts/evaluation/.eslintrc.json',
];
const TYPE_REFERENCE_REGEX = /\/\/\/\s*<reference\s+types=(['"])([^'"]+)\1\s*\/?>/g;
const JEST_MODULE_METHOD_NAMES = new Set([
  'createMockFromModule',
  'mock',
  'unmock',
  'doMock',
  'dontMock',
  'setMock',
  'requireActual',
  'requireMock',
]);
const IMPORT_RULE_WARN_GLOBS = [
  'scripts/create_observability_rules.js',
  'src/cli_setup/**',
  'src/dev/build/tasks/install_chromium.ts',
  'x-pack/platform/test/plugin_functional/plugins/resolver_test/**',
];
const UNIFORM_IMPORTS_OFF_GLOBS = ['packages/kbn-dependency-usage/**/*.{ts,tsx}'];
const DEFAULT_IGNORED_DOT_DIR_ALLOWLIST = new Set(['.buildkite', '.storybook']);
const ANY = Symbol('any');
const IMPORTABLE_FROM = {
  'non-package': ['non-package', 'server package', 'browser package', 'common package', 'static'],
  'server package': ['common package', 'server package', 'static'],
  'browser package': ['common package', 'browser package', 'static'],
  'common package': ['common package', 'static'],
  static: [],
  'tests or mocks': ANY,
  tooling: ANY,
};
const featurePrivilegesLinter = new Linter();
featurePrivilegesLinter.defineParser('@typescript-eslint/parser', require('@typescript-eslint/parser'));
featurePrivilegesLinter.defineRule(
  RULE_REQUIRE_KIBANA_FEATURE_PRIVILEGES_NAMING,
  requireKibanaFeaturePrivilegesNamingRule
);
const requireKbnFsLinter = new Linter();
requireKbnFsLinter.defineParser('@typescript-eslint/parser', require('@typescript-eslint/parser'));
requireKbnFsLinter.defineRule(RULE_REQUIRE_KBN_FS, requireKbnFsRule);

const toArray = (value) => (Array.isArray(value) ? value : value == null ? [] : [value]);
const normalizePath = (value) => value.replace(/\\/g, '/');
const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim();
const normalizeLicenseComment = (value) => {
  const commentText = String(value ?? '').trim();
  const multilineMatch = commentText.match(/^\/\*([\s\S]*?)\*\/$/);
  if (multilineMatch) {
    return normalizeWhitespace(multilineMatch[1]);
  }

  const singleLineMatch = commentText.match(/^\/\/(.*)$/);
  if (singleLineMatch) {
    return normalizeWhitespace(singleLineMatch[1]);
  }

  return normalizeWhitespace(commentText);
};

const isFile = (targetPath) => {
  try {
    return fs.statSync(targetPath).isFile();
  } catch {
    return false;
  }
};

const listRepoFiles = (pathSpecs) => {
  const args = ['ls-files'];
  if (pathSpecs.length > 0) {
    args.push('--', ...pathSpecs);
  }

  const result = execa.sync('git', args, {
    cwd: REPO_ROOT,
    reject: false,
  });

  if (result.exitCode !== 0 || !result.stdout) {
    return [];
  }

  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(normalizePath);
};

const listUntrackedFiles = (pathSpecs) => {
  const args = ['ls-files', '--others', '--exclude-standard'];
  if (pathSpecs.length > 0) {
    args.push('--', ...pathSpecs);
  }

  const result = execa.sync('git', args, {
    cwd: REPO_ROOT,
    reject: false,
  });

  if (result.exitCode !== 0 || !result.stdout) {
    return [];
  }

  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(normalizePath);
};

const resolveExplicitFileSpecs = (pathSpecs) => {
  const files = new Set();

  for (const pathSpec of pathSpecs) {
    const absolutePath = path.resolve(REPO_ROOT, pathSpec);
    if (isFile(absolutePath)) {
      files.add(normalizePath(path.relative(REPO_ROOT, absolutePath)));
    }
  }

  return files;
};

const isDeclarationFile = (filePath) => filePath.endsWith('.d.ts');
const isSupportedSourceFile = (filePath) =>
  SUPPORTED_EXTENSIONS.test(filePath) && !isDeclarationFile(filePath);
const isTypeScriptSourceFile = (filePath) => filePath.endsWith('.ts') && !isDeclarationFile(filePath);

const getCandidateFiles = (pathSpecs) => {
  const trackedFiles = listRepoFiles(pathSpecs);
  const untrackedFiles = listUntrackedFiles(pathSpecs);
  const explicitFiles = resolveExplicitFileSpecs(pathSpecs);
  const files = new Set([...trackedFiles, ...untrackedFiles]);

  for (const explicitFile of explicitFiles) {
    files.add(explicitFile);
  }

  return [...files].filter(isSupportedSourceFile);
};

const matchesAny = (filePath, globs) =>
  globs.some((glob) => minimatch(filePath, glob, { dot: true, nocomment: true }));

const isRuleConfigOff = (ruleConfig) => {
  if (ruleConfig === 'off' || ruleConfig === 0) {
    return true;
  }

  if (Array.isArray(ruleConfig)) {
    const level = ruleConfig[0];
    return level === 'off' || level === 0;
  }

  return false;
};

const loadRootEslintConfig = () => require(path.resolve(REPO_ROOT, '.eslintrc.js'));

const createLegacyEslintIgnoreMatcher = () => {
  const eslintIgnorePath = path.resolve(REPO_ROOT, '.eslintignore');
  const matcher = ignore();
  if (isFile(eslintIgnorePath)) {
    matcher.add(fs.readFileSync(eslintIgnorePath, 'utf8'));
  }

  const isDefaultIgnored = (filePath) => {
    if (filePath === '.eslintrc.js') {
      return false;
    }

    const segments = filePath.split('/');
    return segments.some(
      (segment) => segment.startsWith('.') && !DEFAULT_IGNORED_DOT_DIR_ALLOWLIST.has(segment)
    );
  };

  return (filePath) => matcher.ignores(filePath) || isDefaultIgnored(filePath);
};

const loadRequireImportPolicies = () => {
  const policies = [];

  for (const relativeConfigPath of REQUIRE_IMPORT_CONFIGS) {
    const absoluteConfigPath = path.resolve(REPO_ROOT, relativeConfigPath);
    if (!isFile(absoluteConfigPath)) {
      continue;
    }

    const config = JSON.parse(fs.readFileSync(absoluteConfigPath, 'utf8'));
    const configDirectory = normalizePath(path.posix.dirname(relativeConfigPath));

    for (const override of toArray(config.overrides)) {
      const rule = override.rules?.['@kbn/imports/require_import'];
      if (!Array.isArray(rule) || rule.length < 2) {
        continue;
      }

      const modules = [];
      const rawOptions = toArray(rule[1]);
      for (const option of rawOptions) {
        if (typeof option === 'string') {
          modules.push(option);
          continue;
        }

        if (option && typeof option === 'object' && typeof option.module === 'string') {
          if (option.as && option.as !== 'typeReference') {
            continue;
          }
          modules.push(option.module);
        }
      }

      if (modules.length === 0) {
        continue;
      }

      const files = toArray(override.files)
        .map((glob) => normalizePath(path.posix.join(configDirectory, glob)))
        .filter(Boolean);

      if (files.length === 0) {
        continue;
      }

      policies.push({ files, modules });
    }
  }

  return policies;
};

const loadScoutFileNamingGlobs = (eslintConfig) => {
  const globs = [];

  for (const override of toArray(eslintConfig.overrides)) {
    if (override.rules?.['@kbn/eslint/scout_test_file_naming'] == null) {
      continue;
    }

    globs.push(...toArray(override.files).map(normalizePath).filter(Boolean));
  }

  return globs;
};

const loadNoUnresolvableImportOffGlobs = (eslintConfig) => {
  const offGlobs = [];

  for (const override of toArray(eslintConfig.overrides)) {
    const ruleConfig = override.rules?.[RULE_NO_UNRESOLVABLE_IMPORTS];
    if (!isRuleConfigOff(ruleConfig)) {
      continue;
    }

    offGlobs.push(...toArray(override.files).map(normalizePath).filter(Boolean));
  }

  return offGlobs;
};

const loadLicensePolicies = (eslintConfig) => {
  const policies = [];

  for (const override of toArray(eslintConfig.overrides)) {
    const requireLicenseRule = override.rules?.[RULE_REQUIRE_LICENSE_HEADER];
    const disallowLicenseRule = override.rules?.[RULE_DISALLOW_LICENSE_HEADERS];

    if (!requireLicenseRule && !disallowLicenseRule) {
      continue;
    }

    const files = toArray(override.files).map(normalizePath).filter(Boolean);
    if (files.length === 0) {
      continue;
    }

    const requiredLicense =
      Array.isArray(requireLicenseRule) && requireLicenseRule[1]?.license
        ? normalizeLicenseComment(requireLicenseRule[1].license)
        : undefined;

    const disallowedLicenses =
      Array.isArray(disallowLicenseRule) && Array.isArray(disallowLicenseRule[1]?.licenses)
        ? new Set(disallowLicenseRule[1].licenses.map(normalizeLicenseComment))
        : undefined;

    policies.push({
      files,
      requiredLicense,
      disallowedLicenses,
    });
  }

  return policies;
};

const getLicensePolicyForFile = (filePath, policies) => {
  let requiredLicense;
  let disallowedLicenses;

  for (const policy of policies) {
    if (!matchesAny(filePath, policy.files)) {
      continue;
    }

    if (policy.requiredLicense !== undefined) {
      requiredLicense = policy.requiredLicense;
    }

    if (policy.disallowedLicenses !== undefined) {
      disallowedLicenses = policy.disallowedLicenses;
    }
  }

  if (requiredLicense === undefined && disallowedLicenses === undefined) {
    return undefined;
  }

  return { requiredLicense, disallowedLicenses };
};

const getImportRuleLevel = (ruleName, filePath) => {
  if (ruleName === RULE_UNIFORM_IMPORTS && matchesAny(filePath, UNIFORM_IMPORTS_OFF_GLOBS)) {
    return 'off';
  }

  if (
    (ruleName === RULE_NO_GROUP_CROSSING_IMPORTS ||
      ruleName === RULE_NO_GROUP_CROSSING_MANIFESTS) &&
    matchesAny(filePath, IMPORT_RULE_WARN_GLOBS)
  ) {
    return 'warn';
  }

  return 'error';
};

const isImportRuleEnabled = (ruleName, filePath) => getImportRuleLevel(ruleName, filePath) !== 'off';

const isImportRuleWarningOnly = (ruleName, filePath) =>
  getImportRuleLevel(ruleName, filePath) === 'warn';

const shouldRunRequireKbnFsRule = (filePath) =>
  matchesAny(filePath, REQUIRE_KBN_FS_INCLUDE_GLOBS) &&
  !matchesAny(filePath, REQUIRE_KBN_FS_EXCLUDE_GLOBS);

const getScriptKind = (filePath) => {
  if (filePath.endsWith('.tsx')) {
    return Ts.ScriptKind.TSX;
  }
  if (filePath.endsWith('.ts')) {
    return Ts.ScriptKind.TS;
  }
  return Ts.ScriptKind.JS;
};

const getImportRequest = (node) => {
  if (!node) {
    return null;
  }

  if (Ts.isStringLiteralLike(node) || Ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  if (Ts.isTemplateExpression(node) && node.templateSpans.length === 0) {
    return node.head.text;
  }

  return null;
};

const isTypeOnlyImportDeclaration = (node) => {
  if (!node.importClause) {
    return false;
  }

  if (node.importClause.isTypeOnly) {
    return true;
  }

  const { namedBindings } = node.importClause;
  return (
    namedBindings &&
    Ts.isNamedImports(namedBindings) &&
    namedBindings.elements.length > 0 &&
    namedBindings.elements.some((element) => element.isTypeOnly)
  );
};

const isTypeOnlyExportDeclaration = (node) => {
  if (node.isTypeOnly) {
    return true;
  }

  return (
    node.exportClause &&
    Ts.isNamedExports(node.exportClause) &&
    node.exportClause.elements.length > 0 &&
    node.exportClause.elements.some((element) => element.isTypeOnly)
  );
};

const extractImportStatements = (sourceText, filePath) => {
  const sourceFile = Ts.createSourceFile(
    filePath,
    sourceText,
    Ts.ScriptTarget.Latest,
    true,
    getScriptKind(filePath)
  );
  const imports = [];

  const pushImport = ({ request, type, node, isTypeOnly = false }) => {
    if (request == null) {
      return;
    }

    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    imports.push({
      request,
      type,
      isTypeOnly,
      line: line + 1,
    });
  };

  const visit = (node) => {
    if (Ts.isImportDeclaration(node)) {
      pushImport({
        request: getImportRequest(node.moduleSpecifier),
        type: 'esm',
        node: node.moduleSpecifier,
        isTypeOnly: isTypeOnlyImportDeclaration(node),
      });
      return;
    }

    if (Ts.isExportDeclaration(node) && node.moduleSpecifier) {
      pushImport({
        request: getImportRequest(node.moduleSpecifier),
        type: 'esm',
        node: node.moduleSpecifier,
        isTypeOnly: isTypeOnlyExportDeclaration(node),
      });
      return;
    }

    if (Ts.isCallExpression(node)) {
      if (node.expression.kind === Ts.SyntaxKind.ImportKeyword && node.arguments.length === 1) {
        pushImport({
          request: getImportRequest(node.arguments[0]),
          type: 'esm',
          node: node.arguments[0],
        });
        return;
      }

      if (
        Ts.isIdentifier(node.expression) &&
        node.expression.text === 'require' &&
        node.arguments.length === 1
      ) {
        pushImport({
          request: getImportRequest(node.arguments[0]),
          type: 'require',
          node: node.arguments[0],
        });
        return;
      }

      if (
        Ts.isPropertyAccessExpression(node.expression) &&
        Ts.isIdentifier(node.expression.expression) &&
        node.arguments.length === 1
      ) {
        const objectName = node.expression.expression.text;
        const methodName = node.expression.name.text;

        if (objectName === 'require' && methodName === 'resolve') {
          pushImport({
            request: getImportRequest(node.arguments[0]),
            type: 'require-resolve',
            node: node.arguments[0],
          });
          return;
        }

        if (objectName === 'jest' && JEST_MODULE_METHOD_NAMES.has(methodName)) {
          pushImport({
            request: getImportRequest(node.arguments[0]),
            type: 'jest',
            node: node.arguments[0],
          });
          return;
        }
      }
    }

    Ts.forEachChild(node, visit);
  };

  Ts.forEachChild(sourceFile, visit);

  return imports;
};

const scanComments = (sourceText) => {
  const comments = [];
  const scanner = Ts.createScanner(
    Ts.ScriptTarget.Latest,
    false,
    Ts.LanguageVariant.JSX,
    sourceText
  );

  let token = scanner.scan();
  while (token !== Ts.SyntaxKind.EndOfFileToken) {
    if (
      token === Ts.SyntaxKind.MultiLineCommentTrivia ||
      token === Ts.SyntaxKind.SingleLineCommentTrivia
    ) {
      const raw = scanner.getTokenText();
      const value =
        token === Ts.SyntaxKind.MultiLineCommentTrivia ? raw.slice(2, -2) : raw.slice(2);

      comments.push({
        start: scanner.getTokenPos(),
        end: scanner.getTextPos(),
        raw,
        normalized: normalizeWhitespace(value),
      });
    }

    token = scanner.scan();
  }

  return comments;
};

const isRuleDisabledInFile = (comments, ruleName) =>
  comments.some((comment) => comment.raw.includes('eslint-disable') && comment.raw.includes(ruleName));

const getShebangOffset = (sourceText) => {
  if (!sourceText.startsWith('#!')) {
    return 0;
  }

  const endOfFirstLine = sourceText.indexOf('\n');
  return endOfFirstLine === -1 ? sourceText.length : endOfFirstLine + 1;
};

const checkScoutTestFileNaming = (filePath, scoutFileNamingGlobs) => {
  if (!isTypeScriptSourceFile(filePath) || !matchesAny(filePath, scoutFileNamingGlobs)) {
    return [];
  }

  if (SCOUT_TEST_PATH_PATTERN.test(filePath)) {
    if (path.posix.basename(filePath) === 'global.setup.ts') {
      return [];
    }

    if (!filePath.endsWith('.spec.ts')) {
      return [
        `${filePath}: Scout test files in ${SCOUT_TEST_PATH_DESCRIPTION} must end with '.spec.ts'.`,
      ];
    }

    return [];
  }

  const basename = path.posix.basename(filePath, '.ts');
  if (basename.includes('test') || basename.includes('spec')) {
    return [
      `${filePath}: Scout test files must be under ${SCOUT_TEST_PATH_DESCRIPTION} directories.`,
    ];
  }

  return [];
};

const checkLicenseHeaders = (filePath, sourceText, comments, policy) => {
  if (!policy) {
    return [];
  }

  const errors = [];
  const isRequireHeaderDisabled = isRuleDisabledInFile(comments, RULE_REQUIRE_LICENSE_HEADER);
  const isDisallowHeaderDisabled = isRuleDisabledInFile(comments, RULE_DISALLOW_LICENSE_HEADERS);

  if (!isRequireHeaderDisabled && policy.requiredLicense) {
    const matchingComment = comments.find((comment) => comment.normalized === policy.requiredLicense);

    if (!matchingComment) {
      errors.push(`${filePath}: File must start with the required license header.`);
    } else {
      const startOffset = getShebangOffset(sourceText);
      const prefixText = sourceText.slice(startOffset, matchingComment.start);
      if (prefixText.trim().length > 0) {
        errors.push(`${filePath}: Required license header must be at the start of the file.`);
      }
    }
  }

  if (!isDisallowHeaderDisabled && policy.disallowedLicenses?.size) {
    for (const comment of comments) {
      if (policy.disallowedLicenses.has(comment.normalized)) {
        errors.push(`${filePath}: This license header is not allowed in this file.`);
      }
    }
  }

  return errors;
};

const checkRequiredTypeReferences = (filePath, sourceText, requireImportPolicies) => {
  const matchedPolicies = requireImportPolicies.filter((policy) => matchesAny(filePath, policy.files));
  if (matchedPolicies.length === 0) {
    return [];
  }

  const requiredModules = new Set();
  for (const policy of matchedPolicies) {
    for (const moduleName of policy.modules) {
      requiredModules.add(moduleName);
    }
  }

  const presentModules = new Set();
  for (const match of sourceText.matchAll(TYPE_REFERENCE_REGEX)) {
    presentModules.add(match[2]);
  }

  const errors = [];
  for (const requiredModule of requiredModules) {
    if (!presentModules.has(requiredModule)) {
      errors.push(
        `${filePath}: Missing required triple-slash reference: /// <reference types="${requiredModule}"/>`
      );
    }
  }

  return errors;
};

const resolveImportRequest = ({ resolver, resolveCache, dirname, request }) => {
  const cacheKey = `${dirname}\0${request}`;
  let resolveResult = resolveCache.get(cacheKey);
  if (resolveResult === undefined) {
    resolveResult = resolver.resolve(request, dirname) ?? null;
    resolveCache.set(cacheKey, resolveResult);
  }

  return resolveResult;
};

const checkNoUnresolvableImports = ({ filePath, comments, resolver, resolveCache, importStatements }) => {
  if (isRuleDisabledInFile(comments, RULE_NO_UNRESOLVABLE_IMPORTS)) {
    return [];
  }

  if (importStatements.length === 0) {
    return [];
  }

  const dirname = path.dirname(path.resolve(REPO_ROOT, filePath));
  const errors = [];
  const requests = new Set(importStatements.map((statement) => statement.request).filter(Boolean));

  for (const request of requests) {
    const resolveResult = resolveImportRequest({ resolver, resolveCache, dirname, request });
    if (!resolveResult) {
      errors.push(`${filePath}: Unable to resolve import [${request}]`);
    }
  }

  return errors;
};

const checkRequireKibanaFeaturePrivilegesNaming = ({
  filePath,
  absolutePath,
  sourceText,
  comments,
  warnings,
}) => {
  if (isRuleDisabledInFile(comments, RULE_REQUIRE_KIBANA_FEATURE_PRIVILEGES_NAMING)) {
    return [];
  }

  if (!sourceText.includes('registerKibanaFeature')) {
    return [];
  }

  const errors = [];
  try {
    const messages = featurePrivilegesLinter.verify(
      sourceText,
      {
        parser: '@typescript-eslint/parser',
        noInlineConfig: true,
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
          ecmaFeatures: {
            jsx: true,
          },
        },
        rules: {
          [RULE_REQUIRE_KIBANA_FEATURE_PRIVILEGES_NAMING]: 'warn',
        },
      },
      {
        filename: absolutePath,
      }
    );

    for (const message of messages) {
      if (
        message.message.includes("has no effect because you have 'noInlineConfig' setting in your config")
      ) {
        continue;
      }

      const text = `${filePath}:${message.line}:${message.column}: ${message.message}`;
      if (message.severity === 2) {
        errors.push(text);
      } else {
        warnings.push(text);
      }
    }
  } catch (error) {
    errors.push(`${filePath}: Failed to evaluate ${RULE_REQUIRE_KIBANA_FEATURE_PRIVILEGES_NAMING}: ${error.message}`);
  }

  return errors;
};

const checkRequireKbnFs = ({ filePath, absolutePath, sourceText, comments }) => {
  if (isRuleDisabledInFile(comments, RULE_REQUIRE_KBN_FS)) {
    return [];
  }

  if (!sourceText.includes('fs')) {
    return [];
  }

  try {
    const messages = requireKbnFsLinter.verify(
      sourceText,
      {
        parser: '@typescript-eslint/parser',
        noInlineConfig: true,
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
          ecmaFeatures: {
            jsx: true,
          },
        },
        rules: {
          [RULE_REQUIRE_KBN_FS]: ['error', REQUIRE_KBN_FS_OPTIONS],
        },
      },
      {
        filename: absolutePath,
      }
    );

    return messages
      .filter(
        (message) =>
          !message.message.includes(
            "has no effect because you have 'noInlineConfig' setting in your config"
          )
      )
      .map((message) => `${filePath}:${message.line}:${message.column}: ${message.message}`);
  } catch (error) {
    return [`${filePath}: Failed to evaluate ${RULE_REQUIRE_KBN_FS}: ${error.message}`];
  }
};

const isImportableFrom = (from, importedGroup, importedVisibility) => {
  const isDevOnly =
    !from.manifest ||
    Boolean(from.manifest?.devOnly) ||
    from.manifest?.type === 'functional-tests' ||
    from.manifest?.type === 'test-helper';

  return (
    (isDevOnly && importedGroup === 'platform') ||
    from.group === importedGroup ||
    importedVisibility === 'shared'
  );
};

const checkBoundaryCrossing = ({
  filePath,
  absolutePath,
  comments,
  resolver,
  classifier,
  resolveCache,
  importStatements,
  warnings,
}) => {
  if (isRuleDisabledInFile(comments, RULE_NO_BOUNDARY_CROSSING)) {
    return [];
  }

  const ownDirname = path.dirname(absolutePath);
  const self = classifier.classify(absolutePath);
  const importable = IMPORTABLE_FROM[self.type];
  if (importable === ANY) {
    return [];
  }

  const errors = [];
  for (const statement of importStatements) {
    if (!statement.request || statement.request.endsWith('?raw') || statement.isTypeOnly) {
      continue;
    }

    const result = resolveImportRequest({
      resolver,
      resolveCache,
      dirname: ownDirname,
      request: statement.request,
    });

    if (result?.type !== 'file' || result.nodeModule) {
      continue;
    }

    const imported = classifier.classify(result.absolute);
    if (importable.includes(imported.type)) {
      continue;
    }

    const message = `${filePath}:${statement.line}: "${imported.type}" code cannot be imported from "${self.type}" code.`;
    if (isImportRuleWarningOnly(RULE_NO_BOUNDARY_CROSSING, filePath)) {
      warnings.push(message);
      continue;
    }

    errors.push(message);
  }

  return errors;
};

const checkGroupCrossingImports = ({
  filePath,
  absolutePath,
  comments,
  resolver,
  classifier,
  resolveCache,
  importStatements,
  warnings,
}) => {
  if (isRuleDisabledInFile(comments, RULE_NO_GROUP_CROSSING_IMPORTS)) {
    return [];
  }

  const ownDirname = path.dirname(absolutePath);
  const self = classifier.classify(absolutePath);
  const errors = [];

  for (const statement of importStatements) {
    if (!statement.request || statement.request.endsWith('?raw')) {
      continue;
    }

    const result = resolveImportRequest({
      resolver,
      resolveCache,
      dirname: ownDirname,
      request: statement.request,
    });

    if (result?.type !== 'file' || result.nodeModule) {
      continue;
    }

    const imported = classifier.classify(result.absolute);
    if (isImportableFrom(self, imported.group, imported.visibility)) {
      continue;
    }

    const message = `${filePath}:${statement.line}: Illegal import: "${self.pkgInfo?.pkgId ?? 'unknown'}" (${self.group}) cannot import "${imported.pkgInfo?.pkgId ?? 'unknown'}" (${imported.group}/${imported.visibility}).`;
    if (isImportRuleWarningOnly(RULE_NO_GROUP_CROSSING_IMPORTS, filePath)) {
      warnings.push(message);
      continue;
    }

    errors.push(message);
  }

  return errors;
};

const checkUniformImports = ({
  filePath,
  absolutePath,
  comments,
  resolver,
  resolveCache,
  importStatements,
  warnings,
}) => {
  if (isRuleDisabledInFile(comments, RULE_UNIFORM_IMPORTS)) {
    return [];
  }

  const sourceDirname = path.dirname(absolutePath);
  const ownPackageId = resolver.getPackageIdForPath(absolutePath);
  const errors = [];

  for (const statement of importStatements) {
    if (!statement.request) {
      continue;
    }

    const result = resolveImportRequest({
      resolver,
      resolveCache,
      dirname: sourceDirname,
      request: statement.request,
    });

    if (result?.type !== 'file' || result.nodeModule) {
      continue;
    }

    const { pkgId } = result;

    let expected;
    if (pkgId === ownPackageId || !pkgId) {
      expected = getRelativeImportReq({
        ...result,
        original: statement.request,
        dirname: sourceDirname,
        sourcePath: absolutePath,
        type: statement.type,
      });
    } else {
      const packageDir = resolver.getAbsolutePackageDir(pkgId);
      if (!packageDir) {
        const message = `${filePath}:${statement.line}: Unable to determine location of package [${pkgId}]`;
        if (isImportRuleWarningOnly(RULE_UNIFORM_IMPORTS, filePath)) {
          warnings.push(message);
        } else {
          errors.push(message);
        }
        continue;
      }

      expected = getPackageRelativeImportReq({
        ...result,
        packageDir,
        pkgId,
        type: statement.type,
      });
    }

    if (statement.request === expected) {
      continue;
    }

    const message = `${filePath}:${statement.line}: Use import request [${expected}]`;
    if (isImportRuleWarningOnly(RULE_UNIFORM_IMPORTS, filePath)) {
      warnings.push(message);
      continue;
    }

    errors.push(message);
  }

  return errors;
};

const createManifestChecker = ({ classifier }) => {
  const checkedPluginPackageIds = new Set();
  const pluginPackagesByPluginId = new Map(
    getPackages(REPO_ROOT)
      .filter(getPluginPackagesFilter())
      .map((pkg) => [pkg.manifest.plugin.id, pkg])
  );

  return ({ filePath, absolutePath, warnings }) => {
    const self = classifier.classify(absolutePath);
    if (self.manifest?.type !== 'plugin' || !self.pkgInfo) {
      return [];
    }

    if (checkedPluginPackageIds.has(self.pkgInfo.pkgId)) {
      return [];
    }
    checkedPluginPackageIds.add(self.pkgInfo.pkgId);

    const pluginInfo = self.manifest.plugin;
    const dependencies = [
      ...(pluginInfo.requiredPlugins ?? []),
      ...(pluginInfo.requiredBundles ?? []),
      ...(pluginInfo.optionalPlugins ?? []),
      ...(pluginInfo.runtimePluginDependencies ?? []),
    ];
    if (dependencies.length === 0) {
      return [];
    }

    const manifestPath = normalizePath(path.join(path.relative(REPO_ROOT, self.pkgInfo.pkgDir), 'kibana.jsonc'));
    const errors = [];

    for (const dependencyPluginId of dependencies) {
      const dependencyPackage = pluginPackagesByPluginId.get(dependencyPluginId);
      if (!dependencyPackage) {
        continue;
      }

      if (isImportableFrom(self, dependencyPackage.group, dependencyPackage.visibility)) {
        continue;
      }

      const message = `${manifestPath}: Illegal manifest dependency: plugin "${pluginInfo.id}" (${self.group}) depends on "${dependencyPluginId}" (${dependencyPackage.group}/${dependencyPackage.visibility}).`;
      if (isImportRuleWarningOnly(RULE_NO_GROUP_CROSSING_MANIFESTS, filePath)) {
        warnings.push(message);
        continue;
      }

      errors.push(message);
    }

    return errors;
  };
};

run(
  async ({ log, flags }) => {
    const files = getCandidateFiles(flags._.map(normalizePath));
    const eslintConfig = loadRootEslintConfig();
    const isLegacyIgnored = createLegacyEslintIgnoreMatcher();
    const resolver = ImportResolver.create(REPO_ROOT);
    const classifier = new RepoSourceClassifier(resolver);
    const checkGroupCrossingManifests = createManifestChecker({ classifier });
    const resolveCache = new Map();
    const requireImportPolicies = loadRequireImportPolicies();
    const scoutFileNamingGlobs = loadScoutFileNamingGlobs(eslintConfig);
    const noUnresolvableOffGlobs = loadNoUnresolvableImportOffGlobs(eslintConfig);
    const licensePolicies = loadLicensePolicies(eslintConfig);
    const errors = [];
    const warnings = [];
    let filesChecked = 0;

    for (const filePath of files) {
      const runScoutCheck =
        isTypeScriptSourceFile(filePath) && matchesAny(filePath, scoutFileNamingGlobs);
      const runRequireImportCheck = requireImportPolicies.some((policy) =>
        matchesAny(filePath, policy.files)
      );
      const isEslintIgnored = isLegacyIgnored(filePath);
      const runNoUnresolvableCheck =
        !isEslintIgnored && !matchesAny(filePath, noUnresolvableOffGlobs);
      const licensePolicy = getLicensePolicyForFile(filePath, licensePolicies);
      const runLicenseCheck = !isEslintIgnored && Boolean(licensePolicy);
      const runBoundaryCheck =
        !isEslintIgnored && isImportRuleEnabled(RULE_NO_BOUNDARY_CROSSING, filePath);
      const runGroupImportCheck =
        !isEslintIgnored && isImportRuleEnabled(RULE_NO_GROUP_CROSSING_IMPORTS, filePath);
      const runGroupManifestCheck =
        !isEslintIgnored && isImportRuleEnabled(RULE_NO_GROUP_CROSSING_MANIFESTS, filePath);
      const runUniformImportsCheck =
        !isEslintIgnored && isImportRuleEnabled(RULE_UNIFORM_IMPORTS, filePath);
      const runRequireKibanaFeaturePrivilegesNamingCheck = !isEslintIgnored;
      const runRequireKbnFsCheck = !isEslintIgnored && shouldRunRequireKbnFsRule(filePath);

      if (
        !runScoutCheck &&
        !runRequireImportCheck &&
        !runNoUnresolvableCheck &&
        !runLicenseCheck &&
        !runBoundaryCheck &&
        !runGroupImportCheck &&
        !runGroupManifestCheck &&
        !runUniformImportsCheck &&
        !runRequireKibanaFeaturePrivilegesNamingCheck &&
        !runRequireKbnFsCheck
      ) {
        continue;
      }

      filesChecked += 1;
      const absolutePath = path.resolve(REPO_ROOT, filePath);
      if (!isFile(absolutePath)) {
        continue;
      }

      const sourceText = fs.readFileSync(absolutePath, 'utf8');
      const comments = scanComments(sourceText);
      const runImportStatementChecks =
        runBoundaryCheck || runGroupImportCheck || runUniformImportsCheck || runNoUnresolvableCheck;
      const importStatements =
        runImportStatementChecks &&
        (sourceText.includes('import') ||
          sourceText.includes('export') ||
          sourceText.includes('require') ||
          sourceText.includes('jest.'))
          ? extractImportStatements(sourceText, absolutePath)
          : [];

      if (runScoutCheck) {
        errors.push(...checkScoutTestFileNaming(filePath, scoutFileNamingGlobs));
      }

      if (runRequireImportCheck) {
        errors.push(...checkRequiredTypeReferences(filePath, sourceText, requireImportPolicies));
      }

      if (runLicenseCheck) {
        errors.push(...checkLicenseHeaders(filePath, sourceText, comments, licensePolicy));
      }

      if (runNoUnresolvableCheck) {
        errors.push(
          ...checkNoUnresolvableImports({
            filePath,
            comments,
            resolver,
            resolveCache,
            importStatements,
          })
        );
      }

      if (runBoundaryCheck) {
        errors.push(
          ...checkBoundaryCrossing({
            filePath,
            absolutePath,
            comments,
            resolver,
            classifier,
            resolveCache,
            importStatements,
            warnings,
          })
        );
      }

      if (runGroupImportCheck) {
        errors.push(
          ...checkGroupCrossingImports({
            filePath,
            absolutePath,
            comments,
            resolver,
            classifier,
            resolveCache,
            importStatements,
            warnings,
          })
        );
      }

      if (runUniformImportsCheck) {
        errors.push(
          ...checkUniformImports({
            filePath,
            absolutePath,
            comments,
            resolver,
            resolveCache,
            importStatements,
            warnings,
          })
        );
      }

      if (runGroupManifestCheck) {
        errors.push(
          ...checkGroupCrossingManifests({
            filePath,
            absolutePath,
            warnings,
          })
        );
      }

      if (runRequireKibanaFeaturePrivilegesNamingCheck) {
        errors.push(
          ...checkRequireKibanaFeaturePrivilegesNaming({
            filePath,
            absolutePath,
            sourceText,
            comments,
            warnings,
          })
        );
      }

      if (runRequireKbnFsCheck) {
        errors.push(
          ...checkRequireKbnFs({
            filePath,
            absolutePath,
            sourceText,
            comments,
          })
        );
      }
    }

    if (warnings.length > 0) {
      for (const warning of warnings) {
        log.warning(warning);
      }
    }

    if (errors.length > 0) {
      for (const error of errors) {
        log.error(error);
      }
      process.exit(1);
    }

    if (!flags.quiet && !flags.silent) {
      log.success(`Custom lint checks passed on ${filesChecked} files.`);
    }
  },
  {
    description: 'Run custom non-JS-plugin lint checks for Kibana-specific rules',
    usage: 'node scripts/lint_custom_rules.js [options] [<file>...]',
    flags: {
      allowUnexpected: true,
      boolean: ['quiet', 'silent'],
    },
  }
);
