# Specification: Standard Algebraic Notation (SAN)

Implements SAN as defined in the
[PGN Standard §8.2](http://www.saremba.de/chessgml/standards/pgn/pgn-complete.htm#c8.2)
and [FIDE Laws of Chess Appendix C](https://handbook.fide.com/chapter/E012023).

---

## Piece Letters

| Letter | Piece |
|--------|-------|
| `K` | King |
| `Q` | Queen |
| `R` | Rook |
| `B` | Bishop |
| `N` | Knight |
| (none) | Pawn |

---

## Move Format

```
[piece][from_file][from_rank][x][to_file][to_rank][=promotion][+/#]
```

| Component | Meaning |
|-----------|---------|
| `piece` | Piece letter (omitted for pawns) |
| `from_file` | Disambiguation file (`a`–`h`), if needed |
| `from_rank` | Disambiguation rank (`1`–`8`), if needed |
| `x` | Capture indicator |
| `to_file` | Destination file (required) |
| `to_rank` | Destination rank (required) |
| `=X` | Promotion piece (`Q`, `R`, `B`, `N`) |
| `+` | Check |
| `#` | Checkmate |

---

## Disambiguation Rules

Disambiguation is required when two or more pieces of the same type can legally
move to the same square. Resolution order:

1. If the pieces are on different files → use the from-file
2. If the pieces are on the same file but different ranks → use the from-rank
3. If neither resolves uniquely → use the full from-square

---

## Castling

| Notation | Meaning |
|----------|---------|
| `O-O` | Kingside castling |
| `O-O-O` | Queenside castling |

Note: Uses capital letter O, not zero.

---

## Pawn Moves

- **Push**: `e4` (destination only)
- **Capture**: `exd5` (from-file + `x` + destination)
- **Promotion**: `e8=Q` (destination + `=` + piece)
- **Promotion capture**: `exd8=Q`

---

## Implementation Notes

- `parse(san)` — pure string parsing, no position needed, throws `RangeError` for invalid input
- `resolve(move, position)` — fills in `from` square, throws `RangeError` if illegal or ambiguous
- `stringify(move, position)` — generates correct SAN including disambiguation and check/checkmate suffix
- Pawn direction is color-dependent: white pawns move toward rank 8 (increasing rank), black toward rank 1
- `@echecs/position/internal` is used for attack detection during resolve and check detection during stringify

## Sources

- [PGN Standard §8.2](http://www.saremba.de/chessgml/standards/pgn/pgn-complete.htm#c8.2)
- [FIDE Laws of Chess Appendix C](https://handbook.fide.com/chapter/E012023)
