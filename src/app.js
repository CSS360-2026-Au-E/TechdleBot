require('dotenv').config();

import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import { loadEvents } from "./helpers";
import path from "path";


const TOKEN = process.env.TOKEN;

const { Guilds, GuildMembers, GuildMessages, MessageContent } =
  GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember } = Partials;

const client = new Client({
  intents: [Guilds, GuildMembers, GuildMessages, MessageContent],
  partials: [User, Message, GuildMember, ThreadMember],
});


async function getWordleWord() {

  //connects to the repo JSON list I made
  const url = `https://raw.githubusercontent.com/Mario-gogo/list/refs/heads/main/list.json`;

  try {
    //built in fetch, hopefully will return desired json
    const response = await fetch(url);
    //if the fetch doesn't actually connects
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    //retrieve the json data, since this is inside an async function, we need to put AWAIT since WE NEED THIS
    //BEFORE WE CONTINUE, data will receive the json object with the variables/information
    const data = await response.json();
    //just the tech_word field, its an array so wordlist is an array
    const wordlist = data.tech_words;
    
    
     const randomIndex = Math.floor(Math.random() * wordlist.length);
     //pick a random index from the wordlist above
    const wordleWord = wordlist[randomIndex];
    
    
    //return the word to the calling function (when game is activated)
    return wordleWord;
    //fix, be more specific with errors.
  } catch (error) {
    console.error("Something went wrong:", error);
  }
}

//map with key and value (word, num of guesses). Guesses will be the restriction to win/lose.
 const activeGames = new Map();

client.on('messageCreate', async (message) => {
    // if a bot responds ignore it
    if (message.author.bot) return;

    // 
    if (message.content.toLowerCase() === 'expand') {
        // reply message, since this is an async function we need to attach AWAIT keyword!!!!
        await message.reply('DONG');
    }
    //trim removes white space and split turns string into array, seperated at white space
    const args = message.content.trim().split(/\s+/);
    const command = args[0].toLowerCase();

    
  
    if (command === '!techdle') {
      //This needs to be "await" or else the function will just go on while the getwordleword function is catching up
    const secretWord = await getWordleWord();

    console.log("This is a test: " + secretWord);
    //links the user with the values of "secretword" and guesses
    activeGames.set(message.author.id, { word: secretWord, guesses: 0 });
    
    return message.reply('New Wordle game with TECH words started! Type `!guess ` then a word seperated with a space to play.');
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

    console.log("Secret Word is: " + word);
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
