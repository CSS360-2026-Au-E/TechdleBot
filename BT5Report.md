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
Build integration has been automated through the use of GitHub actions and the CI Node.js template. Slight modifications were used to make the YAML file use Node version 24.x, as previous versions resulted in deprecation warnings. Testing with specific files was also automated, and the template allows future tests to be added. 
## Reflection
Thanks to existing documentation and templates, the CI/CD pipeline wasn't that hard to implement. The threat model was disproportionally harder in comparison; the total time spent concluded to around 7-8 hours, with a roughly even split between research, creating the data flow diagram, and writing the actual analysis. In all, I would highly recommend leaving threat modeling to someone with an established background in cybersecurity, instead of someone who may have to do all the knowledge acquisition from the ground up, on the spot. 
# Anthony
# Mario 
# Sida
# Abhi
