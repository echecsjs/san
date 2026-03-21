# Design: `parse()` overload with optional position

**Date:** 2026-03-19 **Status:** Approved

## Summary

Add a second overload to `parse` that accepts an optional `Position`. When
provided, it parses the SAN string and resolves it in one call, returning a
`Move` instead of a `SanMove`.

## Motivation

Currently consumers need two calls to go from a SAN string to a resolved move:

```typescript
const sanMove = parse('Nf3');
const move = resolve(sanMove, position);
```

With the overload, this becomes:

```typescript
const move = parse('Nf3', position);
```

## API

```typescript
function parse(san: string): SanMove;
function parse(san: string, position: Position): Move;
```

## Implementation

The existing parse logic is unchanged. The implementation function gains an
optional `position` parameter. When present, it calls
`resolve(sanMove, position)` internally and returns the result. No logic
duplication.

## Public API after change

| Export             | Change                   |
| ------------------ | ------------------------ |
| `parse`            | Updated — new overload   |
| `resolve`          | Unchanged — stays public |
| `stringify`        | Unchanged                |
| `SanMove`          | Unchanged                |
| `Move`, `Position` | Unchanged (re-exports)   |

## Error behavior

When position is provided, `parse` can also throw the `RangeError`s that
`resolve` throws (no legal move found, ambiguous move). This is expected — the
caller opted into resolution.

## Tests

- `parse("e4", STARTING_POSITION)` returns `Move { from: 'e2', to: 'e4' }`
- `parse("Nf3", STARTING_POSITION)` returns `Move { from: 'g1', to: 'f3' }`
- `parse("e4")` still returns `SanMove` (existing tests unchanged)

## Breaking changes

None. Existing callers of `parse(san)` are unaffected.
