import { expect } from "chai";
import fs from "fs";
import os from "os";
import path from "path";
import event from "../src/events/interactionCreate";
import { createGameStore } from "../src/game/store";
import { startGame } from "../src/game/start";
import { ANSWERS } from "../src/game/words";
import { register } from "../src/registerTechdle";

function interaction(commandName, word, id = "alice", guildId = null) {
  return {
    commandName, user: { id }, guildId, deferred: false, replied: false,
    calls: [], responses: [],
    isChatInputCommand: () => true,
    options: { getString(name, required) {
      expect(name).to.equal("word");
      expect(required).to.equal(true);
      return word;
    } },
    async deferReply(options) {
      expect(options.ephemeral).to.equal(true);
      this.deferred = true;
      this.calls.push("defer");
    },
    async editReply(value) {
      expect(this.deferred).to.equal(true);
      this.calls.push("edit");
      this.responses.push(value.content);
      this.lastReply = value;
    },
  };
}

describe("Techdle slash integration", () => {
  let dir, filename, previousPath, client;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "techdle-slash-"));
    filename = path.join(dir, "games.json");
    previousPath = process.env.TECHDLE_GAME_STORE;
    process.env.TECHDLE_GAME_STORE = filename;
    client = {};
  });
  afterEach(() => {
    if (previousPath === undefined) delete process.env.TECHDLE_GAME_STORE;
    else process.env.TECHDLE_GAME_STORE = previousPath;
    fs.rmSync(dir, { recursive: true, force: true });
  });
  async function send(command, word, id, guildId) {
    const i = interaction(command, word, id, guildId);
    await event.execute(i, client);
    expect(i.calls).to.deep.equal(["defer", "edit"]);
    return i.responses[0];
  }
  async function start(id = "alice") {
    expect(await send("techdle", undefined, id)).to.include("Use /guess");
    return client.techdleGames.get(id);
  }
  const wrong = (game, index = 0) => ANSWERS.filter(word => word !== game.answer)[index];

  it("asks a player without a game to start first", async () => {
    expect(await send("guess", "array")).to.equal("Start a game with /techdle first.");
  });
  it("starts through the real dispatcher, wins and saves the result", async () => {
    const game = await start();
    expect(await send("guess", game.answer)).to.include("🟩🟩🟩🟩🟩\n🎉 You win!");
    expect(createGameStore(filename).get("alice").status).to.equal("won");
  });
  it("normalizes guess case and whitespace", async () => {
    const game = await start();
    expect(await send("guess", `  ${game.answer.toUpperCase()}  `)).to.include("You win!");
  });
  it("rejects invalid guesses without changing memory or disk", async () => {
    await start();
    const before = fs.readFileSync(filename, "utf8");
    for (const word of ["", "a", "abcdef", "ar!ay"]) {
      const reply = await send("guess", word);
      expect(reply).not.to.include("Guess 1/");
      expect(client.techdleGames.get("alice").guesses).to.have.length(0);
      expect(fs.readFileSync(filename, "utf8")).to.equal(before);
    }
  });
  it("shows exact letter feedback and attempt count without revealing the answer", async () => {
    client.techdleGames = createGameStore(filename);
    startGame("alice", client.techdleGames, () => 0); // array
    const reply = await send("guess", "crane");
    expect(reply).to.equal("⬛🟩🟨⬛⬛ (Guess 1/6)\n5 attempts left. Use /guess to guess again.");
    expect(reply.toLowerCase()).not.to.include("array");
  });
  it("rejects made-up words without using an attempt", async () => {
    client.techdleGames = createGameStore(filename);
    startGame("alice", client.techdleGames, () => 0); // array
    expect(await send("guess", "zzzzz")).to.equal("That isn't in the word list.");
    expect(await send("guess", "radar")).to.equal("🟨🟨⬛🟩🟨 (Guess 1/6)\n5 attempts left. Use /guess to guess again.");
    expect(createGameStore(filename).get("alice").guesses.map(g => g.guess)).to.deep.equal(["radar"]);
  });
  it("loses after six valid wrong guesses and rejects a seventh", async () => {
    const game = await start();
    for (let n = 1; n < 6; n++) {
      expect(await send("guess", wrong(game, n - 1))).to.include(`${6 - n} attempts left`);
    }
    expect(await send("guess", wrong(game, 5))).to.include(`No attempts left. The word was ${game.answer.toUpperCase()}.`);
    const before = fs.readFileSync(filename, "utf8");
    expect(await send("guess", game.answer)).to.equal("This game is already finished.");
    expect(fs.readFileSync(filename, "utf8")).to.equal(before);
  });
  it("allows a win on the sixth guess", async () => {
    const game = await start();
    for (let n = 0; n < 5; n++) await send("guess", wrong(game, n));
    expect(await send("guess", game.answer)).to.include("in 6 tries");
    expect(client.techdleGames.get("alice").status).to.equal("won");
  });
  it("rejects further guesses after a win", async () => {
    const game = await start();
    await send("guess", game.answer);
    expect(await send("guess", wrong(game))).to.equal("This game is already finished.");
    expect(client.techdleGames.get("alice").guesses).to.have.length(1);
  });
  it("replaces an unfinished game and resets attempts", async () => {
    const game = await start();
    await send("guess", wrong(game));
    const next = await start();
    expect(next.answer).not.to.equal(game.answer);
    expect(next.guesses).to.have.length(0);
    expect(next.maxAttempts).to.equal(6);
  });
  it("starts a fresh game after either win or loss", async () => {
    let game = await start();
    await send("guess", game.answer);
    game = await start();
    for (let n = 0; n < 6; n++) await send("guess", wrong(game, n));
    const next = await start();
    expect(next.status).to.equal("playing");
    expect(next.answer).not.to.equal(game.answer);
    expect(next.guesses).to.have.length(0);
  });
  it("keeps two players separate", async () => {
    const alice = await start();
    const bob = await start("bob");
    await send("guess", alice.answer);
    expect(client.techdleGames.get("bob").guesses).to.have.length(0);
    expect(await send("guess", bob.answer, "bob")).to.include("in 1 try");
  });
  it("reloads saved games on a guess after restart", async () => {
    const game = await start();
    await send("guess", wrong(game));
    client = {};
    expect(await send("guess", game.answer)).to.include("in 2 tries");
    expect(createGameStore(filename).get("alice").status).to.equal("won");
  });
  it("rejects overlapping duplicate guesses in one process", async () => {
    const game = await start();
    const replies = await Promise.all([send("guess", wrong(game)), send("guess", wrong(game))]);
    expect(replies).to.include("You already guessed that!");
    expect(createGameStore(filename).get("alice").guesses).to.have.length(1);
  });
  it("does not claim a successful guess if saving fails", async () => {
    const game = await start();
    const before = JSON.stringify(game);
    const realStore = client.techdleGames;
    client.techdleGames = {
      get: key => realStore.get(key),
      set() { throw new Error("simulated disk failure"); },
    };
    expect(await send("guess", game.answer)).to.include("could not complete");
    expect(JSON.stringify(realStore.get("alice"))).to.equal(before);
    expect(createGameStore(filename).get("alice").status).to.equal("playing");
  });
  it("handles a corrupt store without replacing it", async () => {
    fs.writeFileSync(filename, "bad json");
    expect(await send("guess", "array")).to.include("could not complete");
    expect(fs.readFileSync(filename, "utf8")).to.equal("bad json");
  });
  it("handles Discord refusing both the acknowledgement and error reply", async () => {
    const i = interaction("guess", "array");
    i.deferReply = async () => { throw new Error("simulated acknowledgement failure"); };
    i.reply = async () => { throw new Error("simulated reply failure"); };
    await event.execute(i, client);
    expect(client.techdleGames).to.equal(undefined);
  });
  it("starts a streak at 1 on a first win and shows it", async () => {
    const game = await start();
    expect(await send("guess", game.answer)).to.include("\n🔥 Win streak: 1 (best 1)");
  });
  it("counts consecutive wins and saves them next to the games", async () => {
    for (let n = 0; n < 3; n++) await send("guess", (await start()).answer);
    const streaks = createGameStore(path.join(dir, "techdle-streaks.json"));
    expect(streaks.get("alice")).to.deep.equal({ current: 3, best: 3 });
  });
  it("resets the streak on a loss but keeps the best", async () => {
    await send("guess", (await start()).answer);
    await send("guess", (await start()).answer);
    const game = await start();
    let reply;
    for (let n = 0; n < 6; n++) reply = await send("guess", wrong(game, n));
    expect(reply).to.include("The word was");
    expect(reply).to.include("🔥 Win streak: 0 (best 2)");
  });
  it("doesn't show or change the streak mid-game", async () => {
    await send("guess", (await start()).answer);
    const game = await start();
    expect(await send("guess", wrong(game))).not.to.include("streak");
    expect(await send("streak")).to.equal("🔥 Win streak: 1 (best 1)");
  });
  it("shows the streak with /streak, including for a new player", async () => {
    expect(await send("streak")).to.equal("🔥 Win streak: 0 (best 0)");
    await send("guess", (await start()).answer);
    expect(await send("streak")).to.equal("🔥 Win streak: 1 (best 1)");
  });
  it("resets the streak when a player skips a game they already guessed in", async () => {
    await send("guess", (await start()).answer);
    const game = await start();
    await send("guess", wrong(game));
    expect(await send("techdle")).to.include("streak reset to 0 (best 1)");
    expect(await send("streak")).to.equal("🔥 Win streak: 0 (best 1)");
  });
  it("keeps the streak when a new game replaces one with no guesses", async () => {
    await send("guess", (await start()).answer);
    await start();
    expect(await send("techdle")).not.to.include("streak");
    expect(await send("streak")).to.equal("🔥 Win streak: 1 (best 1)");
  });
  it("keeps each player's streak separate", async () => {
    await send("guess", (await start()).answer);
    expect(await send("streak", undefined, "bob")).to.equal("🔥 Win streak: 0 (best 0)");
  });
  it("reloads saved streaks after a restart", async () => {
    await send("guess", (await start()).answer);
    client = {};
    await send("guess", (await start()).answer);
    expect(await send("streak")).to.equal("🔥 Win streak: 2 (best 2)");
  });
  it("still shows the win if saving the streak fails", async () => {
    const game = await start();
    client.techdleStreaks = {
      get: () => undefined,
      set() { throw new Error("simulated disk failure"); },
    };
    const reply = await send("guess", game.answer);
    expect(reply).to.include("You win!");
    expect(reply).not.to.include("streak");
    expect(createGameStore(filename).get("alice").status).to.equal("won");
  });

  // Plays one full game for a player in a server and wins it.
  async function win(id, guildId) {
    await send("techdle", undefined, id, guildId);
    await send("guess", client.techdleGames.get(id).answer, id, guildId);
  }
  async function lose(id, guildId) {
    await send("techdle", undefined, id, guildId);
    const game = client.techdleGames.get(id);
    for (let n = 0; n < game.maxAttempts; n++) await send("guess", wrong(game, n), id, guildId);
  }

  it("shows an empty leaderboard before anyone has won", async () => {
    expect(await send("leaderboard", undefined, "alice", "s1"))
      .to.equal("🏆 No wins yet. Start a game with /techdle.");
  });
  it("ranks a server's players by best streak without pinging them", async () => {
    await win("alice", "s1");
    await win("bob", "s1"); await win("bob", "s1"); await lose("bob", "s1");
    const i = interaction("leaderboard", undefined, "carol", "s1");
    await event.execute(i, client);
    expect(i.responses[0]).to.equal(
      "🏆 Techdle Leaderboard · Best Win Streak\n1. <@bob> 2 wins in a row\n2. <@alice> 1 win in a row");
    expect(i.lastReply.allowedMentions).to.deep.equal({ parse: [] });
  });
  it("keeps each server's streaks and leaderboard separate", async () => {
    await win("alice", "s1");
    expect(await send("streak", undefined, "alice", "s2")).to.equal("🔥 Win streak: 0 (best 0)");
    expect(await send("leaderboard", undefined, "alice", "s2")).to.include("No wins yet");
    expect(await send("leaderboard", undefined, "alice", "s1")).to.include("<@alice>");
  });
  it("doesn't count an unfinished game on the leaderboard", async () => {
    await send("techdle", undefined, "alice", "s1");
    await send("guess", wrong(client.techdleGames.get("alice")), "alice", "s1");
    expect(await send("leaderboard", undefined, "bob", "s1")).to.include("No wins yet");
  });
  it("asks for a server when /leaderboard is used in a DM", async () => {
    expect(await send("leaderboard")).to.equal("Use /leaderboard in a server to see its leaderboard.");
  });
  it("ignores unrelated commands and interactions", async () => {
    const i = interaction("decline");
    await event.execute(i, client);
    expect(i.calls).to.deep.equal([]);
    await event.execute({ isChatInputCommand: () => false }, client);
  });
});

