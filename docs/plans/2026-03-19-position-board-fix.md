# Position Board Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task.

**Goal:** Replace all `position.board` accesses with the `Position` class public
API so TypeScript compiles and tests pass.

**Architecture:** Mechanical replacement of 15 `position.board` references in
`src/index.ts` with `position.piece()`, `position.pieces()`, and
`new Position()` constructor calls. No logic changes.

**Tech Stack:** TypeScript, `@echecs/position`

---

### Task 1: Fix imports — move Position to value import

**Files:**

- Modify: `src/index.ts:11-21`

**Step 1: Update imports**

Move `Position` from the type-only import to the value import. Currently:

```typescript
import type {
  Color,
  File,
  Move,
  Piece,
  PieceType,
  Position,
  PromotionPieceType,
  Rank,
  Square,
} from '@echecs/position';
```

Change to:

```typescript
import { Position } from '@echecs/position';

import type {
  Color,
  File,
  Move,
  Piece,
  PieceType,
  PromotionPieceType,
  Rank,
  Square,
} from '@echecs/position';
```

**Step 2: Verify**

Run: `pnpm test` Expected: Same failures as before (import change alone doesn't
fix anything yet).

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "refactor: import Position as value for constructor usage"
```

---

### Task 2: Fix `applyMoveToBoard`

**Files:**

- Modify: `src/index.ts` — the `applyMoveToBoard` function (around lines
  114-142)

**Step 1: Replace the function body**

Current code:

```typescript
function applyMoveToBoard(
  position: Position,
  from: Square,
  to: Square,
  promotion?: PromotionPieceType,
): Position {
  const board = new Map(position.board);
  const p = board.get(from);
  if (p === undefined) {
    return position;
  }

  board.delete(from);

  // En passant capture
  if (p.type === 'p' && to === position.enPassantSquare) {
    const epRank =
      position.turn === 'w'
        ? String(Number(to[1]) - 1)
        : String(Number(to[1]) + 1);
    board.delete(`${to[0]}${epRank}` as Square);
  }

  const finalPiece: Piece = promotion ? { color: p.color, type: promotion } : p;
  board.set(to, finalPiece);

  const turn: Color = position.turn === 'w' ? 'b' : 'w';
  return { ...position, board, enPassantSquare: undefined, turn };
}
```

Replace with:

```typescript
function applyMoveToBoard(
  position: Position,
  from: Square,
  to: Square,
  promotion?: PromotionPieceType,
): Position {
  const board = position.pieces();
  const p = board.get(from);
  if (p === undefined) {
    return position;
  }

  board.delete(from);

  // En passant capture
  if (p.type === 'p' && to === position.enPassantSquare) {
    const epRank =
      position.turn === 'w'
        ? String(Number(to[1]) - 1)
        : String(Number(to[1]) + 1);
    board.delete(`${to[0]}${epRank}` as Square);
  }

  const finalPiece: Piece = promotion ? { color: p.color, type: promotion } : p;
  board.set(to, finalPiece);

  const turn: Color = position.turn === 'w' ? 'b' : 'w';
  return new Position(board, {
    castlingRights: position.castlingRights,
    enPassantSquare: undefined,
    turn,
  });
}
```

Changes:

- `new Map(position.board)` → `position.pieces()` (already returns a new Map)
- `{ ...position, board, enPassantSquare: undefined, turn }` →
  `new Position(board, { castlingRights, enPassantSquare: undefined, turn })`

**Step 2: Commit**

```bash
git add src/index.ts
git commit -m "refactor: use Position constructor in applyMoveToBoard"
```

---

### Task 3: Fix `findKing` and `isKingInCheck`

**Files:**

- Modify: `src/index.ts` — `findKing` and `isKingInCheck` functions

**Step 1: Fix `findKing`**

Replace `position.board` with `position.pieces()`:

```typescript
function findKing(position: Position, color: Color): Square | undefined {
  for (const [square, p] of position.pieces()) {
    if (p.type === 'k' && p.color === color) {
      return square;
    }
  }
  return undefined;
}
```

**Step 2: Fix `isKingInCheck`**

Replace both `position.board` references:

```typescript
function isKingInCheck(position: Position, color: Color): boolean {
  const kingSquare = findKing(position, color);
  if (kingSquare === undefined) {
    return false;
  }

  const board = boardFromMap(position.pieces());
  const targetIndex = squareToIndex(kingSquare);
  const opponent: Color = color === 'w' ? 'b' : 'w';

  for (const [sq, p] of position.pieces()) {
    if (p.color !== opponent) {
      continue;
    }
    const fromIndex = squareToIndex(sq);
    if (canAttack(board, fromIndex, targetIndex, p.type, p.color)) {
      return true;
    }
  }
  return false;
}
```

**Step 3: Run tests**

Run: `pnpm test` Expected: `resolve` tests may now pass (these helpers are used
by resolve).

**Step 4: Commit**

```bash
git add src/index.ts
git commit -m "refactor: use Position public API in findKing and isKingInCheck"
```

---

### Task 4: Fix `resolve`

**Files:**

- Modify: `src/index.ts` — the `resolve` function

**Step 1: Replace `position.board` references in resolve**

Two occurrences:

- `boardFromMap(position.board)` → `boardFromMap(position.pieces())`
- `for (const [square, p] of position.board)` →
  `for (const [square, p] of position.pieces())`

**Step 2: Run tests**

Run: `pnpm test` Expected: All `resolve` tests pass (6 tests).

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "refactor: use Position public API in resolve"
```

---

### Task 5: Fix `stringify`

**Files:**

- Modify: `src/index.ts` — the `stringify` function

**Step 1: Replace all `position.board` references in stringify**

Four occurrences:

- `position.board.get(move.from)` → `position.piece(move.from)`
- `position.board.has(move.to)` → `position.piece(move.to) !== undefined`
- `boardFromMap(position.board)` → `boardFromMap(position.pieces())`
- `for (const [sq, other] of position.board)` →
  `for (const [sq, other] of position.pieces())`

**Step 2: Run tests**

Run: `pnpm test` Expected: All `stringify` tests pass (6 tests).

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "refactor: use Position public API in stringify"
```

---

### Task 6: Fix `isCheckmate`

**Files:**

- Modify: `src/index.ts` — the `isCheckmate` function

**Step 1: Replace all `position.board` references in isCheckmate**

Five occurrences:

- `for (const [from, p] of position.board)` →
  `for (const [from, p] of position.pieces())`
- `boardFromMap(position.board)` → `boardFromMap(position.pieces())`
- `position.board.get(...)` → `position.piece(...)`
- `[...position.board.keys()].find(...)` →
  `[...position.pieces().keys()].find(...)`
- `for (const sq of position.board.keys())` →
  `for (const sq of position.pieces().keys())`

**Step 2: Run tests**

Run: `pnpm test` Expected: All 29 tests pass.

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "refactor: use Position public API in isCheckmate"
```

---

### Task 7: Verify everything passes

**Step 1: Run full check**

```bash
pnpm lint && pnpm test && pnpm build
```

Expected: All pass — 0 TypeScript errors, 29 tests green, build succeeds.

**Step 2: Commit any auto-fix changes if needed**

```bash
git add -A && git commit -m "style: apply lint fixes"
```
