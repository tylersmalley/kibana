# Common Pitfalls

## Missing providers after removing `shallow`

`shallow` hides missing context providers. After switching to `render()`, add the required i18n,
theme, router, Redux, or custom providers, or mock those dependencies explicitly.

## EUI-heavy suites

Some EUI components render a large DOM or need stable mocks. Prefer shared mocks when available,
then plugin-local `__mocks__/`, then inline mocks as a fallback. If you stub to `<div>`, only add
`data-test-subj` when the test needs a stable query.

## Portal-based elements

Modals, toasts, popovers, and tooltips often render outside `container`. Use `screen` or
`document.querySelector`, and avoid snapshots for those cases.

## `act()` warnings

Most `act()` warnings mean the interaction or async boundary was not awaited. Tighten the test to
wait on the actual UI change instead of raising timeouts or adding empty `act()` blocks.

## `userEvent` performance

`userEvent` simulates full event sequences and can be expensive in CI. Prefer `fireEvent` for
simple clicks and direct value changes. Use `userEvent` when the behavior depends on hover,
per-keystroke handlers, input masking, typeahead suggestions, or similar semantics.

When a full-value update is enough, `userEvent.paste` can be cheaper than `userEvent.type`.

## Fake timers

When the suite uses fake timers and `userEvent`, configure it explicitly:

```ts
const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
```
