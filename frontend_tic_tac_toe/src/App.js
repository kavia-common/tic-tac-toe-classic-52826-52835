import React, { useMemo, useState } from "react";
import "./App.css";

/**
 * All winning line combinations (indices into the 0..8 board array).
 */
const WIN_LINES = [
  [0, 1, 2], // rows
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6], // cols
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8], // diagonals
  [2, 4, 6],
];

/**
 * Calculate winner info for a given board.
 * @param {Array<("X"|"O"|null)>} squares
 * @returns {{ winner: ("X"|"O"|null), line: number[] | null }}
 */
function calculateWinner(squares) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line };
    }
  }
  return { winner: null, line: null };
}

/**
 * Returns true if every square is filled.
 * @param {Array<("X"|"O"|null)>} squares
 */
function isBoardFull(squares) {
  return squares.every((v) => v !== null);
}

// PUBLIC_INTERFACE
function App() {
  /** Board squares (0..8). */
  const [squares, setSquares] = useState(Array(9).fill(null));
  /** True = X turn, False = O turn. */
  const [xIsNext, setXIsNext] = useState(true);
  /** Optional scoring (persists until refresh). */
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });

  const { winner, line: winningLine } = useMemo(
    () => calculateWinner(squares),
    [squares]
  );

  const draw = !winner && isBoardFull(squares);
  const gameOver = Boolean(winner) || draw;

  const currentPlayer = xIsNext ? "X" : "O";
  const statusText = winner
    ? `${winner} wins!`
    : draw
      ? "It's a draw!"
      : `Current player: ${currentPlayer}`;

  // PUBLIC_INTERFACE
  function handleSquareClick(index) {
    /** Handle a user's move on a square. */
    if (gameOver) return;
    if (squares[index]) return;

    setSquares((prev) => {
      const next = [...prev];
      next[index] = xIsNext ? "X" : "O";
      return next;
    });
    setXIsNext((prev) => !prev);
  }

  // PUBLIC_INTERFACE
  function restartGame({ keepScores = true } = {}) {
    /**
     * Restart current game. Optionally reset scores.
     * @param {{keepScores?: boolean}} opts
     */
    setSquares(Array(9).fill(null));
    setXIsNext(true);

    if (!keepScores) {
      setScores({ X: 0, O: 0, draws: 0 });
    }
  }

  // When game ends, update scores once (derive from transitions).
  // We do it by computing next score based on the end-state and the fact that no more moves will be made.
  // To avoid useEffect here, we update scores opportunistically when a move is placed that ends the game.
  // That logic is implemented by checking win/draw after a move in a controlled helper:
  // However, keeping handleSquareClick simple is important; instead we add a small wrapper:
  // We implement score updates by intercepting setSquares using a functional update below.
  // (We re-define handleSquareClick with that approach.)
  function handleSquareClickWithScore(index) {
    if (gameOver) return;
    if (squares[index]) return;

    setSquares((prev) => {
      const next = [...prev];
      next[index] = xIsNext ? "X" : "O";

      const nextResult = calculateWinner(next);
      const nextDraw = !nextResult.winner && isBoardFull(next);

      if (nextResult.winner) {
        setScores((s) => ({ ...s, [nextResult.winner]: s[nextResult.winner] + 1 }));
      } else if (nextDraw) {
        setScores((s) => ({ ...s, draws: s.draws + 1 }));
      }

      return next;
    });
    setXIsNext((prev) => !prev);
  }

  const onSquareClick = handleSquareClickWithScore;

  return (
    <div className="ttt-app">
      <main className="ttt-shell" role="main" aria-label="Tic Tac Toe">
        <header className="ttt-header">
          <h1 className="ttt-title">Tic Tac Toe</h1>
          <p className="ttt-subtitle">Two players, one device. Take turns and win the line.</p>
        </header>

        <section
          className={`ttt-status ${winner ? "is-win" : draw ? "is-draw" : ""}`}
          aria-live="polite"
        >
          <div className="ttt-status-pill">
            <span className="ttt-status-label">{statusText}</span>
          </div>

          <div className="ttt-scoreboard" aria-label="Scoreboard">
            <div className="ttt-score">
              <span className="ttt-score-key">X</span>
              <span className="ttt-score-val">{scores.X}</span>
            </div>
            <div className="ttt-score">
              <span className="ttt-score-key">O</span>
              <span className="ttt-score-val">{scores.O}</span>
            </div>
            <div className="ttt-score ttt-score-draw">
              <span className="ttt-score-key">Draws</span>
              <span className="ttt-score-val">{scores.draws}</span>
            </div>
          </div>
        </section>

        <section className="ttt-surface" aria-label="Game board">
          <div className="ttt-board" role="grid" aria-label="3 by 3 Tic Tac Toe board">
            {squares.map((value, idx) => {
              const isWinningSquare = winningLine ? winningLine.includes(idx) : false;
              return (
                <button
                  key={idx}
                  type="button"
                  className={[
                    "ttt-square",
                    value ? "is-filled" : "",
                    value === "X" ? "is-x" : "",
                    value === "O" ? "is-o" : "",
                    isWinningSquare ? "is-winning" : "",
                    gameOver ? "is-locked" : "",
                  ].join(" ")}
                  onClick={() => onSquareClick(idx)}
                  role="gridcell"
                  aria-label={`Square ${idx + 1}${value ? `, ${value}` : ""}`}
                  disabled={Boolean(value) || gameOver}
                >
                  <span className="ttt-mark" aria-hidden="true">
                    {value}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="ttt-helper" aria-label="Game help">
            {winner && <span className="ttt-helper-text">Winning line highlighted.</span>}
            {draw && <span className="ttt-helper-text">No more moves—restart to play again.</span>}
            {!gameOver && (
              <span className="ttt-helper-text">
                Tip: You can’t overwrite a square once placed.
              </span>
            )}
          </div>
        </section>

        <footer className="ttt-actions" aria-label="Game actions">
          <button
            type="button"
            className="ttt-btn ttt-btn-primary"
            onClick={() => restartGame({ keepScores: true })}
          >
            Restart Game
          </button>
          <button
            type="button"
            className="ttt-btn ttt-btn-secondary"
            onClick={() => restartGame({ keepScores: false })}
          >
            Reset Game &amp; Scores
          </button>
        </footer>
      </main>
    </div>
  );
}

export default App;