describe("Techdle challenge slash integration", () => {
  let dir, previousPath, client;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "techdle-challenge-"));
    previousPath = process.env.TECHDLE_GAME_STORE;
    process.env.TECHDLE_GAME_STORE = path.join(dir, "games.json");
    client = {};
  });
  afterEach(() => {
    if (previousPath === undefined) delete process.env.TECHDLE_GAME_STORE;
    else process.env.TECHDLE_GAME_STORE = previousPath;
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function mock(commandName, { id = "alice", word, targetUser } = {}) {
    return {
      commandName, user: { id },
      responses: [], followUps: [],
      isChatInputCommand: () => true,
      options: { getString: () => word, getUser: () => targetUser },
      async deferReply() {},
      async editReply(value) { this.responses.push(value.content); },
      async followUp(value) { this.followUps.push(value); },
    };
  }
  async function send(commandName, options) {
    const i = mock(commandName, options);
    await event.execute(i, client);
    return { reply: i.responses[0], followUps: i.followUps };
  }
  async function start() {
    await send("challenge", { id: "alice", targetUser: { id: "bob" } });
    await send("accept", { id: "bob" });
    return client.techdleChallenges.get("alice").answer;
  }

  it("invites the opponent and gives private feedback while the challenge is still going", async () => {
    const answer = await start();
    const wrong = ANSWERS.find(word => word !== answer);
    const { reply, followUps } = await send("cguess", { id: "alice", word: wrong });
    expect(reply).to.include("(Guess 1/6)");
    expect(followUps).to.have.length(0); // nobody has won yet
  });
  it("refuses to challenge yourself and to accept twice", async () => {
    expect((await send("challenge", { id: "alice", targetUser: { id: "alice" } })).reply)
      .to.equal("You can't challenge yourself.");
    await start();
    expect((await send("accept", { id: "bob" })).reply).to.equal("This challenge has already been accepted.");
  });
  it("ends the challenge the moment someone wins, locking out the other player", async () => {
    const answer = await start();
    const { followUps } = await send("cguess", { id: "alice", word: answer });
    expect(followUps[0].content).to.include("<@alice> wins!");
    const blocked = await send("cguess", { id: "bob", word: answer });
    expect(blocked.reply).to.equal("This challenge is already finished.");
    expect(blocked.followUps).to.have.length(0);
  });
  it("ties when neither player solves it", async () => {
    const answer = await start();
    const wrong = ANSWERS.filter(word => word !== answer).slice(0, 6);
    for (const word of wrong) await send("cguess", { id: "alice", word });
    let last;
    for (const word of wrong) last = await send("cguess", { id: "bob", word });
    expect(last.followUps[0].content).to.include("Tie");
  });
});

