# Imports and Rendering

## Import changes

Before:

```ts
import { shallow, mount } from 'enzyme';
import { shallowWithIntl, mountWithIntl, findTestSubject } from '@kbn/test-jest-helpers';
```

After:

```ts
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
```

Keep `@kbn/test-jest-helpers` only for non-Enzyme utilities and RTL render helpers like
`renderWithKibanaRenderContext`, `renderWithI18n`, and `renderWithEuiTheme`.

## Preferred render helpers

When the component needs Kibana context, prefer existing RTL helpers instead of hand-rolled
provider stacks:

| Helper | Wraps with |
| --- | --- |
| `renderWithKibanaRenderContext(<Comp />)` | `EuiThemeProvider` + `I18nProvider` |
| `renderWithI18n(<Comp />)` | `I18nProvider` only |
| `renderWithEuiTheme(<Comp />)` | `EuiThemeProvider` only |

These are drop-in replacements for RTL `render()` and accept the same render options.

## Rendering equivalents

| Enzyme | RTL |
| --- | --- |
| `shallow(<Comp />)` | `render(<Comp />)` or `renderWithKibanaRenderContext(<Comp />)` |
| `mount(<Comp />)` | `render(<Comp />)` or `renderWithKibanaRenderContext(<Comp />)` |
| `shallowWithIntl(<Comp />)` | `renderWithI18n(<Comp />)` or `renderWithKibanaRenderContext(<Comp />)` |
| `mountWithIntl(<Comp />)` | `renderWithI18n(<Comp />)` or `renderWithKibanaRenderContext(<Comp />)` |

Use `screen` for most queries because it searches `document.body`, which means portals are still
reachable.
