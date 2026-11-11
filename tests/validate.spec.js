import { expect } from "chai";
import { validateGuess, ERRORS } from "../src/game/validate";

describe("validateGuess", () => {
  it("accepts a real 5-letter word", () => {
    expect(validateGuess("house")).to.deep.equal({ valid: true, guess: "house" });
  });

  it("normalizes case and surrounding whitespace", () => {
    expect(validateGuess("  HoUsE \n")).to.deep.equal({ valid: true, guess: "house" });
  });

  it("rejects words that are too short or too long", () => {
    expect(validateGuess("hous")).to.deep.equal({ valid: false, error: ERRORS.WRONG_LENGTH });
    expect(validateGuess("houses")).to.deep.equal({ valid: false, error: ERRORS.WRONG_LENGTH });
  });

  it("rejects digits, punctuation and inner spaces", () => {
    for (const bad of ["h0use", "hou-e", "ho se", "h@use"]) {
      expect(validateGuess(bad)).to.deep.equal({ valid: false, error: ERRORS.NOT_LETTERS });
    }
  });

  it("rejects 5-letter strings that aren't words", () => {
    expect(validateGuess("zzzzz")).to.deep.equal({ valid: false, error: ERRORS.NOT_A_WORD });
  });

  it("accepts everyday words, not just tech words", () => {
    for (const w of ["crane", "jazzy", "frame", "regex"]) {
      expect(validateGuess(w)).to.deep.equal({ valid: true, guess: w });
    }
  });

  it("uses a custom word list when given one", () => {
    expect(validateGuess("zzzzz", new Set(["zzzzz"])).valid).to.equal(true);
    expect(validateGuess("house", new Set(["zzzzz"])).valid).to.equal(false);
  });

  it("rejects non-string input", () => {
    for (const bad of [null, undefined, 12345, {}]) {
      expect(validateGuess(bad)).to.deep.equal({ valid: false, error: ERRORS.NOT_TEXT });
    }
  });

  it("returns the requested message for empty, short and long guesses", () => {
    for (const raw of ["", "   ", "abcd", "abcdef"]) {
      expect(validateGuess(raw)).to.deep.equal({ valid: false, error: "you need 5 letters" });
    }
  });
});
