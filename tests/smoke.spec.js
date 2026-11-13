// Smoke test (Bot Task 5): one quick pass through every major feature of the
// bot, wired up the same way app.js wires it for Discord. If any of these
// fail, something core is broken and the bot shouldn't be deployed.
import { expect } from "chai";
import fs from "fs";
import os from "os";
import path from "path";
import { EventEmitter } from "events";
import { Collection } from "discord.js";
import { loadEvents } from "../src/helpers";
import { register } from "../src/registerTechdle";
import { ANSWERS } from "../src/game/words";

// A stand-in for a Discord slash command interaction.
function slash(commandName, word, userId = "smoke-user") {
  return {
    commandName,
    user: { id: userId },
    deferred: false,
    replied: false,
    replies: [],
    isChatInputCommand: () => true,
    options: { getString: () => word },
    async deferReply() { this.deferred = true; },
    async editReply({ content }) { this.replies.push(content); },
  };
}

// Silences console.log while fn runs and returns everything it logged.
function captureLogs(fn) {
  const logged = [];
  const original = console.log;
  console.log = (...args) => logged.push(args.join(" "));
  try { fn(); } finally { console.log = original; }
  return logged.join("\n");
}

describe("Smoke test: every major feature", () => {
  let dir, previousStore, previousMeme, client;

  // Runs a command through the loaded interactionCreate handler and
  // returns the bot's reply.
  async function command(name, word, userId) {
    const interaction = slash(name, word, userId);
    await client.events.get("interactionCreate")(interaction);
    expect(interaction.replies, `/${name} should reply once`).to.have.length(1);
    return interaction.replies[0];
  }
  const answer = () => client.techdleGames.get("smoke-user").answer;
  const wrongWord = () => ANSWERS.find(word => word !== answer());

  before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "techdle-smoke-"));
    previousStore = process.env.TECHDLE_GAME_STORE;
    process.env.TECHDLE_GAME_STORE = path.join(dir, "games.json");
    // The welcome event crashes without a meme URL (found by this test; see
    // BT5Report.md), so give it one like a real .env file would.
    previousMeme = process.env.MEME_URL;
    process.env.MEME_URL = "https://example.com/meme.png";

    // Same setup as app.js, with a fake client instead of a Discord login.
    client = new EventEmitter();
    client.rest = new EventEmitter();
    client.events = new Collection();
    const table = captureLogs(() => loadEvents(client, path.join(__dirname, "../src/events")));
    expect(table).to.include("interactionCreate.js");
  });

  after(() => {
    if (previousStore === undefined) delete process.env.TECHDLE_GAME_STORE;
    else process.env.TECHDLE_GAME_STORE = previousStore;
    if (previousMeme === undefined) delete process.env.MEME_URL;
    else process.env.MEME_URL = previousMeme;
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("loads every event handler", () => {
    expect([...client.events.keys()]).to.have.members(["ready", "interactionCreate", "guildMemberAdd"]);
    expect(client.listenerCount("interactionCreate")).to.equal(1);
  });

  it("registers all slash commands", async () => {
    const posted = [];
    const original = console.log; // keep the test output clean
    console.log = () => {};
    try {
      await register({ TOKEN: "t", CLIENT_ID: "1", GUILD_ID: "2" },
        () => ({ async post(route, { body }) { posted.push(body.name); } }));
    } finally { console.log = original; }
    expect(posted).to.deep.equal(["techdle", "guess", "streak"]);
  });

  it("logs in through the ready event", () => {
    const fakeBot = { user: { username: "Techdle" }, guilds: { cache: { size: 1 } }, users: { cache: { size: 3 } } };
    expect(captureLogs(() => client.events.get("ready")(fakeBot))).to.include("Logged in as Techdle!");
  });

  it("welcomes a new member", async () => {
    const sent = [];
    const channel = { name: process.env.CHANNEL_NAME, send: message => sent.push(message) };
    const member = {
      id: "new-member",
      guild: { channels: { cache: { find: test => [channel].find(test) } } },
    };
    await client.events.get("guildMemberAdd")(member);
    expect(sent).to.have.length(1);
    expect(sent[0].content).to.include("<@new-member>");
    expect(sent[0].embeds).to.have.length(1);
  });

  it("plays a full game: start, bad guess, wrong guess, win", async () => {
    expect(await command("techdle")).to.include("Techdle started!");
    expect(await command("guess", "ab")).to.equal("you need 5 letters");
    expect(await command("guess", wrongWord())).to.include("(Guess 1/6)");
    const win = await command("guess", answer());
    expect(win).to.include("🎉 You win!");
    expect(win).to.include("🔥 Win streak: 1 (best 1)");
  });

  it("loses after six wrong guesses and resets the streak", async () => {
    await command("techdle");
    let reply;
    for (let i = 0; i < 6; i++) reply = await command("guess", wrongWord());
    expect(reply).to.include(`The word was ${answer().toUpperCase()}`);
    expect(reply).to.include("🔥 Win streak: 0 (best 1)");
  });

  it("shows the streak with /streak", async () => {
    expect(await command("streak")).to.equal("🔥 Win streak: 0 (best 1)");
  });

  it("keeps games and streaks after the bot restarts", async () => {
    await command("techdle");
    const before = answer();
    // A restart throws away everything in memory except the saved files.
    delete client.techdleGames;
    delete client.techdleStreaks;
    expect(await command("streak")).to.equal("🔥 Win streak: 0 (best 1)");
    expect(answer()).to.equal(before);
    expect(await command("guess", before)).to.include("🔥 Win streak: 1 (best 1)");
  });
});
