// v3.4.5 portrait prompts — 13 species × 5 evolution stages (rank 1/3/5/7/9)
// CRITICAL: this is a top-down 2D .io game. Sprites are viewed STRAIGHT DOWN from above,
// not in cinematic standing pose. PNG MUST be true alpha transparent (no white background).
export const STYLE = [
  // Camera — use isometric top-down like Diablo 2 / Archero / Vampire Survivors for humanoids,
  //          or directly-overhead for flat animals (wolf, eagle, snake, etc.)
  'isometric top-down 2D game sprite, camera ~60° overhead, character head near top of frame, feet near bottom',
  '2D game sprite icon, like Archero or Vampire Survivors character sprites',
  // CONSISTENCY rule — most important for multi-rank species
  'CRITICAL CONSISTENCY: identical camera angle, identical body proportions, IDENTICAL POSE TEMPLATE across ALL ranks of this species — ONLY armor detail, weapon power, and glow/aura level changes between ranks',
  // Art style
  'FLAT ICON STYLE: bold black outlines (3-4px stroke), maximum 4 solid fill colors, NO gradients, NO textures, NO fine detail',
  'high-contrast silhouette instantly recognizable at 32px, simple graphic shapes like mobile game icons',
  // Transparency — belts-and-suspenders phrasing
  'TRANSPARENT BACKGROUND — pure alpha channel, NO white fill, NO grey fill, NO background color of any kind, NO ground, NO sky, NO environment, NO drop shadow',
  'no text, no watermark, no border, no frame',
].join(', ');

