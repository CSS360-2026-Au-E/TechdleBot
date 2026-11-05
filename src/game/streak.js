// Win streaks (issue #35).
//
// Every /techdle is a new game (no daily puzzle), so a streak counts
// consecutive wins, not consecutive days. A loss resets it to 0.
//
// TODO (next steps):
// - save each player's streak (reuse createGameStore from store.js)
// - call recordResult when /guess ends a game as won or lost
// - show the streak in the win/loss reply, maybe add a /streak command
import { STATUS } from "./game";

export function newStreak() {
  return { current: 0, best: 0 };
}

// Updates a player's streak after a finished game. Games still being
// played don't change it. Never mutates the streak it was given.
export function recordResult(streak = newStreak(), status) {
  if (status === STATUS.WON) {
    const current = streak.current + 1;
    return { current, best: Math.max(streak.best, current) };
  }
  if (status === STATUS.LOST) {
    return { ...streak, current: 0 };
  }
  return streak;
}
