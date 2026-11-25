import { expect } from "chai";
import fs from "fs";
import os from "os";
import path from "path";
import { startGame } from "../src/game/start";
import { createGameStore } from "../src/game/store";
import { ANSWERS } from "../src/game/words";
import { formatFeedback } from "../src/game/feedback";
import { submitGuess } from "../src/game/game";
import { handleStart } from "../src/events/interactionCreate";

describe("Techdle start", () => {
  it("chooses a tech answer with six fresh attempts", () => {
    const result = startGame("alice", new Map(), () => 0);
    expect(result.game.answer).to.equal(ANSWERS[0]);
    expect(result.game.guesses).to.have.length(0);
    expect(result.game.status).to.equal("playing");
    expect(result.game.maxAttempts).to.equal(6);
  });
  it("uses the picker rather than selecting a daily answer", () => {
    const result = startGame("alice", new Map(), length => length - 1);
    expect(result.game.answer).to.equal(ANSWERS[ANSWERS.length - 1]);
  });
  it("replaces an unfinished game with a different word and fresh attempts", () => {
    const store = new Map();
    const first = startGame("alice", store, () => 0);
    store.set(first.key, submitGuess(first.game, "stack").game);
    const next = startGame("alice", store, () => 0);
    expect(next.key).to.equal(first.key);
    expect(next.game.answer).not.to.equal(first.game.answer);
    expect(next.game.guesses).to.have.length(0);
    expect(next.game.status).to.equal("playing");
    expect(store.size).to.equal(1);
  });
  it("allows new games after either a win or a loss", () => {
    for (const status of ["won", "lost"]) {
      const store = new Map();
      const first = startGame("alice", store, () => 0);
      store.set(first.key, { ...first.game, status });
      const next = startGame("alice", store, () => 0);
      expect(next.game.status).to.equal("playing");
      expect(next.game.answer).not.to.equal(first.game.answer);
    }
  });
  it("keeps different players' active games separate", () => {
    const store = new Map();
    const bob = startGame("bob", store, () => 0).game;
    startGame("alice", store);
    startGame("alice", store);
    expect(store.get("bob")).to.equal(bob);
  });
  it("persists the active game and can replace it after a restart", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "techdle-"));
    try {
      const filename = path.join(dir, "games.json");
      const first = startGame("alice", createGameStore(filename), () => 0);
      const reopened = createGameStore(filename);
      expect(reopened.get("alice")).to.deep.equal(first.game);
      const next = startGame("alice", reopened, () => 0);
      expect(next.game.answer).not.to.equal(first.game.answer);
      expect(createGameStore(filename).get("alice")).to.deep.equal(next.game);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
  it("starts a fresh game on every /techdle and keeps the answer private", async () => {
    const replies = [];
    const client = { techdleGames: new Map() };
    const interaction = {
      isChatInputCommand: () => true, commandName: "techdle",
      user: { id: "alice" },
      deferReply: async options => { expect(options.ephemeral).to.equal(true); },
      editReply: async value => replies.push(value),
    };
    await handleStart(interaction, client);
    const first = client.techdleGames.get("alice");
    expect(replies[0].content).not.to.include(first.answer);
    await handleStart(interaction, client);
    const second = client.techdleGames.get("alice");
    expect(second.answer).not.to.equal(first.answer);
    expect(second.guesses).to.have.length(0);
    expect(replies[1].content).to.include("Techdle started!");
    expect(replies[1].content).not.to.include(second.answer);
  });
  it("integrates stored games with the team's validation, feedback and win/loss engine", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "techdle-engine-"));
    try {
      const filename = path.join(dir, "games.json");
      const store = createGameStore(filename);
      startGame("alice", store, () => 0); // array
      const initial = store.get("alice");
      expect(submitGuess(initial, "zz").ok).to.equal(false);
      expect(store.get("alice").guesses).to.have.length(0);
      for (let attempt = 0; attempt < 6; attempt++) {
        const wrong = ANSWERS.filter(word => word !== initial.answer)[attempt];
        const result = submitGuess(store.get("alice"), wrong);
        expect(result.ok).to.equal(true);
        expect(result.feedback).to.have.length(5);
        expect(formatFeedback(result.feedback)).to.be.a("string");
        store.set("alice", result.game);
      }
      const reloaded = createGameStore(filename);
      expect(reloaded.get("alice").status).to.equal("lost");
      expect(submitGuess(reloaded.get("alice"), initial.answer).ok).to.equal(false);
      const fresh = startGame("alice", reloaded, () => 0).game;
      const win = submitGuess(fresh, fresh.answer);
      expect(win.game.status).to.equal("won");
      expect(formatFeedback(win.feedback)).to.equal("🟩🟩🟩🟩🟩");
      reloaded.set("alice", win.game);
      expect(createGameStore(filename).get("alice").status).to.equal("won");
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
  it("ignores unrelated commands and other interaction types", async () => {
    await handleStart({ isChatInputCommand: () => false }, {});
    await handleStart({ isChatInputCommand: () => true, commandName: "wordle" }, {});
  });
});
