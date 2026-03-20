# Props, Async Updates, and Snapshots

## Child-component prop assertions

Replace `.find(Component).prop('x')` / `.props()` with mocks plus mock-call assertions:

```ts
jest.mock('@elastic/charts', () => {
  const actual = jest.requireActual('@elastic/charts');
  return {
    ...actual,
    AreaSeries: jest.fn(() => <div data-test-subj="area-series-mock" />),
    Axis: jest.fn(() => <div data-test-subj="axis-mock" />),
  };
});

const MockedAreaSeries = jest.mocked(AreaSeries);
const MockedAxis = jest.mocked(Axis);

expect(MockedAreaSeries.mock.calls[0][0].yScaleType).toEqual(configs.series.yScaleType);
expect(MockedAxis).toHaveBeenCalledWith(
  expect.objectContaining({ tickFormat: mockTimeFormatter }),
  expect.anything()
);
```

Clear mocks in `beforeEach` with `jest.clearAllMocks()`.

## Events and async updates

Common conversions:

| Enzyme | RTL |
| --- | --- |
| `.simulate('click')` | `fireEvent.click(element)` |
| `.simulate('change', { target: { value: 'x' } })` | `fireEvent.change(input, { target: { value: 'x' } })` |
| `wrapper.update()` | Wait for the next UI boundary |

Rules:

- Prefer `findBy*` for async appearance
- Use `waitFor` when you need a custom assertion
- Use `waitForElementToBeRemoved` for disappearance
- Use `act()` only for explicit timer advancement or imperative React updates
- Do not wrap ordinary `fireEvent` / `userEvent` calls in `act()`

## Snapshot strategy

Default migration:

```ts
expect(container.children[0]).toMatchSnapshot();
```

Rules:

- RTL snapshots are larger; do not add mocks only to shrink them
- Delete old `.snap` files and regenerate with `--updateSnapshot`
- Prefer targeted assertions when the snapshot is noisy or low-signal

Portal-based components must use targeted assertions, not snapshots, because the interesting DOM
often lives outside `container`.

```ts
expect(screen.getByText('Panel Title')).toBeInTheDocument();
expect(document.querySelector('[data-test-subj="confirmModal"]')).toBeInTheDocument();
```
