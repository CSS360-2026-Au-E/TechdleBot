import fs from "fs";
import path from "path";

// Small single-process store. Mount this directory on persistent storage in
// deployment. Reuse set(key, result.game) after a successful submitGuess.
export function createGameStore(filename) {
  let entries = {};
  try {
    entries = JSON.parse(fs.readFileSync(filename, "utf8"));
    if (!entries || typeof entries !== "object" || Array.isArray(entries)) {
      throw new Error("Invalid Techdle game store");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  return {
    get(key) { return entries[key]; },
    // Every saved [key, value] pair, e.g. for ranking players.
    entries() { return Object.entries(entries); },
    set(key, game) {
      const next = { ...entries, [key]: game };
      fs.mkdirSync(path.dirname(filename), { recursive: true });
      fs.writeFileSync(`${filename}.tmp`, JSON.stringify(next), { mode: 0o600 });
      fs.renameSync(`${filename}.tmp`, filename);
      entries = next;
    },
  };
}
