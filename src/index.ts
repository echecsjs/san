import type {
  Piece as BoardPiece,
  Color,
  File,
  Move,
  PieceType,
  Position,
  PromotionPieceType,
  Rank,
  Square,
} from '@echecs/position';

// ---------------------------------------------------------------------------
// Types owned by this package
// ---------------------------------------------------------------------------

type Disambiguation = File | Rank | Square;

interface ParseError {
  column: number;
  line: number;
  message: string;
  offset: number;
}

interface ParseOptions {
  onError?: (error: ParseError) => void;
}

interface SAN {
  capture: boolean;
  castling: boolean;
  check: boolean;
  checkmate: boolean;
  from: Disambiguation | undefined;
  long: boolean;
  piece: PieceType;
  promotion: PromotionPieceType | undefined;
  to: Square | undefined;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const PIECE_LETTERS: Record<string, PieceType> = {
  B: 'bishop',
  K: 'king',
  N: 'knight',
  Q: 'queen',
  R: 'rook',
};

const PROMOTION_LETTERS: Record<string, PromotionPieceType> = {
  B: 'bishop',
  N: 'knight',
  Q: 'queen',
  R: 'rook',
};

const FILES_SET = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
const RANKS_SET = new Set(['1', '2', '3', '4', '5', '6', '7', '8']);

// SAN regex — handles piece moves, pawn moves, promotions, check/checkmate
// Groups: 1=piece, 2=fromFile, 3=fromRank, 4=capture, 5=toFile, 6=toRank,
//         7=promotion, 8=check
const SAN_REGEX =
  /^([BKNQR])?([a-h])?([1-8])?(x)?([a-h])([1-8])(?:=([BKNQR]))?([+#])?$/;

function applyMoveToBoard(
  position: Position,
  from: Square,
  to: Square,
  promotion?: PromotionPieceType,
): Position {
  const piece = position.at(from);
  if (piece === undefined) {
    return position;
  }

  const changes: [Square, BoardPiece | undefined][] = [
    [from, undefined],
    [to, promotion ? { color: piece.color, type: promotion } : piece],
  ];

  // Castling — move the rook alongside the king
  if (piece.type === 'king') {
    const fileDiff = (to.codePointAt(0) ?? 0) - (from.codePointAt(0) ?? 0);
    const rank = from.at(1) as string;
    if (fileDiff === 2) {
      // Kingside: rook h→f
      changes.push(
        [`h${rank}` as Square, undefined],
        [`f${rank}` as Square, { color: piece.color, type: 'rook' }],
      );
    } else if (fileDiff === -2) {
      // Queenside: rook a→d
      changes.push(
        [`a${rank}` as Square, undefined],
        [`d${rank}` as Square, { color: piece.color, type: 'rook' }],
      );
    }
  }

  // En passant capture — remove the captured pawn
  if (piece.type === 'pawn' && to === position.enPassantSquare) {
    const epOffset = position.turn === 'white' ? -1 : 1;
    const epRank = String(Number(to.at(1)) + epOffset);
    changes.push([`${to.at(0)}${epRank}` as Square, undefined]);
  }

  const turn: Color = position.turn === 'white' ? 'black' : 'white';
  return position.derive({ changes, turn });
}

// ---------------------------------------------------------------------------
// parse()
// ---------------------------------------------------------------------------

function emitError(options: ParseOptions | undefined, message: string): void {
  options?.onError?.({ column: 1, line: 1, message, offset: 0 });
}

function parse(san: string, options?: ParseOptions): SAN | null;
function parse(
  san: string,
  position: Position,
  options?: ParseOptions,
): Move | null;
function parse(
  san: string,
  positionOrOptions?: ParseOptions | Position,
  options?: ParseOptions,
): Move | SAN | null {
  const position =
    positionOrOptions !== undefined && 'turn' in positionOrOptions
      ? positionOrOptions
      : undefined;
  const options_ =
    position === undefined
      ? (positionOrOptions as ParseOptions | undefined)
      : options;

  if (san.length === 0) {
    emitError(options_, 'Empty SAN string');
    // eslint-disable-next-line unicorn/no-null
    return null;
  }

  // Strip annotation glyphs
  const clean = san.replaceAll(/[!?]/g, '');

  // Castling
  if (clean.startsWith('O-O-O')) {
    const sanMove: SAN = {
      capture: false,
      castling: true,
      check: clean.endsWith('+'),
      checkmate: clean.endsWith('#'),
      from: undefined,
      long: true,
      piece: 'king',
      promotion: undefined,
      to: undefined,
    };

    if (position !== undefined) {
      try {
        return resolve(sanMove, position);
      } catch {
        emitError(options_, `No legal move found for "${san}"`);
        // eslint-disable-next-line unicorn/no-null
        return null;
      }
    }

    return sanMove;
  }

  if (clean.startsWith('O-O')) {
    const sanMove: SAN = {
      capture: false,
      castling: true,
      check: clean.endsWith('+'),
      checkmate: clean.endsWith('#'),
      from: undefined,
      long: false,
      piece: 'king',
      promotion: undefined,
      to: undefined,
    };

    if (position !== undefined) {
      try {
        return resolve(sanMove, position);
      } catch {
        emitError(options_, `No legal move found for "${san}"`);
        // eslint-disable-next-line unicorn/no-null
        return null;
      }
    }

    return sanMove;
  }

  const match = SAN_REGEX.exec(clean);
  if (!match) {
    emitError(options_, `Invalid SAN: "${san}"`);
    // eslint-disable-next-line unicorn/no-null
    return null;
  }

  const [
    ,
    pieceString,
    fromFileString,
    fromRankString,
    captureString,
    toFileString,
    toRankString,
    promoString,
    checkString,
  ] = match;

  const piece: PieceType = pieceString
    ? (PIECE_LETTERS[pieceString] ?? 'pawn')
    : 'pawn';
  const file =
    fromFileString && FILES_SET.has(fromFileString)
      ? (fromFileString as File)
      : undefined;
  const rank =
    fromRankString && RANKS_SET.has(fromRankString)
      ? (fromRankString as Rank)
      : undefined;
  const isCapture = captureString === 'x';
  const to = `${toFileString}${toRankString}` as Square;
  const promotion =
    promoString && Object.hasOwn(PROMOTION_LETTERS, promoString)
      ? PROMOTION_LETTERS[promoString]
      : undefined;
  const isCheck = checkString === '+';
  // eslint-disable-next-line unicorn/consistent-boolean-name -- chess domain term
  const checkmate = checkString === '#';

  const from: Disambiguation | undefined =
    file !== undefined && rank !== undefined
      ? (`${file}${rank}` as Square)
      : (file ?? rank ?? undefined);

  const sanMove: SAN = {
    capture: isCapture,
    castling: false,
    check: isCheck,
    checkmate,
    from,
    long: false,
    piece,
    promotion,
    to,
  };

  if (position !== undefined) {
    try {
      return resolve(sanMove, position);
    } catch {
      emitError(options_, `No legal move found for "${san}"`);
      // eslint-disable-next-line unicorn/no-null
      return null;
    }
  }

  return sanMove;
}

// ---------------------------------------------------------------------------
// resolve()
// ---------------------------------------------------------------------------

function resolve(move: SAN, position: Position): Move {
  // Castling
  if (move.castling) {
    const backRank = position.turn === 'white' ? '1' : '8';
    const from = `e${backRank}` as Square;
    const to = move.long
      ? (`c${backRank}` as Square)
      : (`g${backRank}` as Square);
    return { from, promotion: undefined, to };
  }

  if (move.to === undefined) {
    throw new RangeError('SAN has no target square');
  }

  const candidates: Square[] = [];

  for (const [square, piece] of position.pieces(position.turn)) {
    if (piece.type !== move.piece) {
      continue;
    }

    // Apply disambiguation filter
    if (move.from !== undefined) {
      if (move.from.length === 2) {
        // Full square disambiguation
        if (square !== move.from) {
          continue;
        }
      } else if (FILES_SET.has(move.from)) {
        // File disambiguation
        if (square.at(0) !== move.from) {
          continue;
        }
      } else {
        // Rank disambiguation
        if (square.at(1) !== move.from) {
          continue;
        }
      }
    }

    // Check if piece can reach the target square
    const reachable = position.reach(square, piece);
    if (!reachable.includes(move.to)) {
      continue;
    }

    // Verify move doesn't leave own king in check.
    // applyMoveToBoard flips the turn, so isCheck tests the opponent.
    // Derive back to our turn to test whether our king is exposed.
    const after = applyMoveToBoard(position, square, move.to, move.promotion);
    if (after.derive({ turn: position.turn }).isCheck) {
      continue;
    }

    candidates.push(square);
  }

  if (candidates.length === 0) {
    throw new RangeError(
      `No legal move found for SAN "${JSON.stringify(move)}" in position`,
    );
  }

  if (candidates.length > 1) {
    throw new RangeError(
      `Ambiguous: ${candidates.length} candidates for SAN "${JSON.stringify(move)}"`,
    );
  }

  const from = candidates[0];
  if (from === undefined) {
    throw new RangeError('No candidate found (internal error)');
  }

  return { from, promotion: move.promotion, to: move.to };
}

// ---------------------------------------------------------------------------
// stringify()
// ---------------------------------------------------------------------------

const PIECE_TO_LETTER: Record<PieceType, string> = {
  bishop: 'B',
  king: 'K',
  knight: 'N',
  pawn: '',
  queen: 'Q',
  rook: 'R',
};

const PROMOTION_TO_LETTER: Record<PromotionPieceType, string> = {
  bishop: 'B',
  knight: 'N',
  queen: 'Q',
  rook: 'R',
};

function checkSuffix(position: Position): string {
  return position.isCheck ? (isCheckmate(position) ? '#' : '+') : '';
}

function stringify(move: Move, position: Position): string {
  const piece = position.at(move.from);
  if (piece === undefined) {
    throw new RangeError(`No piece on ${move.from}`);
  }

  // Castling
  if (piece.type === 'king') {
    const fileDiff =
      (move.to.codePointAt(0) ?? 0) - (move.from.codePointAt(0) ?? 0);
    if (fileDiff === 2) {
      const after = applyMoveToBoard(position, move.from, move.to);
      return `O-O${checkSuffix(after)}`;
    }

    if (fileDiff === -2) {
      const after = applyMoveToBoard(position, move.from, move.to);
      return `O-O-O${checkSuffix(after)}`;
    }
  }

  const pieceString = PIECE_TO_LETTER[piece.type];
  const isCapture =
    position.at(move.to) !== undefined ||
    (piece.type === 'pawn' && move.to === position.enPassantSquare);

  // Determine disambiguation
  let disambig = '';
  if (piece.type !== 'pawn') {
    const ambiguous: Square[] = [];

    for (const [sq, other] of position.pieces(position.turn)) {
      if (sq === move.from || other.type !== piece.type) {
        continue;
      }
      const reachable = position.reach(sq, other);
      if (!reachable.includes(move.to)) {
        continue;
      }
      // Check it's a legal move (doesn't leave king in check)
      const after = applyMoveToBoard(position, sq, move.to);
      if (!after.derive({ turn: position.turn }).isCheck) {
        ambiguous.push(sq);
      }
    }

    if (ambiguous.length > 0) {
      const isSameFile = ambiguous.some((sq) => sq.at(0) === move.from.at(0));
      const isSameRank = ambiguous.some((sq) => sq.at(1) === move.from.at(1));
      if (!isSameFile) {
        disambig = move.from.at(0) ?? '';
      } else if (isSameRank) {
        disambig = move.from;
      } else {
        disambig = move.from.at(1) ?? '';
      }
    }
  } else if (isCapture) {
    // Pawn capture always includes the from-file
    disambig = move.from.at(0) ?? '';
  }

  const captureString = isCapture ? 'x' : '';
  const promoString = move.promotion
    ? `=${PROMOTION_TO_LETTER[move.promotion]}`
    : '';

  // Apply move and check for check/checkmate
  const after = applyMoveToBoard(position, move.from, move.to, move.promotion);
  const suffix = checkSuffix(after);

  return `${pieceString}${disambig}${captureString}${move.to}${promoString}${suffix}`;
}

function isCheckmate(position: Position): boolean {
  if (!position.isCheck) {
    return false;
  }

  // Try all moves for the side to move — if any gets out of check, not checkmate
  for (const [from, piece] of position.pieces(position.turn)) {
    const reachable = position.reach(from, piece);
    for (const to of reachable) {
      const target = position.at(to);
      if (target?.color !== position.turn) {
        const after = applyMoveToBoard(position, from, to);
        if (!after.derive({ turn: position.turn }).isCheck) {
          return false;
        }
      }
    }
  }
  return true;
}

export type { Disambiguation, ParseError, ParseOptions, SAN };
export type {
  File,
  Move,
  PieceType,
  Position,
  PromotionPieceType,
  Rank,
  Square,
} from '@echecs/position';
export { parse, resolve, stringify };
