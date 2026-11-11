import { expect } from "chai";
import {
  ANSWERS,
  ALLOWED_GUESSES,
  WORD_LENGTH,
} from "../src/game/words";

describe("word lists", () => {
  it("only contains 5-letter lowercase words", () => {
    for (const w of ALLOWED_GUESSES) {
      expect(w).to.match(/^[a-z]{5}$/, w);
      expect(w.length).to.equal(WORD_LENGTH);
    }
  });

  it("has no duplicate answers", () => {
    expect(new Set(ANSWERS).size).to.equal(ANSWERS.length);
  });

  it("accepts every answer as a guess", () => {
    for (const w of ANSWERS) expect(ALLOWED_GUESSES.has(w)).to.equal(true);
  });

  it("accepts everyday words real Wordle accepts", () => {
    for (const w of ["jazzy", "tryst", "pinky", "frame", "crane"]) {
      expect(ALLOWED_GUESSES.has(w)).to.equal(true, w);
    }
    expect(ALLOWED_GUESSES.size).to.be.at.least(12972);
  });

  it("still rejects made-up words", () => {
    for (const w of ["zzzzz", "qwert", "aaaaa"]) {
      expect(ALLOWED_GUESSES.has(w)).to.equal(false, w);
    }
  });
});
