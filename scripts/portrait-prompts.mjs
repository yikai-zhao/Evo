// v3.4.4 portrait prompts — 13 species × 5 evolution stages (rank 1/3/5/7/9)
// Shared style anchor keeps the whole roster visually coherent.
export const STYLE = [
  'highly detailed semi-realistic painterly fantasy concept art',
  'centered character portrait, full body, facing forward, dynamic action pose',
  'rim lighting, volumetric god-rays, cinematic composition',
  'transparent background, clean silhouette, no text, no watermark, no border',
  'square 1:1 framing, character occupies ~78% of frame',
].join(', ');

// Per-species lore + per-rank evolution description.
// Keep prompts terse but evocative — the API does better with vivid nouns than long sentences.
export const SPECIES = {
  swordsman: {
    name: 'Swordsman', palette: 'gold black crimson',
    forms: [
      { rank:1, key:'Apprentice Swordsman',     desc:'young human duelist, leather armor, simple steel longsword, focused eyes' },
      { rank:3, key:'Battle Duelist',           desc:'scarred warrior, embossed plate armor, twin curved blades, battle stance' },
      { rank:5, key:'War Hero',                 desc:'heroic knight, gilded breastplate, glowing rune greatsword, tattered crimson cape' },
      { rank:7, key:'Sword Immortal',           desc:'transcendent sword saint, flowing white robes, halo of floating spectral blades, golden qi aura' },
      { rank:9, key:'True Sword God',           desc:'divine sword deity, celestial armor, supernova radiance, world-cleaving cosmic blade, godhood' },
    ],
  },
  cultivator: {
    name: 'Cultivator', palette: 'violet indigo silver',
    forms: [
      { rank:1, key:'Qi Student',               desc:'young xianxia disciple meditating, simple violet robes, faint qi sparks around hands' },
      { rank:3, key:'Spell Weaver',             desc:'mystic mage weaving glowing talisman runes, embroidered hanfu, third-eye sigil glowing' },
      { rank:5, key:'Dao Seeker',               desc:'wise daoist, flowing silver-trim robes, yin-yang mandala behind, levitating tomes orbiting' },
      { rank:7, key:'Void Master',              desc:'cosmic immortal, star-flecked celestial robes, galaxy nebula swirling behind, telekinetic floating orbs' },
      { rank:9, key:'True Celestial',           desc:'godlike celestial being, radiant white-gold robes, multiple ethereal arms, dao symbols, divine ascension' },
    ],
  },
  dino: {
    name: 'Dinosaur', palette: 'olive amber rust',
    forms: [
      { rank:1, key:'Young Tyrant',             desc:'cute baby T-rex hatchling, big eyes, olive scales, tiny claws, friendly posture' },
      { rank:3, key:'Raging Dino',              desc:'adolescent raptor-tyrannosaur, muscular, snarling, bone spikes along spine' },
      { rank:5, key:'Tyrant Rex',               desc:'massive armored tyrannosaurus, cracked battle scars, jaws agape, intimidating roar' },
      { rank:7, key:'Thunder Titan',            desc:'colossal storm-charged dinosaur titan, lightning crackling between teeth, sky-darkening silhouette' },
      { rank:9, key:'True Tyrant God',          desc:'apocalyptic dino-god, volcanic obsidian hide, lava cracks glowing, asteroid crown, divine kaiju' },
    ],
  },
  longSnake: {
    name: 'Jiao Serpent', palette: 'azure cyan pearl',
    forms: [
      { rank:1, key:'River Jiao',               desc:'small graceful eastern river serpent, pearlescent azure scales, gentle smile, water droplets' },
      { rank:3, key:'Sky Jiao',                 desc:'winged adolescent jiao dragon, cyan mane, lightning-arc whiskers, flying pose' },
      { rank:5, key:'Thunder Jiao',             desc:'powerful storm jiao, deep cobalt scales, electric arcs crackling along body, antlers' },
      { rank:7, key:'Sea Dragon',               desc:'majestic eastern sea dragon, sapphire scales, tidal foam swirl, golden horns, oceanic crown' },
      { rank:9, key:'True Dragon God',          desc:'celestial dragon deity, prismatic divine scales, storm-cloud throne, lightning halo, godhood' },
    ],
  },
  lizard: {
    name: 'Lizard', palette: 'emerald jade ochre',
    forms: [
      { rank:1, key:'River Lizard',             desc:'small cute jade lizard hatchling, dewy skin, curious tilted head' },
      { rank:3, key:'Swift Raptor',             desc:'sleek hunting reptile, lean muscles, dorsal fin crest, mid-sprint pose' },
      { rank:5, key:'War Iguana',               desc:'armored battle iguana, jagged spine plates, war-paint markings, snarling' },
      { rank:7, key:'Primal Hunter',            desc:'feral apex reptile-beast, bone-mask helm, fire-glow eyes, predatory crouch' },
      { rank:9, key:'True Primal God',          desc:'primordial reptile god, volcanic hide, magma cracks, world-serpent scale, ancient totemic aura' },
    ],
  },
  croc: {
    name: 'Crocodile', palette: 'swamp green moss bronze',
    forms: [
      { rank:1, key:'River Croc',               desc:'small young crocodile, mossy green scales, half-submerged, curious grin' },
      { rank:3, key:'Iron Jaw',                 desc:'armored adult crocodile, iron-plated teeth, scarred snout, lurking pose' },
      { rank:5, key:'Ancient Crocodile',        desc:'massive ancient crocodilian, barnacle-encrusted hide, glowing yellow eyes, primal menace' },
      { rank:7, key:'Apex Predator',            desc:'colossal swamp-king crocodile, runic carvings on plates, jaws snapping shut on lightning' },
      { rank:9, key:'True Marsh God',           desc:'divine swamp deity crocodile, jade lotus crown, ancient temple-rune scales, mist halo' },
    ],
  },
  wolf: {
    name: 'Wolf', palette: 'silver charcoal moonlight',
    forms: [
      { rank:1, key:'Young Wolf',               desc:'cute wolf pup, fluffy silver fur, blue eyes, playful stance' },
      { rank:3, key:'Pack Leader',              desc:'lean alpha wolf, scarred muzzle, intense gaze, prowling pose' },
      { rank:5, key:'War Wolf',                 desc:'huge battle-wolf, leather warband collar, war-paint stripes, snarl baring fangs' },
      { rank:7, key:'Fenrir',                   desc:'mythic giant wolf Fenrir, glowing amber eyes, chains snapping, moon halo' },
      { rank:9, key:'True Beast God',           desc:'divine cosmic wolf deity, star-flecked fur, constellation glyphs, devouring eclipse, godhood' },
    ],
  },
  eagle: {
    name: 'Eagle', palette: 'snow steel azure',
    forms: [
      { rank:1, key:'Young Eagle',              desc:'fluffy young eagle, soft white feathers, sharp eyes, perched alert' },
      { rank:3, key:'Sky Hunter',               desc:'majestic adult eagle mid-dive, talons extended, wind-swept feathers' },
      { rank:5, key:'Storm Eagle',              desc:'huge storm eagle, electric-arc feathers, lightning trailing wings, thunderclap pose' },
      { rank:7, key:'Thunder Hawk',             desc:'colossal thunder hawk, plasma-charged plumage, eye of the storm pupil, regal' },
      { rank:9, key:'True Sky God',             desc:'divine sky-deity eagle, radiant solar plumage, sun-halo crown, world-spanning wingspan' },
    ],
  },
  owl: {
    name: 'Night Owl', palette: 'midnight purple silver',
    forms: [
      { rank:1, key:'Young Owl',                desc:'small fluffy young owl, big violet eyes, perched on crescent moon' },
      { rank:3, key:'Shadow Owl',               desc:'sleek nocturnal hunter owl, shadow-cloaked plumage, silent glide pose' },
      { rank:5, key:'Death Watcher',            desc:'ominous large owl with glowing third eye, runic chest sigil, ghostly mist wings' },
      { rank:7, key:'Void Watcher',             desc:'cosmic-horror owl, eldritch many-eye plumage, void-rift halo, regal menacing' },
      { rank:9, key:'True Night God',           desc:'divine night-sky owl deity, constellation feathers, moon-crown, godly stillness' },
    ],
  },
  bat: {
    name: 'Bat', palette: 'crimson violet bone',
    forms: [
      { rank:1, key:'Little Bat',               desc:'cute tiny bat, violet fur, oversized pink ears, smiling, hanging upside-down' },
      { rank:3, key:'Blood Bat',                desc:'predatory blood bat, crimson eyes, fanged snarl, leathery torn wings spread' },
      { rank:5, key:'Vampire Lord',             desc:'humanoid vampire-lord, royal black cape, gold-trim collar, fangs, regal sinister pose' },
      { rank:7, key:'Demon Bat',                desc:'demonic bat-creature, horned skull, bone wings, hellfire aura, monstrous' },
      { rank:9, key:'Undead God',               desc:'divine undead bat-god, skeletal crown, ghostly violet flames, ascended deathly aura' },
    ],
  },
  shark: {
    name: 'Shark', palette: 'steel-blue navy white',
    forms: [
      { rank:1, key:'Young Shark',              desc:'cute small great-white shark pup, big curious eyes, mid-swim, bubble trail' },
      { rank:3, key:'Blood Shark',              desc:'aggressive adult bull shark, scarred snout, blood-tinged water, jaws open' },
      { rank:5, key:'Apex Shark',               desc:'huge megalodon-class apex shark, battle scars, dorsal fin breaching wave' },
      { rank:7, key:'Deep Terror',              desc:'abyssal horror shark, bioluminescent lure, jagged tooth maw, deep-sea menace' },
      { rank:9, key:'True Sea God',             desc:'divine sea-deity shark, pearlescent armor scales, tidal crown, world-ocean halo' },
    ],
  },
  electroEel: {
    name: 'Eel', palette: 'electric green cyan white',
    forms: [
      { rank:1, key:'River Eel',                desc:'small slender green eel, gentle smile, faint electric sparks around tail' },
      { rank:3, key:'Thunder Eel',              desc:'crackling thunder eel, bright lightning arcs along body, glowing eyes' },
      { rank:5, key:'Storm Eel',                desc:'huge storm eel, electric plasma coiled around serpentine body, lightning halo' },
      { rank:7, key:'Void Serpent',             desc:'cosmic void-serpent eel, dark scales with constellation glow, lightning aura' },
      { rank:9, key:'True Storm God',           desc:'divine storm-god eel, world-spanning lightning crown, hurricane halo, godhood' },
    ],
  },
  scorpion: {
    name: 'Scorpion', palette: 'desert ochre poison-green',
    forms: [
      { rank:1, key:'Young Scorpion',           desc:'cute small desert scorpion, amber carapace, raised stinger tail' },
      { rank:3, key:'Sand Stalker',             desc:'large desert scorpion, jagged chitin armor, glowing green venom dripping' },
      { rank:5, key:'Plague Scorpion',          desc:'huge plague scorpion, sickly green miasma aura, skull-marked carapace' },
      { rank:7, key:'Death Scorpion',           desc:'bone-armored death scorpion, skull-faced thorax, necrotic green flame stinger' },
      { rank:9, key:'True Plague God',          desc:'divine plague-god scorpion, ash-crown, world-wasting venom storm, godly menace' },
    ],
  },
};

// Build a single image prompt for one (species, rank)
export function buildPrompt(speciesKey, form){
  const sp = SPECIES[speciesKey];
  const base = `${sp.name} — "${form.key}" (rank ${form.rank}/9 evolution): ${form.desc}.`;
  const palette = `Color palette: ${sp.palette}.`;
  return `${base} ${palette} ${STYLE}`;
}

// All (species, form) pairs to render
export function allTargets(){
  const out = [];
  for (const [key, sp] of Object.entries(SPECIES)){
    for (const f of sp.forms){
      const suffix = f.rank===1 ? '' : ('-r'+f.rank);
      out.push({ key, rank: f.rank, suffix, file: `${key}${suffix}.png`, prompt: buildPrompt(key, f) });
    }
  }
  return out;
}
