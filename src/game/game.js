// Game state, win/loss detection (issue #9) and the attempt limit (issue #10).
import { validateGuess } from "./validate";
import { scoreGuess } from "./feedback";

export const MAX_ATTEMPTS = 6;

export const STATUS = {
  PLAYING: "playing",
  WON: "won",
  LOST: "lost",
};

export const GAME_ERRORS = {
  GAME_OVER: "This game is already finished.",
};

// A fresh game for one answer. Games are plain data and never mutated:
// submitGuess returns a new game, so callers can store them anywhere.
export function newGame(answer, maxAttempts = MAX_ATTEMPTS) {
  return { answer, maxAttempts, guesses: [], status: STATUS.PLAYING };
}

export function attemptsLeft(game) {
  return game.maxAttempts - game.guesses.length;
}

// Won as soon as a guess matches; lost once the attempts run out without one.
export function getStatus(game) {
  const last = game.guesses[game.guesses.length - 1];
  if (last && last.guess === game.answer) return STATUS.WON;
  if (game.guesses.length >= game.maxAttempts) return STATUS.LOST;
  return STATUS.PLAYING;
}

// Plays one raw guess. Returns { ok: true, game, feedback } on success or
// { ok: false, error } for an invalid guess or a finished game. Invalid
// guesses don't cost an attempt.
export function submitGuess(game, raw) {
  if (game.status !== STATUS.PLAYING) {
    return { ok: false, error: GAME_ERRORS.GAME_OVER };
  }

  const checked = validateGuess(raw);
  if (!checked.valid) return { ok: false, error: checked.error };

  const feedback = scoreGuess(checked.guess, game.answer);
  const next = {
    ...game,
    guesses: [...game.guesses, { guess: checked.guess, feedback }],
  };
  next.status = getStatus(next);

  return { ok: true, game: next, feedback };
}
