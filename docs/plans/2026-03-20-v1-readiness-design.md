# Design: v1.0.0 Release Preparation

**Date:** 2026-03-20 **Status:** Approved

## Summary

Prepare `@echecs/san` for v1.0.0 by addressing three blockers: missing test
coverage for critical chess scenarios, missing README.md, and empty
CHANGELOG.md.

## Blocker 1: Test Coverage

Add tests for the following untested code paths:

| Scenario            | FEN                                                        | SAN      | Tests                    |
| ------------------- | ---------------------------------------------------------- | -------- | ------------------------ |
| En passant capture  | `rnbqkbnr/pppp1ppp/8/4pP2/8/8/PPPPP1PP/RNBQKBNR w KQkq e6` | `fxe6`   | resolve + stringify + rt |
| Pawn promotion      | `8/P7/8/8/8/8/8/4K2k w - - 0 1`                            | `a8=Q`   | resolve + stringify      |
| Capture + promotion | `7k/8/8/8/8/8/1p6/R3K3 b - - 0 1`                          | `bxa1=Q` | resolve + stringify      |
| Pawn capture        | after 1.e4 d5                                              | `exd5`   | stringify                |
| Knight ambiguity    | two knights same rank                                      | `Nbd2`   | resolve + stringify      |
| Knight ambiguity    | two knights same file                                      | `N1d2`   | resolve + stringify      |
| Check suffix        | move gives check                                           | `Bb5+`   | stringify                |
| Checkmate           | Scholar's mate or similar                                  | `Qxf7#`  | stringify                |

## Blocker 2: README.md

Create with: package description, installation, API reference for `parse`,
`resolve`, `stringify` with examples, `SanMove` type reference, error handling.

## Blocker 3: CHANGELOG.md

Populate with v1.0.0 entry following Keep a Changelog format.

## After Blockers

Commit untracked files, run full verification, bump version to 1.0.0.
