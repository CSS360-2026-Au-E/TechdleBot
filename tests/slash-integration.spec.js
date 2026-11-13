import { expect } from "chai";
import fs from "fs";
import os from "os";
import path from "path";
import event from "../src/events/interactionCreate";
import { createGameStore } from "../src/game/store";
import { startGame } from "../src/game/start";
import { ANSWERS } from "../src/game/words";
import { register } from "../src/registerTechdle";

function interaction(commandName, word, id = "alice") {
  return {
    commandName, user: { id }, deferred: false, replied: false,
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
  async function send(command, word, id) {
    const i = interaction(command, word, id);
    await event.execute(i, client);
    expect(i.calls).to.deep.equal(["defer", "edit"]);
    return i.responses[0];
  }
  async function start(id = "alice") {
    expect(await send("techdle", undefined, id)).to.include("Use /guess");
    return client.techdleGames.get(id);
  }
  const wrong = game => ANSWERS.find(word => word !== game.answer);

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
  it("scores unlisted guesses, saves them and counts their attempts", async () => {
    client.techdleGames = createGameStore(filename);
    startGame("alice", client.techdleGames, () => 0); // array
    expect(await send("guess", "zzzzz")).to.equal("⬛⬛⬛⬛⬛ (Guess 1/6)\n5 attempts left. Use /guess to guess again.");
    expect(await send("guess", "razzz")).to.equal("🟨🟨⬛⬛⬛ (Guess 2/6)\n4 attempts left. Use /guess to guess again.");
    expect(await send("guess", "aaaaa")).to.equal("🟩⬛⬛🟩⬛ (Guess 3/6)\n3 attempts left. Use /guess to guess again.");
    expect(createGameStore(filename).get("alice").guesses.map(g => g.guess)).to.deep.equal(["zzzzz", "razzz", "aaaaa"]);
  });
  it("loses after six valid wrong guesses and rejects a seventh", async () => {
    const game = await start();
    for (let n = 1; n < 6; n++) {
      expect(await send("guess", wrong(game))).to.include(`${6 - n} attempts left`);
    }
    expect(await send("guess", wrong(game))).to.include(`No attempts left. The word was ${game.answer.toUpperCase()}.`);
    const before = fs.readFileSync(filename, "utf8");
    expect(await send("guess", game.answer)).to.equal("This game is already finished.");
    expect(fs.readFileSync(filename, "utf8")).to.equal(before);
  });
  it("allows a win on the sixth guess", async () => {
    const game = await start();
    for (let n = 0; n < 5; n++) await send("guess", wrong(game));
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
    for (let n = 0; n < 6; n++) await send("guess", wrong(game));
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
  it("preserves two overlapping guesses in one process", async () => {
    const game = await start();
    await Promise.all([send("guess", wrong(game)), send("guess", wrong(game))]);
    expect(createGameStore(filename).get("alice").guesses).to.have.length(2);
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
    for (let n = 0; n < 6; n++) reply = await send("guess", wrong(game));
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
  it("ignores unrelated commands and interactions", async () => {
    const i = interaction("challenge");
    await event.execute(i, client);
    expect(i.calls).to.deep.equal([]);
    await event.execute({ isChatInputCommand: () => false }, client);
  });
});

describe("Techdle command registration", () => {
  it("POSTs all three commands with a required word option and no bulk deletion", async () => {
    const calls = [];
    await register({ TOKEN: "test", CLIENT_ID: "123", GUILD_ID: "456" }, token => {
      expect(token).to.equal("test");
      return { async post(route, options) { calls.push({ route, ...options }); } };
    });
    expect(calls.map(c => c.body.name)).to.deep.equal(["techdle", "guess", "streak"]);
    for (const c of calls) expect(c.route).to.equal("/applications/123/guilds/456/commands");
    expect(calls[1].body.options[0]).to.include({ name: "word", required: true, type: 3 });
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
