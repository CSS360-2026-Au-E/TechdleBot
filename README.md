# Techdle Bot

Techdle is a Discord bot game about guessing five-letter technology related words.

## Current Status

Solo play: `/techdle` starts a game with a random tech word and six attempts, replacing your current game. `/guess word:<word>` submits a guess and shows green/yellow/black feedback. `/streak` shows your current and best win streak.

Head-to-head play: `/challenge @player` invites another player to a shared game. Once they run `/accept`, both players get the same word and six attempts each, and use `/cguess word:<word>` to guess privately. The challenge ends the moment either player solves the word, and the bot announces the winner (fewer guesses wins; no solve on either side is a tie).

See [TECHDLE-START.md](TECHDLE-START.md) for how to register these commands and run the bot against a test server.
