import parseFen from '@echecs/fen';
import { STARTING_POSITION } from '@echecs/position';
import { describe, expect, it } from 'vitest';

import { parse, resolve, stringify } from '../index.js';

// ---------------------------------------------------------------------------
// parse()
// ---------------------------------------------------------------------------

describe('parse — pawn moves', () => {
  it('parses a simple pawn push', () => {
    const move = parse('e4');
    expect(move.piece).toBe('p');
    expect(move.to).toBe('e4');
    expect(move.capture).toBe(false);
    expect(move.castle).toBeUndefined();
    expect(move.check).toBeUndefined();
    expect(move.promotion).toBeUndefined();
  });

  it('parses a pawn capture', () => {
    const move = parse('exd5');
    expect(move.piece).toBe('p');
    expect(move.capture).toBe(true);
    expect(move.file).toBe('e');
    expect(move.to).toBe('d5');
  });

  it('parses a pawn promotion', () => {
    const move = parse('e8=Q');
    expect(move.piece).toBe('p');
    expect(move.to).toBe('e8');
    expect(move.promotion).toBe('q');
  });

  it('parses a promotion with checkmate', () => {
    const move = parse('exd8=Q#');
    expect(move.capture).toBe(true);
    expect(move.promotion).toBe('q');
    expect(move.check).toBe('checkmate');
  });
});

describe('parse — piece moves', () => {
  it('parses a knight move', () => {
    const move = parse('Nf3');
    expect(move.piece).toBe('n');
    expect(move.to).toBe('f3');
    expect(move.capture).toBe(false);
  });

  it('parses a piece capture', () => {
    const move = parse('Rxe4');
    expect(move.piece).toBe('r');
    expect(move.capture).toBe(true);
    expect(move.to).toBe('e4');
  });

  it('parses file disambiguation', () => {
    const move = parse('Nbd7');
    expect(move.piece).toBe('n');
    expect(move.file).toBe('b');
    expect(move.to).toBe('d7');
  });

  it('parses rank disambiguation', () => {
    const move = parse('N2d4');
    expect(move.piece).toBe('n');
    expect(move.rank).toBe('2');
    expect(move.to).toBe('d4');
  });
});

describe('parse — check and checkmate', () => {
  it('parses check suffix', () => {
    expect(parse('Nf3+').check).toBe('check');
  });

  it('parses checkmate suffix', () => {
    expect(parse('Qxh7#').check).toBe('checkmate');
  });
});

describe('parse — castling', () => {
  it('parses kingside castling', () => {
    const move = parse('O-O');
    expect(move.castle).toBe('kingside');
    expect(move.to).toBeUndefined();
    expect(move.piece).toBe('k');
  });

  it('parses queenside castling', () => {
    expect(parse('O-O-O').castle).toBe('queenside');
  });

  it('parses castling with check', () => {
    expect(parse('O-O+').check).toBe('check');
  });
});

describe('parse — errors', () => {
  it('throws RangeError for invalid input', () => {
    expect(() => parse('invalid')).toThrow(RangeError);
  });

  it('throws RangeError for empty string', () => {
    expect(() => parse('')).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// resolve()
// ---------------------------------------------------------------------------

describe('resolve — starting position', () => {
  it('resolves e4', () => {
    const move = resolve(parse('e4'), STARTING_POSITION);
    expect(move.from).toBe('e2');
    expect(move.to).toBe('e4');
    expect(move.promotion).toBeUndefined();
  });

  it('resolves Nf3', () => {
    const move = resolve(parse('Nf3'), STARTING_POSITION);
    expect(move.from).toBe('g1');
    expect(move.to).toBe('f3');
  });

  it('resolves Nc3', () => {
    const move = resolve(parse('Nc3'), STARTING_POSITION);
    expect(move.from).toBe('b1');
    expect(move.to).toBe('c3');
  });

  it('resolves d4', () => {
    const move = resolve(parse('d4'), STARTING_POSITION);
    expect(move.from).toBe('d2');
    expect(move.to).toBe('d4');
  });
});

describe('resolve — castling', () => {
  it('resolves O-O for white', () => {
    const pos = parseFen('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1')!;
    const move = resolve(parse('O-O'), pos);
    expect(move.from).toBe('e1');
    expect(move.to).toBe('g1');
  });

  it('resolves O-O-O for white', () => {
    const pos = parseFen('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1')!;
    const move = resolve(parse('O-O-O'), pos);
    expect(move.from).toBe('e1');
    expect(move.to).toBe('c1');
  });
});

describe('resolve — errors', () => {
  it('throws RangeError for illegal move', () => {
    expect(() => resolve(parse('e5'), STARTING_POSITION)).toThrow(RangeError);
  });

  it('throws RangeError for wrong-colored piece move', () => {
    expect(() => resolve(parse('e5'), STARTING_POSITION)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// stringify()
// ---------------------------------------------------------------------------

describe('stringify — pawn moves', () => {
  it('stringifies pawn push', () => {
    expect(
      stringify(
        { from: 'e2', promotion: undefined, to: 'e4' },
        STARTING_POSITION,
      ),
    ).toBe('e4');
  });

  it('stringifies pawn double push', () => {
    expect(
      stringify(
        { from: 'd2', promotion: undefined, to: 'd4' },
        STARTING_POSITION,
      ),
    ).toBe('d4');
  });
});

describe('stringify — piece moves', () => {
  it('stringifies knight move', () => {
    expect(
      stringify(
        { from: 'g1', promotion: undefined, to: 'f3' },
        STARTING_POSITION,
      ),
    ).toBe('Nf3');
  });
});

describe('stringify — round-trip', () => {
  it('e4 round-trips', () => {
    const move = resolve(parse('e4'), STARTING_POSITION);
    expect(stringify(move, STARTING_POSITION)).toBe('e4');
  });

  it('Nf3 round-trips', () => {
    const move = resolve(parse('Nf3'), STARTING_POSITION);
    expect(stringify(move, STARTING_POSITION)).toBe('Nf3');
  });

  it('Nc3 round-trips', () => {
    const move = resolve(parse('Nc3'), STARTING_POSITION);
    expect(stringify(move, STARTING_POSITION)).toBe('Nc3');
  });
});
