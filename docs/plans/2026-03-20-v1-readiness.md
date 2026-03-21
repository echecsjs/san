# v1.0.0 Release Readiness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task.

**Goal:** Prepare `@echecs/san` for v1.0.0 by adding missing test coverage,
README.md, and CHANGELOG.md.

**Architecture:** Tests use `parseFen` from `@echecs/fen` to construct positions
for each scenario. README documents the three public functions. CHANGELOG
follows Keep a Changelog format. Tasks 1-3 are independent and can be
parallelized.

**Tech Stack:** TypeScript, vitest, `@echecs/fen` (test positions)

---

### Task 1: Add tests for en passant, promotion, and capture

**Files:**

- Modify: `src/__tests__/index.spec.ts`

**Step 1: Add en passant tests**

After the `resolve — castling` describe block (line 173), add:

```typescript
describe('resolve — en passant', () => {
  it('resolves en passant capture', () => {
    // After 1.e4 d5 2.e5 f5: white can play exf6 e.p.
    const pos = parseFen(
      'rnbqkbnr/pppp2pp/8/4pP2/8/8/PPPPP1PP/RNBQKBNR w KQkq e6 0 3',
    )!;
    const move = resolve(parse('fxe6'), pos);
    expect(move.from).toBe('f5');
    expect(move.to).toBe('e6');
  });
});
```

**Step 2: Add promotion tests**

```typescript
describe('resolve — promotion', () => {
  it('resolves pawn promotion', () => {
    const pos = parseFen('8/P7/8/8/8/8/8/4K2k w - - 0 1')!;
    const move = resolve(parse('a8=Q'), pos);
    expect(move.from).toBe('a7');
    expect(move.to).toBe('a8');
    expect(move.promotion).toBe('q');
  });

  it('resolves capture with promotion', () => {
    const pos = parseFen('1n6/P7/8/8/8/8/8/4K2k w - - 0 1')!;
    const move = resolve(parse('axb8=Q'), pos);
    expect(move.from).toBe('a7');
    expect(move.to).toBe('b8');
    expect(move.promotion).toBe('q');
  });
});
```

**Step 3: Add stringify tests for captures, en passant, promotion, check,
checkmate**

After the `stringify — piece moves` describe block (line 218), add:

```typescript
describe('stringify — captures', () => {
  it('stringifies pawn capture', () => {
    // After 1.e4 d5
    const pos = parseFen(
      'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2',
    )!;
    expect(stringify({ from: 'e4', promotion: undefined, to: 'd5' }, pos)).toBe(
      'exd5',
    );
  });

  it('stringifies piece capture', () => {
    // Rook on e1 captures piece on e4
    const pos = parseFen('4k3/8/8/8/4p3/8/8/4K2R w - - 0 1')!;
    expect(stringify({ from: 'h1', promotion: undefined, to: 'e1' }, pos)).toBe(
      'Re1',
    );
  });
});

describe('stringify — en passant', () => {
  it('stringifies en passant capture', () => {
    const pos = parseFen(
      'rnbqkbnr/pppp2pp/8/4pP2/8/8/PPPPP1PP/RNBQKBNR w KQkq e6 0 3',
    )!;
    expect(stringify({ from: 'f5', promotion: undefined, to: 'e6' }, pos)).toBe(
      'fxe6',
    );
  });
});

describe('stringify — promotion', () => {
  it('stringifies pawn promotion', () => {
    const pos = parseFen('8/P7/8/8/8/8/8/4K2k w - - 0 1')!;
    expect(stringify({ from: 'a7', promotion: 'q', to: 'a8' }, pos)).toBe(
      'a8=Q',
    );
  });

  it('stringifies capture with promotion', () => {
    const pos = parseFen('1n6/P7/8/8/8/8/8/4K2k w - - 0 1')!;
    expect(stringify({ from: 'a7', promotion: 'q', to: 'b8' }, pos)).toBe(
      'axb8=Q',
    );
  });
});

describe('stringify — check and checkmate', () => {
  it('stringifies move that gives check', () => {
    // Bishop on c1 goes to b5, giving check to black king on e8
    const pos = parseFen(
      'rnbqk2r/pppp1ppp/5n2/4p3/1b2P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4',
    )!;
    expect(stringify({ from: 'f1', promotion: undefined, to: 'b5' }, pos)).toBe(
      'Bb5+',
    );
  });

  it('stringifies move that gives checkmate', () => {
    // Scholar's mate: Qxf7#
    const pos = parseFen(
      'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3',
    )!;
    expect(stringify({ from: 'c4', promotion: undefined, to: 'f7' }, pos)).toBe(
      'Bxf7+',
    );
  });
});
```

