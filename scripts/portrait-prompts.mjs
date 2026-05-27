// v3.4.5 portrait prompts — 13 species × 5 evolution stages (rank 1/3/5/7/9)
// CRITICAL: this is a top-down 2D .io game. Sprites are viewed STRAIGHT DOWN from above,
// not in cinematic standing pose. PNG MUST be true alpha transparent (no white background).
// NOTE: portraits are rendered WITHOUT rotation in game.js (v3.4.5).
// The sprite always faces upward on screen regardless of movement direction.
// Therefore isometric ~45-60° angle is CORRECT for humanoids; overhead is CORRECT for animals.
export const STYLE = [
  // Art style — single most important rule
  'FLAT ICON STYLE: bold black outlines 3-4px, maximum 4 solid fill colors, NO gradients, NO textures, NO fine photo-realistic detail',
  '2D game sprite icon — think Archero, Vampire Survivors, or Clash Royale card art',
  'high-contrast silhouette instantly readable at 32px, simple graphic shapes',
  // Consistency across ranks of same species
  'CRITICAL: identical camera angle, identical body proportions, IDENTICAL POSE TEMPLATE for ALL ranks — ONLY armor detail, weapon, size, and glow/aura level change',
  // Transparency — multi-phrase enforcement since API sometimes ignores the parameter
  'TRANSPARENT BACKGROUND: pure alpha channel, zero background fill, NO white, NO grey, NO black, NO ground plane, NO environment, NO shadow, NO backdrop of any kind — subject floats on nothing',
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
    pose: 'camera pointing straight down overhead; dinosaur body flat from above; jaws/head at 12-o-clock top, tiny forearms angled to upper sides, massive hind legs at lower sides, thick tail at 6-o-clock bottom; back scales fill center',
    forms: [
      { rank:1, key:'Young Tyrant',             desc:'baby T-rex hatchling, olive-green scales, cute stubby proportions, smooth clean back, tiny head' },
      { rank:3, key:'Raging Dino',              desc:'muscular adolescent tyrannosaur, jagged bone spikes erupting along spine, battle-scarred back, jaws wide' },
      { rank:5, key:'Tyrant Rex',               desc:'massive armored tyrannosaur, cracked battle scars across back, bone armor plates along spine, jaws open' },
      { rank:7, key:'Thunder Titan',            desc:'colossal dinosaur, lightning crackling along spine ridge, electric storm-ring aura, glowing red eyes' },
      { rank:9, key:'True Tyrant God',          desc:'apocalyptic dino-god, volcanic obsidian hide, glowing lava cracks across entire back, asteroid crown halo ring' },
    ],
  },
  longSnake: {
    name: 'Jiao Serpent', palette: 'azure cyan pearl',
    pose: 'camera pointing straight down overhead; serpentine body in elegant S-curve filling the frame; horned head with whiskers at 12-o-clock top, tail tip at 6-o-clock bottom; body winds through center showing scales',
    forms: [
      { rank:1, key:'River Jiao',               desc:'graceful river serpent, pearlescent azure scales, smooth S-curve, delicate whiskers on small head' },
      { rank:3, key:'Sky Jiao',                 desc:'winged jiao dragon, small wings spread from upper body, cyan mane, lightning whiskers, glowing eyes' },
      { rank:5, key:'Thunder Jiao',             desc:'storm jiao, deep cobalt scales, bright electric arcs crackling along body length, golden antlers on head' },
      { rank:7, key:'Sea Dragon',               desc:'majestic sea dragon, sapphire scales in long S-coil, tidal foam swirl ring around body, golden crowned head' },
      { rank:9, key:'True Dragon God',          desc:'celestial dragon deity, prismatic divine rainbow scales coiled, storm-cloud ring halo, divine horn crown' },
    ],
  },
  lizard: {
    name: 'Lizard', palette: 'emerald jade ochre',
    pose: 'camera pointing straight down overhead; lizard body flat like a 4-pointed star from above; head at 12-o-clock top, tail at 6-o-clock bottom; front legs extended upper-left and upper-right, rear legs extended lower-left and lower-right',
    forms: [
      { rank:1, key:'River Lizard',             desc:'small jade lizard, dewy smooth skin, simple clean silhouette, bright eyes' },
      { rank:3, key:'Swift Raptor',             desc:'sleek hunting reptile, lean muscular body, dorsal fin crest running along spine, sharp claws' },
      { rank:5, key:'War Iguana',               desc:'armored iguana, jagged spine plates along entire back, tribal war-paint stripes, scarred scales' },
      { rank:7, key:'Primal Hunter',            desc:'apex reptile-beast, bone shoulder-mask, fire-glow eyes, prehistoric armored ridges, predatory silhouette' },
      { rank:9, key:'True Primal God',          desc:'primordial reptile god, volcanic magma-crack hide, glowing orange lava along back, ancient totemic rune halo ring' },
    ],
  },
  croc: {
    name: 'Crocodile', palette: 'swamp green moss bronze',
    pose: 'camera pointing straight down overhead; elongated crocodilian body pointing straight up; jaws/snout at 12-o-clock top, tail at 6-o-clock bottom; four stubby legs splayed horizontally; wide flat armored back fills width of frame',
    forms: [
      { rank:1, key:'River Croc',               desc:'young crocodile, mossy green scales, simple clean back scutes, snout slightly open' },
      { rank:3, key:'Iron Jaw',                 desc:'adult crocodile, iron-reinforced back scutes, long battle scars on back, wide jaw' },
      { rank:5, key:'Ancient Crocodile',        desc:'massive ancient crocodilian, barnacle-crusted back, deep yellow glowing eyes, very broad silhouette' },
      { rank:7, key:'Apex Predator',            desc:'colossal swamp-king crocodile, glowing runic carvings on back plates, electricity sparking between teeth' },
      { rank:9, key:'True Marsh God',           desc:'divine swamp deity crocodile, jade lotus crown on head, ancient temple rune scales, sacred mist halo ring' },
    ],
  },
  wolf: {
    name: 'Wolf', palette: 'silver charcoal moonlight',
    pose: 'camera pointing straight down overhead; four-legged wolf silhouette; muzzle/head at 12-o-clock top, bushy tail at 6-o-clock bottom; front paws at upper-left and upper-right, rear paws at lower-left and lower-right; back fur texture fills body center',
    forms: [
      { rank:1, key:'Young Wolf',               desc:'wolf pup, fluffy silver-white fur, small rounded head, soft stubby paws, tiny tail' },
      { rank:3, key:'Pack Leader',              desc:'alpha wolf, muscular body, battle scars across back, sharp claws, thick neck' },
      { rank:5, key:'War Wolf',                 desc:'huge battle-wolf, leather war-collar with spikes, tribal war-paint stripes across back, fanged snarl' },
      { rank:7, key:'Fenrir',                   desc:'mythic giant wolf Fenrir, glowing amber eyes, ethereal chains wrapping around body, crescent moon halo ring' },
      { rank:9, key:'True Beast God',           desc:'cosmic wolf deity, star-flecked fur, constellation rune glyphs across back, solar eclipse halo ring' },
    ],
  },
  eagle: {
    name: 'Eagle', palette: 'snow steel azure',
    pose: 'camera pointing straight down overhead, bird in flight; wings FULLY SPREAD horizontally left and right — wingspan fills full width of frame; head/beak at 12-o-clock top center; body runs vertically through center; tail fan at 6-o-clock bottom; talons tucked below body',
    forms: [
      { rank:1, key:'Young Eagle',              desc:'young eagle, fluffy white-grey feathers, soft wing edges, small beak, bright eyes' },
      { rank:3, key:'Sky Hunter',               desc:'adult eagle, sharp golden beak, defined primary feathers, keen golden eyes, athletic build' },
      { rank:5, key:'Storm Eagle',              desc:'huge storm eagle, electric-arc crackling at feather tips, jagged lightning-bolt feather pattern, intense glowing eyes' },
      { rank:7, key:'Thunder Hawk',             desc:'colossal thunder hawk, plasma-charged plumage, bright storm-ring aura, electricity arcing between wingtips' },
      { rank:9, key:'True Sky God',             desc:'divine sky deity eagle, radiant solar golden plumage, blinding sun-halo crown ring, blazing white light from wingtips' },
    ],
  },
  owl: {
    name: 'Night Owl', palette: 'midnight purple silver',
    pose: 'camera pointing straight down overhead, owl in flight; wings FULLY SPREAD horizontally left and right; large round disc-shaped head at 12-o-clock top center; barrel body in center; tail feathers at 6-o-clock; wingspan fills frame',
    forms: [
      { rank:1, key:'Young Owl',                desc:'small fluffy young owl, soft silver-purple feathers, oversized round innocent eyes, tiny beak' },
      { rank:3, key:'Shadow Owl',               desc:'nocturnal hunter owl, dark shadow-grey feathers, sharp talons visible, piercing yellow eyes, silent predator look' },
      { rank:5, key:'Death Watcher',            desc:'ominous large owl, glowing third eye on forehead, runic chest sigil, ghostly pale mist trailing from wing edges' },
      { rank:7, key:'Void Watcher',             desc:'cosmic-horror owl, eldritch many-eye pattern across plumage, void-rift dark aura ring, reality-tear effect at wingtips' },
      { rank:9, key:'True Night God',           desc:'divine night-sky owl deity, galaxy constellation feather pattern, crescent moon-crown halo ring, cosmic void swirl' },
    ],
  },
  bat: {
    name: 'Bat', palette: 'crimson violet bone',
    pose: 'camera pointing straight down overhead; membranous bat wings FULLY SPREAD horizontally like a dark cape — wingspan fills full width; small head at 12-o-clock top center with large pointed ears; compact body in center; rear feet at 6-o-clock bottom',
    forms: [
      { rank:1, key:'Little Bat',               desc:'tiny bat, soft violet fur body, thin translucent wing membranes, oversized round pink ears, tiny cute face' },
      { rank:3, key:'Blood Bat',                desc:'predatory blood bat, crimson glowing eyes, leathery dark-red torn wing membranes, fanged snarl' },
      { rank:5, key:'Vampire Lord',             desc:'large vampire bat, regal dark wings with gold trim, ornate bone-white claw tips, aristocratic fanged expression' },
      { rank:7, key:'Demon Bat',                desc:'demonic bat-creature, curved bone horns on head, jagged bone-shard wing membrane, hellfire orange aura ring' },
      { rank:9, key:'Undead God',               desc:'divine undead bat-god, skeletal bone-white wing frame, ghostly violet ethereal flame wing membranes, crown halo ring' },
    ],
  },
  shark: {
    name: 'Shark', palette: 'steel-blue navy white',
    pose: 'camera pointing straight down overhead; torpedo-shaped shark body pointing straight up; nose at 12-o-clock top, crescent tail fin at 6-o-clock bottom; prominent dorsal fin ridge along back; pectoral fins angled left-right at mid-body; body fills frame vertically',
    forms: [
      { rank:1, key:'Young Shark',              desc:'great-white shark pup, clean smooth blue-grey skin, small dorsal fin, simple torpedo silhouette' },
      { rank:3, key:'Blood Shark',              desc:'aggressive bull shark, battle scars along back, prominent sharp dorsal fin, jaws open showing teeth' },
      { rank:5, key:'Apex Shark',               desc:'huge megalodon-class shark, massive broad body, deep battle scars, large jagged dorsal fin, wide jaw' },
      { rank:7, key:'Deep Terror',              desc:'abyssal horror shark, bioluminescent glowing lure on back, jagged bone-shard fins, glowing deep-sea eyes' },
      { rank:9, key:'True Sea God',             desc:'divine sea-deity shark, pearlescent iridescent armor scales, tidal wave crown halo, world-ocean aura ring' },
    ],
  },
  electroEel: {
    name: 'Eel', palette: 'electric green cyan white',
    pose: 'camera pointing straight down overhead; long slender eel body in S-curve filling the frame top to bottom; head at 12-o-clock top, tail tip at 6-o-clock bottom; body winds through center of frame',
    forms: [
      { rank:1, key:'River Eel',                desc:'slender green river eel, smooth skin, simple S-curve, gentle expression, faint electric sparks near tail' },
      { rank:3, key:'Thunder Eel',              desc:'crackling thunder eel, bright yellow-white lightning arcs along entire body length, glowing electric eyes' },
      { rank:5, key:'Storm Eel',                desc:'huge storm eel, electric plasma corona wrapping around body, crackling lightning halo ring, vivid cyan glow' },
      { rank:7, key:'Void Serpent',             desc:'cosmic void-serpent eel, dark scales with star-constellation glow pattern, crackling lightning aura ring' },
      { rank:9, key:'True Storm God',           desc:'divine storm-god eel, world-spanning lightning crown halo ring, hurricane swirl aura, blazing white-gold electric body' },
    ],
  },
  scorpion: {
    name: 'Scorpion', palette: 'desert ochre poison-green',
    pose: 'camera pointing straight down overhead; scorpion body flat from above; two large pincers/claws at 10-o-clock and 2-o-clock upper corners; segmented body in center; curved stinger tail arching OVER the back (visible as curved arc from tip at top curving down) — stinger tip near center-top; 8 legs spread radially left and right',
    forms: [
      { rank:1, key:'Young Scorpion',           desc:'small desert scorpion, plain amber carapace, simple segmented tail, small claws, clean simple silhouette' },
      { rank:3, key:'Sand Stalker',             desc:'large desert scorpion, jagged spiky chitin armor, green venom drop at stinger tip, enlarged menacing claws' },
      { rank:5, key:'Plague Scorpion',          desc:'huge plague scorpion, skull-marked carapace, sickly green miasma wisps, green-glowing venom stinger, wide stance' },
      { rank:7, key:'Death Scorpion',           desc:'bone-armored death scorpion, skeletal bone plates, necrotic green flame stinger, skull-face marking on thorax' },
      { rank:9, key:'True Plague God',          desc:'divine plague-god scorpion, ash-grey divine carapace, world-wasting green venom aura ring, death-crown halo' },
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


