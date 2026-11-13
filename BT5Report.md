# This is a group report for Bot Task 5. All group members should contribute to this file only.

# Aythan
## Threat Model
### Introduction
This analysis will present a formal threat model for the techdle Discord bot, developed in Java. It will identify potential security threats using the STRIDE framework,
determine their likely impact, and present prevention or mitigation strategies, where possible and relevant to the current build. 
### Bot Basic Description
The techdle bot allows Discord users to play Wordle through slash commands. Figure 1 shows the basic data flows of the bot.

The following serves as a key/legend to the individual components for Figure 1:
- Discord User: Person interacting with the bot.
- Discord API: Handles communication between discord and the bot.
- interactionCreate.js: Handles the majority of the bot's decision making and validation.
- store.js: Handles the game state.
- feedback.js: Handles bot output to the user, including failure messages. 

Figure 1
<img width="1280" height="960" alt="CSS 360 Bot Task 5 Aythan Pao 2026" src="https://github.com/user-attachments/assets/4a397798-df52-4f58-a9f8-b93135c775e0" />
A trust boundary represents a point where information moves between components with different levels of trust. The boundary in Figure 1 shows that primary boundary 
is between the user and the bot. All user input is treated as untrusted and must be verified, and measures should be taken to prevent unauthorized access to the bot 
from the user. 
### STRIDE Threat Analysis
The following tables identify potential threats to the bot, describes them, ranks their risk and impact, and suggests mitigation strategies for each. 

**Spoofing:** An attacker pretends to be someone or something other than themselves.
| Threat | Description | Risk | Impact | Mitigation |
| ------------- | ------------- | ------------- | ------------- | ------------- |
| User/bot spoofing | An attacker forges a user's ID or gains access to the bot's .env token, obscuring their real identify. | Negligible | Medium | Preliminary analysis suggests that both the bot and Discord's API have sufficient protections against spoofing attacks. Discord's API should handle all attempts at spoofing the user. Restricting access to the bot's token in the .env file through the use of .gitignore and avoidance in logging the token in variables and debug console sufficiently protect the bot and its permissions against becoming compromised or misused. |

**Tampering:** Application data, functionality, or game state is modified without appropriate authorization. 
| Threat | Description | Risk | Impact | Mitigation |
| ------------- | ------------- | ------------- | ------------- | ------------- |
| Modification of persistent game state | An attacker with access to the bot's local JSON file could modify it to manipulate the current game state. This could result in changes to the user's answer, the number of allowed attempts, and win/loss conditions. | Medium | Low | Current protections of hiding the JSON file in a hidden folder are sufficient against ordinary users. Against a dedicated attacker, however, the bot may need to be modified so that it can independently check the state of the game against the JSON file to detect errors caused by intrusions. As long as no sensitive information is stored in the file, the impact will remain minimal in the event of a breach. |
| Modification of source code | An attacker with access to the bot's source code can manipulate game mechanics, which can result in unlimited max attempts, rigging games to always be won, and additional words being added to the bot's list of answers. | Low | Extreme | Barring physical theft, the only other point of access would be unauthorized intrusion from the github repo, and creating and self-approving malicious PRs. As long as the CI/CD pipeline has sufficient protections and current repo permissions don't change, the likelihood of this happening should remain low. |

**Repudiation:** The user or system denies having performed an action, necessitating checks for verification of that claim. 
| Threat | Description | Risk | Impact | Mitigation |
| ------------- | ------------- | ------------- | ------------- | ------------- |
| Due to the way the bot works, preliminary analysis is unable to identify a plausible threat that can make use of this attack vector. | N/A | N/A | N/A | N/A |

