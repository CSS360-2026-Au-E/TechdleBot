// Word lists: the answer pool and every word accepted as a guess.
import { OFFICIAL_GUESSES } from "./officialGuesses";

export const WORD_LENGTH = 5;

// Everyday words accepted as guesses but never chosen as the answer.
const GENERAL_WORDS = `
about above actor adapt admit adopt adult after again agent agree ahead alarm album alert alike alive allow alone along alter among angel anger angle angry apart apple apply arena argue arise armor array aside asset avoid awake award aware
badge baker basic beach began begin being below bench birth black blade blame blank blast blind block blood board boost bound brain brand bread break brick brief bring broad brown build burst buyer
cabin cable candy carry catch cause chain chair chalk charm chart chase cheap check chest chief child chose civil claim class clean clear clerk click climb clock close cloud coach coast could count court cover craft crash crowd curve cycle
daily dance dealt death delay depth dream dress drift drink drive eager early earth eight elite empty enemy enjoy enter equal error event every exact exist extra
faith false fault field fifth fight final first flame flash fleet floor focus force frame fresh front fruit funny ghost giant given glass globe grace grade grain grand grant grape grass great green group guard guess guest guide
happy heart heavy honey horse hotel house human humor ideal image index inner input issue joint judge juice knife known label large laser later laugh layer learn least leave legal level light limit local logic loose lucky lunch magic major maker march match maybe mayor media metal might minor model money month moral motor mount mouse mouth movie music
night noble noise north novel nurse ocean offer often olive onion order other outer owner paint panel paper party peace phase phone photo piano pilot pitch place plain plane plant plate point power press price pride prime print prize proof proud queen quick quiet radio raise range rapid ratio reach ready right river robot rough round route royal rural
scale scene score sense serve seven shade shape share sharp sheet shelf shift shine shirt shock short sight since skill sleep slice small smart smile smoke solid solve sound south space spare speak speed spend spice split sport staff stage stand start state steam steel stick stone store storm story strip study style sugar sunny super sweet table taste teach thank their theme there thing think third those three throw tiger tight title today token total touch tough tower trace track trade train treat trend trial tribe truck truly trust truth twice uncle under union unity until upper urban usage usual valid value video visit vital voice waste watch water wheel where which while white whole whose woman world worry worth would write wrong young youth
`.trim().split(/\s+/);

// Programming-themed words the bot may pick as the answer.
export const ANSWERS = `
array stack class float token async regex query event build debug merge queue cache
print input index while yield break catch const super trait enums macro shell linux
bytes ascii parse lexer scope logic block chunk frame patch fetch fixed batch short
tuple slice mutex graph nodes trees pivot clone model views route proxy relay state
store hooks props pixel cloud login admin agent alert audit cycle delta drive email
error field files fixes flags forms gates https image label layer limit lines links
lists local locks modem modes owner pages paths ports rails reset roles round rules
serve setup style table tasks timer tools trace types units users valid value video
write swift scala julia react redux mongo mysql redis fiber await cores crate depth
embed funcs group guard hosts issue items loops mocks mixin pools proto purge quote
reads roots scrum shift sleep slots sorts split stubs swaps tests throw unset usage
utils vault wires
`.trim().split(/\s+/);

// More everyday guess-only words.
const EXTRA_GUESSES = `
abuse adept aloft amber ample anvil bacon basil beard berry bible bingo bison blush bluff boast bonus booth brave brush bunch cargo carve cedar chaos cheer chess chill chunk cider cliff cobra comet coral crane crisp crown cubic dairy delta dense diner ditch dizzy donor dozen draft eagle elbow ember fancy feast fiber flair flock flood flute forge forum frost gauge gloom glory grill gypsy habit haste hazel hedge hinge hobby ivory jolly kayak koala lemon lilac lodge lunar mango maple marsh medal mirth nerdy nylon oasis opera orbit otter oxide pearl pixel plaza plumb polar prank prism quest quilt rebel relax ridge rival rocky rumor salad sauce scout shrug siren skate sleek slope snack solar spark spoon squad stack stern surge swift swing sword tango tempo thumb tulip ultra vapor vigor waltz whale wield yacht yield zebra
`.trim().split(/\s+/);

// Every word the bot accepts as a guess: anything real Wordle accepts, plus
// our tech answers (some, like regex and mutex, aren't in Wordle's list).
export const ALLOWED_GUESSES = new Set([
  ...OFFICIAL_GUESSES,
  ...ANSWERS,
  ...GENERAL_WORDS,
  ...EXTRA_GUESSES,
]);
