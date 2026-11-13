// Win streaks (issue #35).
//
// Every /techdle is a new game (no daily puzzle), so a streak counts
// consecutive wins, not consecutive days. A loss resets it to 0, and so does
// starting a new game after guessing in an unfinished one (otherwise a player
// could skip any hard word and keep their streak).
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

// True when replacing this game should cost the player their streak: they
// already guessed in it but didn't finish it.
export function isAbandoned(game) {
  return game?.status === STATUS.PLAYING && game.guesses.length > 0;
}

export function formatStreak(streak = newStreak()) {
  return `🔥 Win streak: ${streak.current} (best ${streak.best})`;
}
