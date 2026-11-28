// Head-to-head Techdle: two players share one word and six attempts each;
// fewer guesses to solve it wins.
import { randomInt } from "crypto";
import { ANSWERS } from "./words";
import { newGame, submitGuess, STATUS } from "./game";

export const RESULT = { CHALLENGER: "challenger", OPPONENT: "opponent", TIE: "tie" };

export const CHALLENGE_ERRORS = {
  SELF: "You can't challenge yourself.",
  NO_CHALLENGE: "You don't have a challenge to accept. Use /challenge first.",
  NOT_INVITED: "Only the challenged player can accept this.",
  ALREADY_ACTIVE: "This challenge has already been accepted.",
  NO_ACTIVE_CHALLENGE: "You don't have an active challenge. Use /challenge to start one.",
  ALREADY_FINISHED: "This challenge is already finished.",
};

// A win ends it right away for both players; otherwise it's finished once
// neither can still catch up.
function isFinished(games) {
  const list = Object.values(games);
  return list.some(g => g.status === STATUS.WON) || list.every(g => g.status !== STATUS.PLAYING);
}

export function createChallenge(challenger, opponent) {
  if (challenger === opponent) return { ok: false, error: CHALLENGE_ERRORS.SELF };
  return { ok: true, challenge: { challenger, opponent } };
}

export function acceptChallenge(challenge, userId, pickIndex = randomInt) {
  if (!challenge) return { ok: false, error: CHALLENGE_ERRORS.NO_CHALLENGE };
  if (userId !== challenge.opponent) return { ok: false, error: CHALLENGE_ERRORS.NOT_INVITED };
  if (challenge.games) return { ok: false, error: CHALLENGE_ERRORS.ALREADY_ACTIVE };

  const answer = ANSWERS[pickIndex(ANSWERS.length)];
  const games = { [challenge.challenger]: newGame(answer), [challenge.opponent]: newGame(answer) };
  return { ok: true, challenge: { ...challenge, answer, games } };
}

// Reuses the single-player engine for each half, so a guess is validated,
// scored and rejected (duplicate/invalid/finished) the same way it is solo.
export function submitChallengeGuess(challenge, userId, raw) {
  const game = challenge?.games?.[userId];
  if (!game) return { ok: false, error: CHALLENGE_ERRORS.NO_ACTIVE_CHALLENGE };
  if (isFinished(challenge.games)) return { ok: false, error: CHALLENGE_ERRORS.ALREADY_FINISHED };

  const result = submitGuess(game, raw);
  if (!result.ok) return result;

  const games = { ...challenge.games, [userId]: result.game };
  return { ok: true, challenge: { ...challenge, games }, feedback: result.feedback, finished: isFinished(games) };
}

// Fewer guesses to a correct answer wins; solving beats not solving; equal
// guess counts (or neither solving) ties.
export function challengeResult({ challenger, opponent, games }) {
  const won = id => games[id].status === STATUS.WON;
  const tries = id => games[id].guesses.length;

  if (won(challenger) !== won(opponent)) return won(challenger) ? RESULT.CHALLENGER : RESULT.OPPONENT;
  if (!won(challenger) || tries(challenger) === tries(opponent)) return RESULT.TIE;
  return tries(challenger) < tries(opponent) ? RESULT.CHALLENGER : RESULT.OPPONENT;
}
