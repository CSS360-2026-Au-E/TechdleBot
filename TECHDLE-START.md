# Techdle commands

`/techdle` starts a fresh game with a random five-letter tech answer and six
attempts. It replaces the player's previous game and excludes the immediately
previous answer. Older answers may repeat. Both slash commands reply privately.

`/guess word:array` submits a guess to that same game. Valid guesses produce
green/yellow/black feedback. Invalid guesses do not consume an attempt. A match
wins; six valid wrong guesses lose. Finished games reject further guesses until
the player uses `/techdle` again.

## Run in a test server

1. Run `npm ci`.
2. Set `TOKEN`, `CLIENT_ID` (application ID), and `GUILD_ID` (server ID) in `.env`.
   The token and application ID must belong to the same bot.
3. Run `npm run register:techdle`. This registers BOTH `/techdle` and `/guess`
   for that application and server. It updates these names using individual
   POST requests; unrelated commands are preserved.
4. Run `npm start` and leave the process running.
5. Select that bot's `/techdle` in Discord, then `/guess` with its required
   `word` option. Registration alone does not run the bot.

Only run one process for this bot and game store. The existing application
also requests Server Members and Message Content intents; its Developer Portal
settings must permit them. Its separate welcome event needs `CHANNEL_NAME` and
a valid `MEME_URL`, with permission to send messages in that channel.

## Shared game state

The slash interaction dispatcher lives in `src/events/interactionCreate.js`.
It reuses `startGame`, `submitGuess`, and `formatFeedback`; it does not implement
a second scoring engine. Do not add another listener responding to these same
commands.

Games are keyed by Discord user ID in `client.techdleGames`, across servers.
The guess handler initializes the store when necessary, including after a bot
restart, loads the player's game, submits the guess, and saves successful
results with `set(userId, result.game)` before replying.

The default file is `data/techdle-games.json` (ignored by Git).
`TECHDLE_GAME_STORE` overrides that path. Retain this writable file on persistent
storage to keep games across deployments. The store does not support multiple
processes sharing the file. Old `user:UTC-day` records are not resumed. The
active-game store is not a statistics history.

## Scope and verification

Run `npm test` and `npm run build`. The fallback adds 20 tests to the existing
36, covering slash dispatch, persistence, validation, feedback, win/loss,
player separation, overlapping guesses in one process, errors and registration.
Discord interactions and REST calls are mocked in automated tests.

This integration does not replace the legacy `!wordle`/`!guess` implementation
in `app.js`; that implementation uses separate state. Use slash commands for
Techdle. The existing Docker configuration also needs its `dotenv` production
dependency corrected before Docker deployment; this command integration does
not fix that separate issue.

Before release, test on the intended Discord bot: start, guess, invalid input,
win, six-attempt loss, new game, two players, and restart persistence. The
fallback has not yet been tested against a live Discord connection.