// Per-species lore + per-rank evolution description.
// Descriptions reframed for top-down silhouette readability.
export const SPECIES = {
  swordsman: {
    name: 'Swordsman', palette: 'black crimson gold',
    // Pose locked: DO NOT CHANGE between ranks — only armor/weapon/glow escalates
    pose: 'standing humanoid swordsman viewed from ~60° above and slightly front; facing viewer, slight left-shoulder-forward; RIGHT ARM raised with sword gripped overhead, blade tip pointing straight up to 12-o-clock; LEFT ARM in guard position at mid-chest; feet shoulder-width apart; full body visible head to feet',
    forms: [
      { rank:1, key:'Apprentice Swordsman',     desc:'simple brown leather vest and pants, plain unadorned steel longsword, no glow, no effects, brown belt, dark ponytail on head' },
      { rank:3, key:'Battle Duelist',           desc:'dark iron plate armor with pauldrons, battle scars on chestplate, longsword with faint crimson edge glow, crimson sash at waist' },
      { rank:5, key:'War Hero',                 desc:'gilded gold plate armor with crimson trim, greatsword with golden runes glowing along blade, scarlet cape draped behind the body' },
      { rank:7, key:'Sword Immortal',           desc:'ethereal white-gold spirit plate armor, spectral energy blade blazing with blue-white light, ring of 6 small ghostly swords orbiting the figure at shoulder height' },
      { rank:9, key:'True Sword God',           desc:'divine celestial full-plate blazing with golden light, colossal holy blade of pure radiance, blinding solar halo ring of orbiting divine swords and energy arcs filling the frame' },
    ],
  },
  cultivator: {
    name: 'Cultivator', palette: 'violet indigo silver white',
    pose: 'humanoid xianxia cultivator viewed from ~60° above; seated cross-legged in lotus meditation pose, facing viewer; both hands resting palm-up on knees; wide flowing robes spreading out around the seated body like a flower; head at top of frame, robe hem at bottom',
    forms: [
      { rank:1, key:'Qi Student',               desc:'plain violet cotton hanfu robes, no decoration, faint wisps of qi smoke rising from palms, simple wooden hairpin' },
      { rank:3, key:'Spell Weaver',             desc:'embroidered indigo hanfu with silver trim, glowing talisman runes floating in a small ring around the figure, third-eye mark on forehead' },
      { rank:5, key:'Dao Seeker',               desc:'silver-and-violet ceremonial daoist robes, yin-yang taiji symbol glowing on chest, 4 levitating ancient tomes orbiting the figure' },
      { rank:7, key:'Void Master',              desc:'cosmic star-flecked celestial robes, body partially translucent with galaxy glow inside, ring of 8 bright qi orbs orbiting at arm level' },
      { rank:9, key:'True Celestial',           desc:'radiant white-gold divine robes blazing with heavenly light, 4 pairs of ethereal arms extending outward each holding dao symbols, blinding celestial halo ring filling the frame' },
    ],
  },
  dino: {
    name: 'Dinosaur', palette: 'olive amber rust',
    forms: [
      { rank:1, key:'Young Tyrant',             desc:'baby T-rex hatchling from above, olive scales, head at top, tail at bottom, cute friendly proportions' },
      { rank:3, key:'Raging Dino',              desc:'adolescent raptor-tyrannosaur from above, muscular, bone spikes along spine visible from top, jaws agape facing up' },
      { rank:5, key:'Tyrant Rex',               desc:'massive armored tyrannosaurus from above, cracked battle scars on back, jaws open at top of frame, tail at bottom' },
      { rank:7, key:'Thunder Titan',            desc:'colossal storm-charged dinosaur from above, lightning crackling along spine, thunder aura ring' },
      { rank:9, key:'True Tyrant God',          desc:'apocalyptic dino-god from above, volcanic obsidian hide, lava cracks glowing on back, asteroid crown halo' },
    ],
  },
  longSnake: {
    name: 'Jiao Serpent', palette: 'azure cyan pearl',
    forms: [
      { rank:1, key:'River Jiao',               desc:'graceful eastern river serpent from above, coiled in S-shape, pearlescent azure scales, head at top' },
      { rank:3, key:'Sky Jiao',                 desc:'winged jiao dragon from above, cyan mane, wings spread sideways, head facing up, lightning whiskers' },
      { rank:5, key:'Thunder Jiao',             desc:'storm jiao from above, deep cobalt coiled body, electric arcs crackling along length, antlers on head' },
      { rank:7, key:'Sea Dragon',               desc:'majestic eastern sea dragon from above, sapphire scales in long S-coil, tidal foam swirl around, golden horned head at top' },
      { rank:9, key:'True Dragon God',          desc:'celestial dragon deity from above, prismatic divine scales coiled, storm-cloud halo around, lightning ring' },
    ],
  },
  lizard: {
    name: 'Lizard', palette: 'emerald jade ochre',
    forms: [
      { rank:1, key:'River Lizard',             desc:'jade lizard from above, dewy skin, splayed limbs visible, head at top, tail curving at bottom' },
      { rank:3, key:'Swift Raptor',             desc:'sleek hunting reptile from above, lean muscles, dorsal fin crest along spine, mid-sprint pose' },
      { rank:5, key:'War Iguana',               desc:'armored battle iguana from above, jagged spine plates clearly visible from top, war-paint markings' },
      { rank:7, key:'Primal Hunter',            desc:'apex reptile-beast from above, bone-mask on head, fire-glow eyes, predatory crouched silhouette' },
      { rank:9, key:'True Primal God',          desc:'primordial reptile god from above, volcanic hide, magma cracks glowing along back, ancient totemic aura ring' },
    ],
  },
  croc: {
    name: 'Crocodile', palette: 'swamp green moss bronze',
    forms: [
      { rank:1, key:'River Croc',               desc:'young crocodile from above, mossy green scales, head at top with snout pointing up, tail at bottom' },
      { rank:3, key:'Iron Jaw',                 desc:'armored adult crocodile from above, iron-plated back scutes, scarred snout' },
      { rank:5, key:'Ancient Crocodile',        desc:'massive ancient crocodilian from above, barnacle-encrusted back, glowing yellow eyes, broad silhouette' },
      { rank:7, key:'Apex Predator',            desc:'colossal swamp-king crocodile from above, runic carvings on back plates, lightning between teeth' },
      { rank:9, key:'True Marsh God',           desc:'divine swamp deity crocodile from above, jade lotus crown on head, temple-rune scales, mist halo ring' },
    ],
  },
  wolf: {
    name: 'Wolf', palette: 'silver charcoal moonlight',
    forms: [
      { rank:1, key:'Young Wolf',               desc:'wolf pup from above, fluffy silver fur, head at top, four splayed paws, tail at bottom' },
      { rank:3, key:'Pack Leader',              desc:'alpha wolf from above, scarred muzzle pointing up, prowling stretched pose' },
      { rank:5, key:'War Wolf',                 desc:'huge battle-wolf from above, leather warband collar, war-paint stripes on back, snarl visible' },
      { rank:7, key:'Fenrir',                   desc:'mythic giant wolf Fenrir from above, glowing amber eyes, chains around body, moon halo ring' },
      { rank:9, key:'True Beast God',           desc:'cosmic wolf deity from above, star-flecked fur on back, constellation glyphs, eclipse halo ring' },
    ],
  },
  eagle: {
    name: 'Eagle', palette: 'snow steel azure',
    forms: [
      { rank:1, key:'Young Eagle',              desc:'young eagle from above, wings spread wide horizontally, fluffy white feathers, head facing up' },
      { rank:3, key:'Sky Hunter',               desc:'adult eagle from above mid-flight, wings fully spread, talons tucked, head facing up' },
      { rank:5, key:'Storm Eagle',              desc:'huge storm eagle from above, wings spread with electric-arc feathers, lightning trailing wingtips' },
      { rank:7, key:'Thunder Hawk',             desc:'colossal thunder hawk from above, wings spread, plasma-charged plumage, storm aura ring' },
      { rank:9, key:'True Sky God',             desc:'divine sky-deity eagle from above, radiant solar plumage wings spread wide, sun-halo crown ring' },
    ],
  },
  owl: {
    name: 'Night Owl', palette: 'midnight purple silver',
    forms: [
      { rank:1, key:'Young Owl',                desc:'small fluffy young owl from above, wings spread, big violet eyes facing up, crescent moon halo' },
      { rank:3, key:'Shadow Owl',               desc:'nocturnal hunter owl from above, shadow-cloaked wings spread, silent glide pose' },
      { rank:5, key:'Death Watcher',            desc:'ominous large owl from above, glowing third eye on forehead, runic chest sigil, ghostly mist wings spread' },
      { rank:7, key:'Void Watcher',             desc:'cosmic-horror owl from above, eldritch many-eye plumage, void-rift halo ring, wings spread' },
      { rank:9, key:'True Night God',           desc:'divine night-sky owl deity from above, constellation feathers, wings spread, moon-crown halo ring' },
    ],
  },
  bat: {
    name: 'Bat', palette: 'crimson violet bone',
    forms: [
      { rank:1, key:'Little Bat',               desc:'tiny bat from above, violet fur, wings spread wide, oversized pink ears visible on top of head' },
      { rank:3, key:'Blood Bat',                desc:'predatory blood bat from above, crimson eyes, fanged snarl, leathery torn wings fully spread' },
      { rank:5, key:'Vampire Lord',             desc:'humanoid vampire-lord from above, royal black cape spread in circle, fangs visible, regal pose' },
      { rank:7, key:'Demon Bat',                desc:'demonic bat-creature from above, horned skull on top, bone wings spread, hellfire aura ring' },
      { rank:9, key:'Undead God',               desc:'divine undead bat-god from above, skeletal crown halo, wings spread, ghostly violet flame aura ring' },
    ],
  },
  shark: {
    name: 'Shark', palette: 'steel-blue navy white',
    forms: [
      { rank:1, key:'Young Shark',              desc:'small great-white shark pup from above, head at top, dorsal fin clearly visible on back, tail at bottom, swimming silhouette' },
      { rank:3, key:'Blood Shark',              desc:'aggressive bull shark from above, scarred snout pointing up, dorsal fin, jaws open' },
      { rank:5, key:'Apex Shark',               desc:'huge megalodon-class shark from above, battle scars on back, dorsal fin prominent, broad silhouette' },
      { rank:7, key:'Deep Terror',              desc:'abyssal horror shark from above, bioluminescent lure glowing on back, jagged tooth maw at top' },
      { rank:9, key:'True Sea God',             desc:'divine sea-deity shark from above, pearlescent armor scales, tidal crown halo, world-ocean aura ring' },
    ],
  },
  electroEel: {
    name: 'Eel', palette: 'electric green cyan white',
    forms: [
      { rank:1, key:'River Eel',                desc:'slender green eel from above, S-curved body, head at top, gentle smile, faint electric sparks around tail' },
      { rank:3, key:'Thunder Eel',              desc:'crackling thunder eel from above, S-coiled, bright lightning arcs along body length, glowing eyes' },
      { rank:5, key:'Storm Eel',                desc:'huge storm eel from above, electric plasma coiled around serpentine body, lightning halo ring' },
      { rank:7, key:'Void Serpent',             desc:'cosmic void-serpent eel from above, dark scales with constellation glow, lightning aura ring' },
      { rank:9, key:'True Storm God',           desc:'divine storm-god eel from above, world-spanning lightning crown halo ring, hurricane swirl around body' },
    ],
  },
  scorpion: {
    name: 'Scorpion', palette: 'desert ochre poison-green',
    forms: [
      { rank:1, key:'Young Scorpion',           desc:'small desert scorpion from above, amber carapace, claws extended forward (up in frame), stinger tail curving up over body, all 8 legs splayed' },
      { rank:3, key:'Sand Stalker',             desc:'large desert scorpion from above, jagged chitin armor, glowing green venom dripping from stinger, claws spread wide' },
      { rank:5, key:'Plague Scorpion',          desc:'huge plague scorpion from above, sickly green miasma aura ring, skull-marked carapace, claws spread' },
      { rank:7, key:'Death Scorpion',           desc:'bone-armored death scorpion from above, skull-faced thorax, necrotic green flame stinger, claws spread wide' },
      { rank:9, key:'True Plague God',          desc:'divine plague-god scorpion from above, ash-crown halo ring, world-wasting venom storm swirl, claws spread' },
    ],
  },
};

