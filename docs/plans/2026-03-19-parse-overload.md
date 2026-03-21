# `parse()` Overload Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task.

**Goal:** Add a function overload to `parse` so it accepts an optional
`Position` and returns a `Move` when provided.

**Architecture:** Add TypeScript overload signatures to `parse`. When `position`
is provided, delegate to `resolve()` internally. No logic duplication — just
composition.

**Tech Stack:** TypeScript, vitest

---

### Task 1: Write the failing tests

**Files:**

- Modify: `src/__tests__/index.spec.ts`

**Step 1: Add test cases for the new overload**

Add a new `describe` block after the existing `parse` tests (after line 110):

```typescript
describe('parse — with position (overload)', () => {
  it('resolves e4 from starting position', () => {
    const move = parse('e4', STARTING_POSITION);
    expect(move.from).toBe('e2');
    expect(move.to).toBe('e4');
    expect(move.promotion).toBeUndefined();
  });

  it('resolves Nf3 from starting position', () => {
    const move = parse('Nf3', STARTING_POSITION);
    expect(move.from).toBe('g1');
    expect(move.to).toBe('f3');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test` Expected: The two new tests FAIL because `parse` does not
accept a second argument and the return type does not have `from`.

**Step 3: Commit**

```bash
git add src/__tests__/index.spec.ts
git commit -m "test: add failing tests for parse(san, position) overload"
```

---

### Task 2: Implement the overload

**Files:**

- Modify: `src/index.ts:155` (the `parse` function)

**Step 1: Add overload signatures and update implementation**

Replace the current `parse` function signature (line 155) with:

```typescript
function parse(san: string): SanMove;
function parse(san: string, position: Position): Move;
function parse(san: string, position?: Position): SanMove | Move {
```

**Step 2: Add the delegation at the end of `parse`, before the final return**

Right before the final `return` statement at line 236, add:

```typescript
const sanMove: SanMove = {
  capture,
  castle: undefined,
  check,
  file,
  piece,
  promotion,
  rank,
  to,
};

if (position !== undefined) {
  return resolve(sanMove, position);
}

return sanMove;
```

Also update the two castling early-returns (around lines 170 and 188). Each
currently returns a `SanMove` literal directly. Wrap them:

```typescript
  // For each castling branch, replace `return { ... }` with:
  const sanMove: SanMove = { ... };
  if (position !== undefined) {
    return resolve(sanMove, position);
  }
  return sanMove;
```

Note: The variable `sanMove` will shadow in each branch — rename to avoid lint
issues. Use the existing object literal inline and only extract when needed. The
simplest approach: build the `SanMove`, then check `position` at the end of each
return path.

**Step 3: Run tests to verify they pass**

Run: `pnpm test` Expected: The two new tests PASS. All existing parse tests
still PASS.

**Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: add parse(san, position) overload returning Move"
```

---

### Task 3: Update AGENTS.md API table

**Files:**

- Modify: `AGENTS.md`

**Step 1: Update the function table**

Update the `parse` row in the API table to reflect both signatures:

| Function               | Input                   | Output    | Throws                                |
| ---------------------- | ----------------------- | --------- | ------------------------------------- |
| `parse(san)`           | SAN string              | `SanMove` | `RangeError` on empty/invalid input   |
| `parse(san, position)` | SAN string + `Position` | `Move`    | `RangeError` on empty/invalid/illegal |

**Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update AGENTS.md for parse overload"
```
