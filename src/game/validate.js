// Guess validation (issue #8).
import { ALLOWED_GUESSES } from "./words";

export const ERRORS = {
  NOT_TEXT: "you need 5 letters",
  WRONG_LENGTH: "you need 5 letters",
  NOT_LETTERS: "you need 5 letters",
  NOT_A_WORD: "That isn't in the word list.",
};

// Any real word Wordle accepts (plus our tech answers) is a valid guess.
// Made-up words like "zzzzz" are rejected so they don't use up an attempt.
export function validateGuess(raw, allowed = ALLOWED_GUESSES) {
  if (typeof raw !== "string") {
    return { valid: false, error: ERRORS.NOT_TEXT };
  }

  const guess = raw.trim().toLowerCase();

  if (!/^[a-z]{5}$/.test(guess)) {
    return { valid: false, error: ERRORS.WRONG_LENGTH };
  }
  if (!allowed.has(guess)) return { valid: false, error: ERRORS.NOT_A_WORD };

  return { valid: true, guess };
}
