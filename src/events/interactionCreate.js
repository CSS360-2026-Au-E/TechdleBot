import path from "path";
import { startGame } from "../game/start";
import { createGameStore } from "../game/store";
import { submitGuess, attemptsLeft, STATUS } from "../game/game";
import { formatFeedback } from "../game/feedback";
import { recordResult, isAbandoned, formatStreak } from "../game/streak";

const COMMANDS = ["techdle", "guess", "streak"];

function gameStorePath() {
  return process.env.TECHDLE_GAME_STORE ||
    path.join(process.cwd(), "data", "techdle-games.json");
}

// Streaks live in their own file next to the saved games.
function streakStorePath() {
  return process.env.TECHDLE_STREAK_STORE ||
    path.join(path.dirname(gameStorePath()), "techdle-streaks.json");
}

// Saves a streak change. A failed streak save is logged but never hides the
// game result, which has already been saved.
function saveStreak(client, key, update) {
  try {
    const streak = update(client.techdleStreaks.get(key));
    client.techdleStreaks.set(key, streak);
    return streak;
  } catch (error) {
    console.error("Techdle streak save failed:", error.message);
    return null;
  }
}

export async function handleStart(interaction, client) {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "techdle") return;
  return handleInteraction(interaction, client);
}

export async function handleInteraction(interaction, client) {
  if (
    !interaction.isChatInputCommand() ||
    !COMMANDS.includes(interaction.commandName)
  ) {
    return;
  }

  try {
    await interaction.deferReply({ ephemeral: true });

    // Load saved games and streaks only when first needed.
    if (!client.techdleGames) {
      client.techdleGames = createGameStore(gameStorePath());
    }
    if (!client.techdleStreaks) {
      client.techdleStreaks = createGameStore(streakStorePath());
    }

    const key = interaction.user.id;
    if (interaction.commandName === "streak") {
      await interaction.editReply({ content: formatStreak(client.techdleStreaks.get(key)) });
      return;
    }

    if (interaction.commandName === "techdle") {
      const abandoned = isAbandoned(client.techdleGames.get(key));
      startGame(key, client.techdleGames);
      let content =
        "Techdle started! Guess the five-letter tech word in 6 attempts. " +
        "Every /techdle starts a new game and replaces your previous game.\n" +
        "Use /guess and enter your word to play.";
      if (abandoned && client.techdleStreaks.get(key)?.current > 0) {
        const streak = saveStreak(client, key, s => recordResult(s, STATUS.LOST));
        if (streak) content += `\nYour last game wasn't finished, so your win streak reset to 0 (best ${streak.best}).`;
      }
      await interaction.editReply({ content });
      return;
    }

    // Keep load, submit and save together with no await between them. This
    // prevents overlapping commands in one process from overwriting a guess.
    const game = client.techdleGames.get(key);
    if (!game) {
      await interaction.editReply({ content: "Start a game with /techdle first." });
      return;
    }
    const result = submitGuess(game, interaction.options.getString("word", true));
    if (!result.ok) {
      await interaction.editReply({ content: result.error });
      return;
    }
    client.techdleGames.set(key, result.game);

    // A finished game can't take more guesses, so each game is counted once.
    const finished = result.game.status !== STATUS.PLAYING;
    const streak = finished
      ? saveStreak(client, key, s => recordResult(s, result.game.status))
      : null;

    const row = formatFeedback(result.feedback);
    const count = result.game.guesses.length;
    let content;
    if (result.game.status === STATUS.WON) {
      content = `${row}\n🎉 You win! You guessed ${result.game.answer.toUpperCase()} in ${count} ${count === 1 ? "try" : "tries"}. Start another game with /techdle.`;
    } else if (result.game.status === STATUS.LOST) {
      content = `${row}\nNo attempts left. The word was ${result.game.answer.toUpperCase()}. Start another game with /techdle.`;
    } else {
      content = `${row} (Guess ${count}/${result.game.maxAttempts})\n${attemptsLeft(result.game)} attempts left. Use /guess to guess again.`;
    }
    if (streak) content += `\n${formatStreak(streak)}`;
    await interaction.editReply({ content });
  } catch (error) {
    console.error(`Techdle /${interaction.commandName} failed:`, error.message);

    const response = {
      content:
        "Techdle could not complete this command. Please try again later.",
    };

    // Discord might also reject the error response.
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(response);
      } else {
        await interaction.reply({ ...response, ephemeral: true });
      }
    } catch (replyError) {
      console.error("Techdle error response failed:", replyError.message);
    }
  }
}

export default {
  name: "interactionCreate",
  execute: handleInteraction,
};
