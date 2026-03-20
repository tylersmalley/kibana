# Selectors and Assertions

## Test subject selectors

In Kibana Jest setup, RTL uses `testIdAttribute: 'data-test-subj'`, so `getByTestId('x')` queries
`data-test-subj="x"`.

| Enzyme | RTL |
| --- | --- |
| `wrapper.find('[data-test-subj="x"]')` | `screen.getByTestId('x')` |
| `findTestSubject(wrapper, 'x')` | `screen.getByTestId('x')` |
| `wrapper.find('[data-test-subj="x"]').exists()` | `screen.queryByTestId('x')` |
| Nested `find('[data-test-subj="a"] [data-test-subj="b"]')` | `within(screen.getByTestId('a')).getByTestId('b')` |

If `data-test-subj` has multiple tokens, preserve token-match semantics with a `RegExp` matcher.

For async updates, prefer `findByTestId` over `getByTestId`.

## Kibana selector fallback

Prefer RTL queries first. When you truly need test-subject selector syntax as CSS, use `subj()`:

```ts
import { subj } from '@kbn/test-subj-selector';

const el = container.querySelector(subj('foo > ~bar'));
```

## CSS selectors

| Enzyme | RTL |
| --- | --- |
| `wrapper.find('.my-class')` | `container.querySelector('.my-class')` |
| `wrapper.find('button')` | `screen.getByRole('button')` or `container.querySelector('button')` |
| `wrapper.findAll('.item')` | `container.querySelectorAll('.item')` |

Complex chained traversals usually become straightforward DOM queries:

```ts
const links = container.querySelectorAll('tbody tr td a');
const text = links[3]?.querySelectorAll('div span')[2]?.textContent;
```

## Portal queries

Portal content renders outside the local `container`. Use `screen` or `within(document.body)`:

```ts
expect(screen.getByTestId('modal-confirm')).toBeInTheDocument();
within(document.body).getByTestId('modal-confirm');
```

## Assertion conversion

| Enzyme | RTL |
| --- | --- |
| `wrapper.text()` | `screen.getByText('...')` or `element.textContent` |
| `wrapper.find(X).exists()` | Query DOM output instead of React component instances |
| `wrapper.find(X).length` | `querySelectorAll(...).length` or repeated DOM queries |
| `wrapper.setProps({ foo: 'bar' })` | `rerender(<Comp foo="bar" />)` |

When Enzyme asserted on React component types like `wrapper.find(EuiCallOut)`, rewrite the test to
assert on the rendered DOM output instead of component identity.