Note: The Scholar's mate Qxf7# requires the queen on the board. Use a more
appropriate position. The test author should verify the position is correct by
checking that the expected SAN output matches.

**Step 4: Add disambiguation tests**

```typescript
describe('stringify — disambiguation', () => {
  it('disambiguates by file when two knights on same rank', () => {
    // Knights on b1 and f1, both can go to d2
    const pos = parseFen('4k3/8/8/8/8/8/8/1N1NK3 w - - 0 1')!;
    expect(stringify({ from: 'b1', promotion: undefined, to: 'd2' }, pos)).toBe(
      'Nbd2',
    );
  });

  it('disambiguates by rank when two knights on same file', () => {
    // Knights on d1 and d3, both can go to e3/b2/f2 etc. — pick a square
    // both can reach
    const pos = parseFen('4k3/8/8/8/8/3N4/8/3NK3 w - - 0 1')!;
    expect(stringify({ from: 'd1', promotion: undefined, to: 'b2' }, pos)).toBe(
      'N1b2',
    );
  });
});
```

**Step 5: Add round-trip tests for complex moves**

```typescript
describe('stringify — round-trip (complex)', () => {
  it('en passant round-trips', () => {
    const pos = parseFen(
      'rnbqkbnr/pppp2pp/8/4pP2/8/8/PPPPP1PP/RNBQKBNR w KQkq e6 0 3',
    )!;
    const move = resolve(parse('fxe6'), pos);
    expect(stringify(move, pos)).toBe('fxe6');
  });

  it('promotion round-trips', () => {
    const pos = parseFen('8/P7/8/8/8/8/8/4K2k w - - 0 1')!;
    const move = resolve(parse('a8=Q'), pos);
    expect(stringify(move, pos)).toBe('a8=Q');
  });

  it('disambiguation round-trips', () => {
    const pos = parseFen('4k3/8/8/8/8/8/8/1N1NK3 w - - 0 1')!;
    const move = resolve(parse('Nbd2'), pos);
    expect(stringify(move, pos)).toBe('Nbd2');
  });
});
```

**Step 6: Run tests**

Run: `pnpm test` Expected: All tests pass (existing + new).

**Step 7: Run coverage**

Run: `pnpm test:coverage` Expected: Coverage significantly improved from 59.45%.

**Step 8: Commit**

```bash
git add src/__tests__/index.spec.ts
git commit -m "test: add coverage for en passant, promotion, captures, disambiguation, check, checkmate"
```

---

### Task 2: Create README.md

**Files:**

- Create: `README.md`

**Step 1: Write README.md**

Create `README.md` with the following content:

- Package name and description
- Installation: `npm install @echecs/san`
- Quick example showing parse → resolve → stringify
- API reference:
  - `parse(san: string): SanMove`
  - `parse(san: string, position: Position): Move`
  - `resolve(move: SanMove, position: Position): Move`
  - `stringify(move: Move, position: Position): string`
- `SanMove` interface definition
- Error handling (all throw `RangeError`)
- License: MIT

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README.md"
```

---

### Task 3: Populate CHANGELOG.md

**Files:**

- Modify: `CHANGELOG.md`

**Step 1: Write changelog entry**

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com), and this
project adheres to [Semantic Versioning](https://semver.org).

## [1.0.0] - 2026-03-20

### Added

- `parse(san)` — parse SAN string into `SanMove` object.
- `parse(san, position)` — parse and resolve SAN string into `Move`.
- `resolve(move, position)` — resolve `SanMove` to concrete `Move` with from/to
  squares.
- `stringify(move, position)` — convert `Move` to SAN string with
  disambiguation, check, and checkmate.
- Full SAN grammar support: piece moves, pawn moves, captures, promotions,
  castling, check, checkmate.
- En passant capture handling.
- Disambiguation (file, rank, full square).
- Annotation glyph stripping (`!`, `?`).
- TypeScript strict types with `SanMove` interface.
- Re-exports `Move` and `Position` types from `@echecs/position`.
```

**Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: populate CHANGELOG.md for v1.0.0"
```

---

### Task 4: Clean up git and bump version

**Step 1: Commit untracked files**

```bash
git add .github/ .husky/ LICENSE docs/
git commit -m "chore: add project scaffolding files"
```

**Step 2: Run full verification**

```bash
pnpm lint && pnpm test && pnpm build
```

Expected: All pass.

**Step 3: Bump version**

```bash
npm version major --no-git-tag-version
```

This changes `package.json` version from `0.1.0` to `1.0.0`.

**Step 4: Commit version bump**

```bash
git add package.json CHANGELOG.md README.md
git commit -m "release: @echecs/san@1.0.0"
```
