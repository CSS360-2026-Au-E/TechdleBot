import { SlashCommandBuilder } from "discord.js";

export function techdleCommands() {
  return [
    new SlashCommandBuilder()
      .setName("techdle")
      .setDescription("Start a new Techdle game with a random tech word"),
    new SlashCommandBuilder()
      .setName("guess")
      .setDescription("Guess the five-letter word in your current Techdle game")
      .addStringOption(option => option
        .setName("word")
        .setDescription("Your five-letter guess")
        .setRequired(true)),
    new SlashCommandBuilder()
      .setName("streak")
      .setDescription("Show your current and best Techdle win streak"),
  ].map(command => command.toJSON());
}
