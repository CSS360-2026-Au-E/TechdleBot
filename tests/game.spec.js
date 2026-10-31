import { expect } from "chai";
import {
  newGame,
  submitGuess,
  attemptsLeft,
  getStatus,
  MAX_ATTEMPTS,
  STATUS,
  GAME_ERRORS,
} from "../src/game/game";
import { ERRORS } from "../src/game/validate";

// Plays a list of guesses, returning the last result.
function play(game, guesses) {
  let result;
  for (const g of guesses) {
    result = submitGuess(game, g);
    if (!result.ok) return result;
    game = result.game;
  }
  return result;
}

describe("game", () => {
  it("starts playing with the full attempt budget", () => {
    const game = newGame("array");
    expect(game.status).to.equal(STATUS.PLAYING);
    expect(game.guesses).to.have.length(0);
    expect(attemptsLeft(game)).to.equal(MAX_ATTEMPTS);
  });

  it("wins as soon as a guess matches the answer", () => {
    const result = play(newGame("array"), ["stack", "array"]);
    expect(result.ok).to.equal(true);
    expect(result.game.status).to.equal(STATUS.WON);
    expect(attemptsLeft(result.game)).to.equal(MAX_ATTEMPTS - 2);
  });

  it("can win on the very last attempt", () => {
    const misses = ["stack", "queue", "cloud", "class", "float"];
    const result = play(newGame("array"), [...misses, "array"]);
    expect(result.game.status).to.equal(STATUS.WON);
    expect(attemptsLeft(result.game)).to.equal(0);
  });

  it("loses after the sixth wrong guess", () => {
    const misses = ["stack", "queue", "cloud", "class", "float", "token"];
    const result = play(newGame("array"), misses);
    expect(result.game.status).to.equal(STATUS.LOST);
    expect(attemptsLeft(result.game)).to.equal(0);
  });

  it("is still playing after five wrong guesses", () => {
    const misses = ["stack", "queue", "cloud", "class", "float"];
    expect(play(newGame("array"), misses).game.status).to.equal(STATUS.PLAYING);
  });

  it("refuses guesses once the game is over", () => {
    const won = play(newGame("array"), ["array"]).game;
    expect(submitGuess(won, "stack")).to.deep.equal({ ok: false, error: GAME_ERRORS.GAME_OVER });

    const misses = ["stack", "queue", "cloud", "class", "float", "token"];
    const lost = play(newGame("array"), misses).game;
    expect(submitGuess(lost, "array")).to.deep.equal({ ok: false, error: GAME_ERRORS.GAME_OVER });
  });

  it("doesn't charge an attempt for an invalid guess", () => {
    const game = newGame("array");
    expect(submitGuess(game, "zz")).to.deep.equal({ ok: false, error: ERRORS.WRONG_LENGTH });
    expect(attemptsLeft(game)).to.equal(MAX_ATTEMPTS);
  });

  it("never mutates the game it was given", () => {
    const game = newGame("array");
    submitGuess(game, "stack");
    expect(game.guesses).to.have.length(0);
    expect(game.status).to.equal(STATUS.PLAYING);
  });

  it("returns feedback for the guess that was just played", () => {
    const result = submitGuess(newGame("array"), "crane");
    expect(result.feedback).to.deep.equal(["absent", "correct", "present", "absent", "absent"]);
  });

  it("respects a custom attempt limit", () => {
    const game = newGame("array", 2);
    const result = play(game, ["stack", "queue"]);
    expect(result.game.status).to.equal(STATUS.LOST);
    expect(getStatus(result.game)).to.equal(STATUS.LOST);
  });
});
