require('dotenv').config();

import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import { loadEvents } from "./helpers";
import path from "path";
import { get } from "http";

const TOKEN = process.env.TOKEN;

const { Guilds, GuildMembers, GuildMessages, MessageContent } =
  GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember } = Partials;

const client = new Client({
  intents: [Guilds, GuildMembers, GuildMessages, MessageContent],
  partials: [User, Message, GuildMember, ThreadMember],
});


async function getWordleWord() {
  const url = "https://raw.githubusercontent.com/Kinkelin/WordleCompetition/refs/heads/main/data/official/combined_wordlist.txt";

  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const text = await res.text();
    const words = text
      .split(/\r?\n/)
      .map(word => word.trim())
      .filter(word => word);

    return words[Math.floor(Math.random() * words.length)];
  } catch (error) {
    console.error("Something went wrong:", error);
    return null;
  }
}

//getWordleWord();

//map with key and value (word, num of guesses). Guesses will be the restriction to win/lose.
 const activeGames = new Map();

client.on('messageCreate', async (message) => {
    // 
    if (message.author.bot) return;

    // 
    if (message.content.toLowerCase() === 'expand') {
        // reply message, since this is an async function we need to attach AWAIT keyword!!!!
        await message.reply('DONG');
    }
    //trim removes white space and split turns string into array, seperated at white space
    const args = message.content.trim().split(/\s+/);
    const command = args[0].toLowerCase();

    
  
    if (command === '!wordle') {
      //This needs to be "await" or else the function will just go on while the getwordleword function is catching up
    const secretWord = await getWordleWord();
    //links the user with the values of "secretword" and guesses
    activeGames.set(message.author.id, { word: secretWord, guesses: 0 });
    
    return message.reply('New Wordle game started! Type `!guess` to play.');
  }

  // Make a guess, data will be stored in this instance of game. 
  if (command === '!guess') {
    //check if the user has an active game linked to their username
    const game = activeGames.get(message.author.id);
    //if not found/null
    if (!game) {
      return message.reply('You do not have an active game. Type `!wordle` to start one!');
    }

    //can this be easier to understand??
    const guess = args[1]?.toLowerCase();
    if (!guess || guess.length !== 5) {
      return message.reply('Please provide a valid 5-letter word guess (e.g., `!guess CRANE`).');
    }

    //increase the guess attempts
    game.guesses++;
    //store the game data here from the "game" variable which contains the map data from "active games"
    const {word, guesses} = game;

    console.log("This is a test!!" + word);
    if (guess === word) {
      //delete the game instance to start over again
      activeGames.delete(message.author.id);
      return message.reply(`🎉 You win! You guessed ${word} in ${guesses} tries.`);
    }

    // Evaluate letter matches (Green = exact, Yellow = present, Gray = absent)
    let feedback = '';
    for (let i = 0; i < 5; i++) {
      //loop through the word guess and the actual wordle word;
      if (guess[i] === word[i]) {
        feedback += '🟩';
      } //see if the word just has one of the characters, active games will only have 1 active fields
      else if (word.includes(guess[i])) {
        feedback += '🟨';
      }
      //return the black block of failure :-( 
      else {
        feedback += '⬛';
      }
    }

    //failure
    if (guesses >= 6) {
      activeGames.delete(message.author.id);
      return message.reply(`Game over! The word was **${word}**.`);
    }

    //feedback will return the current user input.
    return message.reply(`${feedback} (Guess ${guesses}/6)`);
  }
});

client.events = new Collection();

loadEvents(client, path.join(__dirname, "events"));

client.login(TOKEN);
