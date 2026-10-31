# Techdle Bot

Techdle is a Discord bot game about guessing five-letter technology related words.

## Current Status

Use `/techdle` to start a game. It picks a random word and gives you six attempts. Starting another game replaces your current one.

The game code has guess validation, letter feedback, and win/loss rules. The `/guess` Discord command still needs to be connected so guesses cannot be submitted in Discord yet.

## Run the Bot

1. Install the project packages:

   ```bash
   npm ci
   ```

2. Create a `.env` file in the project folder with your Discord bot token, application ID, and test server ID:

   ```text
   TOKEN=your_bot_token
   CLIENT_ID=your_application_id
   GUILD_ID=your_test_server_id
   ```

3. Register `/techdle` in your test server:

   ```bash
   npm run register:techdle
   ```

4. Start the bot:

   ```bash
   npm start
   ```

## Build and Test

```bash
npm run build
npm test
```
