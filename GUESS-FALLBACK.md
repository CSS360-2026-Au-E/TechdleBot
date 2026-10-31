# Optional slash-guess fallback

Prepared from the team's AythanTesting commit
`3b4e8f4b4ed44a0da8400cc67b58270799d9f412`.
Use only if the team chooses this integration instead of another implementation.
It has not been pushed, merged, registered in Discord, or deployed.

## Apply the patch if needed

These commands assume `upstream` points to CSS360-2026-Au-E/TechdleBot.
First run `git status`. Preserve any unfinished work before switching branches.
Download `techdle-guess-fallback.patch` and substitute its actual path below.

```bash
 git fetch upstream
 git switch -c feat/techdle-guess-fallback upstream/AythanTesting
 git apply --check /path/to/techdle-guess-fallback.patch
 git apply /path/to/techdle-guess-fallback.patch
 npm ci
 npm test
 npm run build
```

If `git apply --check` fails, stop: the team branch may have changed and the
patch needs reconciliation. Do not force it over another person's work.

Follow TECHDLE-START.md to configure your test bot, register BOTH commands with
`npm run register:techdle`, and run `npm start`. Live Discord verification is
still required. Stop any old instance using that same bot token first.

After the team reviews the approach and Discord testing passes, commit the
changed files and open a PR to the team's chosen integration branch. This
fallback does not authorize a direct push to team main.

## Review scope

- One slash dispatcher handles `/techdle` and `/guess word:...` privately.
- Registration preserves unrelated commands.
- The existing start function, file store, word lists and game engine are reused.
- Startup text now tells players to use `/guess`.
- Tests cover valid and invalid input, attempts, wins/losses, restart persistence,
  separate players, simultaneous guesses in one process, and failure handling.
- Existing prefix commands, Docker dependency issues and welcome-handler issues
  are outside this patch. This is a guess-integration fallback, not a complete
  repair of every issue in the branch.
