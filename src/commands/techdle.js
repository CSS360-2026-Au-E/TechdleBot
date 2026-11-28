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
    new SlashCommandBuilder()
      .setName("challenge")
      .setDescription("Challenge another player to a head-to-head Techdle game")
      .addUserOption(option => option
        .setName("player")
        .setDescription("The player you want to challenge")
        .setRequired(true)),
    new SlashCommandBuilder()
      .setName("accept")
      .setDescription("Accept a pending Techdle challenge"),
    new SlashCommandBuilder()
      .setName("cguess")
      .setDescription("Guess the five-letter word in your current Techdle challenge")
      .addStringOption(option => option
        .setName("word")
        .setDescription("Your five-letter guess")
        .setRequired(true)),
      .setName("leaderboard")
      .setDescription("Show the top Techdle players in this server by best win streak"),
  ].map(command => command.toJSON());
}
