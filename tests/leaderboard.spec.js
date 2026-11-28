import { expect } from "chai";
import { streakKey, rankLeaderboard, formatLeaderboard } from "../src/game/leaderboard";

const streak = (best, current = 0) => ({ current, best });

describe("leaderboard", () => {
  it("keys streaks by server and player, and by player alone outside a server", () => {
    expect(streakKey("server1", "alice")).to.equal("server1:alice");
    expect(streakKey(null, "alice")).to.equal("alice");
  });

  it("ranks players by best streak, highest first", () => {
    const rows = rankLeaderboard([
      ["s:alice", streak(2)],
      ["s:bob", streak(5)],
      ["s:carol", streak(3, 3)],
    ], "s");
    expect(rows.map(r => [r.rank, r.userId, r.best])).to.deep.equal([
      [1, "bob", 5], [2, "carol", 3], [3, "alice", 2],
    ]);
  });

  it("ranks by best streak, not the current one", () => {
    const rows = rankLeaderboard([["s:mario", streak(4, 0)], ["s:abhi", streak(3, 3)]], "s");
    expect(rows.map(r => r.userId)).to.deep.equal(["mario", "abhi"]);
  });

  it("gives tied players the same rank and always lists them in the same order", () => {
    const rows = rankLeaderboard([
      ["s:zed", streak(3)], ["s:amy", streak(3)], ["s:top", streak(4)], ["s:low", streak(1)],
    ], "s");
    expect(rows.map(r => [r.rank, r.userId])).to.deep.equal([
      [1, "top"], [2, "amy"], [2, "zed"], [4, "low"],
    ]);
  });

  it("only includes players from the requested server", () => {
    const rows = rankLeaderboard([
      ["s1:alice", streak(2)], ["s2:bob", streak(9)], ["carol", streak(7)],
    ], "s1");
    expect(rows.map(r => r.userId)).to.deep.equal(["alice"]);
  });

  it("leaves out players without a win and stops at 10 players", () => {
    const entries = [["s:none", streak(0)], ["s:missing", undefined]];
    for (let i = 1; i <= 12; i++) entries.push([`s:p${String(i).padStart(2, "0")}`, streak(i)]);
    const rows = rankLeaderboard(entries, "s");
    expect(rows).to.have.length(10);
    expect(rows[0]).to.deep.equal({ rank: 1, userId: "p12", best: 12 });
    expect(rows.map(r => r.userId)).not.to.include.members(["none", "missing"]);
  });

  it("formats the list and an empty leaderboard", () => {
    expect(formatLeaderboard([
      { rank: 1, userId: "111", best: 4 },
      { rank: 2, userId: "222", best: 1 },
    ])).to.equal(
      "🏆 Techdle Leaderboard · Best Win Streak\n1. <@111> 4 wins in a row\n2. <@222> 1 win in a row");
    expect(formatLeaderboard([])).to.equal("🏆 No wins yet. Start a game with /techdle.");
  });
});