**Information Disclosure:** Information is exposed to those not authorized to access it. 
| Threat | Description | Risk | Impact | Mitigation |
| ------------- | ------------- | ------------- | ------------- | ------------- |
| Exposure of Discord bot token | Unauthorized parties gaining access to the bot's token will allow them to hijack the bot. | Low | Medium | Preliminary analysis suggests that all due measures have been taken to obscure the bot's token, including using .gitignore, avoiding giving excessive permissions to the bot to reduce damage in the event of exposure, and physically securing developer machines. However, if the bot is to be maintained for any length of time, it is recommended to reset the token every so often. |

**Denial of Service:** An attacker takes up a significant percentage of an application's resources, hindering its ability to function or making it unavailable entirely.
| Threat | Description | Risk | Impact | Mitigation |
| ------------- | ------------- | ------------- | ------------- | ------------- |
| Spam Discord Commands | Attackers could potentially spam the bot with slash commands, such as through scripts and macros, even while the bot is processing previous commands. This can result in errors in game logic, as well as a general slowdown in bot performance as CPU resources are consumed. | High | High | It is recommended to introduce cooldowns between commands for each user, as well as limit the number of games a player can initiate each day. |

**Elevation of Privilege:** An attacker gains admin perms or other authority not permitted or intended for them. 
| Threat | Description | Risk | Impact | Mitigation |
| ------------- | ------------- | ------------- | ------------- | ------------- |
| Preliminary analysis suggests that any threats that can be achieved through this vector are more likely to happen with Spoofing or Information Disclosure, and will achieve the same results for less work. As such, any weak points and mitigation strategies should instead first concern themselves with those sections | N/A |  N/A | N/A | N/A |

**Summary:**
Overall, the bot in its current state has few vulnerabilities in its short term, though any plans for long term maintenance may need to revise this threat model. Its current security risk lands on Low-Medium. The current highest priority for security should include protecting against DDoS command spam. Medium priorities should focus on protecting and validating games states, while low priorities include introducing more auditing data for logging; examples include dates of game creation, submissions, completions, and user IDs. Whatever solutions may be pursued, this analysis advises caution in not introducing or recording sensitive information, especially in places where such functions or information weren't there before. 
## CI/CD Pipeline
Build integration has been automated through the use of GitHub actions and the CI Node.js template. Slight modifications were used to make the YAML file use Node version 24.x, as previous versions resulted in deprecation warnings. Testing was also automated, and the template allows future, more specific tests to be added. 
## Reflection
Thanks to existing documentation and templates, the CI/CD pipeline wasn't that hard to implement. The threat model was disproportionally harder in comparison; the total time spent concluded to around 7-8 hours, with a roughly even split between research, creating the data flow diagram, and writing the actual analysis. In all, I would highly recommend leaving threat modeling to someone with an established background in cybersecurity, or at least split the work between multiple non-experts. 
# Anthony
# Mario 
## Unit Testing
### Introduction
The following are very basic, fundamental unit tests to test the restrictions on user input in order to provide a valid input via the ```!wordle``` command. These are very basic unit tests, as per instruction. More unit tests will come in the near future.

| | Description | Output | Success |
| ------------- | ------------- | ------------- | ------------- |
| Unit Test 1: Duplicate guesses | Uses a function to imitate a user input then sends the input into the input validation .js file. Input should return a message indicating "You already guessed that!". These values are stored in a set which do not offer multiple duplicates. | Inputting the word "crane" into the function multiple times responds with the bot telling the user this value already exists. | True |
| Unit Test 2: Invalid input | Using the same "mockMessage" function as in Unit Test 1, the mockMessage contains the ```!guess``` command provides a value less than the desired 5 letters. | Bot responds with a message requesting a valid 5-letter input. A valid input size does NOT return the failure message. | True |
| Unit Test 3: Basic Color Boxes | Sending a word as the wordle word and a guess, both containing words that only differ in 1 letter, returns a feedback string with boxes ("emojis") which corresponds whether the letter is in the right place, exists in the answered word or is not present whatsoever. | Importing the "evaluateGuess" function file used in the previous 2 tests, we use this function to compare the feedback string with what we expect the string to be. | True |

