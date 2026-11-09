import { expect } from "chai";
import { newStreak, recordResult, isAbandoned, formatStreak } from "../src/game/streak";
import { newGame } from "../src/game/game";
import { STATUS } from "../src/game/game";

// Plays a list of results, returning the final streak.
function play(results) {
  return results.reduce((streak, status) => recordResult(streak, status), newStreak());
}

describe("streak", () => {
  it("starts at zero", () => {
    expect(newStreak()).to.deep.equal({ current: 0, best: 0 });
  });

  it("counts consecutive wins", () => {
    expect(play([STATUS.WON, STATUS.WON, STATUS.WON])).to.deep.equal({ current: 3, best: 3 });
  });

  it("resets the current streak on a loss but keeps the best", () => {
    expect(play([STATUS.WON, STATUS.WON, STATUS.LOST])).to.deep.equal({ current: 0, best: 2 });
  });

  it("only raises the best streak when it's beaten", () => {
    const results = [STATUS.WON, STATUS.WON, STATUS.WON, STATUS.LOST, STATUS.WON];
    expect(play(results)).to.deep.equal({ current: 1, best: 3 });
  });

  it("ignores games that are still being played", () => {
    expect(play([STATUS.WON, STATUS.PLAYING])).to.deep.equal({ current: 1, best: 1 });
  });

  it("treats a missing streak as a new player", () => {
    expect(recordResult(undefined, STATUS.WON)).to.deep.equal({ current: 1, best: 1 });
  });

  it("never mutates the streak it was given", () => {
    const streak = { current: 2, best: 2 };
    recordResult(streak, STATUS.WON);
    recordResult(streak, STATUS.LOST);
    expect(streak).to.deep.equal({ current: 2, best: 2 });
  });

  it("counts a game as abandoned only after a guess in an unfinished game", () => {
    const game = newGame("array");
    expect(isAbandoned(undefined)).to.equal(false);
    expect(isAbandoned(game)).to.equal(false);
    expect(isAbandoned({ ...game, guesses: [{ guess: "crane" }] })).to.equal(true);
    expect(isAbandoned({ ...game, guesses: [{ guess: "array" }], status: STATUS.WON })).to.equal(false);
  });

  it("formats the streak, including for a new player", () => {
    expect(formatStreak({ current: 2, best: 5 })).to.equal("🔥 Win streak: 2 (best 5)");
    expect(formatStreak(undefined)).to.equal("🔥 Win streak: 0 (best 0)");
  });
});
