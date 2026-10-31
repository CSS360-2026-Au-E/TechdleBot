import path from "path";
import { startGame } from "../game/start";
import { createGameStore } from "../game/store";
import { submitGuess, attemptsLeft, STATUS } from "../game/game";
import { formatFeedback } from "../game/feedback";

export async function handleStart(interaction, client) {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "techdle") return;
  return handleInteraction(interaction, client);
}

export async function handleInteraction(interaction, client) {
  if (
    !interaction.isChatInputCommand() ||
    !["techdle", "guess"].includes(interaction.commandName)
  ) {
    return;
  }

  try {
    await interaction.deferReply({ ephemeral: true });

    // Load saved games only when first needed.
    if (!client.techdleGames) {
      client.techdleGames = createGameStore(
        process.env.TECHDLE_GAME_STORE ||
          path.join(process.cwd(), "data", "techdle-games.json")
      );
    }

    const key = interaction.user.id;
    if (interaction.commandName === "techdle") {
      startGame(key, client.techdleGames);
      await interaction.editReply({ content:
        "Techdle started! Guess the five-letter tech word in 6 attempts. " +
        "Every /techdle starts a new game and replaces your previous game.\n" +
        "Use /guess and enter your word to play."
      });
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