## Fuzzing
As defined, "Fuzzing" introduces the random element of the things that could go wrong from random input that may not have been considered while in implementation. When testing, issues which arose in my instances include: 
- Blank Input: ```!guess``` with absolutely no input breaks the game, not responding to any input and raising an exception on the back end console.
- Duplicates: If a user inputs a duplicate guess, it would count against the user, resulting in the loss of a turn.
- Injection: An attempt to insert Javascript/HTML code and 'return' keyword was made to see if the logic would process it as a command but yielded no results.

Duplication had been patched then tested via Unit Test 1. Blank Input has been noted and a fix is waiting to be pushed to the upstream. 

## Summary and Reflection
The largest issue that I had, which took 3-4 hours of research just on investigating the exception, came from improper file structure. Containing all the logic within the main "app.js" file returned an error with triggering the Node Package Manager (npm) test function. The test call would attempt to run and execute the boiler plate imports at the top of app.js. In order to avoid this route, the function which implements the logic was moved to a separate file within the "game" folder. The next hurdle was the syntax behind the unit testing and the code associated with the implementation which took another 1-2 hours. In response to these issues, modularization will be taken into account in order to implement more unit test files while avoiding any accidental executions. Fuzzing was more manageable, thinking "How can I break this?" but with the randomize element, more focus on fuzzing may need to be taken into account.


# Sida

# Abhi
## Technical Debt and Code Smells

I looked at the code for `/techdle` and `/guess`. `src/events/interactionCreate.js` handles both commands. It starts games, handles guesses, loads and saves games, and builds the replies. The game rules are in separate files, which makes them easier to find.

`src/game/words.js` defines an `ALLOWED_GUESSES` list, but `src/game/validate.js` does not use it. Right now, `/guess` accepts any five letters from a to z, even if the guess is not in the list. That is the current behavior, but the unused list could confuse someone working on the code later.

`src/game/validate.js` also defines three error names with the same message, “you need 5 letters.” The code uses two of those names; the third is unused. This could be simplified.

`src/game/store.js` saves games in a JSON file and is designed for one running bot process. If multiple bot processes ran at the same time, each could have an outdated copy of the game data and overwrite another process’s updates.

## Cohesion and Coupling

Cohesion is about how closely a file's responsibilities fit together. Coupling is about how much it depends on other parts of the program. I checked each file's responsibilities and counted its direct imports from other project files. I did not count Node.js modules or packages such as Discord.js. These counts show some of the connections, but they do not measure every dependency.

| File | Main job | Imports from other project files |
| --- | --- | ---: |
| `src/commands/techdle.js` | Defines `/techdle` and `/guess` | 0 |
| `src/registerTechdle.js` | Registers the commands with Discord | 1 |
| `src/events/interactionCreate.js` | Handles commands and connects Discord to the game code | 4 |
| `src/game/start.js` | Picks an answer and starts a game | 2 |
| `src/game/game.js` | Processes guesses and updates win/loss status | 2 |
| `src/game/store.js` | Saves and loads games | 0 |
| `src/game/feedback.js` | Scores letters and creates colored feedback | 0 |
| `src/game/validate.js` | Checks the guess format | 0 |
| `src/game/words.js` | Holds the answer and guess lists | 0 |

Most of these files have good cohesion because they focus on one main job. For example, `validate.js` checks input, while `store.js` handles saving and loading. This makes it easier to change one part without working through unrelated code.

`interactionCreate.js` has the most direct project imports in this group. That makes sense because it connects the commands to the game rules and storage. It also builds the replies and handles errors, so it is the file most likely to grow as more commands are added. If that happens, moving reply formatting or individual command handling into separate functions could make it easier to manage.

The core game rules do not import Discord.js or perform file operations. Also, `startGame` accepts a store with `get` and `set` methods, so it can work with a map during testing. This helps keep the game rules separate from Discord and the JSON storage.

