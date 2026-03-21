# Design: Replace `position.board` with Position public API

**Date:** 2026-03-19 **Status:** Approved

## Summary

Replace all 15 `position.board` references in `src/index.ts` with the correct
public API methods from the `Position` class. Use `new Position()` constructor
for board simulation in `applyMoveToBoard`.

## Problem

`Position` is a class with a private `#board` field. The code accesses
`position.board` which does not exist on the public API. This causes 22+
TypeScript errors and 14 runtime test failures.

## Replacements

| Pattern                                 | Replacement                                    |
| --------------------------------------- | ---------------------------------------------- |
| `position.board.get(sq)`                | `position.piece(sq)`                           |
| `position.board.has(sq)`                | `position.piece(sq) !== undefined`             |
| `new Map(position.board)`               | `position.pieces()`                            |
| `for (const [sq, p] of position.board)` | `for (const [sq, p] of position.pieces())`     |
| `boardFromMap(position.board)`          | `boardFromMap(position.pieces())`              |
| `[...position.board.keys()]`            | `[...position.pieces().keys()]`                |
| `{ ...position, board, ... }`           | `new Position(board, { castlingRights, ... })` |

## Import change

`Position` moves from `import type` to a value import so it can be instantiated
with `new Position(...)`.

## Expected outcome

- All TypeScript errors resolve
- All 29 tests pass
- No public API changes

## Breaking changes

None. Purely internal refactor.
