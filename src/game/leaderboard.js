// Leaderboard (issue #67).
//
// Ranks a server's players by their best win streak. Streaks are saved per
// server as "<serverId>:<userId>", so each server has its own leaderboard.
// Only finished games change a streak, so unfinished games never count.

export const LEADERBOARD_SIZE = 10;

// The streak store key for a player. Commands used outside a server (in DMs)
// fall back to the player's ID alone and never show up on a leaderboard.
export function streakKey(guildId, userId) {
  return guildId ? `${guildId}:${userId}` : userId;
}

// Takes [key, streak] pairs from the streak store and returns the top players
// in one server: [{ rank, userId, best }]. Players with no wins are left out.
// Higher best streak ranks first; equal streaks share a rank (1, 2, 2, 4) and
// are listed by user ID so the order is always the same.
export function rankLeaderboard(entries, guildId, size = LEADERBOARD_SIZE) {
  const prefix = `${guildId}:`;
  const players = entries
    .filter(([key, streak]) => key.startsWith(prefix) && streak?.best > 0)
    .map(([key, streak]) => ({ userId: key.slice(prefix.length), best: streak.best }))
    .sort((a, b) => b.best - a.best || a.userId.localeCompare(b.userId));

  return players.slice(0, size).map((player, index) => {
    const firstWithScore = players.findIndex(p => p.best === player.best);
    return { rank: firstWithScore + 1, ...player };
  });
}

export function formatLeaderboard(rows) {
  if (rows.length === 0) {
    return "🏆 No wins yet. Start a game with /techdle.";
  }
  const lines = rows.map(({ rank, userId, best }) =>
    `${rank}. <@${userId}> ${best} ${best === 1 ? "win" : "wins"} in a row`);
  return ["🏆 Techdle Leaderboard · Best Win Streak", ...lines].join("\n");
}