describe("Techdle command registration", () => {
  it("POSTs all seven commands with a required word option and no bulk deletion", async () => {
    const calls = [];
    await register({ TOKEN: "test", CLIENT_ID: "123", GUILD_ID: "456" }, token => {
      expect(token).to.equal("test");
      return { async post(route, options) { calls.push({ route, ...options }); } };
    });
    expect(calls.map(c => c.body.name)).to.deep.equal(["techdle", "guess", "streak", "leaderboard", "challenge", "accept", "cguess"]);
    for (const c of calls) expect(c.route).to.equal("/applications/123/guilds/456/commands");
    expect(calls[1].body.options[0]).to.include({ name: "word", required: true, type: 3 });
    expect(calls[3].body.options).to.be.undefined;
    expect(calls[4].body.options[0]).to.include({ name: "player", required: true, type: 6 });
    expect(calls[6].body.options[0]).to.include({ name: "word", required: true, type: 3 });
  });
  it("rejects missing configuration before making a request", async () => {
    let error;
    try { await register({}, () => { throw new Error("must not reach REST"); }); }
    catch (e) { error = e; }
    expect(error.message).to.include("Set TOKEN, CLIENT_ID and GUILD_ID");
  });
  it("propagates a registration failure", async () => {
    let error;
    try {
      await register({ TOKEN: "test", CLIENT_ID: "123", GUILD_ID: "456" }, () => ({
        async post() { throw new Error("simulated Discord registration failure"); },
      }));
    } catch (e) { error = e; }
    expect(error.message).to.equal("simulated Discord registration failure");
  });
});
