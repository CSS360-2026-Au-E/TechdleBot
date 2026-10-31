import { REST, Routes } from "discord.js";
import { techdleCommands } from "./commands/techdle";

// Run explicitly for your private test server. POST creates/updates only this
// named commands and preserves other commands registered by teammates.
export async function register(env = process.env, makeRest = token => new REST({ version: "10" }).setToken(token)) {
  const { TOKEN, CLIENT_ID, GUILD_ID } = env;
  if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
    throw new Error("Set TOKEN, CLIENT_ID and GUILD_ID in your .env file first.");
  }
  const rest = makeRest(TOKEN);
  for (const command of techdleCommands()) {
    await rest.post(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: command,
    });
  }
  console.log("Registered /techdle and /guess in your test server.");
}

if (require.main === module) register().catch(error => {
  console.error("Could not register Techdle commands:", error.message);
  process.exitCode = 1;
});
