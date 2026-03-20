---
name: enzyme-to-rtl
description: Migrate Enzyme tests to React Testing Library (RTL). Use when converting shallow/mount enzyme tests to RTL render, replacing enzyme selectors with RTL queries, updating snapshot tests, or when the user mentions enzyme migration, RTL migration, or react-testing-library.
disable-model-invocation: true
---

# Enzyme to React Testing Library Migration

## Goal

Migrate enzyme tests to `@testing-library/react` as a 1:1 port — preserve existing test intent without refactoring toward integration-style testing or removing mocks.

## Core principles

- **Preserve test intent.** Do not rewrite test logic or remove mocks. Add mocks where enzyme's shallow rendering previously hid missing providers/contexts.
- **Cut dead tests.** Enzyme tests component trees, not DOM. Tests that assert on elements never actually rendered in the DOM should be removed with a comment explaining why.
- **No new `data-test-subj` for snapshots.** Use `container.children[0]` for root-element snapshots instead of adding a test locator just for snapshotting.

## Migration workflow

1. Convert imports and rendering.
   - Read `references/imports_and_rendering.md`.
2. Convert selectors and assertions.
   - Read `references/selectors_and_assertions.md`.
3. Convert component-prop tests, async flows, and snapshots.
   - Read `references/props_async_and_snapshots.md`.
4. Scan for migration traps before finishing.
   - Read `references/common_pitfalls.md`.
5. Run the test, then regenerate or delete snapshots as needed.
   - `yarn test:jest <path-to-test-file> --updateSnapshot`

## Fast mappings

- `shallow()` / `mount()` -> `render()` or Kibana RTL helpers
- `findTestSubject(...)` -> `screen.getByTestId(...)` / `queryByTestId(...)`
- `.simulate()` -> `fireEvent` for simple cases, `userEvent` when hover / keystroke semantics matter
- `.prop()` / `.props()` -> mock the child component and inspect mock calls
- `wrapper.update()` -> wait on a real UI boundary with `findBy*`, `waitFor`, or
  `waitForElementToBeRemoved`

## Decision guide

- Missing providers, `mountWithIntl`, or render helper questions:
  `references/imports_and_rendering.md`
- `findTestSubject`, CSS selectors, DOM assertions, or portal queries:
  `references/selectors_and_assertions.md`
- `.prop()`, `.simulate()`, `wrapper.update()`, snapshots, or `act()` warnings:
  `references/props_async_and_snapshots.md`
- EUI-heavy suites, portal issues, fake timers, or `userEvent` performance:
  `references/common_pitfalls.md`

## Running tests

```bash
yarn test:jest <path-to-test-file> --updateSnapshot
```

## Checklist

- [ ] All `enzyme` imports removed
- [ ] All `shallow()` / `mount()` replaced with `render()`
- [ ] `shallowWithIntl` / `mountWithIntl` replaced with `render()` + `I18nProvider` wrapper
- [ ] `findTestSubject` replaced with equivalent selector semantics (exact vs token `~=` match)
- [ ] Selectors migrated to RTL queries or `container.querySelector`
- [ ] `.simulate()` replaced with `userEvent` or `fireEvent`
- [ ] `.prop()` / `.props()` replaced with mock-based pattern
- [ ] Snapshots regenerated
- [ ] Dead tests (passing only due to shallow rendering) removed
- [ ] Test passes: `yarn test:jest <path>`

## References

- Imports, render helpers, and provider wrapping: `references/imports_and_rendering.md`
- Selector and assertion conversion: `references/selectors_and_assertions.md`
- Child-component props, async flows, and snapshots: `references/props_async_and_snapshots.md`
- Common migration failures and performance traps: `references/common_pitfalls.md`
- [Migrate from Enzyme | Testing Library](https://testing-library.com/docs/react-testing-library/migrate-from-enzyme/)