// Visual power tier injected into every prompt — forces distinct size+glow escalation per rank
const RANK_TIER = {
  1: 'RANK 1 (juvenile): body fills ~50% of canvas, simple clean flat silhouette, NO glow, NO aura, minimal detail, soft muted colors',
  3: 'RANK 3 (warrior): body fills ~65% of canvas, first battle markings and scars visible, subtle energy accent on ONE element only, bolder saturated colors',
  5: 'RANK 5 (elite): body fills ~80% of canvas, clear glowing energy on weapon/eyes/spine, distinct color shift toward vibrant hues, 2x more imposing than rank 1',
  7: 'RANK 7 (legendary): body fills ~90% of canvas, DRAMATIC glowing aura ring surrounding entire body, dominant overwhelming presence, extreme color contrast and saturation',
  9: 'RANK 9 (god-tier): body fills ENTIRE canvas edge to edge, BLINDING divine radiance halo, world-scale cosmic power, maximum visual impact — looks 3x as powerful as rank 7',
};

// Build a single image prompt for one (species, rank)
export function buildPrompt(speciesKey, form){
  const sp = SPECIES[speciesKey];
  const tier = RANK_TIER[form.rank];
  // Pose anchor locks camera angle + body template — same for ALL ranks of this species
  const poseAnchor = sp.pose
    ? `POSE/ANGLE TEMPLATE (must be identical for every rank of ${sp.name}): ${sp.pose}. `
    : '';
  const base = `${sp.name} — "${form.key}" (rank ${form.rank}/9 evolution, ${tier}). ${poseAnchor}Rank-specific visual: ${form.desc}.`;
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


