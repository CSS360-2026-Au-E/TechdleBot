export const ERRORS = {
  NOT_TEXT: "you need 5 letters",
  WRONG_LENGTH: "you need 5 letters",
  NOT_LETTERS: "you need 5 letters",
};

export function validateGuess(raw) {
  if (typeof raw !== "string") {
    return { valid: false, error: ERRORS.NOT_TEXT };
  }

  const guess = raw.trim().toLowerCase();

  if (!/^[a-z]{5}$/.test(guess)) {
    return { valid: false, error: ERRORS.WRONG_LENGTH };
  }

  return { valid: true, guess };
}