// Lands End — Prototype v2.9.2 (mobile UI: minimap+leaderboard vertical stack, no overlap, responsive HUD) · v2.9.1 (real boss portrait PNGs · 5 古神 boss rotation each with unique silhouette · 2.4s boss intro splash (AI art slot ready) · cinematic vignette + enraged letterbox + low-HP pulse · AI prompt pack for production art)
// v1.2.0 多人聯機：WS 中繼、玩家狀態同步、PvP 近戰/彈道、Chat T 鍵、線上人數 HUD
// v1.1.0 群星海洋 14000² + 星海環帶 biome + 22序列登神階位（rank 1-9 + 序列 9→0 = 共 19 階位、近 22 序列精神） + Era of God War + True God試煉
'use strict';

// =====================================================================
// 常數
// =====================================================================
const WORLD = { w: 20000, h: 20000 };  // v2.2.0 team-god-war arena (was 14000; center 10000,10000)
const TILE = 256;
const KEYS = {};
const MOUSE = { x:0, y:0, wx:0, wy:0, ldown:false, rdown:false };

// =====================================================================
// 六大序列（每階皆有獨有能力 — 詭秘之主風 / 演化進階）
// 每個 tier: { name, pname, pdesc, p:{...perks} }
// perks 可用欄位：
//   atk/def/hp/spd/sta : 乘數
//   crit       : 暴擊率加成
//   lifesteal  : 普攻吸血百分比
//   killheal   : 擊殺回血百分比 (maxHp)
//   regen      : 每秒回血
//   reflect    : 受擊釋放衝擊波
//   dot        : 命中附加流血/中毒 dmg/s × 4s
//   pierce     : 普攻無視 def 百分比
//   aoeOnHit   : 普攻附加 60px 範圍 AoE
//   knockRes   : 抗擊退百分比
//   knockMul   : 擊退力度倍率
//   range      : 攻擊距離倍率
//   size       : 體型倍率
//   slowAura   : 周圍 220px 持續減速 30%
//   dotAura    : 周圍 220px 持續Venom Mist 8 dmg/s
//   pushAura   : 周圍 200px 持續擊退
//   revive     : 死亡時自動復活一次
//   vision     : 視野倍率（用於小地圖偵測）
// =====================================================================
const PATHS = {
  human: {
    name:'Path of Humanity', color:'#ffd66b', icon:'⚔️',
    tiers:[
      { name:'Qi Apprentice', pname:'Vital Flow', pdesc:'AS +15%',                 p:{spd:1.15} },
      { name:'Forged Fist', pname:'Inner Burst', pdesc:'ATK +10%, Crit +10%',       p:{atk:1.10, crit:0.10} },
      { name:'Meridian Swordsman', pname:'Open Meridians', pdesc:'ATK +15%, Range +10%',   p:{atk:1.15, range:1.10} },
      { name:'Subtle Master', pname:'Refined Strikes', pdesc:'Crit +15%, Lifesteal 5%',         p:{crit:0.15, lifesteal:0.05} },
      { name:'Mystic Saint', pname:'Profound Truth', pdesc:'ATK +25%, DEF +15%',       p:{atk:1.25, def:1.15} },
      { name:'True Arhat', pname:'Golden Body', pdesc:'HP +40%, DEF +30%',       p:{hp:1.40, def:1.30} },
      { name:'Divine Weapon Lord', pname:'Blade Apotheosis', pdesc:'Range +40%, ATK +20%',    p:{range:1.40, atk:1.20} },
      { name:'Warrior God', pname:'Divine Backlash', pdesc:'Releases shockwave when hit',         p:{reflect:1, atk:1.30} },
      { name:'Grand Martial Patriarch', pname:'Way Perfected', pdesc:'ATK +50%, Kill Heal 40% HP',    p:{atk:1.50, killheal:0.40} },
    ],
  },
  dragon: {
    name:'Path of Dragons', color:'#88e0ff', icon:'🐉',
    tiers:[
      { name:'Hatchling Jiao',   pname:'First Scales', pdesc:'DEF +20%',                  p:{def:1.20} },
      { name:'Twin-Horned Hui',   pname:'Towering Horns', pdesc:'KB Res +50%, HP +10%',     p:{knockRes:0.5, hp:1.10} },
      { name:'Essence-Devouring Chi',   pname:'Essence Feast', pdesc:'Lifesteal +8%, ATK +10%',         p:{lifesteal:0.08, atk:1.10} },
      { name:'Coiled Dragon King',   pname:'Dragon Aura', pdesc:'HP +30%, DEF +15%',        p:{hp:1.30, def:1.15} },
      { name:'Storm-Drawing Ying Long', pname:'Lightning Pierce', pdesc:'ATK +20%, +5/s lightning on hit', p:{atk:1.20, dot:5} },
      { name:'All-Seeing Zhu Long', pname:'Daylit Eyes', pdesc:'Crit +20%, Vision +30%',        p:{crit:0.20, vision:1.30} },
      { name:'Primordial Dragon Lord', pname:'Dragon Patriarch', pdesc:'ATK +40%, Size +10%',        p:{atk:1.40, size:1.10} },
      { name:'True Dragon Sovereign', pname:'True Dragon Roar', pdesc:'Basic adds AoE, HP +30%',   p:{aoeOnHit:1, hp:1.30} },
      { name:'Primal Divine Dragon', pname:'Sky-Cleaving Form', pdesc:'ATK+50%, HP+50%, Slow Aura', p:{atk:1.50, hp:1.50, slowAura:1} },
    ],
  },
  beast: {
    name:'Path of Beasts', color:'#e0a060', icon:'🐺',
    tiers:[
      { name:'Bloodthirsty Cub', pname:'Bloody Fangs', pdesc:'ATK +10%, Lifesteal 3%',          p:{atk:1.10, lifesteal:0.03} },
      { name:'Wild Predator', pname:'Feral Fury', pdesc:'ATK +15%, SPD +5%',          p:{atk:1.15, spd:1.05} },
      { name:'Spirit Beast', pname:'Spirit Instinct', pdesc:'SPD +15%, Crit +5%',          p:{spd:1.15, crit:0.05} },
      { name:'Awakened Beast', pname:'Mind Awakening', pdesc:'Crit +15%, Lifesteal 5%',           p:{crit:0.15, lifesteal:0.05} },
      { name:'Manifest Divine Beast', pname:'Battle Tide', pdesc:'Kill Heal 25%, ATK +15%',     p:{killheal:0.25, atk:1.15} },
      { name:'Thunder Saint Beast', pname:'Thunder Ward', pdesc:'Basic adds AoE, ATK +20%',   p:{aoeOnHit:1, atk:1.20} },
      { name:'Realm-Breaking Demon', pname:'Demonic Growth', pdesc:'Size +20%, HP +30%',          p:{size:1.20, hp:1.30} },
      { name:'Primal Beast Lord', pname:'Primal Might', pdesc:'ATK +40%, HP +40%',          p:{atk:1.40, hp:1.40} },
      { name:'Primordial Beast Patriarch', pname:'Patriarch Awakens', pdesc:'ATK +50%, Slow Aura',           p:{atk:1.50, slowAura:1} },
    ],
  },
  bird: {
    name:'Path of Feathers', color:'#cce0ff', icon:'🦅',
    tiers:[
      { name:'Fledgling', pname:'Light Feathers', pdesc:'SPD +20%',                    p:{spd:1.20} },
      { name:'Wind Rider', pname:'Riding Cry', pdesc:'STA +30%, SPD +10%',          p:{sta:1.30, spd:1.10} },
      { name:'Venom Plume', pname:'Toxic Quill', pdesc:'+4/s poison on hit',             p:{dot:4} },
      { name:'Cloud-Piercer', pname:'Armor Pierce', pdesc:'Ignore 30% DEF',             p:{pierce:0.30} },
      { name:'Storm Feather Prodigy', pname:'Chain Lightning Quill', pdesc:'ATK +20%, Basic adds AoE',       p:{atk:1.20, aoeOnHit:1} },
      { name:'Wind God Roar', pname:'Roar of Winds', pdesc:'KB +50%, ATK +20%',          p:{knockMul:1.5, atk:1.20} },
      { name:'Roc Spread Wings', pname:'Roc Wings', pdesc:'SPD +30%, Range +20%',      p:{spd:1.30, range:1.20} },
      { name:'Thunder Emperor Bird', pname:'Thunder Descent', pdesc:'ATK +30%, Poison Aura',            p:{atk:1.30, dotAura:1} },
      { name:'Immortal Phoenix', pname:'Nirvana Rebirth', pdesc:'Auto-revive once, ATK +40%',   p:{revive:1, atk:1.40} },
    ],
  },
  fish: {
    name:'Path of Scales', color:'#88c0ff', icon:'🐟',
    tiers:[
      { name:'Drifting Fry', pname:'Slick Glide', pdesc:'SPD +15%',                    p:{spd:1.15} },
      { name:'River Carp', pname:'Carp Qi', pdesc:'Regen +1.5/s',                p:{regen:1.5} },
      { name:'Becoming-Jiao Lord', pname:'Jiao Bite', pdesc:'ATK +20%',                     p:{atk:1.20} },
      { name:'Dragon Fish', pname:'Dragon Fish', pdesc:'HP +25%, ATK +15%',           p:{hp:1.25, atk:1.15} },
      { name:'Abyssal Water Spirit', pname:'Water Quake', pdesc:'Push Aura',                    p:{pushAura:1} },
      { name:'Ocean Emperor', pname:'Emperor Aura', pdesc:'ATK +30%, DEF +20%',            p:{atk:1.30, def:1.20} },
      { name:'Abyssal Titan', pname:'Titanic Body', pdesc:'HP +50%, Size +15%',            p:{hp:1.50, size:1.15} },
      { name:'Dragon King of the Sea', pname:'Dragon Wave', pdesc:'Range +40%, ATK +20%',         p:{range:1.40, atk:1.20} },
      { name:'Primordial Sea God', pname:'Sea God Wrath', pdesc:'ATK+30%, HP+30%, Slow Aura',     p:{atk:1.30, hp:1.30, slowAura:1} },
    ],
  },
  insect: {
    name:'Path of Insects', color:'#c0ff60', icon:'🦂',
    tiers:[
      { name:'Devouring Larva', pname:'Devour Heal', pdesc:'Lifesteal 5%',                       p:{lifesteal:0.05} },
      { name:'Molting Mantid', pname:'Shed Carapace', pdesc:'DEF +20%, HP +10%',           p:{def:1.20, hp:1.10} },
      { name:'Blood Wing Drinker', pname:'Marrow Drain', pdesc:'Lifesteal +15%, ATK +10%',           p:{lifesteal:0.15, atk:1.10} },
      { name:'Nesting Queen', pname:'Swarm Aura', pdesc:'ATK +15%, HP +20%',           p:{atk:1.15, hp:1.20} },
      { name:'Queen Expanding', pname:'Queen Growth', pdesc:'HP +40%, Size +10%',           p:{hp:1.40, size:1.10} },
      { name:'Devouring Insect Emperor', pname:'Imperial Venom', pdesc:'+6/s poison on hit',               p:{dot:6} },
      { name:'Swarm Emperor', pname:'Emperor Pressure', pdesc:'ATK +30%, Range +20%',        p:{atk:1.30, range:1.20} },
      { name:'Dreaming Insect Patriarch', pname:'Soul Feast', pdesc:'ATK +20%, Poison Aura',              p:{atk:1.20, dotAura:1} },
      { name:'Primal Insect God', pname:'Insect God Crown', pdesc:'ATK+40%, Slow+Poison Auras',     p:{atk:1.40, slowAura:1, dotAura:1} },
    ],
  },
};
function tierName(p){
  // v2.0: each species has its own 9-stage chain title (overrides path tier name)
  const titles = SPECIES_TITLES[p.species];
  const idx = Math.max(0, Math.min(8, p.rank-1));
  if (titles && titles[idx]) return titles[idx];
  return (p.path.tiers[idx] && p.path.tiers[idx].name) || 'Mortal';
}
function tierData(p){
  // v2.0: tier perks always come from path.tiers (1..9); name override via SPECIES_TITLES
  const idx = Math.max(0, Math.min(8, p.rank-1));
  const base = p.path.tiers[idx];
  if (!base) return null;
  const titles = SPECIES_TITLES[p.species];
  if (titles && titles[idx]) return { ...base, name: titles[idx] };
  return base;
}
function aggregatePerks(p){
  const out = { atk:1, def:1, hp:1, spd:1, sta:1, size:1, range:1, vision:1,
                crit:0, lifesteal:0, killheal:0, regen:0, dot:0, pierce:0,
                knockRes:0, knockMul:1,
                reflect:0, aoeOnHit:0, slowAura:0, dotAura:0, pushAura:0, revive:0 };
  const accumTiers = [];
  for (let i=0;i<Math.min(p.rank,9);i++) if (p.path.tiers[i]) accumTiers.push(p.path.tiers[i]);
  // v2.0: cultivator species has its OWN tier perks (caster-leaning) that overlay the path perks
  for (const t of accumTiers){
    if (!t||!t.p) continue;
    for (const k in t.p){
      if (k==='atk'||k==='def'||k==='hp'||k==='spd'||k==='sta'||k==='size'||k==='range'||k==='vision'||k==='knockMul') out[k]*=t.p[k];
      else if (k==='reflect'||k==='aoeOnHit'||k==='slowAura'||k==='dotAura'||k==='pushAura'||k==='revive') out[k] = Math.max(out[k], t.p[k]);
      else out[k]+=t.p[k];
    }
  }
  return out;
}

// v2.0: 9-level system. RANK_BONUS index N = bonus when promoting rank (N+1)→(N+2). 8 entries cover 1→2 ... 8→9.
const RANK_BONUS = [
  // v3.5.2: rank 1-3 ATK/DEF softened so early game is player-skill, not attrition vs AI
  { hp:50,   atk:6,    def:2,   spd:4,  sta:10,  life:40,   zy:0.14, dh:0.14 },
  { hp:85,   atk:11,   def:4,   spd:5,  sta:13,  life:60,   zy:0.20, dh:0.20 },
  { hp:150,  atk:20,   def:7,   spd:7,  sta:17,  life:90,   zy:0.30, dh:0.30 },
  { hp:340,  atk:48,   def:15,  spd:10, sta:22,  life:180,  zy:0.55, dh:0.55 },
  { hp:600,  atk:85,   def:25,  spd:13, sta:28,  life:300,  zy:0.80, dh:0.80 },
  { hp:1100, atk:155,  def:45,  spd:16, sta:36,  life:480,  zy:1.20, dh:1.20 },
  { hp:2000, atk:280,  def:75,  spd:20, sta:46,  life:780,  zy:1.80, dh:1.80 },
  { hp:3800, atk:520,  def:130, spd:25, sta:58,  life:1250, zy:2.70, dh:2.70 },
];
// v2.0: 9-level qi thresholds. Index N = qi required to promote to rank (N+1). [0]=unused, [8]=throne.
const QI_THR = [0, 80, 280, 720, 1800, 4200, 9500, 20000, 42000];

// v3.4.3: per-species rank icons (9 stages, index 0–8 = rank 1–9) — visual progression that matches each title
const SPECIES_RANK_ICONS = {
  swordsman:  ['🗡️','⚔️','🛡️','🏰','⚜️','👑','🌟','🔱','⚡'],
  cultivator: ['🧘','📿','☯️','🌀','✨','🪷','🌌','💫','⚡'],
  longSnake:  ['🐍','🐍','🐉','🐉','🌊','⚡','🐲','🌌','✨'],
  lizard:     ['🦎','🦎','🐲','🐲','🔥','👑','🐉','🌌','✨'],
  croc:       ['🐊','🐊','🩸','🩸','🌊','👑','🐲','🌌','✨'],
  dino:       ['🦕','🦖','🦖','🔥','👑','🌋','🐉','🌌','⚡'],
  wolf:       ['🐺','🐺','🌙','🌙','🩸','👑','🐉','🌌','⚡'],
  eagle:      ['🦅','🦅','⛈️','⛈️','⚡','👑','🔥','🌅','🐦‍🔥'],
  owl:        ['🦉','🦉','🌙','🌑','💀','👑','🌌','💫','✨'],
  bat:        ['🦇','🦇','🩸','🌑','🌙','👑','💀','🌌','⚡'],
  shark:      ['🦈','🦈','🌊','🩸','👑','🌊','🐲','🌌','✨'],
  electroEel: ['🐍','⚡','⚡','🌩️','⛈️','👑','🐲','🌌','✨'],
  scorpion:   ['🦂','🦂','☠️','🩸','👑','🌋','🐉','🌌','✨'],
};
function tierIcon(p){
  try {
    const sp = p && (p.species || (p.sp && p.sp.key));
    const list = sp ? SPECIES_RANK_ICONS[sp] : null;
    const idx = Math.max(0, Math.min(8, (p.rank||1)-1));
    if (list && list[idx]) return list[idx];
  } catch(e){}
  return (p && p.sp && p.sp.icon) || '✦';
}

// v3.4.4: AI-art portraits per species (drop PNGs into assets/species/<key>.png)
// Loaded lazily; missing files silently fall back to procedural drawShape.
const SPECIES_PORTRAITS = {}; // key -> {base:HTMLImageElement, r3?, r5?, r7?, r9?, ready}
const _PORTRAIT_KEYS = ['swordsman','cultivator','dino','longSnake','lizard','croc','wolf','eagle','owl','bat','shark','electroEel','scorpion'];
function _loadPortrait(key){
  const rec = SPECIES_PORTRAITS[key] = SPECIES_PORTRAITS[key] || { ready:false };
  const tryLoad = (suffix, slot)=>{
    const img = new Image();
    img.onload = ()=>{ rec[slot] = img; rec.ready = true; };
    img.onerror = ()=>{};
    img.src = 'assets/species/' + key + (suffix||'') + '.png';
  };
  tryLoad('', 'base');
  tryLoad('-r3','r3'); tryLoad('-r5','r5'); tryLoad('-r7','r7'); tryLoad('-r9','r9');
}
function preloadSpeciesPortraits(){
  for (const k of _PORTRAIT_KEYS) _loadPortrait(k);
}
function getPortrait(key, rank){
  const rec = SPECIES_PORTRAITS[key]; if (!rec || !rec.ready) return null;
  if (rank>=9 && rec.r9) return rec.r9;
  if (rank>=7 && rec.r7) return rec.r7;
  if (rank>=5 && rec.r5) return rec.r5;
  if (rank>=3 && rec.r3) return rec.r3;
  return rec.base || null;
}
try { preloadSpeciesPortraits(); } catch(e){}

// v2.0: per-species chain titles (9 stages, index 0–8 = rank 1–9)
const SPECIES_TITLES = {
  // Path of Humanity — two chains
  swordsman:  ['Warrior','Battle General','Grey Knight','Paladin','Twilight Giant','Holy Emperor','Avatar of the War God','Lance of Fate','True God · Conqueror'],
  cultivator: ['Qi Refining','Foundation Establishment','Golden Core','Nascent Soul','Spirit Transformation','True Immortal','Daluo Immortal','Heavenly Dao','True God · Wuji Daoist'],
  // Path of Dragons
  longSnake:  ['Hatchling Jiao','Twin-Horned Hui','Cloud-Riding Hui','Coiled Dragon King','Storm Ying Long','All-Seeing Zhu Long','Primordial Dragon Lord','True Dragon Sovereign','True God · Primal Divine Dragon'],
  // Path of Beasts
  lizard:     ['Lizard Pup','Spiny Stalker','Shed-Skin Lizard','Spirit Lizard','Tail-Regrowing Beast','Demon Lizard','Saint Lizard','Primordial Saurian','True God · Lizard God'],
  croc:       ['Crocodile Cub','River Snapper','Bloody-Jaw','Death-Rolling Crocodile','Bloodriver Crocodile','Marshlord','Saint Crocodile','Primordial Sebek','True God · Crocodile God'],
  dino:       ['Newborn Saurus','Pack Hunter','Ridge-Back','Tyrant Stomper','Ancient Saurus','Saurian Lord','World-Shaker','Primordial Tyrant','True God · Tyrant God'],
  wolf:       ['Wolf Pup','Pack Wolf','Lone Hunter','Alpha','Shadowfang','Moon Wolf','Spirit Wolf','Primordial Fenrir','True God · Wolf God'],
  // Path of Feathers
  eagle:      ['Fledgling Eagle','Sky Glider','Wind Rider','Cloud-Piercing Eagle','Storm Eagle','Wind God Eagle','Roc','Thunder Emperor Eagle','True God · Immortal Phoenix'],
  owl:        ['Owlet','Night Hunter','Shadow Owl','Silent Reaper','Moonwatcher','Night God Owl','Death Owl','Eternal Night Owl','True God · Underworld Phoenix'],
  bat:        ['Bat Pup','Echo-Caller','Blood Drinker','Vampire Bat','Shadow Wing','Moonbat','Phantom Bat','Primordial Camazotz','True God · Bat God'],
  // Path of Scales
  shark:      ['Sharklet','Bloodscent Shark','Megalodon Cub','Reef Tyrant','Abyssal Shark','Ocean Hunter','Titan Shark','Primordial Megalodon','True God · Shark God'],
  electroEel: ['Spark Eel','Lightning Eel','Stormcoil','Thunder Eel','Sky-Thunder Eel','Lord of Bolts','Storm God Eel','Primordial Thunder Serpent','True God · Eel God'],
  // Path of Insects
  scorpion:   ['Larva Scorpion','Stinger','Venom Caller','Queen Scorpion','Toxic Empress','Plague Bringer','Saint Scorpion','Primordial Selket','True God · Scorpion God'],
};

// =====================================================================
// v3.5.0 — 物種專屬進階儲式（取代之前「挨打 N 次」的被動任務）
// 所有 quest 均為主動型、不與 XP 衝突：正常打鬥期間自然完成。
// Index = rank-1. Only listed slots override; others fall through to PATH_QUESTS.
// =====================================================================
const SPECIES_QUESTS = {
  swordsman: { 1: { desc:'Blade Initiation: Kill 3 lesser creatures',  req:p=>p.q.kills>=3, show:p=>`Kills ${Math.min(p.q.kills,3)}/3` } },
  cultivator:{ 1: { desc:'Qi Gathering: Kill 3 lesser creatures',      req:p=>p.q.kills>=3, show:p=>`Kills ${Math.min(p.q.kills,3)}/3` } },
  bat:       { 1: { desc:'First Blood: Kill 3 prey',                    req:p=>p.q.kills>=3, show:p=>`Kills ${Math.min(p.q.kills,3)}/3` } },
  lizard:    { 1: { desc:'Hunter\'s Mark: Kill 3 lesser creatures',     req:p=>p.q.kills>=3, show:p=>`Kills ${Math.min(p.q.kills,3)}/3` } },
  croc:      { 1: { desc:'Ambusher: Kill 4 lesser creatures',            req:p=>p.q.kills>=4, show:p=>`Kills ${Math.min(p.q.kills,4)}/4` } },
  wolf:      { 1: { desc:'Pack Hunt: Kill 4 lesser creatures',           req:p=>p.q.kills>=4, show:p=>`Kills ${Math.min(p.q.kills,4)}/4` } },
  scorpion:  { 1: { desc:'Sting Trial: Kill 3 lesser creatures',        req:p=>p.q.kills>=3, show:p=>`Kills ${Math.min(p.q.kills,3)}/3` } },
  eagle:     { 1: { desc:'Sky Hunt: Kill 3 prey',                        req:p=>p.q.kills>=3, show:p=>`Kills ${Math.min(p.q.kills,3)}/3` } },
  owl:       { 1: { desc:'Night Stalk: Kill 3 prey',                     req:p=>p.q.kills>=3, show:p=>`Kills ${Math.min(p.q.kills,3)}/3` } },
  shark:     { 1: { desc:'Bloodfrenzy: Kill 4 lesser creatures',         req:p=>p.q.kills>=4, show:p=>`Kills ${Math.min(p.q.kills,4)}/4` } },
  electroEel:{ 1: { desc:'Charge Up: Kill 3 lesser creatures',          req:p=>p.q.kills>=3, show:p=>`Kills ${Math.min(p.q.kills,3)}/3` } },
  longSnake: { 1: { desc:'Coil Strike: Kill 4 lesser creatures',         req:p=>p.q.kills>=4, show:p=>`Kills ${Math.min(p.q.kills,4)}/4` } },
  dino:      { 1: { desc:'Tyrant Roar: Kill 5 lesser creatures',         req:p=>p.q.kills>=5, show:p=>`Kills ${Math.min(p.q.kills,5)}/5` } },
};

// =====================================================================
// v2.0 — SEQUENCE_QUESTS removed (9-level system folds endgame into PATH_QUESTS + Apotheosis Trial)
// =====================================================================

const SPECIES = {
  // Path of Humanity
  swordsman: { path:'human', name:'Swordsman', icon:'🗡️', color:'#ffd66b', shape:'humanoid',
    base:{hp:130,atk:15,def:5,spd:185,sta:90,life:240, r:18, atkR:55, atkCd:0.4, rngR:480, rngCd:0.8, rngDmg:12, rngSpd:540},
    skillQ:{name:'Triple Arrow', cd:3.5, type:'arrow3', desc:'Fan 3 arrows, x0.7 dmg each', unlockRank:1},
    skillE:{name:'Sword Will Slash', cd:6,  type:'cleave',  desc:'Forward 180 deg fan slash, x3 dmg', unlockRank:4},
    skillR:{name:'Myriad Swords', cd:18, type:'sword_rain', desc:'24 swords orbit and fire at nearest', unlockRank:6},
  },
  // v2.0: Cultivator — caster + protective: bolts, Dao Aegis shield, sky lightning
  cultivator: { path:'human', name:'Cultivator', icon:'🧘', color:'#cba6ff', shape:'humanoid',
    base:{hp:105,atk:11,def:3,spd:170,sta:140,life:230, r:17, atkR:50, atkCd:0.5, rngR:560, rngCd:0.55, rngDmg:14, rngSpd:600},
    skillQ:{name:'Talisman Bolt', cd:3.5, type:'talisman_bolt', desc:'Auto-tracking Qi bolt that chains to 4 nearby foes', unlockRank:1},
    skillE:{name:'Dao Aegis', cd:10, type:'shield', desc:'8s arcane shield absorbs heavy damage', unlockRank:4},
    skillR:{name:'Heavenly Tribulation', cd:22, type:'sky_lightning', desc:'15 random bolts smite enemies', unlockRank:6},
  },
  lizard: { path:'beast', name:'Lizard', icon:'🦎', color:'#7fd07f', shape:'reptile',
    base:{hp:150,atk:16,def:6,spd:170,sta:80,life:200, r:20, atkR:58, atkCd:0.42},
    skillQ:{name:'Whirlwind Slash', cd:3, type:'spin', desc:'360 deg spin slash, x2 + KB', unlockRank:1},
    skillE:{name:'Tail Sweep', cd:5,  type:'tail',  desc:'280 deg tail sweep knockup', unlockRank:4},
    skillR:{name:'Berserk Form', cd:18, type:'rage', desc:'10s AS x2 DEF x2', unlockRank:6},
  },
  croc: { path:'beast', name:'Crocodile', icon:'🐊', color:'#6aa86a', shape:'reptile',
    base:{hp:170,atk:18,def:8,spd:155,sta:80,life:240, r:22, atkR:55, atkCd:0.5},
    skillQ:{name:'Death Roll', cd:3.5, type:'roll', desc:'Charge bite, x2 dmg + bleed', unlockRank:1},
    skillE:{name:'Lockjaw', cd:6, type:'grab', desc:'Grab nearest 2s, bite every 0.3s', unlockRank:4},
    skillR:{name:'Blood River', cd:22, type:'bloodpool', desc:'Blood pool, enemies bleed', unlockRank:6},
  },
  // v2.2.0: Dinosaur — tyrant tank: stomp, dmg-transfer bond, push-roar
  dino: { path:'dragon', name:'Dinosaur', icon:'🦖', color:'#7a8a3a', shape:'beast',
    base:{hp:180,atk:20,def:10,spd:150,sta:80,life:260, r:26, atkR:65, atkCd:0.5},
    skillQ:{name:'Stomp', cd:3, type:'stomp', desc:'250r AoE wave + stun 1s', unlockRank:1},
    skillE:{name:'Tyrant Bond', cd:10, type:'dmg_transfer', desc:'8s: redirect 70% incoming dmg to highest-HP nearby foe', unlockRank:4},
    skillR:{name:'Tyrant Roar', cd:20, type:'roar', desc:'Push all + stun 3s', unlockRank:6},
  },
  wolf: { path:'beast', name:'Wolf', icon:'🐺', color:'#a0a0a0', shape:'beast',
    base:{hp:130,atk:15,def:5,spd:195,sta:100,life:200, r:18, atkR:55, atkCd:0.388},
    skillQ:{name:'Pounce', cd:2.5, type:'pounce', desc:'Lunge + bite x2 dmg', unlockRank:1},
    skillE:{name:'Wolf Pack', cd:8, type:'summon_wolf', desc:'Summon 3 phantom wolves 15s', unlockRank:4},
    skillR:{name:'Bloodlust', cd:20, type:'frenzy', desc:'12s AS x2 + full heal on kill', unlockRank:6},
  },
  // 龍
  longSnake: { path:'dragon', name:'Jiao Serpent', icon:'🐉', color:'#88e0ff', shape:'dragon',
    base:{hp:160,atk:17,def:7,spd:170,sta:90,life:260, r:22, atkR:60, atkCd:0.45, rngR:460, rngCd:1.1, rngDmg:18, rngSpd:520},
    skillQ:{name:'Dragon Breath', cd:3, type:'breath', desc:'400px flame cone x0.6/tick', unlockRank:1},
    skillE:{name:'Coil', cd:6, type:'whirl', desc:'Energy ribbon 3s', unlockRank:4},
    skillR:{name:'True Dragon Descend', cd:25, type:'dragon_form', desc:'15s Size x1.5 ATK +100%', unlockRank:6},
  },
  // 羽
  eagle: { path:'bird', name:'Eagle', icon:'🦅', color:'#cce0ff', shape:'bird',
    base:{hp:110,atk:13,def:4,spd:200,sta:120,life:200, r:16, atkR:50, atkCd:0.38, rngR:540, rngCd:0.6, rngDmg:10, rngSpd:640},
    skillQ:{name:'Dive', cd:3, type:'dive', desc:'Dash to cursor, x3 dmg', unlockRank:1},
    skillE:{name:'Storm Feather Tempest', cd:6, type:'feather_storm', desc:'Fire 12 quills x0.5', unlockRank:4},
    skillR:{name:'Thunder Pierce', cd:20, type:'thunder_dive', desc:'Sky lightning pierces all', unlockRank:6},
  },
  owl: { path:'bird', name:'Night Owl', icon:'🦉', color:'#aabbcc', shape:'bird',
    base:{hp:115,atk:14,def:4,spd:190,sta:100,life:220, r:16, atkR:52, atkCd:0.4, rngR:520, rngCd:0.7, rngDmg:14, rngSpd:580},
    skillQ:{name:'Shadow Arrow', cd:3, type:'shadow_arrow', desc:'Piercing arrow x2 dmg', unlockRank:1},
    skillE:{name:'Veil of Night', cd:8, type:'darkness', desc:'8s stealth + 50% crit', unlockRank:4},
    skillR:{name:'Death Gaze', cd:20, type:'death_gaze', desc:'Lock 1.5s, then 999 true dmg', unlockRank:6},
  },
  // v2.2.0: Bat — echo/blood: sonar stun, vampire aura, phantom swarm
  bat: { path:'bird', name:'Bat', icon:'🦇', color:'#9a76d0', shape:'bird',
    base:{hp:100,atk:11,def:3,spd:210,sta:110,life:200, r:14, atkR:45, atkCd:0.32, rngR:380, rngCd:0.45, rngDmg:7, rngSpd:680},
    skillQ:{name:'Sonar Pulse', cd:3, type:'shock', desc:'250r echo shock + stun 0.5s', unlockRank:1},
    skillE:{name:'Vampire Embrace', cd:9, type:'lifesteal_aura', desc:'8s aura: heal 40% of dmg dealt', unlockRank:4},
    skillR:{name:'Echo Swarm', cd:20, type:'summon_bat', desc:'Summon 5 phantom bats 15s', unlockRank:6},
  },
  // 鱗
  shark: { path:'fish', name:'Shark', icon:'🦈', color:'#88c0ff', shape:'fish',
    base:{hp:220,atk:24,def:8,spd:170,sta:100,life:220, r:24, atkR:60, atkCd:0.4},
    skillQ:{name:'Triple Bite', cd:3, type:'combo3', desc:'3 bites x0.8 + bleed', unlockRank:1},
    skillE:{name:'Blood Frenzy', cd:6, type:'bloodrage', desc:'Sense low-HP 6s + AS x1.5', unlockRank:4},
    skillR:{name:'Abyss Call', cd:22, type:'abyss', desc:'Summon 5 phantom sharks', unlockRank:6},
  },
  electroEel: { path:'fish', name:'Eel', icon:'🐍', color:'#aaffe0', shape:'fish',
    base:{hp:120,atk:13,def:4,spd:170,sta:120,life:200, r:18, atkR:50, atkCd:0.4, rngR:480, rngCd:0.5, rngDmg:9, rngSpd:660},
    skillQ:{name:'Discharge', cd:3, type:'shock', desc:'250r shock + stun 0.5s', unlockRank:1},
    skillE:{name:'Lightning Chain', cd:6, type:'chain', desc:'8-jump chain x0.6 each', unlockRank:4},
    skillR:{name:'Storm Cataclysm', cd:20, type:'thunder_storm', desc:'16-jump chain + 8 sky bolts', unlockRank:6},
  },
  // 蟲
  scorpion: { path:'insect', name:'Scorpion', icon:'🦂', color:'#c0ff60', shape:'insect',
    base:{hp:140,atk:15,def:7,spd:160,sta:90,life:220, r:18, atkR:55, atkCd:0.42, rngR:430, rngCd:0.9, rngDmg:12, rngSpd:500},
    skillQ:{name:'Venom Tail', cd:3, type:'poison_sting', desc:'Spear lunge, 6s DOT 5/s', unlockRank:1},
    skillE:{name:'Venom Mist', cd:7, type:'poison_cloud', desc:'200r venom cloud 6s DOT', unlockRank:4},
    skillR:{name:'Imperial Venom', cd:22, type:'plague', desc:'All poisoned 10s, 30/s', unlockRank:6},
  },
};

// =====================================================================
// 各途徑專屬晉階儀式（每途徑 8 條，呼應種族特色）
// =====================================================================
function qK(n){ return p=>p.q.kills>=n; }
function qKShow(n){ return p=>`Kills ${Math.min(p.q.kills,n)}/${n}`; }
const PATH_QUESTS = {
  human: [
    { desc:'First Steps: Kill 3 creatures',  req:qK(3),  show:qKShow(3) },
    { desc:'Wander the World: Explore 3 biomes',                  req:p=>p.q.terrains.size>=3, show:p=>`Biomes ${p.q.terrains.size}/3` },
    { desc:'Master Eye: Kill 1 tier-3+ enemy',          req:p=>p.q.killHighTier>=1, show:p=>`High-tier ${p.q.killHighTier}/1` },
    { desc:'Grand Master: 12 total kills',                req:qK(12), show:qKShow(12) },
    { desc:'Seek Power: Pick up 1 Authority',                  req:p=>p.q.authorities>=1, show:p=>`Authorities ${p.q.authorities}/1` },
    { desc:'Saint Might: Use Authority 4 times',                  req:p=>p.q.casts>=4, show:p=>`Casts ${Math.min(p.q.casts,4)}/4` },
    { desc:'War God Trial: Enter Lands End',                    req:p=>p.q.enteredEnd, show:p=>p.q.enteredEnd?'Reached':'Not yet' },
    { desc:'Earthly Immortal: Collect 3 Authorities',                  req:p=>p.q.authorities>=3, show:p=>`Authorities ${p.q.authorities}/3` },
  ],
  dragon: [
    { desc:'Jiao Appears: Kill 3 creatures',                   req:qK(3),  show:qKShow(3) },
    { desc:'Hui Wanders: Explore 4 biomes',                  req:p=>p.q.terrains.size>=4, show:p=>`Biomes ${p.q.terrains.size}/4` },
    { desc:'Chi Devours: Kill 1 tier-3+ enemy',          req:p=>p.q.killHighTier>=1, show:p=>`High-tier ${p.q.killHighTier}/1` },
    { desc:'Coiled Dragon: 15 total kills',                  req:qK(15), show:qKShow(15) },
    { desc:'Ying Long Rides Clouds: Pick up 1 Authority',                  req:p=>p.q.authorities>=1, show:p=>`Authorities ${p.q.authorities}/1` },
    { desc:'Zhu Long Opens Eyes: Kill 1 tier-5+ enemy',          req:p=>p.q.killEpic>=1, show:p=>`Epic ${p.q.killEpic}/1` },
    { desc:'Primordial Dragon Descend: Enter Lands End',                    req:p=>p.q.enteredEnd, show:p=>p.q.enteredEnd?'Reached':'Not yet' },
    { desc:'Divine Dragon Awakens: Collect 4 Authorities',                  req:p=>p.q.authorities>=4, show:p=>`Authorities ${p.q.authorities}/4` },
  ],
  beast: [
    { desc:'Cub Forage: Near fruit + kill 2',            req:qK(2),  show:qKShow(2) },
    { desc:'Predator Appears: 8 total kills',                   req:qK(8),  show:qKShow(8) },
    { desc:'Demon Beast Roams: Explore 3 biomes',                  req:p=>p.q.terrains.size>=3, show:p=>`Biomes ${p.q.terrains.size}/3` },
    { desc:'Spirit Beast Awakens: Pick up 1 Authority',                  req:p=>p.q.authorities>=1, show:p=>`Authorities ${p.q.authorities}/1` },
    { desc:'Divine Beast: Kill 2 tier-3+ enemies',          req:p=>p.q.killHighTier>=2, show:p=>`High-tier ${p.q.killHighTier}/2` },
    { desc:'Saint Beast Thunder: Use Authority 4 times',                  req:p=>p.q.casts>=4, show:p=>`Casts ${Math.min(p.q.casts,4)}/4` },
    { desc:'Great Demon Breaks Realm: Enter Lands End',                    req:p=>p.q.enteredEnd, show:p=>p.q.enteredEnd?'Reached':'Not yet' },
    { desc:'Beast God Crowned: 30 total kills',                  req:qK(30), show:qKShow(30) },
  ],
  bird: [
    { desc:'First Flight: Explore 2 biomes',                  req:p=>p.q.terrains.size>=2, show:p=>`Biomes ${p.q.terrains.size}/2` },
    { desc:'Wind Riding: Kill 5 creatures',                   req:qK(5),  show:qKShow(5) },
    { desc:'Demon Bird: Kill 1 tier-3+ enemy',          req:p=>p.q.killHighTier>=1, show:p=>`High-tier ${p.q.killHighTier}/1` },
    { desc:'Cloud Piercer: Explore 5 biomes',                  req:p=>p.q.terrains.size>=5, show:p=>`Biomes ${p.q.terrains.size}/5` },
    { desc:'Thunderbird Subdues: Pick up 1 Authority',                  req:p=>p.q.authorities>=1, show:p=>`Authorities ${p.q.authorities}/1` },
    { desc:'Wind God Roars: Use Authority 5 times',                  req:p=>p.q.casts>=5, show:p=>`Casts ${Math.min(p.q.casts,5)}/5` },
    { desc:'Roc Spreads Wings: Enter Lands End',                    req:p=>p.q.enteredEnd, show:p=>p.q.enteredEnd?'Reached':'Not yet' },
    { desc:'Thunderbird Divine: Kill 3 tier-5+ enemies',          req:p=>p.q.killEpic>=3, show:p=>`Epic ${p.q.killEpic}/3` },
  ],
  fish: [
    { desc:'Fry Swims: Kill 3',                       req:qK(3),  show:qKShow(3) },
    { desc:'Enter River: Visit water (swamp/water)',               req:p=>p.q.terrains.has('water')||p.q.terrains.has('swamp'), show:p=>(p.q.terrains.has('water')||p.q.terrains.has('swamp'))?'Reached':'Not yet' },
    { desc:'Fish to Jiao: 10 total kills',                  req:qK(10), show:qKShow(10) },
    { desc:'Jiao to Dragon: Pick up 1 Authority',                  req:p=>p.q.authorities>=1, show:p=>`Authorities ${p.q.authorities}/1` },
    { desc:'Dragon Fish Turns River: Kill 2 tier-3+ enemies',          req:p=>p.q.killHighTier>=2, show:p=>`High-tier ${p.q.killHighTier}/2` },
    { desc:'Water Spirit Shakes Sea: Use Authority 4 times',                  req:p=>p.q.casts>=4, show:p=>`Casts ${Math.min(p.q.casts,4)}/4` },
    { desc:'Sea King Arrives: Enter Lands End',                    req:p=>p.q.enteredEnd, show:p=>p.q.enteredEnd?'Reached':'Not yet' },
    { desc:'Sea Emperor Crowned: Collect 4 Authorities',                  req:p=>p.q.authorities>=4, show:p=>`Authorities ${p.q.authorities}/4` },
  ],
  insect: [
    { desc:'Larva Seeks Blood: Kill 4 creatures',                   req:qK(4),  show:qKShow(4) },
    { desc:'Demon Insect Molts: Explore 3 biomes',                  req:p=>p.q.terrains.size>=3, show:p=>`Biomes ${p.q.terrains.size}/3` },
    { desc:'Queen Nests: Pick up 1 Authority',                  req:p=>p.q.authorities>=1, show:p=>`Authorities ${p.q.authorities}/1` },
    { desc:'Queen Expands: 18 total kills',                  req:qK(18), show:qKShow(18) },
    { desc:'Insect Emperor Devours: Kill 2 tier-3+ enemies',          req:p=>p.q.killHighTier>=2, show:p=>`High-tier ${p.q.killHighTier}/2` },
    { desc:'Swarm Emperor: Use Authority 5 times',                  req:p=>p.q.casts>=5, show:p=>`Casts ${Math.min(p.q.casts,5)}/5` },
    { desc:'Insect Patriarch Dreams: Enter Lands End',                    req:p=>p.q.enteredEnd, show:p=>p.q.enteredEnd?'Reached':'Not yet' },
    { desc:'Insect God Crown: Kill 2 tier-5+ enemies',          req:p=>p.q.killEpic>=2, show:p=>`Epic ${p.q.killEpic}/2` },
  ],
};

// =====================================================================
// v2.4.0: 進化形態表（盲盒體驗）— 每個物種在 rank 1/3/5/7/9 變身新形態
// =====================================================================
const RANK_FORMS = {
  swordsman: [
    {rank:1,icon:'🗡️',color:'#ffd66b',name:'Apprentice Swordsman'},
    {rank:3,icon:'⚔️',color:'#ffaa44',name:'Battle Duelist'},
    {rank:5,icon:'🛡️',color:'#ff8833',name:'War Hero'},
    {rank:7,icon:'🌟',color:'#ff6600',name:'Sword Immortal'},
    {rank:9,icon:'⚡',color:'#ffffff',name:'True Sword God'},
  ],
  cultivator: [
    {rank:1,icon:'🧘',color:'#cba6ff',name:'Qi Student'},
    {rank:3,icon:'🔮',color:'#aa88ff',name:'Spell Weaver'},
    {rank:5,icon:'☯️',color:'#8866ff',name:'Dao Seeker'},
    {rank:7,icon:'🌌',color:'#6644cc',name:'Void Master'},
    {rank:9,icon:'💫',color:'#ffffff',name:'True Celestial'},
  ],
  lizard: [
    {rank:1,icon:'🦎',color:'#7fd07f',name:'River Lizard'},
    {rank:3,icon:'🐍',color:'#55aa55',name:'Swift Raptor'},
    {rank:5,icon:'🔥',color:'#88aa22',name:'War Iguana'},
    {rank:7,icon:'💀',color:'#aa6600',name:'Primal Hunter'},
    {rank:9,icon:'🌋',color:'#ff6600',name:'True Primal God'},
  ],
  croc: [
    {rank:1,icon:'🐊',color:'#6aa86a',name:'River Croc'},
    {rank:3,icon:'🦷',color:'#558855',name:'Iron Jaw'},
    {rank:5,icon:'🐊',color:'#336644',name:'Ancient Crocodile'},
    {rank:7,icon:'🦖',color:'#225533',name:'Apex Predator'},
    {rank:9,icon:'🌊',color:'#00ffaa',name:'True Marsh God'},
  ],
  dino: [
    {rank:1,icon:'🦖',color:'#7a8a3a',name:'Young Tyrant'},
    {rank:3,icon:'🦕',color:'#8a7a2a',name:'Raging Dino'},
    {rank:5,icon:'💥',color:'#aa8800',name:'Tyrant Rex'},
    {rank:7,icon:'⚡',color:'#cc9900',name:'Thunder Titan'},
    {rank:9,icon:'🌋',color:'#ffaa00',name:'True Tyrant God'},
  ],
  wolf: [
    {rank:1,icon:'🐺',color:'#a0a0a0',name:'Young Wolf'},
    {rank:3,icon:'🐺',color:'#888888',name:'Pack Leader'},
    {rank:5,icon:'🦊',color:'#c06020',name:'War Wolf'},
    {rank:7,icon:'🌕',color:'#ff8844',name:'Fenrir'},
    {rank:9,icon:'☄️',color:'#ffcc44',name:'True Beast God'},
  ],
  longSnake: [
    {rank:1,icon:'🐍',color:'#88e0ff',name:'River Jiao'},
    {rank:3,icon:'🐲',color:'#66ccff',name:'Sky Jiao'},
    {rank:5,icon:'🐉',color:'#44aaff',name:'Thunder Jiao'},
    {rank:7,icon:'🌊',color:'#2288ff',name:'Sea Dragon'},
    {rank:9,icon:'⛈️',color:'#aaccff',name:'True Dragon God'},
  ],
  eagle: [
    {rank:1,icon:'🦅',color:'#cce0ff',name:'Young Eagle'},
    {rank:3,icon:'🦅',color:'#aaccff',name:'Sky Hunter'},
    {rank:5,icon:'⚡',color:'#88aaff',name:'Storm Eagle'},
    {rank:7,icon:'🌩️',color:'#6688ff',name:'Thunder Hawk'},
    {rank:9,icon:'🌟',color:'#ffffff',name:'True Sky God'},
  ],
  owl: [
    {rank:1,icon:'🦉',color:'#aabbcc',name:'Young Owl'},
    {rank:3,icon:'🦉',color:'#889aab',name:'Shadow Owl'},
    {rank:5,icon:'👁️',color:'#668899',name:'Death Watcher'},
    {rank:7,icon:'🌑',color:'#445566',name:'Void Watcher'},
    {rank:9,icon:'☠️',color:'#aaaacc',name:'True Night God'},
  ],
  bat: [
    {rank:1,icon:'🦇',color:'#9a76d0',name:'Little Bat'},
    {rank:3,icon:'🦇',color:'#7a5ab0',name:'Blood Bat'},
    {rank:5,icon:'🧛',color:'#5a3e90',name:'Vampire Lord'},
    {rank:7,icon:'👹',color:'#3a2270',name:'Demon Bat'},
    {rank:9,icon:'☠️',color:'#cc88ff',name:'Undead God'},
  ],
  shark: [
    {rank:1,icon:'🦈',color:'#88c0ff',name:'Young Shark'},
    {rank:3,icon:'🦈',color:'#6699ff',name:'Blood Shark'},
    {rank:5,icon:'⚔️',color:'#4477ff',name:'Apex Shark'},
    {rank:7,icon:'🌊',color:'#2255ff',name:'Deep Terror'},
    {rank:9,icon:'🌀',color:'#aaddff',name:'True Sea God'},
  ],
  eel: [
    {rank:1,icon:'🐍',color:'#aaff88',name:'River Eel'},
    {rank:3,icon:'⚡',color:'#88ff44',name:'Thunder Eel'},
    {rank:5,icon:'🌩️',color:'#66ee00',name:'Storm Eel'},
    {rank:7,icon:'🔮',color:'#44cc00',name:'Void Serpent'},
    {rank:9,icon:'🌪️',color:'#00ff88',name:'True Storm God'},
  ],
  scorpion: [
    {rank:1,icon:'🦂',color:'#cc8844',name:'Young Scorpion'},
    {rank:3,icon:'🦂',color:'#aa6622',name:'Sand Stalker'},
    {rank:5,icon:'☠️',color:'#884400',name:'Plague Scorpion'},
    {rank:7,icon:'💀',color:'#662200',name:'Death Scorpion'},
    {rank:9,icon:'🌑',color:'#ff4400',name:'True Plague God'},
  ],
};
function getRankForm(c){
  const forms = RANK_FORMS[c.species];
  if (!forms) return null;
  let form = forms[0];
  for (const f of forms) if (c.rank >= f.rank) form = f;
  return form;
}

function getNextRankForm(c){
  const forms = RANK_FORMS[c.species];
  if (!forms) return null;
  for (const f of forms) if (f.rank > c.rank) return f;
  return null;
}

function getNextEvolutionPreview(c){
  const form = getNextRankForm(c);
  if (!form) return null;
  return {
    form,
    targetRank: form.rank,
    qiNeed: Math.max(0, (QI_THR[form.rank-1]||0) - (c.qi||0)),
  };
}

function getFirstHuntTarget(){
  if (!G.player) return null;
  let best = null;
  let bestD = Infinity;
  for (const e of G.enemies){
    if (!e || e.hp<=0 || e._dead) continue;
    if ((e.rank||1) > 2) continue;
    const d = dist(G.player, e);
    if (d < bestD){
      bestD = d;
      best = e;
    }
  }
  return best;
}

// =====================================================================
// v2.5.0: 形態圖鑑（盲盒收集驅動）+ 運行指標（留存埋點）
// =====================================================================
const EVO_FORMS_KEY = 'evo_forms_seen';
const EVO_METRICS_KEY = 'evo_run_metrics';

function getFormsSeen(){
  try { return JSON.parse(localStorage.getItem(EVO_FORMS_KEY)||'{}') || {}; } catch(e){ return {}; }
}
function totalFormsCount(){
  let n = 0;
  for (const k in RANK_FORMS) n += RANK_FORMS[k].length;
  return n;
}
function formsDiscoveredCount(){
  const s = getFormsSeen();
  let n = 0; for (const k in s) if (s[k]) n++;
  return n;
}
function markFormSeen(species, rank){
  try {
    const s = getFormsSeen();
    const key = species+':'+rank;
    if (s[key]) return false;
    s[key] = 1;
    localStorage.setItem(EVO_FORMS_KEY, JSON.stringify(s));
    return true;
  } catch(e){ return false; }
}

function getMetrics(){
  try {
    const m = JSON.parse(localStorage.getItem(EVO_METRICS_KEY)||'null');
    if (m) return m;
  } catch(e){}
  return { runs:0, deaths:0, restarts:0, totalPlay:0, firstKillSum:0, firstKillN:0, firstEvoSum:0, firstEvoN:0, maxRankAchieved:0, sharesClicked:0, revivesUsed:0, lastPlayed:0 };
}
function saveMetrics(m){ try { localStorage.setItem(EVO_METRICS_KEY, JSON.stringify(m)); } catch(e){} }
function bumpMetric(key, val){
  const m = getMetrics();
  m[key] = (m[key]||0) + (val||1);
  m.lastPlayed = Date.now();
  saveMetrics(m);
}
function recordFirstKillTime(t){
  const m = getMetrics();
  m.firstKillSum = (m.firstKillSum||0) + t;
  m.firstKillN = (m.firstKillN||0) + 1;
  saveMetrics(m);
}
function recordFirstEvoTime(t){
  const m = getMetrics();
  m.firstEvoSum = (m.firstEvoSum||0) + t;
  m.firstEvoN = (m.firstEvoN||0) + 1;
  saveMetrics(m);
}

// Early-game qi multiplier — guarantees first big evolution (tier 3) within 60-90s
function earlyQiMultiplier(){
  const t = G.time || 0;
  if (t < 30) return 2.5;
  if (t < 60) return 1.8;
  if (t < 90) return 1.3;
  return 1.0;
}

// =====================================================================
// 權柄（巨型 AoE，必須超強）
// =====================================================================
const AUTHORITIES = [
  { id:'fire',    name:'Pyre Authority',  color:'#ff5530', icon:'🔥', cd:14,
    desc:'Fire rain: 240 dmg + 40 DOT x 6s' },
  { id:'frost',   name:'Frost Authority',  color:'#88e0ff', icon:'❄️', cd:16,
    desc:'Freeze all 6s, 120 dmg' },
  { id:'thunder', name:'Thunder Authority',  color:'#fff080', icon:'⚡', cd:14,
    desc:'30-jump chain lightning, 180 dmg each' },
  { id:'gale',    name:'Storm Authority',  color:'#aaffcc', icon:'🌪️', cd:12,
    desc:'600r knock-up + 100 dmg + 4s slow' },
  { id:'life',    name:'Life Authority',  color:'#80ff80', icon:'💚', cd:30,
    desc:'Full heal + perm +100 HP + 60s regen 12/s' },
  { id:'titan',   name:'Titan Authority',  color:'#ffaa30', icon:'💪', cd:25,
    desc:'30s Size x2.2 ATK x2.5 DEF x2' },
  { id:'time',    name:'Time Authority',  color:'#cc88ff', icon:'⏳', cd:30,
    desc:'Freeze all 8s + perm +10 min lifespan' },
  { id:'void',    name:'Rift Authority',  color:'#7a00cc', icon:'🌌', cd:22,
    desc:'1200r rift: pull + 300 true dmg + tear 8s' },
  { id:'omni',    name:'Starfall Authority',  color:'#ffdd66', icon:'☄️', cd:40,
    desc:'Reveal map 12s + 800 boss dmg + Qi +50% 90s' },
];

// =====================================================================
// 地形
// =====================================================================
const BIOMES = {
  plain:  { name:'Plains', color:'#3a4a2a' },
  forest: { name:'Forest', color:'#1a3520' },
  desert: { name:'Desert', color:'#aa9050' },
  swamp:  { name:'Swamp', color:'#3a4530' },
  water:  { name:'Waters', color:'#1f3a55' },
  mtn:    { name:'Mountains', color:'#555560' },
  snow:   { name:'Snowfields', color:'#aac0d0' },
  end:    { name:'Lands End', color:'#1a0a28' },
  starsea:{ name:'Sea of Stars', color:'#0c1838' },  // v1.1.0 環帶生態：星辰外洋
};

// =====================================================================
// 道具
// =====================================================================
const PICKUPS = [
  { id:'spirit',   name:'Qi',     color:'#bb88ff', icon:'✦', rare:false, weight:60, qi:3 },
  { id:'bigspirit',name:'Qi Orb',   color:'#dd99ff', icon:'✧', rare:true,  weight:8,  qi:18 },
  { id:'heal',     name:'Healing Fruit',   color:'#ff5566', icon:'❤', rare:false, weight:25, heal:60 },
  { id:'bighp',    name:'Blood Pill',   color:'#ff2244', icon:'♥', rare:true,  weight:5,  bighp:80 },
  { id:'sta',      name:'Stamina Fruit',   color:'#7fd07f', icon:'⚡', rare:false, weight:20, sta:50 },
  { id:'zhenyuan', name:'True Essence Pill',   color:'#ffd66b', icon:'◆', rare:true,  weight:5,  zy:0.15 },
  { id:'daohen',   name:'Dao Trace Shard', color:'#ddccff', icon:'◇', rare:true,  weight:5,  dh:0.15 },
  { id:'cdreset',  name:'Purity Pearl',   color:'#aaffff', icon:'○', rare:true,  weight:6,  cdreset:true },
  { id:'lifegem',  name:'Lifespan Crystal',   color:'#cc88ff', icon:'∞', rare:true,  weight:4,  life:90 },
];
function weightedPickup(){
  const t=PICKUPS.reduce((s,p)=>s+p.weight,0); let r=Math.random()*t;
  for (const p of PICKUPS){ if ((r-=p.weight)<=0) return p; }
  return PICKUPS[0];
}

// =====================================================================
// Util
// =====================================================================
function rand(a,b){ return a + Math.random()*(b-a); }
function dist2(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return dx*dx+dy*dy; }
function dist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function angTo(from,to){ return Math.atan2(to.y-from.y, to.x-from.x); }
function logMsg(msg, cls=''){
  const el = document.getElementById('log'); if (!el) return;
  const d = document.createElement('div'); d.className = 'line '+cls; d.textContent = msg;
  el.appendChild(d); while (el.childNodes.length > 12) el.removeChild(el.firstChild);
}

// =====================================================================
// 遊戲狀態
// =====================================================================
const G = {
  player:null, enemies:[], minions:[], projectiles:[], pickups:[], spirits:[], authorities:[],
  particles:[], floats:[], shockwaves:[], hazards:[],
  qiSprings:[], rifts:[], stars:[], nebula:[], tendrils:[],
  terrain:null, cam:{x:0,y:0,tx:0,ty:0,shake:0,flash:0,flashColor:'#fff',hitFlash:0},
  time:0, started:false, dead:false, won:false,
  selectedSpecies:null, msg:'', killFeed:[], leaderboard:[], errorCount:0, lastError:'',
  soundOn:true, lastHitTime:0, deathBy:'',
  killStreak:0, streakBannerT:0, streakBannerText:'', streakBannerColor:'#ff8800',
  evoReveal:null,
  firstHunt:null,
  fps:60, frameAcc:0, frameN:0, mapOpen:false,
  bosses:[], bossSpawnT:240, bossDefeated:0,
  miniboss:null, minibossSpawnT:180, miniDefeated:0,
  event:null, eventCdT:120,  // Stars Align
  stage:1, stageBannerT:0, stageBannerText:'', stageBannerSub:'',
  revealT:0, pingX:0, pingY:0, pingT:0,
  timeline:[],  // 死亡時間軸
  tutorialT:0, tutorialStep:0,
  visited:null, visitedCellSize:200, visitedRadius:5,
  _nidSeq:0, _saveTimer:0, paused:false, _firstAdShown:false,
  // v1.9.0: only ONE Seq 0 (rank 19) per path may exist at any time. Maps path -> creature reference.
  thrones: { human:null, dragon:null, beast:null, bird:null, fish:null, insect:null },
  // v2.5.0: per-run metrics tracking (logged once into localStorage via recordFirst*Time)
  _metricsLogged: { firstKill:false, firstEvo:false },
  _runStartT: 0,
};
const FAKE_NAMES = ['Witch','Mystic Name','Brahman','Red Lord','Hermit','Spear of Society','Dark Philosopher','Sun','High Dyke','Trance','Rule','Deceiver','Hidden Lord','Reverberation','Conductor','Jiao One','Black Night','Student','Void Reducer','Elder Day','Devourer','Joy','Falsehood','Flame Tongue','Phantom Light','Kunlun','Penguin','Apostle of Flame','Medium','King'];
function randomName(){ return FAKE_NAMES[(Math.random()*FAKE_NAMES.length)|0]; }

// =====================================================================
// 地形
// =====================================================================
function generateTerrain(){
  const cols = Math.ceil(WORLD.w / TILE);
  const rows = Math.ceil(WORLD.h / TILE);
  const map = [];
  for (let y=0;y<rows;y++){
    const row=[];
    for (let x=0;x<cols;x++){
      const cx=x*TILE+TILE/2, cy=y*TILE+TILE/2;
      const dxc=cx-WORLD.w/2, dyc=cy-WORLD.h/2;
      const dc=Math.hypot(dxc,dyc);
      let b;
      if (dc < 600) b='end';
      else if (dc > 5500 && dc < 6800) b='starsea';  // v1.1.0 星海環帶（環繞外洋）
      else {
        // 區域偏好
        const ang = Math.atan2(dyc,dxc);
        const sec = ((ang+Math.PI)/(Math.PI*2)*7)|0;
        b = ['plain','forest','desert','swamp','water','mtn','snow'][sec];
        // 一點隨機
        if (Math.random()<0.18) b = ['plain','forest','desert','swamp','water','mtn','snow'][(Math.random()*7)|0];
      }
      row.push(b);
    }
    map.push(row);
  }
  G.terrain = { cols, rows, map };
  // 預建小地圖快取（避免首幀黑屏 / 畫面遗失）
  try {
    const SCALE = 8; // 放大快取避免伸展時厚重像素化
    const off = document.createElement('canvas');
    off.width = cols * SCALE; off.height = rows * SCALE;
    const octx = off.getContext('2d');
    for (let y=0;y<rows;y++) for (let x=0;x<cols;x++){
      const b = map[y][x];
      octx.fillStyle = BIOMES[b].color;
      octx.fillRect(x*SCALE, y*SCALE, SCALE, SCALE);
    }
    G.terrain.miniCache = off;
  } catch(e){ console.warn('[miniCache build]', e); }

  // 預建每個 BIOME 的 256x256 紋理快取 — 取代每幀 sub-cell 循環，大幅提升 FPS
  try {
    G.terrain.biomeTex = {};
    for (const bk of Object.keys(BIOMES)){
      const tx = document.createElement('canvas');
      tx.width = TILE; tx.height = TILE;
      const tctx = tx.getContext('2d');
      const base = BIOMES[bk].color;
      tctx.fillStyle = base; tctx.fillRect(0,0,TILE,TILE);
      const SUB = 8, ss = TILE/SUB;
      let seed = (bk.charCodeAt(0)*2654435761) >>> 0;
      for (let sy=0; sy<SUB; sy++){
        for (let sx=0; sx<SUB; sx++){
          seed = (seed*1664525 + 1013904223) >>> 0;
          const v = ((seed>>>16) & 0x1f) - 16;
          tctx.fillStyle = shadeColor(base, Math.floor(v*0.6));
          tctx.fillRect(sx*ss, sy*ss, ss+0.5, ss+0.5);
        }
      }
      // v0.8.0: Lands End額外灑星，避免一整片黑屏
      // v1.1.0: Sea of Stars也灑滿星（更多更亮）
      if (bk==='starsea'){
        for (let i=0;i<60;i++){
          seed = (seed*1664525 + 1013904223) >>> 0;
          const px = (seed>>>0) % TILE;
          seed = (seed*1664525 + 1013904223) >>> 0;
          const py = (seed>>>0) % TILE;
          seed = (seed*1664525 + 1013904223) >>> 0;
          const rr = 0.6 + ((seed>>>16) & 0x7) * 0.4;
          tctx.fillStyle = ['#ffd0ff','#80c8ff','#ffffff','#bba0ff','#80ffe0'][(seed>>>4)%5];
          tctx.globalAlpha = 0.55 + ((seed>>>8)&0x7)/14;
          tctx.beginPath(); tctx.arc(px, py, rr, 0, Math.PI*2); tctx.fill();
        }
        tctx.globalAlpha = 1;
      }
      if (bk==='end'){
        for (let i=0;i<24;i++){
          seed = (seed*1664525 + 1013904223) >>> 0;
          const px = (seed>>>0) % TILE;
          seed = (seed*1664525 + 1013904223) >>> 0;
          const py = (seed>>>0) % TILE;
          seed = (seed*1664525 + 1013904223) >>> 0;
          const rr = 0.5 + ((seed>>>16) & 0x3) * 0.4;
          tctx.fillStyle = ['#ccaaff','#aaccff','#ffccee','#ffffff'][(seed>>>4)&3];
          tctx.globalAlpha = 0.5 + ((seed>>>8)&0x7)/16;
          tctx.beginPath(); tctx.arc(px, py, rr, 0, Math.PI*2); tctx.fill();
        }
        tctx.globalAlpha = 1;
      }
      // v2.8.0: per-biome decorative scenery (baked once into the tile, zero per-frame cost)
      // D2 retention killer fix — map no longer feels like flat color blocks
      const _seedRand = ()=>{ seed = (seed*1664525 + 1013904223) >>> 0; return (seed>>>0); };
      const _rndF = ()=>{ return (_seedRand() & 0xffff) / 0xffff; };
      if (bk==='plain'){
        // grass tufts: short green strokes
        for (let i=0;i<40;i++){
          const px = _rndF()*TILE, py = _rndF()*TILE;
          const h = 3 + _rndF()*4;
          tctx.strokeStyle = _rndF()<0.5 ? '#5a7a3a' : '#6a8a4a';
          tctx.globalAlpha = 0.6 + _rndF()*0.3;
          tctx.lineWidth = 1;
          tctx.beginPath(); tctx.moveTo(px, py); tctx.lineTo(px + (_rndF()-0.5)*2, py-h); tctx.stroke();
        }
        // occasional small flowers
        for (let i=0;i<6;i++){
          const px = _rndF()*TILE, py = _rndF()*TILE;
          tctx.fillStyle = ['#ffee66','#ff88aa','#ffffff','#aaccff'][_seedRand()&3];
          tctx.globalAlpha = 0.9;
          tctx.beginPath(); tctx.arc(px, py, 1.4, 0, Math.PI*2); tctx.fill();
        }
        tctx.globalAlpha = 1;
      } else if (bk==='forest'){
        // dark tree canopies
        for (let i=0;i<14;i++){
          const px = _rndF()*TILE, py = _rndF()*TILE;
          const r = 6 + _rndF()*10;
          tctx.fillStyle = _rndF()<0.5 ? '#0d2615' : '#1a3a22';
          tctx.globalAlpha = 0.85;
          tctx.beginPath(); tctx.arc(px, py, r, 0, Math.PI*2); tctx.fill();
          // trunk highlight
          tctx.fillStyle = '#3a5230';
          tctx.globalAlpha = 0.5;
          tctx.beginPath(); tctx.arc(px-r*0.25, py-r*0.25, r*0.3, 0, Math.PI*2); tctx.fill();
        }
        // tiny ferns
        for (let i=0;i<20;i++){
          const px = _rndF()*TILE, py = _rndF()*TILE;
          tctx.strokeStyle = '#4a6a3a'; tctx.globalAlpha = 0.55; tctx.lineWidth = 1;
          tctx.beginPath(); tctx.moveTo(px, py); tctx.lineTo(px+(_rndF()-0.5)*4, py-3); tctx.stroke();
        }
        tctx.globalAlpha = 1;
      } else if (bk==='desert'){
        // dune ripple lines
        tctx.strokeStyle = '#c0a060'; tctx.globalAlpha = 0.35; tctx.lineWidth = 1;
        for (let i=0;i<10;i++){
          const yy = _rndF()*TILE;
          tctx.beginPath();
          tctx.moveTo(0, yy);
          for (let xx=0; xx<=TILE; xx+=16) tctx.lineTo(xx, yy + Math.sin(xx*0.05 + i)*3);
          tctx.stroke();
        }
        // scattered pebbles
        for (let i=0;i<18;i++){
          const px = _rndF()*TILE, py = _rndF()*TILE;
          tctx.fillStyle = _rndF()<0.5 ? '#8a7038' : '#a08850';
          tctx.globalAlpha = 0.6;
          tctx.beginPath(); tctx.arc(px, py, 1 + _rndF()*1.5, 0, Math.PI*2); tctx.fill();
        }
        // rare cactus silhouette
        if (_rndF()<0.3){
          const cx = _rndF()*TILE, cy = _rndF()*TILE;
          tctx.fillStyle = '#3a6a3a'; tctx.globalAlpha = 0.8;
          tctx.fillRect(cx-1.5, cy-8, 3, 12);
          tctx.fillRect(cx-4, cy-4, 2.5, 5);
          tctx.fillRect(cx+1.5, cy-5, 2.5, 6);
        }
        tctx.globalAlpha = 1;
      } else if (bk==='swamp'){
        // lily pads + muck pools
        for (let i=0;i<10;i++){
          const px = _rndF()*TILE, py = _rndF()*TILE;
          const r = 4 + _rndF()*5;
          tctx.fillStyle = '#2a3a1a'; tctx.globalAlpha = 0.7;
          tctx.beginPath(); tctx.arc(px, py, r, 0, Math.PI*2); tctx.fill();
          tctx.fillStyle = '#5a7a3a'; tctx.globalAlpha = 0.5;
          tctx.beginPath(); tctx.arc(px-r*0.2, py-r*0.2, r*0.5, 0, Math.PI*2); tctx.fill();
        }
        // bubbles
        for (let i=0;i<14;i++){
          const px = _rndF()*TILE, py = _rndF()*TILE;
          tctx.strokeStyle = '#7a9a4a'; tctx.globalAlpha = 0.4; tctx.lineWidth = 0.8;
          tctx.beginPath(); tctx.arc(px, py, 1.2 + _rndF(), 0, Math.PI*2); tctx.stroke();
        }
        tctx.globalAlpha = 1;
      } else if (bk==='water'){
        // wave caps + foam
        tctx.strokeStyle = '#88c0e0'; tctx.lineWidth = 1;
        for (let i=0;i<8;i++){
          const yy = _rndF()*TILE;
          const xx = _rndF()*TILE;
          const w = 6 + _rndF()*10;
          tctx.globalAlpha = 0.5 + _rndF()*0.3;
          tctx.beginPath();
          tctx.arc(xx, yy, w, Math.PI*1.1, Math.PI*1.9);
          tctx.stroke();
        }
        // foam dots
        for (let i=0;i<22;i++){
          const px = _rndF()*TILE, py = _rndF()*TILE;
          tctx.fillStyle = '#cce8ff'; tctx.globalAlpha = 0.4;
          tctx.beginPath(); tctx.arc(px, py, 0.8, 0, Math.PI*2); tctx.fill();
        }
        tctx.globalAlpha = 1;
      } else if (bk==='mtn'){
        // rocky crags — gray polygons
        for (let i=0;i<10;i++){
          const px = _rndF()*TILE, py = _rndF()*TILE;
          const r = 5 + _rndF()*10;
          tctx.fillStyle = _rndF()<0.5 ? '#3a3a44' : '#4a4a55';
          tctx.globalAlpha = 0.85;
          tctx.beginPath();
          const sides = 5 + (_seedRand()&3);
          for (let k=0;k<sides;k++){
            const a = (k/sides)*Math.PI*2;
            const rr = r * (0.7 + _rndF()*0.5);
            const xx = px + Math.cos(a)*rr;
            const yy = py + Math.sin(a)*rr;
            if (k===0) tctx.moveTo(xx,yy); else tctx.lineTo(xx,yy);
          }
          tctx.closePath(); tctx.fill();
          // highlight
          tctx.fillStyle = '#7a7a88'; tctx.globalAlpha = 0.5;
          tctx.beginPath(); tctx.arc(px-r*0.3, py-r*0.3, r*0.35, 0, Math.PI*2); tctx.fill();
        }
        tctx.globalAlpha = 1;
      } else if (bk==='snow'){
        // ice crystals + snowflakes
        for (let i=0;i<26;i++){
          const px = _rndF()*TILE, py = _rndF()*TILE;
          tctx.strokeStyle = '#ffffff'; tctx.globalAlpha = 0.7 + _rndF()*0.25; tctx.lineWidth = 1;
          tctx.beginPath();
          for (let k=0;k<3;k++){
            const a = k*Math.PI/3;
            const l = 2 + _rndF()*1.5;
            tctx.moveTo(px - Math.cos(a)*l, py - Math.sin(a)*l);
            tctx.lineTo(px + Math.cos(a)*l, py + Math.sin(a)*l);
          }
          tctx.stroke();
        }
        // pale blue shadow patches
        for (let i=0;i<6;i++){
          const px = _rndF()*TILE, py = _rndF()*TILE;
          tctx.fillStyle = '#88aac8'; tctx.globalAlpha = 0.18;
          tctx.beginPath(); tctx.arc(px, py, 6 + _rndF()*8, 0, Math.PI*2); tctx.fill();
        }
        tctx.globalAlpha = 1;
      }
      G.terrain.biomeTex[bk] = tx;
    }
  } catch(e){ console.warn('[biomeTex]',e); G.terrain.biomeTex = null; }
}


// =====================================================================
// 克蘇魯星空 + 邊界觸手
// =====================================================================
function generateCosmos(){
  G.stars = [];
  let seed = 0xC05;
  const rng = ()=>{ seed = (seed*1664525 + 1013904223) >>> 0; return seed/4294967295; };
  for (let i=0;i<600;i++){
    G.stars.push({
      x: -WORLD.w*0.5 + rng()*WORLD.w*2,
      y: -WORLD.h*0.5 + rng()*WORLD.h*2,
      r: 0.5 + rng()*1.8,
      tw: 0.5 + rng()*2,
      ph: rng()*Math.PI*2,
    });
  }
  G.nebula = [];
  const nebColors = ['#aa44ff','#4488ff','#ff4488','#44ffaa','#ffaa44'];
  for (let i=0;i<10;i++){
    G.nebula.push({
      x: -WORLD.w*0.3 + rng()*WORLD.w*1.6,
      y: -WORLD.h*0.3 + rng()*WORLD.h*1.6,
      r: 400 + rng()*600,
      color: nebColors[i%nebColors.length],
    });
  }
  G.tendrils = [];
  for (const side of ['top','bottom','left','right']){
    for (let i=0;i<8;i++){
      const along = (side==='top'||side==='bottom') ? WORLD.w : WORLD.h;
      G.tendrils.push({
        side, pos: (i+0.5)/8*along,
        len: 200 + Math.random()*400,
        ph: Math.random()*Math.PI*2,
      });
    }
  }
}


// =====================================================================
// 世界 Boss · Elder Day · Star-Touching Eye (v0.9.0) — v2.9.0 expanded to 5 古神 rotation
// =====================================================================
// v2.9.0: Each 古神 has unique visual silhouette + signature attack flavor.
// Rotates each spawn so players see fresh art every 5 minutes (retention + screenshot variety).
const BOSS_POOL = [
  // v3.5.0: outer gods buffed ~3x HP / 2x ATK — they should feel like a real raid threat
  { type:'eye',     name:'Elder Day · Star-Touching Eye',     color:'#aa44ff', hp:26000, atk:160, accent:'#ff44aa' },
  { type:'maw',     name:'Ravager · Thousand-Mouth Devourer', color:'#ff4444', hp:30000, atk:185, accent:'#ffaa30' },
  { type:'crown',   name:'Sovereign · Frozen-Abyss Crown',    color:'#66ccff', hp:28000, atk:150, accent:'#ffffff' },
  { type:'phoenix', name:'Ashen Phoenix · Cycle-Breaker',     color:'#ffaa30', hp:27000, atk:175, accent:'#ff3344' },
  { type:'serpent', name:'Nine-Headed Verdant Serpent',       color:'#44dd66', hp:29000, atk:165, accent:'#aa44ff' },
];
// v3.5.1: returns the closest living outer god to pos (for skills / melee / projectiles)
function nearestBoss(pos){
  let best=null, bd=Infinity;
  for (const b of G.bosses){ if (!b||b.hp<=0) continue; const d=Math.hypot(b.x-(pos?pos.x:0),b.y-(pos?pos.y:0)); if(d<bd){bd=d;best=b;} }
  return best;
}
function spawnBoss(){
  const cx=WORLD.w/2, cy=WORLD.h/2;
  // v2.9.0: cycle through pool (avoid repeating last one)
  let pick;
  do { pick = BOSS_POOL[(Math.random()*BOSS_POOL.length)|0]; } while (G._lastBossType && pick.type===G._lastBossType && BOSS_POOL.length>1);
  G._lastBossType = pick.type;
  const nb = {
    isBoss:true, type:pick.type, name:pick.name,
    x:cx, y:cy, vx:0, vy:0, r:80,
    hp:pick.hp, maxHp:pick.hp, atk:pick.atk,
    atkCdT:0, projT:4, eyeT:0, phase:1,
    color:pick.color, accent:pick.accent,
  };
  G.bosses.push(nb);
  pushKillFeed('☄ '+pick.name+' descends ☄', pick.color);
  logMsg('★★★ '+pick.name+' arrives at map center — approach with caution ★★★','promote');
  try{ playSound('auth'); flash(pick.color,0.6); shake(30); }catch(e){}
  // v2.9.0: 2.4-second cinematic intro splash (loads AI-generated art if present)
  G._bossIntro = { t: 2.4, type: pick.type, name: pick.name, color: pick.color };
  try { _loadBossArt(pick.type); } catch(e){}
}
// v2.9.0: lazy-load AI-generated boss splash PNG. Falls back to in-engine drawing if missing.
const _bossArtCache = {};
function _loadBossArt(type){
  if (_bossArtCache[type] !== undefined) return _bossArtCache[type];
  _bossArtCache[type] = null;
  const img = new Image();
  img.onload = ()=>{ _bossArtCache[type] = img; };
  img.onerror = ()=>{ _bossArtCache[type] = false; };  // false = tried + failed, don't retry
  img.src = 'assets/bosses/' + type + '.png';
  return null;
}
function updateBoss(b, dt){
  b.eyeT += dt;
  // 二階段：低於 50% 加速
  if (b.hp < b.maxHp*0.5 && b.phase===1){
    b.phase = 2; pushKillFeed('☄ Star-Touching Eye awakens','#ff44aa');
    try{ flash('#ff44aa',0.5); shake(20); }catch(e){}
  }
  // 緩慢追玩家
  if (G.player){
    const dx = G.player.x - b.x, dy = G.player.y - b.y, d = Math.hypot(dx,dy)||1;
    const sp = b.phase===2 ? 40 : 22;
    b.x += (dx/d) * sp * dt;
    b.y += (dy/d) * sp * dt;
    // 撞擊近戰
    if (d < b.r + G.player.r + 10){
      b.atkCdT -= dt;
      if (b.atkCdT<=0){
        b.atkCdT = 0.8;
        dealDamage(b, G.player, b.atk, '#aa44ff');
        try{ shake(8); G.cam.hitFlash = Math.max(G.cam.hitFlash, 0.4); }catch(e){}
        if (!(G.player.invuln>0)) G.player.sanity = Math.max(0, G.player.sanity - 5);
      }
    }
    // 觸手彈幕（每 4s 一次 12 顆）
    b.projT -= dt;
    if (b.projT<=0){
      b.projT = b.phase===2 ? 2.4 : 4;
      const N = b.phase===2 ? 16 : 12;
      for (let i=0;i<N;i++){
        const a = i/N*Math.PI*2 + Math.random()*0.1;
        G.projectiles.push({x:b.x,y:b.y, vx:Math.cos(a)*260, vy:Math.sin(a)*260, life:3, r:8, dmg:35, hostile:true, color:'#aa44ff', owner:b, hit:new Set(), pierce:1});
      }
      try{ playSound('auth'); }catch(e){}
    }
  }
}
function onBossDeath(b){
  if (G.player){
    G.player.qi += 1500;
    G.player.q.bossKilled = (G.player.q.bossKilled||0) + 1;
    G.player.sanity = Math.min(G.player.maxSanity, G.player.sanity + 40);
    addFloat(G.player.x, G.player.y-40, 'Slay the Outer God! +1500 XP', '#ffd66b', 22, 2.5);
    pushKillFeed('★★ You defeated ['+b.name+'】 ★★','#ffd66b');
    logMsg('★★★ Outer God slain: +1500 XP + SAN restored ★★★','promote');
    try{ playSound('promote'); flash('#ffffff',0.9); shake(30); }catch(e){}
    G.bossDefeated++;
    // v3.2.0: max happyTime signal — boss kill is peak engagement
    try { if (window.SDK && SDK.happyTime) SDK.happyTime(1.0); } catch(e){}
    // v3.4.0: midroll ad on boss-kill euphoria (SDK throttles to >=120s gap, so safe-spam)
    try { if (window.SDK && SDK.ready && SDK.commercialBreak) SDK.commercialBreak(); } catch(e){}
    G.timeline.push({t:G.time, text:'Slay Star-Touching Eye'});
    // 掉一個隨機權柄
    // v2.1.0: only restore a globally-missing authority (world-unique)
    try {
      const heldIds = new Set([
        ...G.authorities.map(x=>x.id),
        ...((G.player && G.player.authoritySlots) ? G.player.authoritySlots.map(x=>x.id) : [])
      ]);
      const missing = AUTHORITIES.filter(a=>!heldIds.has(a.id));
      if (missing.length){
        const a = missing[(Math.random()*missing.length)|0];
        G.authorities.push({...a, x:b.x, y:b.y, pulse:0, droppedT:G.time});
        pushKillFeed('★ Outer God restored Authority: '+a.name, a.color);
      }
    } catch(e){}
  }
  for (let i=0;i<160;i++) G.particles.push({x:b.x,y:b.y,vx:rand(-600,600),vy:rand(-600,600),life:2,color:'#aa44ff',r:4});
  G.shockwaves.push({x:b.x,y:b.y,r:0,max:800,life:1.5,color:'#aa44ff'});
}
function drawBoss(){
  for (const b of G.bosses){
  if (!b || b.hp<=0) continue;
  const pul = 1 + Math.sin(b.eyeT*3)*0.1;
  const col = b.color || '#aa44ff';
  const acc = b.accent || '#ff44aa';
  // v2.9.0: outer aura (all bosses) — 4 stacked radial gradient rings for halo
  for (let i=4;i>=1;i--){
    const g = ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*pul*(2+i*0.45));
    g.addColorStop(0, col + ['77','55','33','15'][i-1]);
    g.addColorStop(1, '#00000000');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*pul*(2+i*0.45),0,Math.PI*2); ctx.fill();
  }
  // v2.9.0: rune orbit ring (signature for all 古神 — gold mystic glyphs)
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.eyeT*0.3);
  ctx.strokeStyle = '#ffd66b'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6;
  for (let i=0;i<12;i++){
    const a = (i/12)*Math.PI*2;
    const rr = b.r*pul*1.7;
    const x1 = Math.cos(a)*rr, y1 = Math.sin(a)*rr;
    ctx.beginPath(); ctx.arc(x1, y1, 4 + Math.sin(b.eyeT*4+i)*2, 0, Math.PI*2); ctx.stroke();
  }
  ctx.restore();

  if (b.type === 'maw'){
    // === 千口噬日：紅色裂口本體 + 旋轉牙齒環 ===
    // body
    ctx.fillStyle = '#1a0808'; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*pul,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.stroke();
    // central gaping mouth (vertical slit that pulses open)
    const openF = 0.5 + Math.sin(b.eyeT*2)*0.5;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, b.r*0.55*openF, b.r*0.85, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = acc; ctx.lineWidth = 2; ctx.stroke();
    // teeth around mouth (16 fangs)
    for (let i=0;i<16;i++){
      const a = (i/16)*Math.PI*2 + b.eyeT*0.4;
      const rr = b.r*0.85;
      const fx = b.x + Math.cos(a)*rr;
      const fy = b.y + Math.sin(a)*rr;
      const tx = b.x + Math.cos(a)*(rr-22);
      const ty = b.y + Math.sin(a)*(rr-22);
      const perp = a + Math.PI/2;
      const w = 7;
      ctx.fillStyle = '#ffeecc';
      ctx.beginPath();
      ctx.moveTo(fx + Math.cos(perp)*w, fy + Math.sin(perp)*w);
      ctx.lineTo(fx - Math.cos(perp)*w, fy - Math.sin(perp)*w);
      ctx.lineTo(tx, ty);
      ctx.closePath(); ctx.fill();
    }
    // tongues lashing out
    for (let i=0;i<4;i++){
      const a = b.eyeT*0.8 + i*Math.PI/2;
      const len = 100 + Math.sin(b.eyeT*3+i)*60;
      ctx.strokeStyle = acc; ctx.lineWidth = 6; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(b.x,b.y);
      ctx.lineTo(b.x + Math.cos(a)*len, b.y + Math.sin(a)*len);
      ctx.stroke();
    }
  } else if (b.type === 'crown'){
    // === 寒淵冠冕：藍冰六邊形 + 王冠尖刺 ===
    // hex body
    ctx.fillStyle = '#0a1838';
    ctx.beginPath();
    for (let i=0;i<6;i++){
      const a = i*Math.PI/3 + b.eyeT*0.2;
      const x = b.x + Math.cos(a)*b.r*pul;
      const y = b.y + Math.sin(a)*b.r*pul;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.stroke();
    // crown spikes (8 ice shards on top half)
    for (let i=0;i<8;i++){
      const a = -Math.PI + (i/7)*Math.PI;
      const base = b.r*pul;
      const tipLen = 50 + Math.sin(b.eyeT*1.5+i)*8;
      const bx = b.x + Math.cos(a)*base;
      const by = b.y + Math.sin(a)*base;
      const tx = b.x + Math.cos(a)*(base+tipLen);
      const ty = b.y + Math.sin(a)*(base+tipLen);
      const perp = a + Math.PI/2;
      const w = 8;
      ctx.fillStyle = acc;
      ctx.beginPath();
      ctx.moveTo(bx + Math.cos(perp)*w, by + Math.sin(perp)*w);
      ctx.lineTo(bx - Math.cos(perp)*w, by - Math.sin(perp)*w);
      ctx.lineTo(tx, ty);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
    }
    // central frost eye
    if (G.player){
      const ang = Math.atan2(G.player.y-b.y, G.player.x-b.x);
      const pr = b.r*0.35;
      const px = b.x + Math.cos(ang)*pr*0.3, py = b.y + Math.sin(ang)*pr*0.3;
      ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(px,py,pr,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px,py,pr*0.4,0,Math.PI*2); ctx.fill();
    }
    // snowflake particles orbiting
    for (let i=0;i<6;i++){
      const a = b.eyeT*0.6 + i*Math.PI/3;
      const rr = b.r*pul*1.4;
      const sx = b.x + Math.cos(a)*rr, sy = b.y + Math.sin(a)*rr;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
      for (let k=0;k<3;k++){
        const ka = k*Math.PI/3;
        ctx.beginPath();
        ctx.moveTo(sx - Math.cos(ka)*4, sy - Math.sin(ka)*4);
        ctx.lineTo(sx + Math.cos(ka)*4, sy + Math.sin(ka)*4);
        ctx.stroke();
      }
    }
  } else if (b.type === 'phoenix'){
    // === 燼羽鳳神：金紅雙翼 + 火焰拖尾 ===
    // wing sweep behind
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(Math.sin(b.eyeT*1.2)*0.15);
    const wingSpan = b.r*pul*2.4;
    // left wing
    ctx.fillStyle = '#8a1a08';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-wingSpan*0.7, -b.r*0.3, -wingSpan, b.r*0.4);
    ctx.quadraticCurveTo(-wingSpan*0.5, b.r*0.6, 0, b.r*0.2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
    // right wing
    ctx.fillStyle = '#8a1a08';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(wingSpan*0.7, -b.r*0.3, wingSpan, b.r*0.4);
    ctx.quadraticCurveTo(wingSpan*0.5, b.r*0.6, 0, b.r*0.2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
    // feather highlights — diagonal lines on wings
    ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.7;
    for (let s=-1; s<=1; s+=2){
      for (let k=1;k<=4;k++){
        const t = k/5;
        ctx.beginPath();
        ctx.moveTo(s*wingSpan*0.3, b.r*0.1);
        ctx.lineTo(s*wingSpan*t, -b.r*0.15 + k*4);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    // body — egg-shaped fiery core
    const g = ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*pul);
    g.addColorStop(0, '#ffee88'); g.addColorStop(0.5, col); g.addColorStop(1, acc);
    ctx.fillStyle = g; ctx.beginPath();
    ctx.ellipse(b.x, b.y, b.r*0.85*pul, b.r*pul, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#ffeecc'; ctx.lineWidth = 4; ctx.stroke();
    // head — small triangular beak top
    ctx.fillStyle = '#ffd66b';
    ctx.beginPath();
    ctx.moveTo(b.x, b.y - b.r*pul - 20);
    ctx.lineTo(b.x-12, b.y - b.r*pul);
    ctx.lineTo(b.x+12, b.y - b.r*pul);
    ctx.closePath(); ctx.fill();
    // eyes
    ctx.fillStyle = '#ff3344';
    ctx.beginPath(); ctx.arc(b.x-12, b.y-b.r*pul+6, 5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(b.x+12, b.y-b.r*pul+6, 5,0,Math.PI*2); ctx.fill();
    // tail flames (3 trailing streamers)
    for (let i=0;i<3;i++){
      const wob = Math.sin(b.eyeT*3+i)*15;
      ctx.strokeStyle = i===1 ? '#ffee88' : col; ctx.lineWidth = 6; ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(b.x + (i-1)*15, b.y + b.r*pul);
      ctx.quadraticCurveTo(b.x + (i-1)*30 + wob, b.y + b.r*pul + 50, b.x + (i-1)*40, b.y + b.r*pul + 120);
      ctx.stroke();
    }
  } else if (b.type === 'serpent'){
    // === 蛇王九首：中心核 + 9 條盤旋蛇頭 ===
    // central core
    ctx.fillStyle = '#0a2010'; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*0.65*pul,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke();
    // scale pattern on core
    ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
    for (let i=0;i<6;i++){
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r*0.65*pul - i*10, -Math.PI*0.7, -Math.PI*0.3);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // 9 snake heads on long necks
    for (let i=0;i<9;i++){
      const a = (i/9)*Math.PI*2 + b.eyeT*0.4;
      const necklen = 130 + Math.sin(b.eyeT*2+i*0.7)*30;
      // neck (snake-like S-curve)
      ctx.strokeStyle = '#1a4520'; ctx.lineWidth = 12; ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(b.x + Math.cos(a)*b.r*0.6*pul, b.y + Math.sin(a)*b.r*0.6*pul);
      const mid1x = b.x + Math.cos(a)*(b.r + necklen*0.4) + Math.cos(a+Math.PI/2)*15;
      const mid1y = b.y + Math.sin(a)*(b.r + necklen*0.4) + Math.sin(a+Math.PI/2)*15;
      const headx = b.x + Math.cos(a)*(b.r + necklen);
      const heady = b.y + Math.sin(a)*(b.r + necklen);
      ctx.quadraticCurveTo(mid1x, mid1y, headx, heady);
      ctx.stroke();
      // head (oval)
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(headx, heady, 18, 12, a, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = acc; ctx.lineWidth = 2; ctx.stroke();
      // glowing eye
      ctx.fillStyle = acc;
      ctx.beginPath(); ctx.arc(headx + Math.cos(a)*8, heady + Math.sin(a)*8, 3, 0, Math.PI*2); ctx.fill();
    }
  } else {
    // === 星瞳古神 (default 'eye'): 原版巨眼 ===
    ctx.fillStyle = '#0a0014'; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*pul,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke();
    if (G.player){
      const ang = Math.atan2(G.player.y-b.y, G.player.x-b.x);
      const pr = b.r*0.45;
      const px = b.x + Math.cos(ang)*pr*0.4, py = b.y + Math.sin(ang)*pr*0.4;
      ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(px,py,pr,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px,py,pr*0.4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(px,py,pr*0.18,0,Math.PI*2); ctx.fill();
    }
    for (let i=0;i<6;i++){
      const a = b.eyeT*0.6 + i*Math.PI/3;
      const x0 = b.x + Math.cos(a)*b.r*pul, y0 = b.y + Math.sin(a)*b.r*pul;
      ctx.strokeStyle = '#220033'; ctx.lineWidth = 14; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(x0,y0);
      for (let k=1;k<=5;k++){
        const f = k/5;
        const wob = Math.sin(b.eyeT*2 + i + f*4)*30*f;
        const ex = x0 + Math.cos(a)*220*f + Math.cos(a+Math.PI/2)*wob;
        const ey = y0 + Math.sin(a)*220*f + Math.sin(a+Math.PI/2)*wob;
        ctx.lineTo(ex,ey);
      }
      ctx.stroke();
    }
  }
  // 名稱 + HP 條 (shared, with golden frame)
  ctx.fillStyle = col; ctx.font = 'bold 18px sans-serif'; ctx.textAlign='center';
  ctx.shadowColor = col; ctx.shadowBlur = 12;
  ctx.fillText(b.name, b.x, b.y - b.r*pul - 36);
  ctx.shadowBlur = 0;
  const bw = 260, bh = 12;
  ctx.fillStyle = '#000a'; ctx.fillRect(b.x-bw/2, b.y-b.r*pul-26, bw, bh);
  const hg = ctx.createLinearGradient(b.x-bw/2, 0, b.x+bw/2, 0);
  hg.addColorStop(0, col); hg.addColorStop(1, acc);
  ctx.fillStyle = hg; ctx.fillRect(b.x-bw/2, b.y-b.r*pul-26, bw*(b.hp/b.maxHp), bh);
  ctx.strokeStyle='#ffd66b'; ctx.lineWidth=1.5; ctx.strokeRect(b.x-bw/2, b.y-b.r*pul-26, bw, bh);
  } // end bosses loop
}
function applyDamageToBoss(dmg, tgt){
  const b = tgt || nearestBoss(G.player);
  if (b && b.hp>0){ b.hp -= dmg; if (dmg>0) G.cam.hitFlash = Math.max(G.cam.hitFlash, 0.1); }
}


// =====================================================================
// 小 Boss · Ancient Wraith (v1.0.0)  — Era of Cultivation起循環刷新
// =====================================================================
function spawnMiniboss(){
  // 在隨機秘境位置 spawn（玩家不在的那一個）
  let spot = null;
  const candidates = G.rifts.slice().sort(()=>Math.random()-0.5);
  for (const rf of candidates){ if (!G.player || dist(rf, G.player) > 600){ spot = rf; break; } }
  if (!spot){ spot = { x: WORLD.w/2 + rand(-3000,3000), y: WORLD.h/2 + rand(-3000,3000) }; }
  G.miniboss = {
    isBoss:true, isMiniboss:true, name:'Ancient Wraith',
    x:spot.x, y:spot.y, vx:0, vy:0, r:50,
    hp:1800, maxHp:1800, atk:55,
    atkCdT:0, dashT:5, eyeT:0, color:'#66ccff',
  };
  pushKillFeed('☄ Ancient Wraith appears near a sanctum','#66ccff');
  logMsg('★ Wraith mini-boss appears! Slay for +600 XP + item rain','promote');
  try{ flash('#66ccff',0.4); shake(15); playSound('auth'); }catch(e){}
}
function updateMiniboss(b, dt){
  b.eyeT += dt;
  if (!G.player) return;
  const dx = G.player.x - b.x, dy = G.player.y - b.y, d = Math.hypot(dx,dy)||1;
  // 快速短衝
  b.dashT -= dt;
  if (b.dashT<=0 && d<800){
    b.dashT = 4;
    b.vx = dx/d*350; b.vy = dy/d*350;
    G.shockwaves.push({x:b.x,y:b.y,r:0,max:80,life:0.4,color:'#66ccff'});
  }
  b.x += b.vx*dt; b.y += b.vy*dt;
  b.vx *= 0.92; b.vy *= 0.92;
  // 普通跟蹤
  b.x += (dx/d) * 70 * dt;
  b.y += (dy/d) * 70 * dt;
  // 近戰（v1.0.1: 走 dealDamage）
  if (d < b.r + G.player.r + 8){
    b.atkCdT -= dt;
    if (b.atkCdT<=0){
      b.atkCdT = 0.7;
      dealDamage(b, G.player, b.atk, '#66ccff');
      try{ shake(5); }catch(e){}
    }
  }
}
function onMinibossDeath(b){
  if (G.player){
    G.player.qi += 600;
    G.player.sanity = Math.min(G.player.maxSanity, G.player.sanity + 15);
    addFloat(G.player.x, G.player.y-30, 'Slain Wraith! +600 XP', '#66ccff', 18, 1.8);
    pushKillFeed('★ You defeated the Wraith','#66ccff');
    G.miniDefeated = (G.miniDefeated||0) + 1;
    G.timeline.push({t:G.time, text:'Defeat the Wraith'});
  }
  // 道具雨
  for (let i=0;i<14;i++){
    const a = Math.random()*Math.PI*2, d = rand(20,140);
    const def = weightedPickup();
    G.pickups.push({...def, x:b.x+Math.cos(a)*d, y:b.y+Math.sin(a)*d, pulse:0});
  }
  for (let i=0;i<50;i++) G.particles.push({x:b.x,y:b.y,vx:rand(-300,300),vy:rand(-300,300),life:1.2,color:'#66ccff',r:3});
  G.shockwaves.push({x:b.x,y:b.y,r:0,max:400,life:1,color:'#66ccff'});
  try{ playSound('promote'); flash('#66ccff',0.5); shake(15); }catch(e){}
}
function drawMiniboss(){
  if (!G.miniboss || G.miniboss.hp<=0) return;
  const b = G.miniboss;
  const pul = 1 + Math.sin(b.eyeT*4)*0.08;
  // 鬼火光環
  const g = ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*2.4);
  g.addColorStop(0,'#66ccffaa'); g.addColorStop(1,'#66ccff00');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*2.4,0,Math.PI*2); ctx.fill();
  // 身體（飄忽人形）
  ctx.fillStyle = '#0a1a2a';
  ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r*pul*0.6, b.r*pul, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#88ccff'; ctx.lineWidth = 3; ctx.stroke();
  // 雙眼
  for (const sx of [-1,1]){
    ctx.fillStyle = '#ffffaa';
    ctx.beginPath(); ctx.arc(b.x + sx*b.r*0.18, b.y - b.r*0.3, b.r*0.1*pul, 0, Math.PI*2); ctx.fill();
  }
  // 名稱 + HP
  ctx.fillStyle = '#66ccff'; ctx.font='bold 14px sans-serif'; ctx.textAlign='center';
  ctx.fillText(b.name, b.x, b.y - b.r*pul - 24);
  const bw = 140, bh = 7;
  ctx.fillStyle = '#000a'; ctx.fillRect(b.x-bw/2, b.y-b.r*pul-18, bw, bh);
  ctx.fillStyle = '#66ccff'; ctx.fillRect(b.x-bw/2, b.y-b.r*pul-18, bw*(b.hp/b.maxHp), bh);
}

// =====================================================================
// 階段橫幅 + 世界事件 FX (v1.0.0)
// =====================================================================
function drawPingArrow(){
  if (G.pingT<=0 || !G.player) return;
  const W = window.innerWidth, H = window.innerHeight;
  const cx = W/2, cy = H/2;
  const wx = (G.pingX - G.cam.x); // 相對相機
  const wy = (G.pingY - G.cam.y);
  // 若 Ping 已在可視範圍內，不顯示箭頭
  if (Math.abs(wx) < W/2 - 80 && Math.abs(wy) < H/2 - 80) return;
  const ang = Math.atan2(wy, wx);
  const ax = cx + Math.cos(ang) * Math.min(W,H) * 0.35;
  const ay = cy + Math.sin(ang) * Math.min(W,H) * 0.35;
  ctx.save();
  ctx.translate(ax, ay); ctx.rotate(ang);
  ctx.fillStyle = 'rgba(255,68,170,0.92)';
  ctx.beginPath(); ctx.moveTo(18,0); ctx.lineTo(-10,-10); ctx.lineTo(-4,0); ctx.lineTo(-10,10); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle='#ff44aa'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
  const dPing = Math.hypot(wx,wy)|0;
  ctx.fillText('PING '+dPing+'px', ax, ay - 22);
}

function drawStageBanner(){
  if (G.stageBannerT<=0) return;
  const W = window.innerWidth, H = window.innerHeight;
  const t = G.stageBannerT;
  // v1.8.1: epic banner — full-screen darkening + gradient + huge text + glow + sub-banner
  const a = t > 7 ? (8-t) : Math.min(1, t/1.2);
  // Full-screen vignette darken
  ctx.fillStyle = 'rgba(0,0,0,'+(0.55*a)+')';
  ctx.fillRect(0, 0, W, H);
  // Gold/purple radial halo behind text
  const cy = H*0.40;
  const g = ctx.createRadialGradient(W/2, cy, 0, W/2, cy, Math.max(W,H)*0.45);
  g.addColorStop(0, 'rgba(255,221,102,'+(0.35*a)+')');
  g.addColorStop(0.5, 'rgba(180,80,200,'+(0.18*a)+')');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // Top + bottom gold bars
  ctx.fillStyle = 'rgba(255,221,102,'+(0.7*a)+')';
  ctx.fillRect(0, cy-90, W, 3); ctx.fillRect(0, cy+70, W, 3);
  // Huge title with glow
  ctx.save();
  ctx.shadowColor = 'rgba(255,221,102,'+(0.9*a)+')'; ctx.shadowBlur = 32;
  ctx.fillStyle = 'rgba(255,235,150,'+a+')';
  ctx.font = 'bold 64px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  ctx.fillText(G.stageBannerText, W/2, cy);
  ctx.restore();
  // Subtitle
  ctx.fillStyle = 'rgba(220,220,255,'+(a*0.9)+')';
  ctx.font = 'italic 22px sans-serif';
  ctx.fillText(G.stageBannerSub, W/2, cy + 42);
  // Animated sparks beneath
  const sparks = 18;
  for (let i=0;i<sparks;i++){
    const phase = (G.time*1.5 + i*0.7) % (Math.PI*2);
    const sx = W/2 + Math.cos(phase + i)* (180 + Math.sin(phase*2)*40);
    const sy = cy + 55 + Math.sin(phase*1.7)*8;
    ctx.fillStyle = 'rgba(255,221,102,'+(a*(0.4+0.4*Math.abs(Math.sin(phase))))+')';
    ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI*2); ctx.fill();
  }
}
function drawWorldEventFX(){
  if (!G.event || G.event.type!=='aligned') return;
  // 全螢幕金紫光暈
  const W = window.innerWidth, H = window.innerHeight;
  const g = ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.1, W/2,H/2,Math.max(W,H)*0.7);
  g.addColorStop(0,'rgba(255,221,102,0)'); g.addColorStop(1,'rgba(255,221,102,0.18)');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  // 頂部倒計時
  ctx.fillStyle = '#ffdd66'; ctx.font='bold 16px sans-serif'; ctx.textAlign='center';
  ctx.fillText('☄ Stars Align ' + G.event.t.toFixed(1) + 's', W/2, 32);
}


function drawFirstHuntGuide(){
  if (!G.started || G.dead || !G.player || !G.firstHunt || !G.firstHunt.active) return;
  const target = getFirstHuntTarget();
  if (!target) return;
  const W = window.innerWidth, H = window.innerHeight;
  const sx = target.x - G.cam.x + W/2;
  const sy = target.y - G.cam.y + H/2;
  const onScreen = sx >= 24 && sx <= W-24 && sy >= 24 && sy <= H-24;
  const bannerW = Math.min(560, W - 32);
  const bannerX = (W - bannerW) / 2;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = 'rgba(15,12,22,0.88)';
  ctx.fillRect(bannerX, 18, bannerW, 58);
  ctx.strokeStyle = '#ffd66b';
  ctx.lineWidth = 2;
  ctx.strokeRect(bannerX, 18, bannerW, 58);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd66b';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('FIRST KILL = FIRST HOOK', W/2, 42);
  ctx.fillStyle = '#f4ecff';
  ctx.font = '14px sans-serif';
  ctx.fillText('Hunt the nearest creature to start your evolution chain', W/2, 63);
  if (onScreen){
    const pulse = 12 + 5*Math.sin(G.time*6);
    ctx.strokeStyle = '#ffd66b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sx, sy, target.r + pulse, 0, Math.PI*2);
    ctx.stroke();
    ctx.fillStyle = '#ffd66b';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('KILL THIS', sx, sy - target.r - 18);
  } else {
    const cx = W/2, cy = H/2;
    const dx = sx - cx, dy = sy - cy;
    const ang = Math.atan2(dy, dx);
    const ex = Math.cos(ang), ey = Math.sin(ang);
    const pad = 42;
    let t = Infinity;
    if (ex!==0){ const tx=(dx>0?W/2-pad:-W/2+pad)/ex; if (tx>0) t=Math.min(t,tx); }
    if (ey!==0){ const ty=(dy>0?H/2-pad:-H/2+pad)/ey; if (ty>0) t=Math.min(t,ty); }
    const ax = cx + ex*t, ay = cy + ey*t;
    ctx.translate(ax, ay);
    ctx.rotate(ang);
    ctx.fillStyle = '#ffd66b';
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-10, -10);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();
    ctx.rotate(-ang);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('FIRST KILL', 0, -18);
  }
  ctx.restore();
}
// =====================================================================
// 星圖：生態區標籤工具（v1.0.0）
// =====================================================================
function _biomeCentroids(){
  if (G._biomeCentroidsCache) return G._biomeCentroidsCache;
  const acc = {};
  if (G.terrain){
    for (let y=0;y<G.terrain.rows;y++) for (let x=0;x<G.terrain.cols;x++){
      const b = G.terrain.map[y][x];
      if (!acc[b]) acc[b] = {sx:0,sy:0,n:0};
      acc[b].sx += x; acc[b].sy += y; acc[b].n++;
    }
  }
  const out = [];
  for (const k of Object.keys(acc)){
    const a = acc[k];
    out.push({biome:k, x:(a.sx/a.n)*TILE, y:(a.sy/a.n)*TILE, n:a.n});
  }
  G._biomeCentroidsCache = out;
  return out;
}

function generateNodes(){
  G.qiSprings = [];
  const cx = WORLD.w/2, cy = WORLD.h/2;
  // v1.0.0: 10 個Qi Spring（內 6 + 外 4），大地圖更需要修為來源
  for (let i=0;i<6;i++){
    const ang = (i/6)*Math.PI*2 + Math.PI/6;
    G.qiSprings.push({ x: cx + Math.cos(ang)*2400, y: cy + Math.sin(ang)*2400, r: 150, tcd: 3, pulse: Math.random()*Math.PI*2 });
  }
  for (let i=0;i<4;i++){
    const ang = (i/4)*Math.PI*2 + Math.PI/4;
    G.qiSprings.push({ x: cx + Math.cos(ang)*4200, y: cy + Math.sin(ang)*4200, r: 180, tcd: 3, pulse: Math.random()*Math.PI*2 });
  }
  G.rifts = [];
  // v1.0.0: 8 個秘境（4 內 + 4 外）
  const riftDefs = [
    {name:'XP Sanctum',  icon:'X', color:'#bb88ff', reward:'qi'},
    {name:'Vitality Sanctum',  icon:'L', color:'#ff7080', reward:'heal'},
    {name:'Strength Sanctum',  icon:'P', color:'#ffd66b', reward:'power'},
    {name:'Outer God Sanctum',  icon:'★', color:'#aa44ff', reward:'all'},
    {name:'Star Sanctum',  icon:'St', color:'#88ccff', reward:'qi'},
    {name:'Bloodline Sanctum',  icon:'B', color:'#ff4466', reward:'heal'},
    {name:'Thunder Sanctum',  icon:'T', color:'#fff080', reward:'power'},
    {name:'Void Sanctum',  icon:'V', color:'#7a00cc', reward:'all'},
  ];
  for (let i=0;i<riftDefs.length;i++){
    const ang = (i/riftDefs.length)*Math.PI*2 + Math.PI/8;
    const D = i<4 ? 3000 : 4400;
    // v2.1.0: capture zones (radius 220) with progress + ownership + guardian spawn
    G.rifts.push({ ...riftDefs[i], x: cx + Math.cos(ang)*D, y: cy + Math.sin(ang)*D, r: 220, used:false, cap:0, owner:null, ownerName:'', ownT:0, contested:false, guardT:0, pulse: Math.random()*Math.PI*2 });
  }
}

function drawCosmicBG(){
  for (const n of G.nebula){
    if (Math.abs(n.x - G.cam.x) > window.innerWidth/2 + n.r) continue;
    if (Math.abs(n.y - G.cam.y) > window.innerHeight/2 + n.r) continue;
    const g = ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r);
    g.addColorStop(0, n.color+'55'); g.addColorStop(0.5, n.color+'22'); g.addColorStop(1, n.color+'00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2); ctx.fill();
  }
  for (const st of G.stars){
    if (Math.abs(st.x - G.cam.x) > window.innerWidth/2 + 50) continue;
    if (Math.abs(st.y - G.cam.y) > window.innerHeight/2 + 50) continue;
    const a = 0.4 + 0.6*Math.abs(Math.sin(G.time*st.tw + st.ph));
    ctx.globalAlpha = a;
    ctx.fillStyle = '#e8e8ff';
    ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawTendrils(){
  ctx.lineCap = 'round';
  for (const t of G.tendrils){
    let bx=0, by=0, dx=0, dy=0;
    if (t.side==='top'){ bx=t.pos; by=0; dx=0; dy=-1; }
    else if (t.side==='bottom'){ bx=t.pos; by=WORLD.h; dx=0; dy=1; }
    else if (t.side==='left'){ bx=0; by=t.pos; dx=-1; dy=0; }
    else if (t.side==='right'){ bx=WORLD.w; by=t.pos; dx=1; dy=0; }
    if (Math.abs(bx - G.cam.x) > window.innerWidth + t.len + 200) continue;
    if (Math.abs(by - G.cam.y) > window.innerHeight + t.len + 200) continue;
    ctx.strokeStyle = '#1a0a2a'; ctx.lineWidth = 18;
    ctx.beginPath(); ctx.moveTo(bx, by);
    let endX=bx, endY=by;
    const segs = 6;
    for (let i=1;i<=segs;i++){
      const f = i/segs;
      const wob = Math.sin(G.time*0.6 + t.ph + f*4)*40*f;
      const px = bx + dx*t.len*f + (-dy)*wob;
      const py = by + dy*t.len*f + (dx)*wob;
      ctx.lineTo(px, py);
      endX = px; endY = py;
    }
    ctx.stroke();
    ctx.fillStyle = '#aa0033'; ctx.beginPath(); ctx.arc(endX,endY,8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(endX,endY,3,0,Math.PI*2); ctx.fill();
  }
}

function drawQiSprings(){
  for (const qs of G.qiSprings){
    qs.pulse += 0.04;
    const r = qs.r;
    const g = ctx.createRadialGradient(qs.x,qs.y,0,qs.x,qs.y,r);
    g.addColorStop(0,'#bb88ff66'); g.addColorStop(0.6,'#7744aa22'); g.addColorStop(1,'#00000000');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(qs.x,qs.y,r,0,Math.PI*2); ctx.fill();
    for (let i=0;i<3;i++){
      const rr = 30 + i*16 + Math.sin(qs.pulse + i)*4;
      ctx.strokeStyle = ['#cc99ff66','#cc99ff99','#cc99ffcc'][i];
      ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(qs.x,qs.y,rr,0,Math.PI*2); ctx.stroke();
    }
    ctx.fillStyle='#fff'; ctx.font='bold 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('XP Spring', qs.x, qs.y - r - 8);
  }
}

function drawRifts(){
  for (const rf of G.rifts){
    rf.pulse += 0.05;
    const r = rf.r;
    // owned-state: faint banner with countdown
    if (rf.used){
      ctx.fillStyle = (rf.color||'#888')+'22';
      ctx.beginPath(); ctx.arc(rf.x, rf.y, r*0.55, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = (rf.color||'#888')+'55'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(rf.x, rf.y, r, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = rf.color||'#aaa'; ctx.font='bold 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(rf.name, rf.x, rf.y - 18);
      ctx.fillStyle = '#fff'; ctx.font='12px sans-serif';
      ctx.fillText('Held by '+(rf.ownerName||'a cultivator'), rf.x, rf.y);
      ctx.fillStyle = '#aaa'; ctx.font='11px sans-serif';
      ctx.fillText('Reopens in '+Math.max(0,(rf.ownT||0)|0)+'s', rf.x, rf.y + 18);
      continue;
    }
    // open-state: aura + arcane arcs
    const gg = ctx.createRadialGradient(rf.x,rf.y,0,rf.x,rf.y,r*1.4);
    gg.addColorStop(0, rf.color+'77'); gg.addColorStop(0.5, rf.color+'33'); gg.addColorStop(1, rf.color+'00');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(rf.x,rf.y,r*1.4,0,Math.PI*2); ctx.fill();
    // boundary ring
    ctx.strokeStyle = rf.color+'cc'; ctx.lineWidth = 3;
    ctx.setLineDash([10,8]); ctx.lineDashOffset = -rf.pulse*10;
    ctx.beginPath(); ctx.arc(rf.x, rf.y, r, 0, Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
    for (let i=0;i<6;i++){
      const a = rf.pulse*0.8 + i*Math.PI/3;
      const rr = r*0.55 + Math.sin(rf.pulse*2 + i)*8;
      ctx.strokeStyle = rf.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(rf.x, rf.y, rr, a, a + Math.PI/4); ctx.stroke();
    }
    // capture progress arc
    const cap = Math.max(0, Math.min(100, rf.cap||0));
    if (cap>0){
      ctx.strokeStyle = rf.contested ? '#ff4466' : '#7cff7c';
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(rf.x, rf.y, r+12, -Math.PI/2, -Math.PI/2 + (cap/100)*Math.PI*2); ctx.stroke();
    }
    ctx.fillStyle = rf.color; ctx.font='bold 26px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(rf.icon, rf.x, rf.y);
    ctx.fillStyle='#fff'; ctx.font='bold 14px sans-serif';
    ctx.fillText(rf.name, rf.x, rf.y - r - 18);
    ctx.fillStyle = rf.contested ? '#ff6688' : rf.color;
    ctx.font='12px sans-serif';
    const status = rf.contested ? 'CONTESTED · clear foes!' : (cap>0 ? 'Channeling '+(cap|0)+'%' : 'Stand inside to channel (no foes in zone)');
    ctx.fillText(status, rf.x, rf.y + r + 16);
  }
}

function terrainAt(x,y){
  if (!G.terrain) return 'plain';
  const c = clamp(Math.floor(x/TILE),0,G.terrain.cols-1);
  const r = clamp(Math.floor(y/TILE),0,G.terrain.rows-1);
  return G.terrain.map[r][c];
}

// =====================================================================
// 生物創建
// =====================================================================
function makeCreature(speciesKey, x, y, isPlayer=false){
  const sp = SPECIES[speciesKey];
  const path = PATHS[sp.path];
  const c = {
    species: speciesKey, sp, path, isPlayer,
    x, y, vx:0, vy:0, facing:0, r: sp.base.r,
    pathKey: sp.path, rank: 1,
    qi: 0, zhenyuan: 1, daohen: 1,
    base: {...sp.base},
    hp:0, maxHp:0, sta:0, maxSta:0,
    atk:0, def:0, spd:0, life:0, maxLife:0,
    atkR:sp.base.atkR, atkCd:sp.base.atkCd, atkCdT:0,
    rngR:sp.base.rngR||0, rngCd:sp.base.rngCd||0, rngCdT:0, rngDmg:sp.base.rngDmg||0, rngSpd:sp.base.rngSpd||0,
    dashCd:3, dashCdT:0,
    skillQT:0, skillET:0, skillRT:0,
    authoritySlots:[], authCdT:[],
    defending:false,
    bleed:0, poison:0, slow:0, freeze:0, stun:0, invuln:0, rageT:0, titanT:0, darkT:0,
    shieldHp:0, shieldT:0, lifestealT:0, lifestealPct:0, dmgTransferT:0, dmgTransferPct:0,
    bonusAtkMult:1, bonusSpdMult:1, bonusDefMult:1, bonusSizeMult:1,
    q:{ kills:0, killHighTier:0, killEpic:0, casts:0, terrains:new Set(), enteredEnd:false, authorities:0, bossKilled:0, riftsUsed:0,
        // v1.9.0 trackers
        hitByHigher:0,         // hits taken from creatures of higher rank (species rites)
        killSequenced:0,       // v2.0: kills of rank>=6 creatures (legendary)
        killSeq1Rival:0,       // v2.0: kills of rank>=8 creatures of a DIFFERENT path
        killThrone:0,          // v2.0: kills of rank===9 creatures of the SAME path (throne usurpation)
      },
    sanity:100, maxSanity:100,
    aiState:'wander', aiTarget:null, aiTimer:0,
    unlocks:[],
    color: sp.color,
    name: isPlayer ? 'You' : randomName(),
  };
  recalcStats(c);
  c.hp = c.maxHp; c.sta = c.maxSta; c.life = c.maxLife;
  return c;
}
function recalcStats(p){
  let hp=p.base.hp, atk=p.base.atk, def=p.base.def, spd=p.base.spd, sta=p.base.sta, life=p.base.life;
  const top = Math.min(p.rank-1, RANK_BONUS.length);
  for (let i=0;i<top;i++){
    const b=RANK_BONUS[i]; hp+=b.hp; atk+=b.atk; def+=b.def; spd+=b.spd; sta+=b.sta; life+=b.life;
  }
  const zy=p.zhenyuan;
  const perk = aggregatePerks(p);
  p.perks = perk;
  p.maxHp = Math.floor(hp*zy*perk.hp);
  p.maxSta = Math.floor(sta*zy*perk.sta);
  p.maxLife = Math.floor(life*zy);
  p.atk = Math.floor(atk*zy*p.bonusAtkMult*perk.atk);
  // v1.8.0: Character Mastery permanent bonuses (player only)
  if (p.isPlayer && typeof masteryAtkBonus === 'function'){
    try {
      const sk = G.selectedSpecies;
      const ma = masteryAtkBonus(sk), mh = masteryHpBonus(sk);
      if (ma>0) p.atk = Math.floor(p.atk * (1+ma));
      if (mh>0) p.maxHp = Math.floor(p.maxHp * (1+mh));
    } catch(e){}
  }
  p.def = Math.floor(def*zy*p.bonusDefMult*perk.def);
  p.spd = Math.floor(spd*zy*p.bonusSpdMult*perk.spd);
  // v3.5.1: speed cap — high-rank entities shouldn't be visually untrackable
  p.spd = Math.min(p.spd, p.isPlayer ? 560 : 320 + (p.rank||1)*20);
  p.r = p.base.r * (p.bonusSizeMult||1) * perk.size * (1 + (p.rank-1)*0.05);
  p.atkR = (p.base.atkR||0) * perk.range;
  if (p.base.rngR) p.rngR = p.base.rngR * perk.range;
  if (p.hp > p.maxHp) p.hp = p.maxHp;
  if (p.sta > p.maxSta) p.sta = p.maxSta;
  if (p.life > p.maxLife) p.life = p.maxLife;
  // 被動回血
  p._regen = perk.regen;
}

// =====================================================================
// 修為晉階
// =====================================================================
function currentQuest(p){
  if (p.rank>=9) return null; // v2.0: 9-level cap; rank 9 = True God
  // v2.0: species-specific override at given rank (e.g. rank-2 endurance rites)
  const sq = SPECIES_QUESTS[p.species];
  if (sq && sq[p.rank-1]) return sq[p.rank-1];
  const list = PATH_QUESTS[p.pathKey] || PATH_QUESTS.human;
  return list[p.rank-1];
}
function tryPromote(p){
  let promoted = false;
  let safety = 9;
  // v2.0: 9-level cap (rank 9 = True God throne)
  while (p.rank < 9 && safety-->0){
    if (!QI_THR[p.rank] || p.qi < QI_THR[p.rank]) break;
    const q = currentQuest(p);
    // v3.5.0: SOFT — quest is a hint, not a hard gate. Once XP is full, allow promotion
    // after a short grace window (or instantly if XP overflows by 50%). Keeps progression smooth.
    if (q && !q.req(p)){
      const overflow = p.qi >= QI_THR[p.rank] * 1.5;
      if (!overflow){
        if (!p._questGraceT) p._questGraceT = G.time;
        const waited = G.time - p._questGraceT;
        if (waited < 8){
          if (p.isPlayer && (!p._questTipT || G.time - p._questTipT > 4)){
            p._questTipT = G.time;
            pushKillFeed('★ XP full — try: '+q.desc+' (or wait '+Math.ceil(8-waited)+'s)', '#ff88cc');
          }
          break;
        }
        // grace expired → auto-pass quest
        if (p.isPlayer) pushKillFeed('★ Quest auto-completed by XP surge!', '#ffdd66');
      } else {
        if (p.isPlayer) pushKillFeed('★ XP overflow — breaking through quest!', '#ffdd66');
      }
      p._questGraceT = 0;
    } else {
      p._questGraceT = 0;
    }
    // v2.0: Apotheosis Trial — rank 8→9 ascension to True God throne.
    // Requires Outer God slain + rifts opened + (if throne occupied) killing the holder.
    if (p.rank===8){
      const throneHolder = G.thrones && G.thrones[p.pathKey];
      const needBoss = p.q.bossKilled<2;
      const needRifts = p.q.riftsUsed<4;
      const needUsurp = throneHolder && throneHolder!==p && p.q.killThrone<1;
      if (needBoss || needRifts || needUsurp){
        if (p.isPlayer && (!p._godTipT || G.time - p._godTipT > 8)){
          p._godTipT = G.time;
          const need=[];
          if (needBoss) need.push(`Slay Outer God ${p.q.bossKilled}/2`);
          if (needRifts) need.push(`Open Sanctums ${p.q.riftsUsed}/4`);
          if (needUsurp) need.push(`Usurp ${p.pathKey.toUpperCase()} Throne (kill the True God)`);
          pushKillFeed('★ Apotheosis Trial incomplete: '+need.join(' / '),'#ffd66b');
        }
        break;
      }
    }
    const b = RANK_BONUS[p.rank-1];
    p.rank++;
    // v1.8.3: SUBTRACT qi on promotion — each tier costs its threshold (was free, allowed multi-level cascades)
    p.qi = Math.max(0, p.qi - QI_THR[p.rank-1]);
    p.zhenyuan += b.zy;
    p.daohen += b.dh;
    recalcStats(p);
    // v2.0: register as Throne holder when ascending to True God (rank 9).
    if (p.rank === 9 && G.thrones && !G.thrones[p.pathKey]){
      G.thrones[p.pathKey] = p;
      pushKillFeed(`★ The ${p.pathKey.toUpperCase()} Throne is claimed by ${p.isPlayer?'You':(p.name||p.sp.name)}!`, '#ffd66b');
    }
    p.hp = p.maxHp; p.sta = p.maxSta; p.life = p.maxLife; // 晉階回滿所有狀態
    if (p.isPlayer) p.invuln = Math.max(p.invuln, 3); // 晉階短暫無敵
    promoted = true;
    if (p.isPlayer){
      const td = tierData(p);
      const title = td?td.name:'?';
      logMsg(`★ Promoted [${title}] (tier ${p.rank}) — Gained "${td?td.pname:''}": ${td?td.pdesc:''}`, 'promote');
      pushKillFeed(`★ Promoted ${title}: ${td?td.pname:''}`, p.path.color);
      playSound('promote');
      flash(p.path.color, 0.5);
      shake(20);
      for (let i=0;i<80;i++) G.particles.push({x:p.x,y:p.y,vx:rand(-400,400),vy:rand(-400,400),life:1.4,color:p.path.color, r:3});
      G.shockwaves.push({x:p.x,y:p.y,r:0,max:280,life:0.9,color:p.path.color});
      addFloat(p.x, p.y-30, `Level Up! ${title}`, p.path.color, 24, 2);
      // v2.7.0: confetti burst + party-horn for viral rank-up moment
      try { confettiBurst(p.x, p.y, 60); popComedy(p.x, p.y-60, true); } catch(e){}
      // v2.4.0: 盲盒進化揭曉（rank 3/5/7/9 觸發大彈窗）
      if ([3,5,7,9].includes(p.rank)){
        const evoForm = getRankForm(p);
        if (evoForm) G.evoReveal = { rank: p.rank, form: evoForm, t: 5.0 };
        // v2.5.0: log first-evolution metric + mark form as discovered
        if (!G._metricsLogged.firstEvo){
          G._metricsLogged.firstEvo = true;
        // v3.4.0: midroll ad on big evolution moments (rank 5/7/9 = divine ascension; SDK throttles to >=120s)
        if (p.rank>=5){
          try { if (window.SDK && SDK.ready && SDK.commercialBreak) SDK.commercialBreak(); } catch(e){}
        }
          try { recordFirstEvoTime(G.time||0); } catch(e){}
        }
      }
      // v2.5.0: form-collection (pokedex hook — drives replay)
      try {
        const sk = G.selectedSpecies;
        const isNew = markFormSeen(sk, p.rank);
        if (isNew){
          const totalF = totalFormsCount();
          const haveF  = formsDiscoveredCount();
          pushKillFeed(`★ NEW FORM DISCOVERED! (${haveF}/${totalF} unlocked)`, '#ffd66b');
          addFloat(p.x, p.y-60, `NEW FORM! ${haveF}/${totalF}`, '#ffd66b', 18, 2.5);
          // v3.3.0: happyTime spike on form discovery — Poki engagement signal
          try { if (window.SDK && SDK.happyTime) SDK.happyTime(0.9); } catch(e){}
        }
      } catch(e){}
      // v2.5.0: track max rank achieved across all runs
      try {
        const m = getMetrics();
        if (p.rank > (m.maxRankAchieved||0)){
          m.maxRankAchieved = p.rank;
          saveMetrics(m);
        }
      } catch(e){}
    }
  }
  if (promoted && p.isPlayer && p.rank>=9){ winGame(); }
}

// =====================================================================
// 螢幕震動 / 閃光 / 浮動文字
// =====================================================================
function shake(amount){ G.cam.shake = Math.max(G.cam.shake, amount); }
function flash(color, intensity){ G.cam.flash = Math.max(G.cam.flash, intensity); G.cam.flashColor = color; }
function addFloat(x,y,text,color,size=12,life=0.8){
  G.floats.push({x,y,text,color,size,life,maxLife:life,vy:-30});
}

// =====================================================================
// 世界初始化 / 補充
// =====================================================================
function spawnInitialWorld(){
  G._biomeCentroidsCache = null;  // v1.0.1: 重置生態快取
  generateTerrain();
  generateDecor();
  generateCosmos();
  generateNodes();
  // v1.0.0: visited fog grid (200px cells)
  const vcs = G.visitedCellSize;
  const vw = Math.ceil(WORLD.w/vcs), vh = Math.ceil(WORLD.h/vcs);
  G.visited = [];
  for (let y=0;y<vh;y++){ const row=[]; for (let x=0;x<vw;x++) row.push(0); G.visited.push(row); }
  G.stage = 1; G.eventCdT = 120; G.minibossSpawnT = 180; G.bossSpawnT = 240; G.bosses = []; G.timeline = [];
  // 大地圖：道具/靈氣 — v1.7.0: leaner ambient density for combat focus
  for (let i=0;i<220;i++) spawnPickup();
  for (let i=0;i<160;i++) spawnSpirit();
  for (const qs of G.qiSprings){
    for (let i=0;i<30;i++){
      const ang=Math.random()*Math.PI*2, dd=rand(20, qs.r*0.9);
      G.spirits.push({x:qs.x+Math.cos(ang)*dd, y:qs.y+Math.sin(ang)*dd, pulse:Math.random()*Math.PI*2, qi:6});
    }
  }
  for (let i=0;i<AUTHORITIES.length;i++){
    const a = AUTHORITIES[i];
    // v3.5.0: random scatter across the whole world (not a uniform ring around center)
    // Avoid spawn radius ~600 around player to stop instant freebies.
    let ax, ay, tries = 0;
    do {
      ax = rand(WORLD.w*0.08, WORLD.w*0.92);
      ay = rand(WORLD.h*0.08, WORLD.h*0.92);
      tries++;
    } while (G.player && Math.hypot(ax-G.player.x, ay-G.player.y) < 1200 && tries < 6);
    G.authorities.push({...a, x: ax, y: ay, pulse:0});
  }
// 出生點周遭塞一些靈氣與道具讓玩家先成長 (v1.8.2: drastically reduced — was instant +2 levels)
  if (G.player){
    for (let i=0;i<15;i++){
      const ang=Math.random()*Math.PI*2, d=rand(120,700);
      G.spirits.push({x:G.player.x+Math.cos(ang)*d, y:G.player.y+Math.sin(ang)*d, pulse:Math.random()*Math.PI*2, qi:3});
    }
    for (let i=0;i<8;i++){
      const ang=Math.random()*Math.PI*2, d=rand(180,700);
      const def = weightedPickup();
      G.pickups.push({...def, x:G.player.x+Math.cos(ang)*d, y:G.player.y+Math.sin(ang)*d, pulse:0});
    }
  }
  // 敵人（出生點 2000px 內為絕對安全區）— v1.8.2: more enemies near player for combat density
  for (let i=0;i<90;i++) spawnEnemy(true);
  // v2.3.0 P0: spawn 16 rank-1/2 enemies within 600-1800px for immediate action
  if (G.player){
    const nearKeys = Object.keys(SPECIES);
    for (let i=0;i<16;i++){
      const sp = nearKeys[(Math.random()*nearKeys.length)|0];
      const ang = Math.random()*Math.PI*2;
      const d = 600 + Math.random()*1200;
      const ex = clamp(G.player.x + Math.cos(ang)*d, 100, WORLD.w-100);
      const ey = clamp(G.player.y + Math.sin(ang)*d, 100, WORLD.h-100);
      const e = makeCreature(sp, ex, ey, false);
      e.rank = i < 8 ? 1 : 2;
      const b = RANK_BONUS[0]; if (e.rank>=2){ e.zhenyuan+=b.zy; e.daohen+=b.dh; }
      recalcStats(e); e.hp=e.maxHp; e.sta=e.maxSta;
      e.nid = ++G._nidSeq;
      G.enemies.push(e);
    }
  }
}
function spawnPickup(){
  const def = weightedPickup();
  G.pickups.push({...def, x:rand(80,WORLD.w-80), y:rand(80,WORLD.h-80), pulse:Math.random()*Math.PI*2});
}
function spawnSpirit(){
  G.spirits.push({x:rand(80,WORLD.w-80), y:rand(80,WORLD.h-80), pulse:Math.random()*Math.PI*2, qi:2});
}
function spawnEnemy(initial=false){
  const keys = Object.keys(SPECIES);
  const sp = keys[(Math.random()*keys.length)|0];
  // v1.8.2: closer spawn for denser combat (was 4200/2200)
  const safeDist = initial ? 2400 : 1400;
  let x,y, tries=0;
  do { x=rand(100,WORLD.w-100); y=rand(100,WORLD.h-100); tries++; }
  while (G.player && dist({x,y},G.player) < safeDist && tries<20);
  const e = makeCreature(sp, x, y, false);
  // v1.8.1: enemies scale with PLAYER rank — no more easy farming once you climb
  let maxTier;
  const _pRank = (G.player && G.player.rank) || 1;
  if (G.player){
    const d = dist({x,y},G.player);
    if (G.time < 60){
      maxTier = 1; // gentle 60s tutorial window
    } else if (G.time < 120){
      maxTier = Math.min(2, _pRank);
    } else {
      // v3.5.1: max 1 rank above player — no time-based escalation that skips tiers
      const farBonus = d > 4000 ? 1 : 0;
      maxTier = _pRank + farBonus;
    }
  } else maxTier = 1;
  // v2.0: 9-level cap. Per-path population caps keep the True God tier scarce.
  maxTier = Math.max(1, Math.min(9, maxTier));
  // Weighted tier: bias toward player rank (challenging fights, not pushovers)
  const minTier = Math.max(1, _pRank - 2);
  let tier = minTier + Math.floor(Math.random()*Math.max(1, maxTier - minTier + 1));
  // v2.0: endgame population caps per path: only 1 rank-9 (True God), up to 3 rank-8, up to 5 rank-7.
  if (tier >= 7){
    let c7=0, c8=0, c9=0;
    for (const en of G.enemies){
      if (en._dead || !en.sp || en.sp.path !== sp.path) continue;
      if (en.rank===7) c7++;
      else if (en.rank===8) c8++;
      else if (en.rank===9) c9++;
    }
    // also count player if same path & high rank
    if (G.player && G.player.sp && G.player.sp.path === sp.path){
      if (G.player.rank===7) c7++;
      else if (G.player.rank===8) c8++;
      else if (G.player.rank===9) c9++;
    }
    if (tier===9 && (c9>=1 || (G.thrones && G.thrones[sp.path]))) tier = 8;
    if (tier===8 && c8>=3) tier = 7;
    if (tier===7 && c7>=5) tier = 6;
  }
  for (let r=1;r<tier;r++){
    const b=RANK_BONUS[r-1]; e.zhenyuan+=b.zy; e.daohen+=b.dh;
  }
  e.rank = tier;
  recalcStats(e); e.hp=e.maxHp; e.sta=e.maxSta;
  e.nid = ++G._nidSeq;
  // v2.0: spawned True God (rank 9) claims the throne for its path
  if (e.rank===9 && G.thrones && !G.thrones[sp.path]){
    G.thrones[sp.path] = e;
    pushKillFeed(`★ The ${sp.path.toUpperCase()} Throne is seized by ${e.name||e.sp.name}!`, '#ffd66b');
  }
  G.enemies.push(e);
}

// =====================================================================
// v2.7.0: 暫停 / 教學 / 鬼畜搞笑特效（短影片傳播種子）
// =====================================================================
function togglePause(){
  G.paused = !G.paused;
  const overlay = document.getElementById('pauseOverlay');
  if (overlay){ overlay.classList.toggle('hidden', !G.paused); }
  try { if (G.paused) stopBGM(); else if (G.soundOn && G.started && !G.dead) startBGM(); } catch(e){}
  try { if (G.paused && window.SDK && SDK.gameplayStop) SDK.gameplayStop(); else if (!G.paused && window.SDK && SDK.gameplayStart) SDK.gameplayStart(); } catch(e){}
}

// Comedy: cartoon pop-text on kills/big hits — short-video viral seed
const COMEDY_POPS = ['BONK!','POW!','OOF!','BOOM!','YEET!','OUCH!','SMACK!','KAPOW!','WHAM!','SPLAT!','THWACK!','ZONK!'];
const COMEDY_COLORS = ['#ffd700','#ff4477','#44ddff','#88ff44','#ff8844','#cc88ff'];
function popComedy(x, y, force){
  // force=true always pops; otherwise 35% chance
  if (!force && Math.random() > 0.35) return;
  const txt = COMEDY_POPS[(Math.random()*COMEDY_POPS.length)|0];
  const col = COMEDY_COLORS[(Math.random()*COMEDY_COLORS.length)|0];
  try { addFloat(x + rand(-20,20), y - 30 + rand(-10,10), txt, col, 28 + (Math.random()*8), 1.0); } catch(e){}
  // goofy honk sound (rising sine + noise burst) — distinctly meme-able
  try {
    if (!G.soundOn) return;
    const a = ac(); if (!a) return;
    const t = a.currentTime;
    const o = a.createOscillator(); const g = a.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(220 + Math.random()*120, t);
    o.frequency.exponentialRampToValueAtTime(660 + Math.random()*220, t+0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t+0.22);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t+0.24);
  } catch(e){}
}
// Confetti burst (used on rank-up — viral moment)
function confettiBurst(x, y, n){
  n = n||40;
  const cols = ['#ff4477','#ffd700','#44ddff','#88ff44','#ff8844','#cc88ff','#ffffff'];
  for (let i=0;i<n;i++){
    const a = Math.random()*Math.PI*2;
    const sp = 200 + Math.random()*340;
    G.particles.push({
      x:x, y:y,
      vx:Math.cos(a)*sp, vy:Math.sin(a)*sp - 80,
      life:1.2 + Math.random()*0.6,
      color: cols[(Math.random()*cols.length)|0],
      r: 2 + Math.random()*2,
    });
  }
}

// Tutorial: 12s first-run guidance (skippable). Stored in localStorage so only first ever.
const EVO_TUT_KEY = 'evo_tut_done_v1';
function tutorialDone(){ try { return localStorage.getItem(EVO_TUT_KEY)==='1'; } catch(e){ return false; } }
function markTutorialDone(){ try { localStorage.setItem(EVO_TUT_KEY,'1'); } catch(e){} }
function startTutorial(){
  if (tutorialDone()) return;
  G._tut = { step:0, t:0, totalT:0, hidden:false };
}
function drawTutorial(){
  if (!G._tut || G._tut.hidden) return;
  if (!G.started || G.dead || G.paused) return;
  const tut = G._tut;
  tut.t += 1/60; tut.totalT += 1/60;
  // Auto-advance
  const steps = [
    { dur:5,  text:'Move with WASD or Arrow keys', sub:'(touch: drag the joystick on the left)' },
    { dur:5,  text:'Left-click or SPACE to attack nearby enemies', sub:'Kill creatures to gain XP and evolve' },
    { dur:4,  text:'Press Q for your special skill', sub:'E and R unlock at higher tiers' },
  ];
  const s = steps[tut.step]; if (!s){ tut.hidden = true; markTutorialDone(); return; }
  if (tut.t >= s.dur){ tut.step++; tut.t = 0; return; }
  // Render banner at top-center
  const W = canvas.width / (dpr||1), H = canvas.height / (dpr||1);
  ctx.save();
  ctx.globalAlpha = Math.min(1, tut.t*4) * (tut.t > s.dur-0.4 ? Math.max(0, (s.dur-tut.t)/0.4) : 1);
  const bx = W/2, by = 110;
  const bw = 540, bh = 78;
  ctx.fillStyle = 'rgba(20,16,32,0.88)';
  ctx.strokeStyle = '#ffd66b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(bx-bw/2, by-bh/2, bw, bh, 12); else ctx.rect(bx-bw/2, by-bh/2, bw, bh);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd66b';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`Step ${tut.step+1}/3 · ${s.text}`, bx, by-12);
  ctx.fillStyle = '#cccccc';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(s.sub, bx, by+14);
  // Skip hint
  ctx.fillStyle = '#888';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('(press T to skip tutorial)', bx, by+bh/2+12);
  // Pulsing arrow pointing at player (for step 1)
  if (tut.step === 0 && G.player){
    const cam = G.cam || {x:0,y:0};
    const px = G.player.x - cam.x;
    const py = G.player.y - cam.y;
    const pulse = 1 + 0.2*Math.sin(tut.totalT*6);
    ctx.fillStyle = '#ffd66b';
    ctx.globalAlpha *= 0.85;
    ctx.beginPath();
    ctx.moveTo(px, py - 70*pulse);
    ctx.lineTo(px - 12, py - 92*pulse);
    ctx.lineTo(px + 12, py - 92*pulse);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// =====================================================================
// 輸入
// =====================================================================
function setupInput(canvas){
  window.addEventListener('keydown', e=>{
    const k = e.key.toLowerCase();
    KEYS[k]=true;
    if (e.key===' ') e.preventDefault();
    if (k==='m' && G.started){ G.mapOpen = !G.mapOpen; }
    if (k==='escape' && G.mapOpen){ G.mapOpen = false; }
    // v2.7.0: Esc / P pause toggle when in-game (Poki checklist required)
    if ((k==='escape' || (k==='p' && e.shiftKey)) && G.started && !G.dead && !G.won && !G.mapOpen){
      e.preventDefault();
      togglePause();
      return;
    }
    if (k==='p' && !e.shiftKey && G.started && G.player){ G.pingX = G.player.x; G.pingY = G.player.y; G.pingT = 8; try{ playSound('block'); }catch(e){} }
    // v1.2.0 T 鍵開Chat — v2.7.0: 若 tutorial 顯示中，T 改為 skip
    if (k==='t' && G._tut && !G._tut.hidden){ e.preventDefault(); G._tut.hidden = true; markTutorialDone(); return; }
    if (k==='t' && G.started && window.Net && Net.online && !G._chatOpen){ e.preventDefault(); openChatInput(); }
  });
  window.addEventListener('keyup', e=>{ KEYS[e.key.toLowerCase()]=false; });
  canvas.addEventListener('mousemove', e=>{
    const r = canvas.getBoundingClientRect();
    MOUSE.x = (e.clientX-r.left); MOUSE.y = (e.clientY-r.top);
  });
  canvas.addEventListener('mousedown', e=>{
    if (e.button===0) MOUSE.ldown = true;
    if (e.button===2) MOUSE.rdown = true;
    // v1.0.0: 星圖開啟時左鍵設定 Ping 標記
    if (G.mapOpen && e.button===0){
      const r = canvas.getBoundingClientRect();
      const cx = e.clientX - r.left, cy = e.clientY - r.top;
      const W=window.innerWidth, H=window.innerHeight, PAD=60;
      const aspect = WORLD.w/WORLD.h; let mw = W-PAD*2, mh = H-PAD*2-40;
      if (mw/mh > aspect) mw = mh*aspect; else mh = mw/aspect;
      const mx = (W-mw)/2, my = PAD+20;
      if (cx>=mx && cx<=mx+mw && cy>=my && cy<=my+mh){
        G.pingX = (cx-mx)/mw * WORLD.w;
        G.pingY = (cy-my)/mh * WORLD.h;
        G.pingT = 8;
        try{ playSound('block'); }catch(e2){}
      }
    }
    e.preventDefault();
  });
  canvas.addEventListener('mouseup', e=>{
    if (e.button===0) MOUSE.ldown = false;
    if (e.button===2) MOUSE.rdown = false;
  });
  canvas.addEventListener('contextmenu', e=>e.preventDefault());
  setupTouch(canvas); // v2.4.0: 手機觸屏
}

// =====================================================================
// 玩家更新
// =====================================================================
function updatePlayer(p, dt){
  // 狀態
  if (p.invuln>0) p.invuln-=dt;
  if (p.bleed>0){ p.hp -= 6*dt; p.bleed-=dt; }
  if (p.poison>0){ p.hp -= 10*p.daohen*dt; p.poison-=dt; }
  if (p.qiBonusT>0) p.qiBonusT -= dt;
  // v1.0.0: visited fog 解除（每幀標記玩家附近）
  if (G.visited){
    const cs = G.visitedCellSize || 1;
    const cx = (p.x/cs)|0, cy = (p.y/cs)|0;
    const rad = G.visitedRadius || 4;
    for (let dy=-rad; dy<=rad; dy++) for (let dx=-rad; dx<=rad; dx++){
      const xx = cx+dx, yy = cy+dy;
      if (xx>=0 && yy>=0 && yy<G.visited.length && xx<G.visited[0].length && dx*dx+dy*dy<=rad*rad) G.visited[yy][xx] = 1;
    }
  }
  if (p.slow>0) p.slow-=dt;
  // 玩家不會被凍結（避免無法操作卡死）
  if (p.isPlayer) p.freeze = 0;
  else if (p.freeze>0){ p.freeze-=dt; return; }
  if (p.stun>0){ p.stun-=dt; }
  // 被動回血：玩家 2/s（+真元），9 階前都有效
  if (p.isPlayer && p.hp>0 && p.hp<p.maxHp) p.hp = Math.min(p.maxHp, p.hp + 2*p.zhenyuan*dt);
  // 進階能力：階位回血
  if (p._regen>0 && p.hp>0 && p.hp<p.maxHp) p.hp = Math.min(p.maxHp, p.hp + p._regen*dt);
  // 進階能力：光環（每 0.5s tick）
  p._auraT = (p._auraT||0) - dt;
  const perk = p.perks;
  if (perk && (perk.slowAura||perk.dotAura||perk.pushAura) && p._auraT<=0){
    p._auraT = 0.5;
    const R = 220;
    const list = p.isPlayer ? G.enemies : [G.player];
    for (const e of list){
      if (!e||e.hp<=0) continue;
      const d = Math.hypot(e.x-p.x, e.y-p.y);
      if (d>R) continue;
      if (perk.slowAura) e.slow = Math.max(e.slow||0, 1);
      if (perk.dotAura){ const dmg = 4; e.hp -= dmg; addFloat(e.x,e.y-e.r,''+dmg,'#c0ff60',10,0.4); if (e.hp<=0) onKill(p, e); }
      if (perk.pushAura && d>0){ const a = Math.atan2(e.y-p.y, e.x-p.x); e.x += Math.cos(a)*3; e.y += Math.sin(a)*3; }
    }
    if (perk.slowAura||perk.dotAura){
      for (let i=0;i<4;i++){ const a = Math.random()*Math.PI*2; G.particles.push({x:p.x+Math.cos(a)*R*0.95, y:p.y+Math.sin(a)*R*0.95, vx:0,vy:0,life:0.3, color: perk.dotAura?'#c0ff60':'#88e0ff', r:2}); }
    }
  }
  if (p.rageT>0){ p.rageT-=dt; if (p.rageT<=0){ p.bonusAtkMult/=2; p.bonusDefMult/=2; recalcStats(p);} }
  if (p.titanT>0){ p.titanT-=dt; if (p.titanT<=0){ p.bonusAtkMult/=2.5; p.bonusDefMult/=2; p.bonusSizeMult/=2.2; recalcStats(p);} }
  if (p.darkT>0) p.darkT-=dt;
  // v2.2.0: utility skill timers
  if (p.shieldT>0){ p.shieldT-=dt; if (p.shieldT<=0){ p.shieldHp=0; } }
  if (p.lifestealT>0) p.lifestealT-=dt;
  if (p.dmgTransferT>0) p.dmgTransferT-=dt;

  // 壽命扣減（玩家）
  if (p.isPlayer){ p.life -= dt; if (p.life<=0){ die('Lifespan exhausted'); return; } }

  // 移動
  applyJoystick(); // v2.4.0: 手機搖桿 → 注入 KEYS
  let mx=0,my=0;
  if (KEYS['w']||KEYS['arrowup']) my-=1;
  if (KEYS['s']||KEYS['arrowdown']) my+=1;
  if (KEYS['a']||KEYS['arrowleft']) mx-=1;
  if (KEYS['d']||KEYS['arrowright']) mx+=1;
  const len=Math.hypot(mx,my); if (len>0){ mx/=len; my/=len; }
  const slowK = p.slow>0?0.5:1;
  const sp = p.spd * slowK;
  p.vx = mx*sp; p.vy = my*sp;

  // 衝刺
  if (p.dashCdT>0) p.dashCdT-=dt;
  if (KEYS['x'] && p.dashCdT<=0 && p.sta>=20 && (mx||my)){
    p.vx = mx*sp*5; p.vy = my*sp*5;
    p.dashCdT = p.dashCd; p.sta -= 20; p.invuln = 0.25;
    for (let i=0;i<10;i++) G.particles.push({x:p.x,y:p.y,vx:rand(-120,120),vy:rand(-120,120),life:0.3,color:p.color,r:2});
  }

  p.x = clamp(p.x + p.vx*dt, 20, WORLD.w-20);
  p.y = clamp(p.y + p.vy*dt, 20, WORLD.h-20);

  // 朝向：v2.9.7 行動裝置上跟隨搖桿方向，桌面用滑鼠
  // v2.9.8 fix: 搖桿閒置時保持上次朝向（不 fallback 到 MOUSE，避免頭歪向左下）
  if (typeof TOUCH !== 'undefined' && TOUCH && TOUCH.joy){
    // 搖桿啟動 → 頭朝搖桿方向
    p.facing = TOUCH.joy.ang;
  } else if (!(typeof isMobile === 'function' && isMobile())){
    // 桌面 → 使用滑鼠
    p.facing = Math.atan2(MOUSE.wy - p.y, MOUSE.wx - p.x);
  }
  // 手機 + 搖桿閒置 → p.facing 維持上次值，不修改

  // 地形紀錄
  const t = terrainAt(p.x,p.y);
  p.q.terrains.add(t);
  if (t==='end' && !p.q.enteredEnd){ p.q.enteredEnd = true; logMsg('★ Entered Lands End','promote'); }

  // 攻擊
  if (p.atkCdT>0) p.atkCdT-=dt;
  if (p.rngCdT>0) p.rngCdT-=dt;
  if (p.skillQT>0) p.skillQT-=dt;
  if (p.skillET>0) p.skillET-=dt;
  if (p.skillRT>0) p.skillRT-=dt;
  for (let i=0;i<p.authCdT.length;i++) if (p.authCdT[i]>0) p.authCdT[i]-=dt;

  if ((MOUSE.ldown || KEYS[' ']) && p.atkCdT<=0){ doMelee(p); p.atkCdT = p.atkCd / (p.rageT>0?2:1); }
  // 遠程移到 F 鍵（右鍵改為防禦）
  if (KEYS['f'] && p.rngCdT<=0 && p.rngDmg>0){ doRanged(p); p.rngCdT = p.rngCd; }
  // 右鍵 = 防禦：80% 減傷、反射 30% 傷害、每秒消耗 12 STA；STA 不足自動結束
  p.defending = (MOUSE.rdown || KEYS['shift']) && p.sta>0;
  if (p.defending){
    p.sta = Math.max(0, p.sta - 12*dt);
    p.vx *= 0.4; p.vy *= 0.4; // 防禦時減速
  }

  // 技能
  if (KEYS['q'] && p.skillQT<=0 && p.rank>=(p.sp.skillQ.unlockRank||1)){ castSkill(p, p.sp.skillQ, 'Q'); p.skillQT = _skillCd(p, p.sp.skillQ, 'Q'); }
  if (KEYS['e'] && p.skillET<=0 && p.rank>=(p.sp.skillE.unlockRank||1)){ castSkill(p, p.sp.skillE, 'E'); p.skillET = _skillCd(p, p.sp.skillE, 'E'); }
  if (KEYS['r'] && p.skillRT<=0 && p.rank>=(p.sp.skillR.unlockRank||1)){ castSkill(p, p.sp.skillR, 'R'); p.skillRT = _skillCd(p, p.sp.skillR, 'R'); }

  // 權柄
  if (KEYS['1'] && p.authoritySlots[0] && p.authCdT[0]<=0){ castAuthority(p,0); p.authCdT[0] = p.authoritySlots[0].cd; }
  if (KEYS['2'] && p.authoritySlots[1] && p.authCdT[1]<=0){ castAuthority(p,1); p.authCdT[1] = p.authoritySlots[1].cd; }
  if (KEYS['3'] && p.authoritySlots[2] && p.authCdT[2]<=0){ castAuthority(p,2); p.authCdT[2] = p.authoritySlots[2].cd; }
  if (KEYS['4'] && p.authoritySlots[3] && p.authCdT[3]<=0){ castAuthority(p,3); p.authCdT[3] = p.authoritySlots[3].cd; }
  if (KEYS['5'] && p.authoritySlots[4] && p.authCdT[4]<=0){ castAuthority(p,4); p.authCdT[4] = p.authoritySlots[4].cd; }
  if (KEYS['6'] && p.authoritySlots[5] && p.authCdT[5]<=0){ castAuthority(p,5); p.authCdT[5] = p.authoritySlots[5].cd; }

  // 自動拾取
  autoPickup(p);

  // STA 回復
  p.sta = Math.min(p.maxSta, p.sta + 8*dt);

  tryPromote(p);
}

// =====================================================================
// 戰鬥
// =====================================================================
function doMelee(p){
  // 扇形 90 度範圍
  const r = p.atkR + p.r;
  const enemies = (p===G.player)?G.enemies:[G.player, ...G.enemies.filter(e=>e!==p)];
  let hitCount = 0;
  for (const e of enemies){
    if (!e || e.hp<=0) continue;
    const d = dist(p,e); if (d > r + e.r) continue;
    const ang = angTo(p,e);
    let delta = Math.abs(((ang - p.facing + Math.PI*3) % (Math.PI*2)) - Math.PI);
    if (delta > Math.PI*0.5) continue;
    dealDamage(p, e, p.atk, '#fff', false);
    hitCount++;
  }
  // v1.2.0 PvP 近戰對遠端玩家
  if (p===G.player && window.Net && Net.online){
    for (const [id, peer] of Net.peers){
      if (!peer || !peer.alive || peer.x===undefined) continue;
      const dx=peer.x-p.x, dy=peer.y-p.y, dd=Math.hypot(dx,dy);
      if (dd > r + (peer.r||14)) continue;
      const ang = Math.atan2(dy,dx);
      let delta = Math.abs(((ang - p.facing + Math.PI*3) % (Math.PI*2)) - Math.PI);
      if (delta > Math.PI*0.5) continue;
      const d = Math.max(1, Math.round(p.atk||10));
      Net.sendHit(id, d, 'melee');
      peer.hitT = 0.3; peer.hp = Math.max(0, (peer.hp||0)-d);
      addFloat(peer.x, peer.y - (peer.r||14) - 10, '-'+d, '#ff8888', 13, 0.6);
      hitCount++;
    }
  }
  // 視覺
    G.shockwaves.push({x:p.x,y:p.y,r:r*0.4,max:r,life:0.18,lifeMax:0.18,color:p.color,arc:Math.PI,facing:p.facing,thin:true});
  if (hitCount>0) shake(2);
}
function doRanged(p){
  const ang = p.facing;
  const cnt = p.rangedMult || 1;
  for (let i=0;i<cnt;i++){
    const off = (i - (cnt-1)/2) * 0.18;
    fireProjectile(p, ang+off, p.rngDmg, p.rngSpd, p.color, p.piercing?5:1);
  }
}
function fireProjectile(p, ang, dmg, spd, color, pierce=1){
  G.projectiles.push({
    x:p.x, y:p.y, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd,
    dmg, color, owner:p, life:1.5, pierce, hit:new Set(), r:5,
  });
}
function dealDamage(attacker, target, dmg, color='#fff', isCrit=false){
  // v1.2.0: PvP — 遠端玩家當作 target 時改派網路訊息
  if (target && target._isRemotePeer && window.Net && Net.online){
    const d = Math.max(1, Math.round(dmg));
    Net.sendHit(target._remoteId, d, 'ranged');
    target.hitT = 0.3;
    addFloat(target.x, target.y - (target.r||14) - 10, '-'+d, color||'#fff', 12, 0.5);
    return d;
  }
  if (!target || target.hp<=0 || target._dead) return;
  // v2.1.0: attacker must be alive too
  if (attacker && (attacker._dead || (attacker.hp!==undefined && attacker.hp<=0) ) && !attacker._isRemotePeer && !attacker.isRemotePeerAttacker) return;
  // v1.0.0: Stars Align，所有非玩家攻擊者 +30%
  if (G.event && G.event.type==='aligned' && attacker && !attacker.isPlayer) dmg *= 1.3;
  // v0.9.0: 外神 Boss 走自有結算
  if (target.isBoss){
    const f = Math.max(1, Math.round(dmg||1));
    target.hp -= f;
    addFloat(target.x, target.y-target.r-10, ''+f, isCrit?'#ffeb40':color, isCrit?16:13, 0.7);
    if (target.hp<=0){ target.hp = 0; }
    return;
  }
  if (target.invuln>0){ addFloat(target.x, target.y-target.r, 'Imm', '#ffff80', 12, 0.5); return; }
  let final = dmg;
  if (!isFinite(final) || final<0) final = 1;
  // 進階能力：暴擊
  const ap = attacker && attacker.perks;
  if (ap && ap.crit>0 && !isCrit && Math.random()<ap.crit){ final*=1.8; isCrit=true; }
  // 護甲（含穿透）
  let effDef = target.def;
  if (ap && ap.pierce>0) effDef = effDef * (1 - ap.pierce);
  final = final * 100 / (100 + Math.max(0, effDef));
  // 防禦狀態：強化版（0.15 倍）+ 反彈 30% 給攻擊者
  if (target.defending){
    final *= 0.15;
    if (attacker && attacker!==target && attacker.hp>0){
      const reflect = Math.max(1, Math.round(dmg*0.3));
      attacker.hp -= reflect;
      addFloat(attacker.x, attacker.y-attacker.r, `Rfl ${reflect}`, '#88e0ff', 12, 0.6);
      if (attacker.hp<=0) onKill(target, attacker);
    }
    addFloat(target.x, target.y-target.r, 'Blk', '#88e0ff', 14, 0.5);
    playSound('block');
  }
  // 暗夜暴擊
  if (attacker && attacker.darkT>0 && Math.random()<0.5){ final*=2; isCrit=true; }
  final = Math.max(1, Math.round(final));
  // v2.2.0: Tyrant Bond — redirect % of dmg to highest-HP nearby foe of target
  if (target.dmgTransferT>0 && target.dmgTransferPct>0 && attacker && attacker!==target){
    const list = (target.isPlayer ? G.enemies : [G.player, ...G.enemies.filter(e=>e!==target)]);
    let best=null, bh=-1;
    for (const c of list){ if (!c||c.hp<=0||c._dead||c===attacker) continue; if (Math.hypot(c.x-target.x,c.y-target.y)<420 && c.hp>bh){ bh=c.hp; best=c; } }
    if (best){
      const redir = Math.max(1, Math.round(final * target.dmgTransferPct));
      final -= redir;
      best.hp -= redir;
      addFloat(best.x, best.y-best.r, `Bond ${redir}`, '#ff8844', 13, 0.7);
      G.particles.push({x:target.x,y:target.y,vx:(best.x-target.x)*2,vy:(best.y-target.y)*2,life:0.4,color:'#ff8844',r:2});
      if (best.hp<=0) onKill(attacker, best);
      if (final<=0) final = 0;
    }
  }
  // v2.2.0: Dao Aegis shield absorbs damage before HP
  if (target.shieldT>0 && (target.shieldHp||0)>0 && final>0){
    const absorb = Math.min(target.shieldHp, final);
    target.shieldHp -= absorb;
    final -= absorb;
    addFloat(target.x, target.y-target.r-6, `∩${absorb|0}`, '#88ccff', 12, 0.5);
    if (target.shieldHp<=0){ target.shieldHp=0; target.shieldT=0; if (target.isPlayer) addFloat(target.x,target.y-30,'Shield broken','#88ccff',12,1); }
  }
  if (final<=0){ if ((target.shieldHp||0)>0 || (target.dmgTransferT||0)>0){ return; } final = 1; }
  target.hp -= final;
  // v1.9.0: track "struck by higher creature" for species rite quests
  if (attacker && attacker !== target && target.q && attacker.rank > target.rank && final>0){
    target.q.hitByHigher = (target.q.hitByHigher||0) + 1;
  }
  addFloat(target.x, target.y-target.r, ''+final, isCrit?'#ffeb40':color, isCrit?16:12, 0.7);
  // 進階能力：吸血
  if (ap && ap.lifesteal>0 && attacker.hp>0 && attacker!==target){
    const heal = Math.max(1, Math.round(final*ap.lifesteal));
    attacker.hp = Math.min(attacker.maxHp, attacker.hp+heal);
    if (attacker.isPlayer) addFloat(attacker.x, attacker.y-attacker.r-10, `+${heal}`, '#ff80c0', 11, 0.5);
  }
  // v2.2.0: Vampire Embrace aura on attacker
  if (attacker && attacker.lifestealT>0 && (attacker.lifestealPct||0)>0 && attacker.hp>0 && attacker!==target){
    const heal = Math.max(1, Math.round(final * attacker.lifestealPct));
    attacker.hp = Math.min(attacker.maxHp, attacker.hp+heal);
    if (attacker.isPlayer) addFloat(attacker.x, attacker.y-attacker.r-10, `♥+${heal}`, '#cc1133', 12, 0.5);
  }
  // 進階能力：命中附加 DOT
  if (ap && ap.dot>0){ target.bleed = Math.max(target.bleed||0, 4); }
  // 進階能力：受擊反震
  const tp = target.perks;
  if (tp && tp.reflect && attacker && attacker!==target){
    G.shockwaves.push({x:target.x,y:target.y,r:0,max:160,life:0.5,color:'#ffd66b'});
    const d = Math.hypot(attacker.x-target.x, attacker.y-target.y);
    if (d<200 && attacker.hp>0){
      const rd = Math.max(1, Math.round(target.atk*0.5));
      attacker.hp -= rd;
      addFloat(attacker.x, attacker.y-attacker.r, `Shk ${rd}`, '#ffd66b', 12, 0.6);
      if (attacker.hp<=0) onKill(target, attacker);
    }
  }
  // 進階能力：普攻附加範圍 AoE
  if (ap && ap.aoeOnHit && attacker.hp>0){
    G.shockwaves.push({x:target.x,y:target.y,r:0,max:90,life:0.35,color:attacker.path.color});
    const list = (attacker.isPlayer?G.enemies:[G.player,...G.enemies.filter(e=>e!==attacker)]);
    for (const e of list){
      if (!e||e===target||e.hp<=0) continue;
      const d = Math.hypot(e.x-target.x, e.y-target.y);
      if (d<90){ const ad = Math.max(1, Math.round(attacker.atk*0.4)); e.hp -= ad; addFloat(e.x,e.y-e.r,''+ad,'#ffaa30',11,0.5); if (e.hp<=0) onKill(attacker, e); }
    }
  }
  // 玩家被擊的邊緣紅闪
  if (target.isPlayer){
    G.cam.hitFlash = 1;
    G.lastHitTime = G.time;
    playSound('hurt');
  } else if (attacker && attacker.isPlayer){
    playSound('hit');
    // v1.6.2 combat juice: sparks + tiny shake + brief screen tint on player hits
    G.cam.shake = Math.max(G.cam.shake, isCrit ? 8 : 3);
    if (isCrit) flash('#ffeb40', 0.35);
    const _spk = isCrit ? 14 : 7;
    for (let i=0;i<_spk;i++){
      const a = Math.random()*Math.PI*2;
      const sp_ = rand(180, 380);
      G.particles.push({x:target.x, y:target.y, vx:Math.cos(a)*sp_, vy:Math.sin(a)*sp_, life:0.35, color:isCrit?'#ffeb40':color, r:isCrit?3:2});
    }
  }
  // 擊退（防禦時不被擊退；考慮 knockRes / knockMul）
  if (!target.defending && attacker){
    let kb = 4;
    if (ap && ap.knockMul>1) kb *= ap.knockMul;
    if (tp && tp.knockRes>0) kb *= (1-tp.knockRes);
    const ang = angTo(attacker,target);
    target.x += Math.cos(ang)*kb; target.y += Math.sin(ang)*kb;
  }
  // 噴血
  for (let i=0;i<3;i++) G.particles.push({x:target.x,y:target.y,vx:rand(-120,120),vy:rand(-120,120),life:0.3,color:'#ff4444',r:2});
  if (target.hp<=0) onKill(attacker, target);
}
function onKill(attacker, target){
  if (target.hp<=0 && target._dead) return;
  target._dead = true;
  // v2.0: throne becomes vacant when the True God (rank 9) holder dies
  if (target.rank===9 && target.sp && G.thrones && G.thrones[target.sp.path] === target){
    G.thrones[target.sp.path] = null;
    pushKillFeed(`★ The ${target.sp.path.toUpperCase()} Throne is VACANT — ascend now!`, '#ffd66b');
  }
  playSound('kill');
  // v2.7.0: rng cartoon pop-text on kills + extra goofy honk (short-video viral seed)
  try { popComedy(target.x, target.y, target.rank>=5); } catch(e){}
  // v2.7.0: ragdoll-style death spin (visible briefly via particles + corpse stagger)
  if (target && !target.isPlayer){
    target._ragSpin = (Math.random()<0.5?-1:1) * (6 + Math.random()*8);
  }
  // Kill feed
  if (attacker){
    const an = attacker.isPlayer?'You':(attacker.name||attacker.sp.name);
    const tn = target.isPlayer?'You':(target.name||target.sp.name);
    pushKillFeed(`${an} killed ${tn}`, attacker.isPlayer ? '#ffd66b' : (target.isPlayer ? '#ff4040' : '#aaa'));
    if (target.isPlayer) G.deathBy = `Killed by ${attacker.sp.name} (${tierIcon(attacker)} ${tierName(attacker)})`;
  }
  // 玩家擊殺
  if (attacker && attacker.isPlayer){
    attacker.q.kills++;
    // v2.3.0 P0: kill streak system
    G.killStreak = (G.killStreak||0) + 1;
    const _streakMile = {3:'🔥 Killing Spree!', 5:'⚡ Rampage!', 7:'💀 Unstoppable!', 10:'👑 Godlike!', 15:'☄ Beyond Godlike!', 20:'⭐ LEGENDARY!'};
    if (_streakMile[G.killStreak]){
      const _sbq = G.killStreak * 8;
      attacker.qi += _sbq;
      G.streakBannerText = _streakMile[G.killStreak] + '  +' + _sbq + ' XP';
      G.streakBannerT = 3.5;
      G.streakBannerColor = G.killStreak>=10 ? '#ffd700' : G.killStreak>=7 ? '#ff44ff' : '#ff8800';
      pushKillFeed(G.streakBannerText, G.streakBannerColor);
      // v3.2.0: streak = engagement spike，告訴 Poki 演算法這玩家很爽
      try { if (window.SDK && SDK.happyTime) SDK.happyTime(Math.min(1, G.killStreak/12)); } catch(e){}
    }
    if (target.rank>=3) attacker.q.killHighTier++;
    if (target.rank>=5) attacker.q.killEpic++;
    // v2.0: high-tier kill trackers (legendary / cross-path / throne usurpation)
    if (target.rank>=6) attacker.q.killSequenced = (attacker.q.killSequenced||0) + 1;
    if (target.rank>=8 && target.sp && attacker.sp && target.sp.path !== attacker.sp.path){
      attacker.q.killSeq1Rival = (attacker.q.killSeq1Rival||0) + 1;
    }
    if (target.rank===9 && target.sp && attacker.sp && target.sp.path === attacker.sp.path){
      attacker.q.killThrone = (attacker.q.killThrone||0) + 1;
    }
    let qiReward = 5 + target.rank*4;
    // v1.8.1: STRATEGY — penalize farming much-weaker enemies (must hunt up your weight class)
    if (target.rank < attacker.rank - 1){
      const _diff = attacker.rank - target.rank;
      qiReward = Math.max(1, Math.floor(qiReward * Math.max(0.15, 1 - _diff*0.35)));
    }
    // v1.8.1: bonus for killing UP (hunting stronger prey = big reward)
    if (target.rank > attacker.rank){
      qiReward = Math.floor(qiReward * (1 + (target.rank - attacker.rank) * 0.6));
    }
    // v1.8.0: opposing-path bonus — kill enemies of a different path → +50% Qi
    let _oppMul = 1;
    if (target.sp && attacker.sp && target.sp.path && attacker.sp.path && target.sp.path !== attacker.sp.path){
      _oppMul = 1.5;
      qiReward = Math.floor(qiReward * _oppMul);
    }
    attacker.qi += qiReward;
    addFloat(target.x, target.y-20, `+${qiReward} XP${_oppMul>1?' ⚔':''}`, _oppMul>1?'#ff88cc':'#bb88ff', 14, 1.2);
    // v2.5.0: early-game qi boost — guarantees first evolution in 60-90s
    const _earlyMul = earlyQiMultiplier();
    if (_earlyMul > 1){
      const _bonus = Math.floor(qiReward * (_earlyMul - 1));
      if (_bonus > 0){
        attacker.qi += _bonus;
        addFloat(target.x, target.y-38, `+${_bonus} Welcome XP ✨`, '#ffd66b', 12, 1.2);
      }
    }
    // v2.5.0: record first-kill metric
    if (attacker.q.kills === 1 && !G._metricsLogged.firstKill){
      G._metricsLogged.firstKill = true;
      try { recordFirstKillTime(G.time||0); } catch(e){}
    }
    logMsg(`Killed ${target.sp.name} (${tierIcon(target)} ${tierName(target)}) +${qiReward} XP${_oppMul>1?' [rival path bonus]':''}`);
    const _preRank = attacker.rank;
    tryPromote(attacker);
    if (window.SDK && attacker.rank>_preRank) SDK.happyTime(Math.min(1, attacker.rank/15));
    saveProgress();
    if (window.Net && Net.online && !target.isPlayer && target.nid && Net.sendEnemyKill) Net.sendEnemyKill(target.nid);
  }
  // 進階能力：擊殺回血
  if (attacker && attacker.perks && attacker.perks.killheal>0 && attacker.hp>0){
    const h = Math.round(attacker.maxHp * attacker.perks.killheal);
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + h);
    if (attacker.isPlayer) addFloat(attacker.x, attacker.y-attacker.r-20, `+${h} HP`, '#80ff80', 14, 0.8);
  }
  // 掉落 — v1.7.0: richer brawl drops (more Qi spirits, higher item rate, Authority fruits from rank 3+)
  for (let i=0;i<Math.min(8, 2+target.rank*2);i++){
    G.spirits.push({x:target.x+rand(-20,20), y:target.y+rand(-20,20), pulse:Math.random()*Math.PI*2, qi:5+target.rank*2, vx:rand(-100,100), vy:rand(-100,100), life:0.5});
  }
  // bonus Qi orbs scaling with kill rank
  if (target.rank>=2){
    for (let i=0;i<target.rank+2;i++){
      G.spirits.push({x:target.x+rand(-30,30), y:target.y+rand(-30,30), pulse:Math.random()*Math.PI*2, qi:8+target.rank*3, vx:rand(-150,150), vy:rand(-150,150), life:0.4});
    }
  }
  // higher item pickup chance (was 30%)
  if (Math.random() < 0.45 + target.rank*0.05){
    const def = weightedPickup();
    G.pickups.push({...def, x:target.x, y:target.y, pulse:0});
  }
  // v2.1.0: drop the target's held Authorities at death location (world-unique fruits)
  if (target.authoritySlots && target.authoritySlots.length){
    try {
      for (const a of target.authoritySlots){
        if (!a || !a.id) continue;
        G.authorities.push({...a, x:target.x+rand(-40,40), y:target.y+rand(-40,40), pulse:0, droppedT:G.time});
        const who = target.isPlayer ? 'You' : ((target.sp && target.sp.name) || 'A creature');
        pushKillFeed('★ '+who+' dropped Authority ['+a.name+']', a.color||'#ffaa30');
      }
      target.authoritySlots = [];
      target.authCdT = [];
    } catch(e){}
  }
  for (let i=0;i<15;i++) G.particles.push({x:target.x,y:target.y,vx:rand(-220,220),vy:rand(-220,220),life:0.6,color:target.color,r:2});
  // 移除
  if (target===G.player){ die(G.deathBy || 'killed by'); }
}

// =====================================================================
// 技能執行
// =====================================================================
// v2.2.0: per-species sequence chain — rank gates and enhancement tiers
// Rank 2: unlock skill1(Q). 3: enhance Q.
// Rank 4: unlock skill2(E). 5: enhance E.
// Rank 6: unlock skill3(R). 7: enhance R.
// Rank 8: all skills enhanced. Rank 9: all skills greatly enhanced.
function _skillBoost(p, slot){
  const r = p.rank||1; let mult = 1;
  if (slot==='Q' && r>=3) mult *= 1.30;
  if (slot==='E' && r>=5) mult *= 1.30;
  if (slot==='R' && r>=7) mult *= 1.30;
  if (r>=8) mult *= 1.50;
  if (r>=9) mult *= 1.70; // stacks: total ~3.0x at rank 9
  return mult;
}
function _skillCd(p, s, slot){
  const r = p.rank||1; let cdMult = 1;
  if (slot==='Q' && r>=3) cdMult *= 0.88;
  if (slot==='E' && r>=5) cdMult *= 0.88;
  if (slot==='R' && r>=7) cdMult *= 0.88;
  if (r>=8) cdMult *= 0.80;
  if (r>=9) cdMult *= 0.70;
  return Math.max(0.5, (s.cd||3) * cdMult);
}
function castSkill(p, s, slot){
  const boost = _skillBoost(p, slot||'Q');
  const dh = (p.daohen||1) * boost;
  const type = s.type;
  shake(4);
  if (p.isPlayer) logMsg(`▶ ${s.name}${boost>1?` (×${boost.toFixed(2)})`:''}`);
  switch(type){
    case 'arrow3': for (let i=-1;i<=1;i++) fireProjectile(p, p.facing+i*0.25, p.rngDmg*0.7*dh, p.rngSpd, p.color); break;
    case 'cleave': aoeSlash(p, 200, Math.PI, p.atk*3*dh, '#ffe080'); break;
    case 'sword_rain': swordRain(p, 24, p.atk*1.5*dh); break;
    case 'spin': aoeSlash(p, 180, Math.PI*2, p.atk*2*dh, p.color); knockbackAround(p, 180, 300); break;
    case 'tail': aoeSlash(p, 220, Math.PI*1.5, p.atk*3*dh, p.color); knoc
    // v3.4.3: differentiated signature skills
    case 'summon_bat': for (let i=0;i<5;i++){ const m = makeCreature('bat', p.x+rand(-50,50), p.y+rand(-50,50), false); m.isMinion=true; m.ownerPlayer=p; m.life=15; m.maxLife=15; G.minions.push(m);} flash('#9a76d0',0.3); shake(8); break;
    case 'thunder_storm': chainLightning(p, 16, p.atk*0.8*dh, 360); skyLightning(p, 8, p.atk*1.2*dh, 900); flash('#fff080',0.5); shake(14); break;
    case 'talisman_bolt': {
      // Auto-tracking primary bolt + chain to 4 nearby foes
      let best=null, bd=Infinity;
      for (const e of enemiesOf(p)){ const d=dist(p,e); if (d<560 && d<bd){bd=d;best=e;} }
      if (best){
        const ang = angTo(p,best);
        fireProjectile(p, ang, p.rngDmg*1.8*dh, p.rngSpd, '#cba6ff', 4);
        chainLightning(p, 4, p.atk*0.5*dh, 280);
      } else {
        for (let i=-1;i<=1;i++) fireProjectile(p, p.facing+i*0.25, p.rngDmg*0.9*dh, p.rngSpd, '#cba6ff');
      }
    } break;kbackAround(p, 220, 400); break;
    case 'rage': p.rageT = 10; p.bonusAtkMult*=2; p.bonusDefMult*=2; recalcStats(p); flash(p.color,0.3); break;
    case 'roll': dashAttack(p, 280, p.atk*2*dh, true); break;
    case 'grab': grabNearest(p, p.atk*dh); break;
    // 注意：以下幾個 type 使用 setTimeout 必須在回呼內檢查 G.started/G.dead/p===G.player
    case 'bloodpool': G.hazards.push({type:'bloodpool', x:p.x, y:p.y, r:200, life:8, dmg:15*dh, color:'#cc1133', tick:0, owner:p}); break;
    case 'stomp': aoeSlash(p, 250, Math.PI*2, p.atk*2.5*dh, '#aa6633'); stunAround(p, 250, 1); G.shockwaves.push({x:p.x,y:p.y,r:0,max:250,life:0.5,color:'#aa6633'}); break;
    case 'roar': aoeSlash(p, 2000, Math.PI*2, p.atk*2*dh, '#ffaa30'); stunAround(p, 2000, 3); knockbackAround(p, 2000, 600); shake(15); break;
    case 'pounce': dashAttack(p, 350, p.atk*2*dh, false); break;
    case 'summon_wolf': for (let i=0;i<3;i++){ const m = makeCreature('wolf', p.x+rand(-40,40), p.y+rand(-40,40), false); m.isMinion = true; m.ownerPlayer = p; m.life=15; m.maxLife=15; G.minions.push(m);} break;
    case 'frenzy': p.rageT = 12; p.bonusAtkMult*=2; p.bonusDefMult*=2; recalcStats(p); p._healOnKill=true; setTimeout(()=>{ if (p && (!p.isPlayer || p===G.player)) p._healOnKill=false; },12000); break;
    case 'breath': coneBreath(p, 400, Math.PI/2.5, p.atk*0.6*dh, '#ff6644'); break;
    case 'whirl': G.hazards.push({type:'whirl', x:p.x, y:p.y, r:180, life:3, dmg:p.atk*0.4*dh, color:p.color, tick:0, owner:p, followOwner:true}); break;
    case 'dragon_form': p.titanT=15; p.bonusAtkMult*=2; p.bonusDefMult*=2; p.bonusSizeMult*=1.5; recalcStats(p); break;
    case 'dive': dashAttack(p, 400, p.atk*3*dh, false); break;
    case 'feather_storm': for (let i=0;i<12;i++) fireProjectile(p, p.facing-Math.PI/4+i*(Math.PI/2)/11, p.rngDmg*0.5*dh, p.rngSpd*0.9, p.color); break;
    case 'thunder_dive': skyLightning(p, 8, p.atk*4*dh, 700); break;
    case 'shadow_arrow': fireProjectile(p, p.facing, p.rngDmg*2*dh, p.rngSpd*1.2, '#aa66ff', 6); break;
    case 'darkness': p.darkT = 8; p.invuln=0.1; flash('#220033',0.3); break;
    case 'death_gaze': deathGaze(p); break;
    case 'combo3':
      for (let i=0;i<3;i++) setTimeout(()=>{ if (!G.started||G.dead) return; if (p.isPlayer && p!==G.player) return; if (p.hp>0) aoeSlash(p, 100, Math.PI*0.8, p.atk*0.8*dh, '#ffaaaa'); }, i*150); break;
    case 'bloodrage': p.rageT = 6; p.bonusAtkMult*=1.5; recalcStats(p); break;
    case 'abyss': for (let i=0;i<5;i++){ const m = makeCreature('shark', p.x+rand(-60,60), p.y+rand(-60,60), false); m.isMinion=true; m.ownerPlayer=p; m.life=12; m.maxLife=12; G.minions.push(m);} break;
    case 'shock': aoeSlash(p, 250, Math.PI*2, p.atk*1.5*dh, '#ffff80'); stunAround(p, 250, 0.5); break;
    case 'chain': chainLightning(p, 8, p.atk*0.6*dh, 300); break;
    case 'sky_lightning': skyLightning(p, 15, p.atk*1.5*dh, 1200); break;
    case 'poison_sting': fireProjectile(p, p.facing, p.atk*1.5*dh, 600, '#aaff00', 1); break;
    case 'poison_cloud': G.hazards.push({type:'poison', x:p.x, y:p.y, r:200, life:6, dmg:p.atk*0.3*dh, color:'#88ff44', tick:0, owner:p}); break;
    case 'plague': for (const e of G.enemies){ if (dist(e,p)<3000){ e.poison = 10; }} flash('#88ff44',0.4); break;
    // v2.2.0 new utility skills
    case 'shield': {
      const amount = (p.maxHp||100) * 0.6 * boost + 80;
      p.shieldHp = Math.max(p.shieldHp||0, amount);
      p.shieldT = 8;
      flash('#88ccff', 0.35); shake(6);
      G.shockwaves.push({x:p.x,y:p.y,r:0,max:p.r*4,life:0.5,color:'#88ccff'});
      if (p.isPlayer) addFloat(p.x, p.y-30, `Shield +${amount|0}`, '#88ccff', 16, 1.4);
    } break;
    case 'lifesteal_aura': {
      p.lifestealT = 8;
      p.lifestealPct = 0.4 * boost;
      flash('#cc1133', 0.35);
      G.shockwaves.push({x:p.x,y:p.y,r:0,max:p.r*4,life:0.5,color:'#cc1133'});
      if (p.isPlayer) addFloat(p.x, p.y-30, `Vampire ${(p.lifestealPct*100)|0}% ×8s`, '#cc1133', 16, 1.4);
    } break;
    case 'dmg_transfer': {
      p.dmgTransferT = 8;
      p.dmgTransferPct = Math.min(0.85, 0.7 * boost);
      flash('#ff8844', 0.35);
      G.shockwaves.push({x:p.x,y:p.y,r:0,max:p.r*5,life:0.6,color:'#ff8844'});
      if (p.isPlayer) addFloat(p.x, p.y-30, `Bond → ${(p.dmgTransferPct*100)|0}% ×8s`, '#ff8844', 16, 1.4);
    } break;
  }
}
function aoeSlash(p, radius, arc, dmg, color){
  const enemies = enemiesOf(p);
  for (const e of enemies){
    const d = dist(p,e); if (d > radius + e.r) continue;
    if (arc < Math.PI*2){
      const ang = angTo(p,e);
      const delta = Math.abs(((ang - p.facing + Math.PI*3) % (Math.PI*2)) - Math.PI);
      if (delta > arc/2) continue;
    }
    dealDamage(p, e, dmg, color);
  }
  G.shockwaves.push({x:p.x,y:p.y,r:0,max:radius,life:0.3,lifeMax:0.3,color, arc, facing:p.facing});
}
function knockbackAround(p, radius, force){
  for (const e of enemiesOf(p)){
    const d = dist(p,e); if (d>radius) continue;
    const ang = angTo(p,e);
    e.x += Math.cos(ang)*force*0.05; e.y += Math.sin(ang)*force*0.05;
  }
}
function stunAround(p, radius, dur){
  for (const e of enemiesOf(p)){ if (dist(p,e)<=radius) e.stun = Math.max(e.stun,dur); }
}
function dashAttack(p, dist_, dmg, bleed){
  const ang = p.facing;
  const tx = p.x + Math.cos(ang)*dist_, ty = p.y + Math.sin(ang)*dist_;
  for (const e of enemiesOf(p)){
    // 路徑碰撞：簡化為線段距離
    const px = e.x-p.x, py = e.y-p.y;
    const t = clamp((px*Math.cos(ang)+py*Math.sin(ang))/dist_, 0, 1);
    const cx = p.x+Math.cos(ang)*dist_*t, cy=p.y+Math.sin(ang)*dist_*t;
    if (Math.hypot(e.x-cx,e.y-cy) < e.r+30){
      dealDamage(p,e,dmg,'#ffcccc'); if (bleed) e.bleed = 5;
    }
  }
  p.x = clamp(tx,20,WORLD.w-20); p.y = clamp(ty,20,WORLD.h-20);
  p.invuln = 0.2;
  for (let i=0;i<12;i++) G.particles.push({x:p.x,y:p.y,vx:rand(-200,200),vy:rand(-200,200),life:0.4,color:p.color,r:2});
}
function grabNearest(p, dmg){
  let best=null,bd=Infinity;
  for (const e of enemiesOf(p)){ const d=dist(p,e); if (d<400 && d<bd){bd=d; best=e;} }
  if (!best) return;
  const tx = best.x, ty = best.y;
  for (let i=0;i<6;i++) setTimeout(()=>{
    if (!G.started||G.dead) return;
    if (p.isPlayer && p!==G.player) return;
    if (best && best.hp>0){ dealDamage(p,best,dmg,'#cc3333'); best.stun=0.3; best.x=tx; best.y=ty; }
  }, i*300);
}
function coneBreath(p, dist_, arc, dmg, color){
  for (const e of enemiesOf(p)){
    const d=dist(p,e); if (d>dist_) continue;
    const ang=angTo(p,e);
    const delta = Math.abs(((ang - p.facing + Math.PI*3) % (Math.PI*2)) - Math.PI);
    if (delta > arc/2) continue;
    dealDamage(p,e,dmg,color); e.bleed = Math.max(e.bleed, 3);
  }
  G.shockwaves.push({x:p.x,y:p.y,r:0,max:dist_,life:0.4,lifeMax:0.4,color,arc,facing:p.facing});
}
function chainLightning(p, jumps, dmg, range){
  let cur = p, hit = new Set([p]);
  let cx = p.x, cy = p.y;
  for (let i=0;i<jumps;i++){
    let best=null, bd=Infinity;
    for (const e of enemiesOf(p)){
      if (hit.has(e)) continue;
      const d=Math.hypot(e.x-cx,e.y-cy);
      if (d<range && d<bd){ bd=d; best=e; }
    }
    if (!best) break;
    dealDamage(p,best,dmg,'#fff080');
    G.particles.push({x:cx,y:cy,vx:0,vy:0,life:0.3,color:'#fff080',r:3, line:{x:best.x,y:best.y}});
    hit.add(best); cx=best.x; cy=best.y; cur=best;
  }
}
function skyLightning(p, count, dmg, range){
  for (let i=0;i<count;i++){
    const x = p.x + rand(-range,range), y = p.y + rand(-range,range);
    G.shockwaves.push({x,y,r:0,max:120,life:0.4,color:'#fff080'});
    for (const e of enemiesOf(p)){
      if (Math.hypot(e.x-x,e.y-y) < 120) dealDamage(p,e,dmg,'#fff080');
    }
  }
  flash('#fff080', 0.3); shake(10);
}
function swordRain(p, count, dmg){
  const targets = enemiesOf(p).filter(e=>dist(e,p)<700).slice(0, count);
  for (let i=0;i<count;i++){
    const t = targets[i%Math.max(1,targets.length)] || {x:p.x+rand(-400,400),y:p.y+rand(-400,400)};
    setTimeout(()=>{
      if (!G.started||G.dead) return;
      if (p.isPlayer && p!==G.player) return;
      if (!t || !t.hp || t.hp<=0) return;
      const ang = angTo({x:p.x+rand(-50,50),y:p.y+rand(-50,50)}, t);
      const proj = {x:p.x+rand(-30,30),y:p.y+rand(-30,30), vx:Math.cos(ang)*800, vy:Math.sin(ang)*800, dmg, color:'#ffeb88', owner:p, life:1, pierce:1, hit:new Set(), r:6};
      G.projectiles.push(proj);
    }, i*80);
  }
}
function deathGaze(p){
  let best=null,bd=Infinity;
  for (const e of enemiesOf(p)){ const d=dist(p,e); if (d<bd){bd=d;best=e;} }
  if (!best) return;
  G.particles.push({x:p.x,y:p.y,vx:0,vy:0,life:1.5,color:'#aa00ff',r:1, gaze:{target:best}});
  setTimeout(()=>{
    if (!G.started||G.dead) return;
    if (p.isPlayer && p!==G.player) return;
    if (best && best.hp>0){ best.hp -= 999; addFloat(best.x,best.y,'Death Gaze','#aa00ff',18,1.5); onKill(p,best);}
  },1500);
}
function enemiesOf(p){
  if (p.isPlayer) return G.enemies.filter(e=>e.hp>0);
  if (p.isMinion) return [G.player, ...G.enemies.filter(e=>e!==p && e.hp>0)].filter(x=>x && x.hp>0);
  return [G.player, ...G.minions.filter(m=>m.hp>0)].filter(x=>x && x.hp>0);
}

// =====================================================================
// 權柄釋放
// =====================================================================
function castAuthority(p, slot){
  const a = p.authoritySlots[slot]; if (!a) return;
  p.q.casts++;
  const dh = p.daohen;
  logMsg(`[${a.name}] cast!`, 'promote');
  pushKillFeed(`You cast ${a.name}`, a.color);
  playSound('auth');
  flash(a.color, 0.6); shake(20);
  switch(a.id){
    case 'fire': {
      const cnt = 20; // 從 30 降到 20，避免效果爆炸卡頓
      for (let i=0;i<cnt;i++){
        setTimeout(()=>{
          if (!G.started||G.dead) return;
          if (p!==G.player) return;
          const x = p.x + rand(-700,700), y = p.y + rand(-700,700);
          G.shockwaves.push({x,y,r:0,max:140,life:0.5,color:'#ff5530'});
          for (const e of enemiesOf(p)){
            if (Math.hypot(e.x-x,e.y-y) < 140) { dealDamage(p,e,240*dh,'#ff5530'); e.bleed = Math.max(e.bleed,6); }
          }
        }, i*60);
      }
      break;
    }
    case 'frost': {
      flash('#88e0ff', 0.8);
      for (const e of enemiesOf(p)){
        if (dist(p,e)<1500){ dealDamage(p,e,120*dh,'#88e0ff'); e.freeze = 6; }
      }
      G.shockwaves.push({x:p.x,y:p.y,r:0,max:1500,life:0.8,color:'#88e0ff'});
      break;
    }
    case 'thunder': {
      for (let i=0;i<5;i++) setTimeout(()=>{ if (!G.started||G.dead||p!==G.player) return; chainLightning(p, 30, 180*dh, 500); }, i*100);
      flash('#fff080', 0.5);
      break;
    }
    case 'gale': {
      for (const e of enemiesOf(p)){
        const d = dist(p,e); if (d<800){
          dealDamage(p,e,100*dh,'#aaffcc');
          const ang = angTo(p,e);
          e.x += Math.cos(ang)*400; e.y += Math.sin(ang)*400;
          e.slow = 4;
        }
      }
      G.shockwaves.push({x:p.x,y:p.y,r:0,max:800,life:0.6,color:'#aaffcc'});
      break;
    }
    case 'life': {
      p.maxHp += 100; p.hp = p.maxHp; p._regen = (p._regen||0) + 12; setTimeout(()=>{ if (p===G.player) p._regen = Math.max(0,(p._regen||0)-12); },60000);
      break;
    }
    case 'titan': {
      p.titanT = 30; p.bonusAtkMult *= 2.5; p.bonusDefMult *= 2; p.bonusSizeMult *= 2.2; recalcStats(p);
      break;
    }
    case 'time': {
      for (const e of enemiesOf(p)) e.freeze = 8;
      p.maxLife += 600; p.life += 600;
      G.shockwaves.push({x:p.x,y:p.y,r:0,max:2000,life:1.5,color:'#cc88ff'});
      flash('#cc88ff', 0.7);
      break;
    }
    case 'void': {
      // 空間裂縫：吸力 + 真實傷害 + 撕裂
      G.shockwaves.push({x:p.x,y:p.y,r:0,max:1200,life:1.6,color:'#7a00cc'});
      G.shockwaves.push({x:p.x,y:p.y,r:0,max:600,life:1.0,color:'#220033'});
      G.hazards.push({type:'rift', x:p.x, y:p.y, r:1200, life:2, dmg:0, color:'#7a00cc', tick:0, owner:p});
      for (const e of enemiesOf(p)){
        const d = dist(p,e); if (d<1200){
          const ang = angTo(e,p);
          e.x += Math.cos(ang)*Math.min(d*0.6, 600);
          e.y += Math.sin(ang)*Math.min(d*0.6, 600);
          e.hp -= 300*dh; e.bleed = Math.max(e.bleed||0, 8);
          addFloat(e.x,e.y-e.r,'300','#7a00cc',13,0.7);
          if (e.hp<=0) onKill(p,e);
        }
      }
      { const _nb=nearestBoss(p); if (_nb && _nb.hp>0 && dist(p,_nb)<1200){ applyDamageToBoss(300*dh, _nb); } }
      flash('#7a00cc', 0.6);
      break;
    }
    case 'omni': {
      // 揭示全圖 + 重擊 Boss + 全圖修為加成
      G.revealT = 12;
      p.qiBonusT = 90; p.qiBonusMul = 1.5;
      { const _nb=nearestBoss(p); if (_nb && _nb.hp>0){ applyDamageToBoss(800*dh,_nb); addFloat(_nb.x,_nb.y-_nb.r-40,'Starfall 800!','#ffdd66',20,1.5); } }
      flash('#ffdd66', 1.0); shake(20);
      // 揭示時填滿 visited
      if (G.visited){ for (let y=0;y<G.visited.length;y++) for (let x=0;x<G.visited[0].length;x++) G.visited[y][x] = 1; }
      pushKillFeed('★ Stars Align! Map revealed','#ffdd66');
      break;
    }
  }
}

// =====================================================================
// 自動拾取
// =====================================================================
function autoPickup(p){
  const R2 = 70*70;
  // 靈氣磁吸
  for (const s of G.spirits){
    const dx = p.x-s.x, dy=p.y-s.y, d2=dx*dx+dy*dy;
    if (d2 < 250*250){ const d=Math.sqrt(d2)||1; s.x += dx/d*300* (1/60); s.y += dy/d*300*(1/60); }
    if (d2 < R2){
      let q = s.qi || 5;
      if (p.qiBonusT>0) q = (q * (p.qiBonusMul||1))|0;
      if (G.event && G.event.type==='aligned') q = (q * 1.5)|0;
      p.qi += q;
      addFloat(s.x,s.y,`+${q} XP`,'#bb88ff',10,0.6);
      s._gone = true;
    }
  }
  G.spirits = G.spirits.filter(s=>!s._gone);
  // 拾取
  for (const it of G.pickups){
    if (dist2(p,it) < R2){
      applyPickup(p, it);
      it._gone = true;
    }
  }
  G.pickups = G.pickups.filter(it=>!it._gone);
  // 權柄
  for (const a of G.authorities){
    if (dist2(p,a) < (60+40)*(60+40)){
      if (p.authoritySlots.length<6){
        p.authoritySlots.push(a); p.authCdT.push(0); p.q.authorities++;
        logMsg(`★ Picked up [${a.name}]`, 'promote');
        pushKillFeed(`You picked up ${a.name}`, a.color);
        playSound('promote');
        flash(a.color,0.5); shake(10);
        // v3.3.0: happyTime on Authority pickup — peak loot moment
        try { if (p.isPlayer && window.SDK && SDK.happyTime) SDK.happyTime(0.7); } catch(e){}
        a._gone = true;
      }
    }
  }
  G.authorities = G.authorities.filter(a=>!a._gone);
  for (const qs of G.qiSprings){
    if (dist(p, qs) < qs.r){
      // v1.8.3: slower passive Qi (was 12/s — too fast)
      p.qi += 4 * (1/60);
      if (!qs._floatT || G.time - qs._floatT > 0.8){ addFloat(p.x,p.y-30,'XP Spring +XP','#bb88ff',12,0.8); qs._floatT = G.time; }
    }
    qs.tcd -= 1/60;
    if (qs.tcd<=0){
      qs.tcd = 4;
      for (let i=0;i<2;i++){
        const ang = Math.random()*Math.PI*2, dd = rand(20, qs.r*0.9);
        G.spirits.push({x:qs.x+Math.cos(ang)*dd, y:qs.y+Math.sin(ang)*dd, pulse:Math.random()*Math.PI*2, qi:3});
      }
    }
  }
  // v2.1.0: capture-and-hold rifts — stand inside (no enemies) to channel; takes ~8s; contested if foes inside
  for (const rf of G.rifts){
    if (rf.used) continue;
    const inside = dist(p, rf) < rf.r;
    if (!inside){
      // slow decay when no one channeling
      rf.cap = Math.max(0, (rf.cap||0) - 6*(1/60));
      rf.contested = false;
      continue;
    }
    // count hostile enemies inside zone (alive)
    let foes = 0;
    for (const e of G.enemies){ if (!e._dead && e.hp>0 && Math.hypot(e.x-rf.x,e.y-rf.y) < rf.r) foes++; }
    if (foes > 0){
      rf.contested = true;
      rf.cap = Math.max(0, (rf.cap||0) - 4*foes*(1/60));
    } else {
      rf.contested = false;
      // channel: 8s clear = 12.5/s -> use 15/s for snappier feel
      rf.cap = Math.min(100, (rf.cap||0) + 15*(1/60));
      // light passive while channeling
      p.qi += 0.5;
      if (p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + p.maxHp*0.002);
    }
    if (rf.cap >= 100){
      rf.cap = 0;
      rf.used = true;
      rf.owner = p;
      rf.ownerName = p.name || 'You';
      rf.ownT = 90; // ownership/cooldown 90s before reopens
      p.q.riftsUsed++;
      p.sanity = Math.min(p.maxSanity, p.sanity+25);
      G.timeline.push({t:G.time, text:'Captured '+rf.name});
      grantRiftReward(p, rf);
    }
  }
  // v1.7.0: SAN system removed — pin sanity full so legacy quest gates never block
  p.sanity = p.maxSanity;
  tryPromote(p);
}
function grantRiftReward(p, rf){
  logMsg('★ Opened ['+rf.name+'】！', 'promote');
  pushKillFeed('★ '+rf.name, rf.color);
  try{ playSound('promote'); }catch(e){}
  try{ flash(rf.color, 0.7); shake(18); }catch(e){}
  for (let i=0;i<60;i++) G.particles.push({x:rf.x,y:rf.y,vx:rand(-400,400),vy:rand(-400,400),life:1.2,color:rf.color,r:3});
  G.shockwaves.push({x:rf.x,y:rf.y,r:0,max:400,life:1,color:rf.color});
  if (rf.reward==='qi'){
    p.qi += 200; addFloat(p.x,p.y-30,'+200 XP','#bb88ff',18,1.5);
  } else if (rf.reward==='heal'){
    p.maxHp = Math.floor(p.maxHp*1.15); p.hp = p.maxHp; p.maxLife += 60; p.life = p.maxLife;
    addFloat(p.x,p.y-30,'HP +15%','#ff7080',18,1.5);
  } else if (rf.reward==='power'){
    p.zhenyuan += 0.3; p.daohen += 0.3; recalcStats(p); p.hp = p.maxHp;
    addFloat(p.x,p.y-30,'Essence +30% Dao +30%','#ffd66b',18,1.5);
  } else if (rf.reward==='all'){
    p.qi += 120; p.zhenyuan += 0.2; p.daohen += 0.2; p.maxHp = Math.floor(p.maxHp*1.1); recalcStats(p); p.hp = p.maxHp;
    addFloat(p.x,p.y-30,'Outer God Boon · All Stats +','#aa44ff',18,1.8);
  }
}
function applyPickup(p, it){
  playSound('pickup');
  if (it.qi){ p.qi += it.qi; addFloat(p.x,p.y-20,`+${it.qi} XP`,'#bb88ff',12,1); }
  if (it.heal){ p.hp = Math.min(p.maxHp, p.hp+it.heal); addFloat(p.x,p.y-20,`+${it.heal} HP`,'#ff6677',12,1); }
  if (it.bighp){ p.maxHp += it.bighp; p.hp += it.bighp; addFloat(p.x,p.y-20,`+${it.bighp} max HP`,'#ff2244',14,1); }
  if (it.sta){ p.sta = Math.min(p.maxSta, p.sta+it.sta); }
  if (it.zy){ p.zhenyuan += it.zy; recalcStats(p); addFloat(p.x,p.y-20,`Essence +${(it.zy*100)|0}%`,'#ffd66b',14,1.2); }
  if (it.dh){ p.daohen += it.dh; addFloat(p.x,p.y-20,`Dao +${(it.dh*100)|0}%`,'#ddccff',14,1.2); }
  if (it.cdreset){ p.skillQT=p.skillET=p.skillRT=0; for (let i=0;i<p.authCdT.length;i++) p.authCdT[i]=0; addFloat(p.x,p.y-20,'CD Reset','#aaffff',14,1.2); }
  if (it.life){ p.life = Math.min(p.maxLife, p.life+it.life); addFloat(p.x,p.y-20,`+${it.life}s Lifespan`,'#cc88ff',14,1.2); }
  logMsg(`Picked up ${it.name}`);
}

// =====================================================================
// AI
// =====================================================================
function aiUpdate(e, dt){
  if (e.hp<=0) return;
  if (!isFinite(e.x) || !isFinite(e.y)){ e.x = clamp(e.x||WORLD.w/2,20,WORLD.w-20); e.y = clamp(e.y||WORLD.h/2,20,WORLD.h-20); }
  if (e.freeze>0){ e.freeze-=dt; return; }
  if (e.stun>0){ e.stun-=dt; return; }
  if (e.bleed>0){ e.hp -= 5*dt; e.bleed-=dt; }
  if (e.poison>0){ e.hp -= 10*dt; e.poison-=dt; }
  if (e.slow>0) e.slow-=dt;
  if (e.atkCdT>0) e.atkCdT-=dt;
  if (e.rngCdT>0) e.rngCdT-=dt;
  if (e.skillQT>0) e.skillQT-=dt;
  e.aiTimer-=dt;
  // 找目標（視野設為 500，比原 800 低）
  let tgt = null, td = Infinity;
  const cands = e.isMinion ? G.enemies.filter(x=>x.hp>0) : [G.player, ...G.minions.filter(m=>m.hp>0)];
  const sightR = 500 + (e.rank||1)*20;
  for (const c of cands){
    if (!c||c.hp<=0) continue;
    if (c.isPlayer && c.invuln>0) continue; // 出生保護時 AI 無視玩家
    const d=dist(e,c); if (d<sightR && d<td){ td=d; tgt=c; }
  }
  // 每只 AI 有個「懶散度」：低階心虐手軟，高階才主動進攒
  if (e.aiLazy === undefined) e.aiLazy = rand(0.3, 0.85) - (e.rank||1)*0.04;
  if (!tgt || Math.random() < e.aiLazy*dt*0.6){
    // 漫遊
    if (e.aiTimer<=0){ e.aiTimer=rand(1.5,4); e._wx=rand(-1,1); e._wy=rand(-1,1); const l=Math.hypot(e._wx,e._wy)||1; e._wx/=l; e._wy/=l; }
    e.vx = (e._wx||0)*e.spd*0.35; e.vy = (e._wy||0)*e.spd*0.35;
    // 漫遊時頭部朝向與移動方向一致
    if (Math.hypot(e.vx, e.vy) > 0.05) e.facing = Math.atan2(e.vy, e.vx);
  } else {
    e.facing = angTo(e,tgt);
    // 近戰範圍內：攻擊
    if (td < e.atkR + e.r + tgt.r){
      e.vx*=0.5; e.vy*=0.5;
      // v3.5.2: low-rank AI attacks less precisely — lower hit chance, longer cooldown
      const hitChance = (e.rank||1) <= 3 ? 0.35 : 0.70;
      const cdMult    = (e.rank||1) <= 3 ? 2.0  : 1.35;
      if (e.atkCdT<=0 && Math.random()<hitChance){ doMelee(e); e.atkCdT = e.atkCd * cdMult; }
    } else if (e.rngDmg>0 && td<e.rngR && e.rngCdT<=0 && Math.random()<((e.rank||1)<=3?0.07:0.22)){
      doRanged(e); e.rngCdT = e.rngCd*((e.rank||1)<=3 ? 3.5 : 2.2);
    } else {
      // v3.5.2: rank 1-3 AI chases at 65% speed — easy to kite
      const chaseSp = (e.rank||1) <= 3 ? 0.60 : 0.85;
      const ang=angTo(e,tgt); const sp = e.spd*chaseSp*(e.slow>0?0.5:1);
      e.vx=Math.cos(ang)*sp; e.vy=Math.sin(ang)*sp;
    }
    // AI 技能釋放機率大幅下調（1/8 以下）
    if (e.skillQT<=0 && td<380 && Math.random()<0.0012 && !(tgt && tgt.isPlayer && tgt.invuln>0) && e.rank>=(e.sp.skillQ.unlockRank||1)){ try{ castSkill(e, e.sp.skillQ, 'Q'); }catch(err){ console.warn('AI skill err', err);} e.skillQT = e.sp.skillQ.cd * 1.5; }
  }
  e.x = clamp(e.x+e.vx*dt, 20, WORLD.w-20);
  e.y = clamp(e.y+e.vy*dt, 20, WORLD.h-20);
  // AI 修為（很慢、由擊殺）
}

// =====================================================================
// 投射物 / 危險區 / 召喚物
// =====================================================================
function _bossProjCheck(pr){
  if (!G.bosses.length) return false;
  if (pr.hostile) return false;
  for (const b of G.bosses){
    if (!b || b.hp<=0) continue;
    if (Math.hypot(pr.x-b.x, pr.y-b.y) < b.r + (pr.r||4)){
      applyDamageToBoss(pr.dmg||10, b); pr._dead=true; G.particles.push({x:pr.x,y:pr.y,vx:0,vy:0,life:0.3,color:"#aa44ff",r:3}); return true;
    }
  }
  return false;
}
function _playerMeleeBoss(p){
  if (!G.bosses.length || !p || !p.isPlayer) return;
  if (dist(p, G.bosses[0]) < (p.atkR||50) + G.bosses[0].r && p.atkCdT<=0){
    /* melee handled in player attack code */
  }
}
function updateProjectiles(dt){
  for (const pr of G.projectiles){
    pr.x += pr.vx*dt; pr.y += pr.vy*dt; pr.life-=dt;
    if (pr.life<=0 || pr.x<0||pr.y<0||pr.x>WORLD.w||pr.y>WORLD.h){ pr._gone=true; continue; }
    let targets = pr.owner.isPlayer ? G.enemies : (pr.owner.isMinion ? G.enemies.filter(e=>e!==pr.owner) : [G.player, ...G.minions]);
    if (pr.owner && pr.owner.isPlayer){
      for (const _b of G.bosses){ if (_b && _b.hp>0) targets.push(_b); }
      if (G.miniboss && G.miniboss.hp>0) targets = targets.concat([G.miniboss]);
      // v1.2.0 PvP 彈道：遠端玩家可被命中
      if (window.Net && Net.online){
        for (const [pid, peer] of Net.peers){
          if (!peer || !peer.alive || peer.x===undefined) continue;
          targets.push({ x:peer.x, y:peer.y, r:peer.r||14, hp:1, _isRemotePeer:true, _remoteId:pid, _peerRef:peer });
        }
      }
    }
    for (const t of targets){
      if (!t || t.hp<=0 || pr.hit.has(t)) continue;
      if (Math.hypot(t.x-pr.x,t.y-pr.y) < t.r+pr.r){
        dealDamage(pr.owner, t, pr.dmg, pr.color);
        pr.hit.add(t); pr.pierce--;
        if (pr.pierce<=0){ pr._gone=true; break; }
      }
    }
  }
  for (const pr of G.projectiles){ if (!pr._gone && !pr._dead) _bossProjCheck(pr); }
  G.projectiles = G.projectiles.filter(p=>!p._gone && !p._dead);
}
function updateHazards(dt){
  for (const h of G.hazards){
    h.life-=dt; if (h.life<=0){ h._gone=true; continue; }
    if (!h.owner || h.owner.hp<=0){ h._gone=true; continue; } // 主人死，hazard 隨之消失
    if (h.followOwner){ h.x=h.owner.x; h.y=h.owner.y; }
    h.tick -= dt;
    if (h.tick<=0){
      h.tick = 0.4;
      for (const e of enemiesOf(h.owner)){
        if (dist(e,h)<h.r){
          dealDamage(h.owner, e, h.dmg, h.color);
          if (h.type==='poison') e.poison = Math.max(e.poison,3);
          if (h.type==='bloodpool') e.bleed = Math.max(e.bleed,3);
        }
      }
    }
  }
  G.hazards = G.hazards.filter(h=>!h._gone);
}

// =====================================================================
// 死亡 / 勝利
// =====================================================================
// v2.5.0: render side-by-side form silhouettes on death-card canvas
function _renderDeathFormCanvas(curForm, nextPreview){
  const cvs = document.getElementById('deathFormCanvas');
  if (!cvs || !cvs.getContext) return;
  const cx = cvs.getContext('2d');
  cx.clearRect(0,0,cvs.width,cvs.height);
  const g = cx.createLinearGradient(0,0,cvs.width,0);
  g.addColorStop(0,'rgba(20,16,28,0.0)');
  g.addColorStop(0.5,'rgba(60,40,80,0.25)');
  g.addColorStop(1,'rgba(20,16,28,0.0)');
  cx.fillStyle = g; cx.fillRect(0,0,cvs.width,cvs.height);

  const drawForm = (x, form, label, alpha, glow) => {
    if (!form) return;
    cx.save();
    cx.globalAlpha = alpha;
    if (glow){
      cx.shadowColor = form.color || '#ffd66b';
      cx.shadowBlur = 22;
    }
    cx.font = 'bold 78px serif';
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.fillStyle = form.color || '#ffd66b';
    cx.fillText(form.icon || '?', x, 70);
    cx.shadowBlur = 0;
    cx.font = 'bold 14px system-ui';
    cx.fillStyle = '#ffe9b8';
    cx.fillText(form.name || '', x, 122);
    cx.font = '11px system-ui';
    cx.fillStyle = '#aaa';
    cx.fillText(label, x, 140);
    cx.restore();
  };

  if (nextPreview){
    drawForm(130, curForm, 'You reached', 1.0, false);
    cx.save();
    cx.strokeStyle = '#ffd66b'; cx.lineWidth = 3;
    cx.beginPath(); cx.moveTo(220, 70); cx.lineTo(300, 70); cx.stroke();
    cx.beginPath(); cx.moveTo(295,62); cx.lineTo(305,70); cx.lineTo(295,78); cx.stroke();
    cx.font = 'bold 12px system-ui';
    cx.fillStyle = '#ffd66b';
    cx.textAlign = 'center';
    cx.fillText('NEXT', 260, 54);
    cx.fillText('REVEAL', 260, 92);
    cx.restore();
    drawForm(390, nextPreview.form, `Tier ${nextPreview.targetRank} · locked`, 0.45, true);
    cx.save();
    cx.globalAlpha = 0.85;
    cx.font = 'bold 56px system-ui';
    cx.fillStyle = '#1a1208';
    cx.strokeStyle = '#ffd66b'; cx.lineWidth = 3;
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.strokeText('?', 390, 70);
    cx.fillText('?', 390, 70);
    cx.restore();
  } else {
    drawForm(260, curForm, 'FINAL FORM ACHIEVED', 1.0, true);
  }
}
function _renderDeathQiBar(nextPreview){
  const wrap = document.getElementById('deathQiBar');
  const fill = document.getElementById('deathQiBarFill');
  if (!wrap || !fill) return;
  if (!nextPreview || !G.player){ wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  const targetThr = (typeof QI_THR !== 'undefined') ? (QI_THR[nextPreview.targetRank-1] || 0) : 0;
  const current = Math.max(0, targetThr - nextPreview.qiNeed);
  const pct = targetThr > 0 ? Math.min(100, Math.floor((current/targetThr)*100)) : 0;
  fill.style.width = pct + '%';
}
function _setupShareButton(curForm, nextPreview, coinsEarned){
  const btn = document.getElementById('shareBtn');
  if (!btn) return;
  const url = (typeof location !== 'undefined' && location.href) ? location.href.split('?')[0].split('#')[0] : 'https://evo.example';
  const formTxt = curForm ? `${curForm.icon} ${curForm.name}` : (G.player && G.player.sp ? G.player.sp.name : 'a creature');
  const stats = G.player ? `Tier ${G.player.rank} · ${G.player.q.kills} kills · ${(G.time/60)|0}m${(G.time%60)|0}s` : '';
  const haveF = formsDiscoveredCount();
  const totF = totalFormsCount();
  const text = `I evolved into ${formTxt} in Evo — ${stats}. ${haveF}/${totF} forms discovered. Can you beat me? ${url}`;
  btn.textContent = '📷 Share My Run';
  btn.disabled = false;
  btn.onclick = async ()=>{
    try { bumpMetric('sharesClicked', 1); } catch(e){}
    btn.disabled = true; btn.textContent = 'Sharing…';
    try {
      if (navigator.share){
        await navigator.share({ title:'Evo — I just evolved!', text, url });
        btn.textContent = '✓ Shared!';
      } else if (navigator.clipboard && navigator.clipboard.writeText){
        await navigator.clipboard.writeText(text);
        btn.textContent = '✓ Copied — paste anywhere!';
      } else {
        const tw = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
        window.open(tw, '_blank');
        btn.textContent = '✓ Opened Twitter';
      }
    } catch(e){
      btn.textContent = '📷 Share My Run';
      btn.disabled = false;
    }
    setTimeout(()=>{ btn.disabled = false; btn.textContent = '📷 Share My Run'; }, 3500);
  };
}

function die(reason){
  if (G.dead) return;
  // 進階能力：Immortal Phoenix — 復活一次
  if (G.player && G.player.perks && G.player.perks.revive>0 && !G.player._revivedOnce){
    G.player._revivedOnce = true;
    G.player._dead = false; // v3.5.0: clear _dead flag so attacks register again
    G.player.hp = G.player.maxHp;
    G.player.sta = G.player.maxSta;
    G.player.invuln = 4;
    G.shockwaves.push({x:G.player.x,y:G.player.y,r:0,max:500,life:1.2,color:'#ffaa30'});
    for (let i=0;i<120;i++) G.particles.push({x:G.player.x,y:G.player.y,vx:rand(-500,500),vy:rand(-500,500),life:1.6,color:'#ffaa30',r:3});
    flash('#ffaa30', 0.7); shake(30); playSound('promote');
    pushKillFeed('★ Rebirth!', '#ffaa30');
    logMsg('★ Rebirth! Phoenix power lifts you again','promote');
    return;
  }
  G.killStreak = 0;
  G.dead = true;
  try { saveProgress({onDeath:true}); } catch(e){}
  playSound('death');
  // v2.8.0: cinematic death — explosive FX + 1.6s slow-mo before overlay (short-video gold)
  G._deathReason = reason || G.deathBy || 'Unknown cause';
  G._deathCinT = 1.6;
  if (G.player){
    G.shockwaves.push({x:G.player.x,y:G.player.y,r:0,max:700, life:1.4,color:'#ff3344'});
    G.shockwaves.push({x:G.player.x,y:G.player.y,r:0,max:1100,life:1.8,color:'#ffaa30'});
    for (let i=0;i<160;i++){
      G.particles.push({
        x:G.player.x, y:G.player.y,
        vx:rand(-700,700), vy:rand(-700,700),
        life:1.6 + Math.random()*0.8,
        color: i%3===0?'#ff4444':(i%3===1?'#ffaa30':'#ffffff'),
        r: 2 + Math.random()*2,
      });
    }
    try { confettiBurst(G.player.x, G.player.y, 50); } catch(e){}
    try { popComedy(G.player.x, G.player.y-40, true); } catch(e){}
    flash('#ff3344', 0.9); shake(55);
    G.player._ragSpin = (Math.random()<0.5?-1:1) * 14;
  }
  try { stopBGM(); } catch(e){}
}
function _showDeathOverlay(){
  if (!G.dead) return;
  if (G._deathOverlayShown) return;
  G._deathOverlayShown = true;
  const reason = G._deathReason || G.deathBy || 'Unknown cause';
  document.getElementById('death').classList.remove('hidden');
  document.getElementById('deathReason').textContent = reason;
  // v1.6.2: leaderboard rank in death stats
  let _rankTxt = '';
  try {
    const lb = G.leaderboard || [];
    const idx = lb.findIndex(e=>e && e.isPlayer);
    if (idx>=0) _rankTxt = ` · Leaderboard #${idx+1}/${lb.length}`;
  } catch(e){}
  const _on = window.Net && Net.online;
  // v1.7.0: award coins and show in death stats
  let _coinsEarned = 0;
  try { _coinsEarned = awardRunCoins(); } catch(e){}
  const _coinTxt = (_coinsEarned>0) ? ` · ★ +${_coinsEarned} coins earned (Total: ${getCoins()})` : '';
  document.getElementById('deathStats').textContent =
    `Tier ${G.player.rank} ${tierIcon(G.player)} ${tierName(G.player)} · Kills ${G.player.q.kills} · High-tier ${G.player.q.killHighTier} · XP ${G.player.qi} · Survived ${(G.time/60)|0}m${(G.time%60)|0}s`
    + _rankTxt
    + _coinTxt
    + (_on?` · ${Net.peers.size+1} online`:'');
  const _curForm = getRankForm(G.player);
  const _nextPreview = getNextEvolutionPreview(G.player);
  const _deathNext = document.getElementById('deathNextForm');
  const _deathHook = document.getElementById('deathHook');
  const _restartBtn = document.getElementById('restartBtn');
  if (_deathNext){
    if (_nextPreview){
      _deathNext.textContent = `${_curForm?_curForm.icon+' '+_curForm.name:G.player.sp.name} → ${_nextPreview.form.icon} ${_nextPreview.form.name} at Tier ${_nextPreview.targetRank} · ${_nextPreview.qiNeed} more XP to reveal it`;
    } else {
      _deathNext.textContent = `Final evolution reached: ${_curForm?_curForm.icon+' '+_curForm.name:G.player.sp.name}`;
    }
  }
  if (_deathHook){
    if (_nextPreview){
      _deathHook.textContent = `Play again now: your next blind-box reveal is only ${_nextPreview.qiNeed} XP away.`;
    } else {
      _deathHook.textContent = 'Play again for a cleaner route, faster snowball, and a higher leaderboard finish.';
    }
  }
  if (_restartBtn) _restartBtn.textContent = _nextPreview ? `Play Again · Reveal ${_nextPreview.form.icon}` : 'Play Again';
  // v2.7.0: 3-second restart delay so share button gets visible time (viral exposure)
  if (_restartBtn){
    _restartBtn.disabled = true;
    let _cd = 3;
    const _origTxt = _restartBtn.textContent;
    _restartBtn.textContent = `${_origTxt}  (${_cd}s)`;
    const _cdInt = setInterval(()=>{
      _cd--;
      if (_cd<=0){
        clearInterval(_cdInt);
        _restartBtn.disabled = false;
        _restartBtn.textContent = _origTxt;
      } else {
        _restartBtn.textContent = `${_origTxt}  (${_cd}s)`;
      }
    }, 1000);
    G._deathRestartCdInt = _cdInt;
  }
  // v2.5.0: render big silhouette canvas (current form -> next form) + XP progress bar + share button
  try { _renderDeathFormCanvas(_curForm, _nextPreview); } catch(e){}
  try { _renderDeathQiBar(_nextPreview); } catch(e){}
  try { _setupShareButton(_curForm, _nextPreview, _coinsEarned); } catch(e){}
  // forms-collected display
  try {
    const _fEl = document.getElementById('deathFormsTotal');
    if (_fEl){
      const _have = formsDiscoveredCount();
      const _tot = totalFormsCount();
      const _pct = Math.floor((_have/_tot)*100);
      _fEl.textContent = `📖 Form Codex: ${_have} / ${_tot} discovered (${_pct}%) — every new tier reveals a new form!`;
    }
  } catch(e){}
  // metrics: count this death
  try { bumpMetric('deaths', 1); bumpMetric('totalPlay', Math.floor(G.time||0)); } catch(e){}
  // v1.6.2: one-time rewarded-ad revive button
  const _revive = document.getElementById('reviveBtn');
  if (_revive){
    if (!G._reviveUsed && window.SDK && SDK.ready && typeof SDK.rewardedBreak==='function'){
      _revive.classList.remove('hidden');
      _revive.disabled = false;
      _revive.textContent = '▶ Watch Ad to Revive (Once per run)';
      _revive.onclick = async ()=>{
        if (G._reviveUsed) return;
        G._reviveUsed = true;
        _revive.disabled = true; _revive.textContent = 'Loading ad…';
        try { await SDK.rewardedBreak(); } catch(e){}
        // Restore 60% HP + invuln, hide death, resume
        G.dead = false;
        G._deathCinT = 0; G._deathOverlayShown = false; G._deathReason = null;
        document.getElementById('death').classList.add('hidden');
        if (G.player){
          G.player._dead = false; // v3.5.0: clear _dead so dealDamage doesn't block player attacks after revive
          G.player.hp = Math.max(G.player.hp, Math.floor(G.player.maxHp * 0.6));
          G.player.sta = G.player.maxSta;
          // v2.9.9: reset life timer so lifespan-exhaustion deaths don't immediately re-kill after revive
          if (G.player.life <= 0) G.player.life = Math.ceil((G.player.maxLife||120) * 0.5);
          G.player.invuln = 3; // reduced from 5s — enough protection without feeling "permanent"
          G.shockwaves.push({x:G.player.x,y:G.player.y,r:0,max:600,life:1.4,color:'#ffaa30'});
          for (let i=0;i<160;i++) G.particles.push({x:G.player.x,y:G.player.y,vx:rand(-600,600),vy:rand(-600,600),life:1.8,color:'#ffaa30',r:3});
          flash('#ffaa30', 0.9); shake(40); playSound('promote');
          pushKillFeed('★ Revived by Heaven’s Mercy!', '#ffaa30');
          logMsg('★ Revived! +60% HP restored','promote');
        }
      };
    } else {
      _revive.classList.add('hidden');
    }
  }
  // v1.8.0: rewarded-ad Double-Coins button (one-shot per run)
  const _cdb = document.getElementById('coinDoubleBtn');
  if (_cdb){
    if (_coinsEarned>0 && !G._coinDoubleUsed && window.SDK && SDK.ready && typeof SDK.rewardedBreak==='function'){
      _cdb.classList.remove('hidden');
      _cdb.disabled = false;
      _cdb.textContent = `▶ Watch Ad: 🪙 Double Coins! (+${_coinsEarned} more)`;
      _cdb.onclick = async ()=>{
        if (G._coinDoubleUsed) return;
        G._coinDoubleUsed = true;
        _cdb.disabled = true; _cdb.textContent = 'Loading ad…';
        let ok = false;
        try { ok = await SDK.rewardedBreak(); } catch(e){}
        if (ok !== false){
          addCoins(_coinsEarned);
          try { bumpLifetime(0,0,0,_coinsEarned); } catch(e){}
          _cdb.textContent = `✓ +${_coinsEarned} bonus coins! (Total: ${getCoins()})`;
          const _ds = document.getElementById('deathStats');
          if (_ds) _ds.textContent = _ds.textContent + ` → 🪙 +${_coinsEarned} bonus!`;
        } else {
          _cdb.textContent = 'Ad failed — try again next run';
        }
      };
    } else {
      _cdb.classList.add('hidden');
    }
  }
  // v1.0.0: 死亡時間軸
  try{
    const tl = (G.timeline||[]).slice(-8);
    if (tl.length){
      const txt = 'Cultivation Log:\n' + tl.map(e=>'  '+e.t.toFixed(0)+'s · '+e.text).join('\n');
      const el = document.getElementById('deathReason');
      if (el) el.textContent = (el.textContent||'') + '\n\n' + txt;
    }
  }catch(e){}
}
function winGame(){
  if (G.won) return;
  G.won = true;
  document.getElementById('win').classList.remove('hidden');
  // v1.1.0: 序列 0 愚者True God
  document.getElementById('winStats').textContent = `${G.player.path.name} · Seq 0 [Fool, the True God] enthroned! From mortal creature to ruler of all stars — the path is complete.`;
  // v3.4.0: stop active gameplay session + show end-of-game commercial (peak satisfaction — high engagement ad slot)
  try { if (window.SDK && SDK.ready){ SDK.gameplayStop && SDK.gameplayStop(); SDK.commercialBreak && SDK.commercialBreak(); } } catch(e){}
}

// =====================================================================
// 主循環
// =====================================================================
let canvas, ctx, dpr=1;
function setupCanvas(){
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  dpr = window.devicePixelRatio || 1;
  resize();
  window.addEventListener('resize', resize);
}
function resize(){
  // v1.5.0: cap DPR for mobile performance
  const raw = window.devicePixelRatio || 1;
  const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints>0);
  dpr = Math.min(raw, isMobile ? 1.5 : 2);
  canvas.width = Math.floor(window.innerWidth*dpr);
  canvas.height = Math.floor(window.innerHeight*dpr);
  canvas.style.width = window.innerWidth+'px';
  canvas.style.height = window.innerHeight+'px';
}
function drawStatusBanner(){
  if (!G.player) return;
  const p = G.player;
  const cx = window.innerWidth/2;
  if (p.invuln>0 && p.isPlayer){
    ctx.fillStyle = '#ffff80';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
    const t = `★ Spawn protect ${p.invuln.toFixed(1)}s ★`;
    ctx.strokeText(t, cx, 60); ctx.fillText(t, cx, 60);
  }
  if (p.defending){
    ctx.fillStyle = '#88e0ff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    const t = 'Defending (80% dmg reduction + reflect)';
    ctx.strokeText(t, cx, window.innerHeight-90); ctx.fillText(t, cx, window.innerHeight-90);
  }
}
let lastT=0;
function loop(t){
  let dt = Math.min(0.05, (t-lastT)/1000 || 0); lastT=t;
  // v1.5.0: pause when tab hidden / ad playing
  if (G.paused || document.hidden) dt = 0;
  G.frameAcc += dt; G.frameN++;
  if (G.frameAcc >= 0.5){ G.fps = Math.round(G.frameN / G.frameAcc); G.frameAcc = 0; G.frameN = 0; }
  try {
    if (dt>0 && G.started && !G.dead && !G.won){
      update(dt);
      G._saveTimer += dt;
      if (G._saveTimer >= 30){ G._saveTimer = 0; saveProgress(); }
    }
    // v2.8.0: death-cinema — keep updating world at slow-mo speed for 1.6s before showing overlay
    if (dt>0 && G.started && G.dead && G._deathCinT > 0){
      G._deathCinT -= dt;
      try { update(dt * 0.22); } catch(e){}  // slow-mo
      if (G._deathCinT <= 0){
        try { _showDeathOverlay(); } catch(e){}
      }
    }
    render();
  } catch(err){
    G.errorCount++;
    G.lastError = String(err);
    console.error('[loop error]', err);
    if (G.errorCount<5) pushKillFeed('⚠ Internal error recovered', '#ff8888');
  }
  requestAnimationFrame(loop);
}
function update(dt){
  G.time += dt;
  G._mDt = dt;
  // 相機平滑跟隨 + 世界邊界夾限 + NaN 保護
  if (!isFinite(G.player.x) || !isFinite(G.player.y)){ G.player.x = WORLD.w/2; G.player.y = WORLD.h/2; G.player.vx=0; G.player.vy=0; }
  G.cam.tx = G.player.x; G.cam.ty = G.player.y;
  const halfW = window.innerWidth/2, halfH = window.innerHeight/2;
  G.cam.tx = clamp(G.cam.tx, halfW, WORLD.w - halfW);
  G.cam.ty = clamp(G.cam.ty, halfH, WORLD.h - halfH);
  if (!isFinite(G.cam.x) || !isFinite(G.cam.y)){ G.cam.x = G.cam.tx; G.cam.y = G.cam.ty; }
  G.cam.x += (G.cam.tx - G.cam.x) * Math.min(1, dt*8);
  G.cam.y += (G.cam.ty - G.cam.y) * Math.min(1, dt*8);
  if (G.cam.shake>0) G.cam.shake = Math.max(0, G.cam.shake-dt*40);
  if (G.cam.flash>0) G.cam.flash = Math.max(0, G.cam.flash-dt*1.5);
  if (G.cam.hitFlash>0) G.cam.hitFlash = Math.max(0, G.cam.hitFlash-dt*1.5);
  // 滑鼠世界座標
  MOUSE.wx = G.cam.x + (MOUSE.x - window.innerWidth/2);
  MOUSE.wy = G.cam.y + (MOUSE.y - window.innerHeight/2);

  updatePlayer(G.player, dt);
  // v1.0.1: 玩家近戰可以打 Boss + 小 Boss
  if (G.player.hp>0){
    if (G.player._meleeTick === undefined) G.player._meleeTick = 0;
    G.player._meleeTick -= dt;
    const meleeReady = G.player._meleeTick<=0;
    if (meleeReady){
      let hit=false;
      for (const _b of G.bosses){ if (_b && _b.hp>0 && dist(G.player,_b)<(G.player.atkR||50)+_b.r+10){
        dealDamage(G.player, _b, G.player.atk*0.8, '#ffd66b');
        hit=true;
      }}
      if (G.miniboss && G.miniboss.hp>0 && dist(G.player,G.miniboss)<(G.player.atkR||50)+G.miniboss.r+10){
        dealDamage(G.player, G.miniboss, G.player.atk*1.0, '#66ccff');
        hit=true;
      }
      if (hit) G.player._meleeTick = G.player.atkCd || 0.4;
    }
  }
  // NaN 守衛
  if (!isFinite(G.player.x) || !isFinite(G.player.y)){
    G.player.x = WORLD.w/2; G.player.y = WORLD.h/2; G.player.vx=0; G.player.vy=0;
    pushKillFeed('⚠ Position reset', '#ff8888');
  }
  // v2.1.0: defensive skip — dead creatures must not run AI/attack even before filter runs
  for (const e of G.enemies){ if (e._dead || e.hp<=0) continue; try{ aiUpdate(e, dt); }catch(err){ e.hp=0; console.warn('ai err',err);} }
  for (const m of G.minions){ if (m._dead || m.hp<=0) { m.life=0; continue; } try{ aiUpdate(m, dt); }catch(err){ m.hp=0;} m.life-=dt; if (m.life<=0) m.hp=0; }
  updateProjectiles(dt);
  updateHazards(dt);
  // 粒子
  for (const p of G.particles){ p.x+=(p.vx||0)*dt; p.y+=(p.vy||0)*dt; p.life-=dt; }
  G.particles = G.particles.filter(p=>p.life>0);
  // 浮字
  for (const f of G.floats){ f.life-=dt; f.y += f.vy*dt; }
  G.floats = G.floats.filter(f=>f.life>0);
  // 衝擊波
  for (const s of G.shockwaves){ if (s.lifeMax===undefined) s.lifeMax=s.life; s.life-=dt; s.r = s.max * (1 - s.life/s.lifeMax); }
  G.shockwaves = G.shockwaves.filter(s=>s.life>0);
  // 防止特效爆炸導致 FPS 過低卡頓
  // v3.3.0: adaptive particle cap — mobile/low-pixel devices keep 250, desktop 500
  const _pcap = (window.innerWidth < 720 || (navigator.hardwareConcurrency||4) <= 2) ? 250 : 500;
  if (G.particles.length>_pcap) G.particles.splice(0, G.particles.length-_pcap);
  if (G.shockwaves.length>80) G.shockwaves.splice(0, G.shockwaves.length-80);
  if (G.floats.length>120) G.floats.splice(0, G.floats.length-120);
  if (G.projectiles.length>200) G.projectiles.splice(0, G.projectiles.length-200);
  // 玩家 regen
  if (G.player._regen) G.player.hp = Math.min(G.player.maxHp, G.player.hp + G.player._regen*dt);
  // Kill feed 老化
  for (const k of G.killFeed) k.life-=dt;
  G.killFeed = G.killFeed.filter(k=>k.life>0);
  // 清理死敵 + 補充
  G.enemies = G.enemies.filter(e=>e.hp>0 && isFinite(e.x) && isFinite(e.y));
  G.minions = G.minions.filter(m=>m.hp>0);
  // v1.0.0: 大地圖敵人數量隨階段提升 — v1.8.2: denser, especially mid-game
  // v2.2.0: denser team-god-war map (was [180,240,300,360,460])
  const enemyCap = [380, 480, 600, 720, 880][G.stage-1] || 380;
  while (G.enemies.length < enemyCap) spawnEnemy();
  // v2.1.0: rift ownership countdown (was simple respawn)
  for (const rf of G.rifts){
    if (rf.used){
      // support legacy respawnT field
      if (rf.respawnT){ rf.ownT = Math.max(rf.ownT||0, rf.respawnT); rf.respawnT = 0; }
      rf.ownT = (rf.ownT||0) - dt;
      if (rf.ownT <= 0){
        rf.used = false; rf.ownT = 0; rf.cap = 0; rf.owner = null; rf.ownerName=''; rf.contested = false;
        pushKillFeed('★ Sanctum reopens: '+rf.name, rf.color);
      }
    }
  }
  // v0.9.0: 世界 Boss
  for (let _i=G.bosses.length-1;_i>=0;_i--){ if (G.bosses[_i].hp<=0){ onBossDeath(G.bosses[_i]); G.bosses.splice(_i,1); G.bossSpawnT=160; } }
  const _maxB = G.stage>=5?3:(G.stage>=4?2:1);
  if (G.stage>=3 && G.bosses.length<_maxB){ G.bossSpawnT-=dt; if(G.bossSpawnT<=0){ spawnBoss(); G.bossSpawnT=150+G.bosses.length*40; } }
  for (const _b of G.bosses) updateBoss(_b, dt);
  // v2.9.0: boss intro splash timer
  if (G._bossIntro && G._bossIntro.t > 0){ G._bossIntro.t -= dt; if (G._bossIntro.t <= 0) G._bossIntro = null; }
  // v1.0.0: 階段進程
  // v1.1.0: 5 紀元（Era of God War加入）
  const stageThresholds = [180, 480, 900, 1500];
  const stageNames = ['Era of Beasts','Era of Cultivation','Era of Stars','Era of the Weird','Era of God War'];
  const stageSubs  = [
    'Life emerges · Learn ecosystem & hunting',
    'Sanctums bloom · Authorities arrive, demons revive',
    'Stars tremble · Tentacles rampage, mind shakes',
    'Weirdness floods · Outer Gods cycle, trial begins',
    'God War returns · Sequences collapse, True Gods duel'
  ];
  let newStage = 1;
  for (let i=0;i<stageThresholds.length;i++) if (G.time >= stageThresholds[i]) newStage = i+2;
  if (newStage !== G.stage){
    G.stage = newStage;
    // v1.8.1: EPIC era transitions — bigger banner, screen shake, particle storm, mass spawn, forced bosses
    G.stageBannerT = 8; G.stageBannerText = '★ '+stageNames[newStage-1].toUpperCase()+' ★';
    G.stageBannerSub  = stageSubs[newStage-1];
    try{ flash('#ffdd66', 1.2); shake(45); playSound('promote'); }catch(e){}
    // Particle storm around player
    if (G.player){
      for (let i=0;i<260;i++){
        const a = Math.random()*Math.PI*2, sp = rand(180, 720);
        G.particles.push({x:G.player.x, y:G.player.y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:2.2, color: newStage>=4?'#aa44ff':(newStage>=3?'#88ccff':'#ffdd66'), r: rand(2,5)});
      }
      G.shockwaves.push({x:G.player.x,y:G.player.y,r:0,max:1400,life:2.0,color:newStage>=4?'#aa44ff':'#ffdd66'});
    }
    pushKillFeed('☄☄☄ ERA SHIFT — '+stageNames[newStage-1]+' ☄☄☄','#ffdd66');
    logMsg('★★★ '+G.stageBannerText+' — '+G.stageBannerSub,'promote');
    G.timeline.push({t:G.time, text:'Entered '+stageNames[newStage-1]});
    // Mass spawn wave (v3.5.0: bigger brawl — was 8+stage*6, now 18+stage*10)
    const waveSize = 18 + newStage*10;
    for (let i=0;i<waveSize;i++){ try { spawnEnemy(false); } catch(e){} }
    // v3.5.0: miniboss from stage 1, Outer Gods from stage 3 (was stage 2/4) — escalate chaos faster
    if (newStage>=1 && !G.miniboss){ try { spawnMiniboss(); G.minibossSpawnT = 120; } catch(e){} }
    if (newStage>=3 && G.bosses.length===0){ try { spawnBoss(); G.bossSpawnT = 120; } catch(e){} }
    if (newStage>=4){ G.eventCdT = Math.min(G.eventCdT, 12); }
  }
  if (G.stageBannerT>0) G.stageBannerT -= dt;
  if (G.revealT>0) G.revealT -= dt;
  if (G.pingT>0) G.pingT -= dt;
  // v1.0.0: 小 Boss · Ancient Wraith（Era of Cultivation起，每 180s）
  if (G.stage>=2){
    if (G.miniboss && G.miniboss.hp<=0){ onMinibossDeath(G.miniboss); G.miniboss=null; G.minibossSpawnT = G.stage>=3?150:180; }
    if (!G.miniboss){ G.minibossSpawnT -= dt; if (G.minibossSpawnT<=0){ spawnMiniboss(); G.minibossSpawnT = G.stage>=3?150:180; } }
    if (G.miniboss) updateMiniboss(G.miniboss, dt);
  }
  // v1.0.0: 世界事件 · Stars Align（Era of Cultivation起，每 120s, 20s 持續）
  if (G.stage>=2){
    if (G.event){
      G.event.t -= dt;
      if (G.event.t<=0){ G.event = null; G.eventCdT = 120; pushKillFeed('☄ Stars disperse','#aaccff'); }
    } else {
      G.eventCdT -= dt;
      if (G.eventCdT<=0){
        G.event = {type:'aligned', t:20};
        pushKillFeed('☄ Stars Align! Enemy ATK +30% · XP +50% (20s)','#ffdd66');
        logMsg('★ Stars Align: 20s of danger and opportunity — reap all!','promote');
        try{ flash('#ffdd66',0.5); shake(10); }catch(e){}
        G.timeline.push({t:G.time, text:'Stars Align'});
      }
    }
  }
  // v0.9.0: 教學浮窗
  G.tutorialT += dt;
  if (G.firstHunt && G.firstHunt.active){
    G.firstHunt.t -= dt;
    if ((G.player.q.kills||0) > 0 || G.player.rank >= 3 || G.firstHunt.t <= 0){
      G.firstHunt.active = false;
    } else if (!G.firstHunt.shown && G.tutorialT > 1.2){
      addFloat(G.player.x, G.player.y-80, 'First goal: kill the nearest creature', '#ffd66b', 20, 3.2);
      G.firstHunt.shown = true;
    }
  }
  if (G.tutorialStep===0 && G.tutorialT>3){ addFloat(G.player.x, G.player.y-60, isMobile()?"Left thumb move · Right buttons attack":"WASD move · Left-click melee", "#ffd66b", 18, 4); G.tutorialStep=1; }
  if (G.tutorialStep===1 && G.tutorialT>9){ addFloat(G.player.x, G.player.y-60, "Stand near purple Qi springs for Qi", "#bb88ff", 18, 4); G.tutorialStep=2; }
  if (G.tutorialStep===2 && G.tutorialT>15){ addFloat(G.player.x, G.player.y-60, "Press M for map · 1-6 cast Authority", "#88ccff", 18, 4); G.tutorialStep=3; }
  if (G.tutorialStep===3 && G.tutorialT>22){ addFloat(G.player.x, G.player.y-60, "4 sanctums + slay Outer God = Apotheosis", "#ff88cc", 18, 5); G.tutorialStep=4; }
  // 補充靈氣與道具
  if (G.spirits.length<70 && Math.random()<0.35) spawnSpirit();
  if (G.pickups.length<180 && Math.random()<0.25) spawnPickup();  // v1.7.0: leaner ambient
  // v1.2.0 多人聯機 tick
  if (window.Net){
    try{ Net.update(G.player, dt); }catch(e){}
    for (const [,peer] of Net.peers){ if (peer.hitT>0) peer.hitT-=dt; if (peer.chatT>0) peer.chatT-=dt; }
  }
  // 更新排行榜
  updateLeaderboard();
  // HUD
  updateHUD();
}
function updateLeaderboard(){
  const all=[G.player,...G.enemies];
  if(window.Net&&Net.peers)for(const [id,peer] of Net.peers){
    if(!peer||peer.x===undefined)continue;
    all.push({name:peer.name||('Player#'+id),rank:peer.rank||1,qi:0,
      path:{color:peer.color||'#88ccff'},sp:{name:peer.name||'?'},
      _isPeer:true,isPlayer:false});
  }
  all.sort((a,b)=>(b.rank*1000+b.qi)-(a.rank*1000+a.qi));
  G.leaderboard=all.slice(0,8);
}
function pushKillFeed(text, color){
  G.killFeed.push({text, color: color||'#fff', life: 4, maxLife: 4});
  if (G.killFeed.length>5) G.killFeed.shift();
}

// =====================================================================
// 渲染
// =====================================================================
function render(){
  if (!ctx) return;
  // 完全重置 transform —— 防止例外後 scale 殘留導致畫面無限放大/黑屏
  ctx.setTransform(dpr,0,0,dpr,0,0);
  // 背景
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(0,0,window.innerWidth,window.innerHeight);
  if (!G.started) return;
  // 相機（用 try/finally 保證 transform 一定重置）
  try {
    ctx.save();
    const sx = (G.cam.shake>0)?rand(-G.cam.shake,G.cam.shake):0;
    const sy = (G.cam.shake>0)?rand(-G.cam.shake,G.cam.shake):0;
    ctx.translate(window.innerWidth/2 - G.cam.x + sx, window.innerHeight/2 - G.cam.y + sy);
    drawCosmicBG();
    drawTerrain();
    drawAmbientMotes();
    drawTendrils();
    drawQiSprings();
    drawRifts();
    drawSpirits();
    drawPickups();
    drawAuthoritiesWorld();
    drawHazards();
    try{ drawBoss(); }catch(e){}
    try{ drawMiniboss(); }catch(e){}
    for (const m of G.minions) try{ drawCreature(m); }catch(e){}
    for (const e of G.enemies) try{ drawCreature(e); }catch(err){}
    try{ drawCreature(G.player); }catch(e){}
    try{ drawRemotePeers(); }catch(e){}
    drawProjectiles();
    drawShockwaves();
    drawParticles();
    drawFloats();
  } catch(err){
    console.warn('[render world]', err);
  } finally {
    ctx.restore();
    // 再保底重設一次，確保 UI 層不被殘留 transform 影響
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  try{ drawOnlineBadge(); }catch(e){}
  // v2.9.0: vignette + boss-active chromatic frame — atmospheric cinema layer
  try { _drawVignette(); } catch(e){}
  // v2.9.0: 2.4s boss-arrival splash (uses AI-painted art if loaded; otherwise stylish title card)
  try { _drawBossIntro(); } catch(e){}
  // 螢幕閃光
  if (G.cam.flash>0){
    ctx.fillStyle = G.cam.flashColor;
    ctx.globalAlpha = G.cam.flash*0.5;
    ctx.fillRect(0,0,window.innerWidth,window.innerHeight);
    ctx.globalAlpha = 1;
  }
  try{ drawMinimap(); }catch(e){}
  try{ drawCrosshair(); }catch(e){}
  try{ drawStatusBanner(); }catch(e){}
  try{ drawFirstHuntGuide(); }catch(e){}
  try{ drawKillFeed(); }catch(e){}
  try{ drawStreakBanner(); }catch(e){}
  try{ drawEdgeArrows(); }catch(e){}
  try{ drawEvoReveal(); }catch(e){}
  try{ drawJoystick(); }catch(e){}
  try{ drawLeaderboard(); }catch(e){}
  ctx.fillStyle = G.fps<30 ? '#ff6666' : (G.fps<50 ? '#ffcc66' : '#88ff88');
  ctx.font = 'bold 11px monospace'; ctx.textAlign = 'left';
  ctx.fillText('FPS '+G.fps, 8, window.innerHeight-8);
  ctx.fillStyle = '#88ccff'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
  ctx.fillText(G.mapOpen?'[M] Close map':'[M] Open map', window.innerWidth-12, window.innerHeight-8);
  if (G.mapOpen) try{ drawStarMap(); }catch(e){ console.warn('[starmap]',e); }
  try{ drawWorldEventFX(); }catch(e){}
  try{ drawPingArrow(); }catch(e){}
  try{ drawStageBanner(); }catch(e){}
  // v2.7.0: tutorial overlay (only first run)
  try{ drawTutorial(); }catch(e){}
  // v0.9.0: 心智低紫色暈眩
  if (G.player && G.player.sanity<30){
    const lvl = (30-G.player.sanity)/30;
    const g = ctx.createRadialGradient(window.innerWidth/2, window.innerHeight/2, Math.min(window.innerWidth,window.innerHeight)*0.2, window.innerWidth/2, window.innerHeight/2, Math.max(window.innerWidth,window.innerHeight)*0.7);
    g.addColorStop(0,'rgba(170,68,255,0)'); g.addColorStop(1,'rgba(170,68,255,'+(lvl*0.5)+')');
    ctx.fillStyle=g; ctx.fillRect(0,0,window.innerWidth,window.innerHeight);
    if (G.player.sanity<10){
      ctx.fillStyle='rgba(255,68,170,'+(0.05+Math.random()*0.05)+')';
      ctx.fillRect(0,0,window.innerWidth,window.innerHeight);
    }
  }
  // 受擊紅暈
  if (G.cam.hitFlash>0){
    const g = ctx.createRadialGradient(window.innerWidth/2, window.innerHeight/2, Math.min(window.innerWidth,window.innerHeight)*0.3, window.innerWidth/2, window.innerHeight/2, Math.max(window.innerWidth,window.innerHeight)*0.7);
    g.addColorStop(0, 'rgba(255,0,0,0)');
    g.addColorStop(1, 'rgba(255,0,0,'+(G.cam.hitFlash*0.6)+')');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,window.innerWidth,window.innerHeight);
  }
}
function drawTerrain(){
  const cw = window.innerWidth, ch = window.innerHeight;
  // NaN 保護
  if (!isFinite(G.cam.x) || !isFinite(G.cam.y) || !G.terrain) return;
  // 先在世界範圍裡給任何超出 map 的區域套上「虛空」色，避免邊緣黑屏
  ctx.fillStyle = '#101015';
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  const x0 = Math.max(0, Math.floor((G.cam.x - cw/2)/TILE) - 1);
  const x1 = Math.min(G.terrain.cols, Math.ceil((G.cam.x + cw/2)/TILE) + 1);
  const y0 = Math.max(0, Math.floor((G.cam.y - ch/2)/TILE) - 1);
  const y1 = Math.min(G.terrain.rows, Math.ceil((G.cam.y + ch/2)/TILE) + 1);
  for (let y=y0;y<y1;y++){
    for (let x=x0;x<x1;x++){
      const b = G.terrain.map[y][x];
      const tex = G.terrain.biomeTex && G.terrain.biomeTex[b];
      if (tex){
        ctx.drawImage(tex, x*TILE, y*TILE);
      } else {
        ctx.fillStyle = BIOMES[b].color;
        ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
      }
    }
  }
  // 裝飾物
  drawDecor(x0,y0,x1,y1);
  // Lands End中心動畫
  const cx=WORLD.w/2, cy=WORLD.h/2;
  if (Math.hypot(G.cam.x-cx,G.cam.y-cy)<2500){
    for (let i=0;i<6;i++){
      const a = G.time*0.5 + i*Math.PI/3;
      const rr = 350 + Math.sin(G.time*1.5 + i)*30;
      ctx.strokeStyle = '#aa44ff44'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx,cy,rr,a,a+Math.PI/4); ctx.stroke();
    }
    const r = 400 + Math.sin(G.time*2)*40;
    const grad = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    grad.addColorStop(0,'#440033cc'); grad.addColorStop(0.5,'#22002288'); grad.addColorStop(1,'#00000000');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
  }
}
function generateDecor(){
  // 每 tile 用偽隨機生成一些裝飾物
  const decor = [];
  for (let y=0;y<G.terrain.rows;y++){
    for (let x=0;x<G.terrain.cols;x++){
      const b = G.terrain.map[y][x];
      if (b==='end') continue;
      const seed = (x*73856093 ^ y*19349663) >>> 0;
      const rng = mulberry32(seed);
      const count = b==='forest'?5 : b==='mtn'?3 : b==='desert'?2 : b==='swamp'?4 : b==='water'?3 : b==='snow'?4 : b==='plain'?3 : 0;
      for (let i=0;i<count;i++){
        decor.push({
          x: x*TILE + rng()*TILE,
          y: y*TILE + rng()*TILE,
          type: b,
          rot: rng()*Math.PI*2,
          scale: 0.7 + rng()*0.6,
        });
      }
    }
  }
  G.decor = decor;
}
function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = a; t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function drawDecor(x0,y0,x1,y1){
  if (!G.decor) return;
  const wx0 = x0*TILE, wy0 = y0*TILE, wx1 = x1*TILE, wy1 = y1*TILE;
  for (const d of G.decor){
    if (d.x<wx0||d.x>wx1||d.y<wy0||d.y>wy1) continue;
    drawDecorItem(d);
  }
}
// v1.6.2: ambient motes — biome-colored floating particles (dust / fireflies / snow / starsea sparks).
// Pure screen-space, ~120 motes, tiny perf cost, big visual upgrade.

// v2.9.0: cinematic vignette + boss-aura screen edge — applied in screen-space (after world transform restored)
// This is the post-process layer that gives the game a "premium / polished" look — front-page worthy.
function _drawVignette(){
  if (!ctx) return;
  const cw = window.innerWidth, ch = window.innerHeight;
  // Base vignette — always on (subtle dark corners)
  let g = ctx.createRadialGradient(cw/2, ch/2, Math.min(cw,ch)*0.35, cw/2, ch/2, Math.max(cw,ch)*0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = g; ctx.fillRect(0,0,cw,ch);
  // Boss-active extra: animated colored aura on screen edges + low-frequency pulse
  const _nb = nearestBoss(G.player);
  if (_nb && _nb.hp>0){
    const col = _nb.color || '#aa44ff';
    const pul = 0.15 + Math.abs(Math.sin((_nb.eyeT||0)*1.6))*0.18;
    const g2 = ctx.createRadialGradient(cw/2, ch/2, Math.min(cw,ch)*0.25, cw/2, ch/2, Math.max(cw,ch)*0.7);
    g2.addColorStop(0, col + '00');
    g2.addColorStop(0.7, col + Math.floor(pul*120).toString(16).padStart(2,'0'));
    g2.addColorStop(1, col + Math.floor(pul*200).toString(16).padStart(2,'0'));
    ctx.fillStyle = g2; ctx.fillRect(0,0,cw,ch);
    // letter-box dark bars at low boss hp for "enraged" cinema
    if (_nb.hp < _nb.maxHp * 0.3){
      const barH = 28 + Math.sin((_nb.eyeT||0)*4)*4;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, cw, barH);
      ctx.fillRect(0, ch-barH, cw, barH);
      ctx.fillStyle = col;
      ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('☄ ENRAGED — Final Phase ☄', cw/2, barH-8);
    }
  }
  // Low-HP red pulse for the player (visceral)
  if (G.player && !G.dead && G.player.hp < G.player.maxHp*0.25){
    const a = 0.18 + Math.abs(Math.sin((G.time||0)*4))*0.18;
    const gr = ctx.createRadialGradient(cw/2, ch/2, Math.min(cw,ch)*0.2, cw/2, ch/2, Math.max(cw,ch)*0.7);
    gr.addColorStop(0, 'rgba(255,40,60,0)');
    gr.addColorStop(1, 'rgba(255,40,60,'+a+')');
    ctx.fillStyle = gr; ctx.fillRect(0,0,cw,ch);
  }
}

// v2.9.0: cinematic boss intro splash — overlays AI-painted boss portrait + name for 2.4s.
// Gracefully falls back to a stylish title card if PNG isn't present yet.
function _drawBossIntro(){
  const intro = G._bossIntro;
  if (!intro || intro.t <= 0) return;
  const cw = window.innerWidth, ch = window.innerHeight;
  // ease-in-out fade
  const tNorm = 1 - (intro.t / 2.4);  // 0 → 1
  const alpha = tNorm < 0.15 ? (tNorm/0.15) : (tNorm > 0.85 ? (1-tNorm)/0.15 : 1);
  ctx.save();
  ctx.globalAlpha = Math.min(1, Math.max(0, alpha));
  // Darken background
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0,0,cw,ch);
  // Letter-box bars
  const barH = ch*0.12;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cw, barH); ctx.fillRect(0, ch-barH, cw, barH);
  // Try AI-painted PNG; fall back to stylized text card
  const img = _bossArtCache[intro.type];
  if (img && img.naturalWidth){
    // center-fit image preserving aspect, max 60% screen height
    const maxH = ch * 0.55, maxW = cw * 0.55;
    const r = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
    const iw = img.naturalWidth * r, ih = img.naturalHeight * r;
    // glow halo behind
    const g = ctx.createRadialGradient(cw/2, ch/2, 0, cw/2, ch/2, Math.max(iw,ih)*0.8);
    g.addColorStop(0, intro.color + 'aa'); g.addColorStop(1, intro.color + '00');
    ctx.fillStyle = g; ctx.fillRect(0,0,cw,ch);
    ctx.drawImage(img, (cw-iw)/2, (ch-ih)/2 - 20, iw, ih);
  } else {
    // Fallback title card — large mystical glyph circle
    const cx = cw/2, cy = ch/2 - 20;
    const rad = Math.min(cw,ch) * 0.18;
    // glow
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad*2.5);
    g.addColorStop(0, intro.color + 'aa'); g.addColorStop(1, intro.color + '00');
    ctx.fillStyle = g; ctx.fillRect(0,0,cw,ch);
    // dark disc
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = intro.color; ctx.lineWidth = 3; ctx.stroke();
    // rune ring
    ctx.strokeStyle = '#ffd66b'; ctx.lineWidth = 2;
    const t = (G.time || 0);
    for (let i=0;i<14;i++){
      const a = i*Math.PI*2/14 + t*0.4;
      const rr = rad * 1.35;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a)*rr, cy + Math.sin(a)*rr, 5, 0, Math.PI*2); ctx.stroke();
    }
    // central glyph (depends on type)
    ctx.fillStyle = intro.color; ctx.font = 'bold ' + (rad*1.1).toFixed(0) + 'px serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.shadowColor = intro.color; ctx.shadowBlur = 24;
    const glyph = ({eye:'☉', maw:'⚙', crown:'❄', phoenix:'☀', serpent:'§'})[intro.type] || '☄';
    ctx.fillText(glyph, cx, cy);
    ctx.shadowBlur = 0;
  }
  // Title text in lower letter-box
  ctx.fillStyle = '#ffd66b'; ctx.font = 'bold 12px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('☄  OUTER GOD DESCENDS  ☄', cw/2, ch - barH/2 - 18);
  ctx.fillStyle = intro.color; ctx.font = 'bold 28px serif';
  ctx.shadowColor = intro.color; ctx.shadowBlur = 16;
  ctx.fillText(intro.name, cw/2, ch - barH/2 + 8);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawAmbientMotes(){
  if (!G.terrain) return;
  const cw = window.innerWidth, ch = window.innerHeight;
  if (!G._motes){
    G._motes = [];
    for (let i=0;i<120;i++){
      G._motes.push({
        sx: Math.random()*cw, sy: Math.random()*ch,
        vx: (Math.random()-0.5)*22, vy: -8 - Math.random()*18,
        r: 0.8 + Math.random()*1.6,
        ph: Math.random()*Math.PI*2,
      });
    }
  }
  // Biome at player position drives color
  let col = '#bb88ff';
  try {
    const b = terrainAt(G.player.x, G.player.y);
    col = ({
      forest:'#a8ff80', plain:'#ddff90', desert:'#ffd680', swamp:'#88ffcc',
      water:'#88ccff', mtn:'#cccccc', snow:'#ffffff', end:'#cc66ff', starsea:'#ffeeaa'
    })[b] || '#bb88ff';
  } catch(e){}
  ctx.save();
  // Reset transform so motes are screen-space (above terrain, below entities).
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const dt = (G._mDt || 0.016);
  for (const m of G._motes){
    m.sx += m.vx * dt + Math.sin(G.time*1.4 + m.ph)*0.3;
    m.sy += m.vy * dt;
    if (m.sy < -8){ m.sy = ch + 8; m.sx = Math.random()*cw; }
    if (m.sx <  -8) m.sx = cw + 8;
    if (m.sx > cw+8) m.sx = -8;
    const a = 0.35 + Math.sin(G.time*2 + m.ph)*0.25;
    ctx.fillStyle = col;
    ctx.globalAlpha = Math.max(0, Math.min(0.8, a));
    ctx.beginPath(); ctx.arc(m.sx, m.sy, m.r, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
function drawDecorItem(d){
  const s = d.scale;
  switch(d.type){
    case 'forest': {
      // 樹：三角頂 + 棕色幹
      ctx.fillStyle = '#4a2c1a';
      ctx.fillRect(d.x-3*s, d.y, 6*s, 14*s);
      ctx.fillStyle = '#1f5a25';
      ctx.beginPath(); ctx.moveTo(d.x,d.y-22*s); ctx.lineTo(d.x-16*s,d.y+4*s); ctx.lineTo(d.x+16*s,d.y+4*s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2a7a35';
      ctx.beginPath(); ctx.moveTo(d.x,d.y-14*s); ctx.lineTo(d.x-12*s,d.y-2*s); ctx.lineTo(d.x+12*s,d.y-2*s); ctx.closePath(); ctx.fill();
      break;
    }
    case 'mtn': {
      // 大石頭
      ctx.fillStyle = '#777';
      ctx.beginPath(); ctx.ellipse(d.x,d.y,18*s,12*s,d.rot,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#999';
      ctx.beginPath(); ctx.ellipse(d.x-4*s,d.y-3*s,8*s,5*s,d.rot,0,Math.PI*2); ctx.fill();
      break;
    }
    case 'desert': {
      // 仙人掌或骨頭
      if ((d.rot|0)%2){
        ctx.fillStyle = '#3a6a35';
        ctx.fillRect(d.x-3*s,d.y-12*s,6*s,24*s);
        ctx.fillRect(d.x-10*s,d.y-4*s,6*s,12*s);
        ctx.fillRect(d.x+4*s,d.y-8*s,6*s,12*s);
      } else {
        ctx.strokeStyle = '#ddd'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(d.x-10*s,d.y); ctx.lineTo(d.x+10*s,d.y); ctx.stroke();
        ctx.fillStyle = '#eee';
        ctx.beginPath(); ctx.arc(d.x-10*s,d.y,3*s,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(d.x+10*s,d.y,3*s,0,Math.PI*2); ctx.fill();
      }
      break;
    }
    case 'swamp': {
      // 蘑菇/水泡
      ctx.fillStyle = '#5a4a2a';
      ctx.fillRect(d.x-2*s,d.y,4*s,8*s);
      ctx.fillStyle = '#aa3344';
      ctx.beginPath(); ctx.ellipse(d.x,d.y,9*s,5*s,0,Math.PI,0); ctx.fill();
      ctx.fillStyle = '#fff8';
      ctx.beginPath(); ctx.arc(d.x-3*s,d.y-2*s,1.5*s,0,Math.PI*2); ctx.fill();
      break;
    }
    case 'water': {
      // 波紋
      ctx.strokeStyle = '#88c0ff66'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(d.x,d.y,8*s + Math.sin(G.time*2 + d.rot)*2,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(d.x,d.y,14*s + Math.sin(G.time*2 + d.rot)*2,0,Math.PI*2); ctx.stroke();
      break;
    }
    case 'snow': {
      // 雪結晶 / 小冰塊
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(d.x,d.y,2.5*s,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#ddeeff'; ctx.lineWidth = 1.5;
      for (let i=0;i<6;i++){
        const a = i*Math.PI/3 + d.rot;
        ctx.beginPath(); ctx.moveTo(d.x,d.y); ctx.lineTo(d.x+Math.cos(a)*7*s,d.y+Math.sin(a)*7*s); ctx.stroke();
      }
      break;
    }
    case 'plain': {
      // 草叢
      ctx.strokeStyle = '#5a8a3a'; ctx.lineWidth = 2;
      for (let i=-2;i<=2;i++){
        ctx.beginPath(); ctx.moveTo(d.x+i*2*s,d.y+4*s); ctx.lineTo(d.x+i*2*s+(i*s),d.y-6*s); ctx.stroke();
      }
      // 小花
      if ((d.rot|0)%3===0){
        ctx.fillStyle = '#ffcc44';
        ctx.beginPath(); ctx.arc(d.x,d.y-4*s,2*s,0,Math.PI*2); ctx.fill();
      }
      break;
    }
  }
}
function drawSpirits(){
  for (const s of G.spirits){
    s.pulse += 0.1;
    const r = 6 + Math.sin(s.pulse)*2;
    ctx.fillStyle = '#bb88ff'; ctx.beginPath(); ctx.arc(s.x,s.y,r,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#ffffff80'; ctx.lineWidth = 1; ctx.stroke();
  }
}
function drawPickups(){
  for (const p of G.pickups){
    p.pulse += 0.08;
    const r = 10 + Math.sin(p.pulse)*2;
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.fill();
    if (p.rare){
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x,p.y,r+4,0,Math.PI*2); ctx.stroke();
    }
    ctx.fillStyle = '#000'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(p.icon, p.x, p.y);
  }
}
function drawAuthoritiesWorld(){
  for (const a of G.authorities){
    a.pulse += 0.1;
    const r = 30 + Math.sin(a.pulse)*5;
    // 光環
    const grad = ctx.createRadialGradient(a.x,a.y,0,a.x,a.y,r*3);
    grad.addColorStop(0, a.color+'aa'); grad.addColorStop(1, a.color+'00');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(a.x,a.y,r*3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = a.color; ctx.beginPath(); ctx.arc(a.x,a.y,r,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000'; ctx.font='bold 22px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(a.icon, a.x, a.y);
    ctx.fillStyle='#fff'; ctx.font='12px sans-serif';
    ctx.fillText(a.name, a.x, a.y+r+14);
  }
}
function drawHazards(){
  for (const h of G.hazards){
    ctx.fillStyle = h.color+'55';
    ctx.beginPath(); ctx.arc(h.x,h.y,h.r,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = h.color; ctx.lineWidth = 2; ctx.stroke();
  }
}
function drawCreature(c){
  if (!c || c.hp<=0) return;
  // v3.4.0: off-screen culling — skip creatures far outside camera (60% perf win on busy worlds)
  if (!c.isPlayer){
    const _cx = G.cam ? G.cam.x : 0, _cy = G.cam ? G.cam.y : 0;
    const _mx = window.innerWidth/2  + (c.r||30) + 80;
    const _my = window.innerHeight/2 + (c.r||30) + 80;
    if (Math.abs(c.x - _cx) > _mx || Math.abs(c.y - _cy) > _my) return;
  }
  const isP = c.isPlayer;
  // v2.4.0: 取得進化形態（決定圖示、顏色）
  const evoForm = getRankForm(c);
  const evoColor = (evoForm && c.rank >= 3) ? evoForm.color : c.path.color;
  const evoIcon  = evoForm ? evoForm.icon : c.sp.icon;
  // v2.3.0: 階位光環 + 高階身形放大
  if (c.rank>=5){
    const scaleFactor = 1 + (c.rank-4)*0.06;
    c.r = Math.round((c.sp.base.r||18) * scaleFactor);
  }
  if (c.rank>=3){
    const aR = c.r + 6 + c.rank;
    ctx.strokeStyle = evoColor; ctx.lineWidth = Math.min(6, c.rank-1);
    ctx.beginPath(); ctx.arc(c.x,c.y,aR,0,Math.PI*2); ctx.stroke();
    if (c.rank>=7){
      ctx.globalAlpha = 0.18 + 0.12*Math.sin(G.time*3 + c.x*0.01);
      ctx.fillStyle = evoColor;
      ctx.beginPath(); ctx.arc(c.x,c.y,aR,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // v3.4.3: divine golden halo for rank 8-9 (神階)
    if (c.rank>=8){
      const goldR = c.r + 18 + (c.rank-7)*4;
      const goldGrad = ctx.createRadialGradient(c.x,c.y,c.r, c.x,c.y,goldR*1.6);
      goldGrad.addColorStop(0, 'rgba(255,215,0,0)');
      goldGrad.addColorStop(0.5, 'rgba(255,215,0,'+(0.25+0.1*Math.sin(G.time*4))+')');
      goldGrad.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = goldGrad;
      ctx.beginPath(); ctx.arc(c.x,c.y,goldR*1.6,0,Math.PI*2); ctx.fill();
      // rotating sigil ring
      const segs = c.rank===9 ? 9 : 7;
      ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2;
      ctx.globalAlpha = 0.85;
      for (let i=0;i<segs;i++){
        const a = (G.time*0.6) + i*(Math.PI*2/segs);
        const x1 = c.x + Math.cos(a)*goldR, y1 = c.y + Math.sin(a)*goldR;
        const x2 = c.x + Math.cos(a)*(goldR+6), y2 = c.y + Math.sin(a)*(goldR+6);
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }
  // 無敵盾光（出生保護或衝刺）
  if (c.invuln>0){
    ctx.strokeStyle = '#ffff80';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.4 + 0.4*Math.sin(G.time*8);
    ctx.beginPath(); ctx.arc(c.x,c.y,c.r+10,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // v3.1.0: 地面陰影（提供 3D 立體感）
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.ellipse(c.x, c.y + c.r*0.78, c.r*1.05, c.r*0.32, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
  // v3.1.0: 移動殘影（高階且高速時）
  if (c.rank>=5 && (c.vx*c.vx + c.vy*c.vy) > 400){
    const trailCol = (evoColor||c.color||'#fff');
    for (let i=1;i<=3;i++){
      const t = i*0.045;
      ctx.save();
      ctx.globalAlpha = 0.18 - i*0.045;
      ctx.translate(c.x - c.vx*t, c.y - c.vy*t);
      ctx.rotate(c.facing);
      ctx.scale(1 - i*0.06, 1 - i*0.06);
      ctx.fillStyle = trailCol;
      ctx.beginPath(); ctx.arc(0,0,c.r*0.85,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }
  // 身體（依物種形狀繪製 — 若有 AI 繪製肖像則優先用圖）
  ctx.save();
  // v3.1.0: 呼吸 idle 動畫（subtle）
  const breath = 1 + Math.sin(G.time*2.4 + (c._fp||0))*0.025;
  ctx.translate(c.x,c.y); ctx.scale(breath, breath);
  if (c.darkT>0 && !isP) ctx.globalAlpha = 0.4;
  // v3.4.5: portrait does NOT rotate with facing — always faces up-screen so isometric art looks correct
  const _portrait = getPortrait(c.species, c.rank);
  if (_portrait){
    const _sz = c.r * 2.4;
    ctx.drawImage(_portrait, -_sz/2, -_sz/2, _sz, _sz);
  } else {
    ctx.rotate(c.facing); // drawShape still uses facing for non-portrait creatures
    drawShape(c);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  // v2.2.0: shield bubble visual
  if ((c.shieldHp||0)>0 && (c.shieldT||0)>0){
    ctx.strokeStyle = '#88ccff';
    ctx.lineWidth = 3; ctx.globalAlpha = 0.45 + 0.35*Math.sin(G.time*6);
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r+8, 0, Math.PI*2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if ((c.lifestealT||0)>0){
    ctx.strokeStyle = '#cc1133';
    ctx.lineWidth = 2; ctx.globalAlpha = 0.35 + 0.25*Math.sin(G.time*8);
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r+12, 0, Math.PI*2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if ((c.dmgTransferT||0)>0){
    ctx.strokeStyle = '#ff8844';
    ctx.lineWidth = 2; ctx.setLineDash([6,6]); ctx.lineDashOffset = -G.time*30;
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r+14, 0, Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
  }
  // icon (v2.6.0: 小角標而非蓋滿身體 — 讓程序化美術主導視覺)
  // 只有進化形態（rank>=3）才顯示形態圖示作為右上角標
  if (evoForm && c.rank >= 3){
    const _bx = c.x + c.r*0.85, _by = c.y - c.r*0.85;
    const _br = Math.max(8, c.r*0.32);
    ctx.save();
    ctx.fillStyle = 'rgba(20,16,28,0.78)';
    ctx.strokeStyle = evoColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(_bx, _by, _br, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.floor(_br*1.1)}px sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(evoIcon, _bx, _by+1);
    ctx.restore();
  }
  // v2.6.0: 高階王冠標記（rank 5+ 三角金冠，rank 7+ 五角星，rank 9 雙環王者光）
  if (c.rank >= 5){
    const _cy = c.y - c.r - (isP ? 28 : 32);
    ctx.save();
    if (c.rank >= 9){
      // 雙環王者光
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6 + 0.35*Math.sin(G.time*4);
      ctx.beginPath(); ctx.arc(c.x, _cy, 14, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(c.x, _cy, 18, 0, Math.PI*2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (c.rank >= 7){
      // 五角星
      ctx.fillStyle = '#ffd700';
      ctx.strokeStyle = '#a87000';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i=0;i<10;i++){
        const a = -Math.PI/2 + i*Math.PI/5;
        const rr = (i%2===0) ? 9 : 4;
        const sx = c.x + Math.cos(a)*rr, sy = _cy + Math.sin(a)*rr;
        if (i===0) ctx.moveTo(sx,sy); else ctx.lineTo(sx,sy);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      // 金冠
      ctx.fillStyle = '#ffd700';
      ctx.strokeStyle = '#7a4d00';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(c.x-10, _cy+5);
      ctx.lineTo(c.x-10, _cy-2);
      ctx.lineTo(c.x-5,  _cy+2);
      ctx.lineTo(c.x,    _cy-6);
      ctx.lineTo(c.x+5,  _cy+2);
      ctx.lineTo(c.x+10, _cy-2);
      ctx.lineTo(c.x+10, _cy+5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
  // HP bar
  if (!isP){
    const w = Math.max(30, c.r*2);
    ctx.fillStyle = '#000c'; ctx.fillRect(c.x-w/2, c.y-c.r-14, w, 5);
    ctx.fillStyle = c.hp/c.maxHp>0.4?'#5f5':'#f44'; ctx.fillRect(c.x-w/2, c.y-c.r-14, w*clamp(c.hp/c.maxHp,0,1), 5);
    const dispName = (evoForm && c.rank>=3) ? evoForm.name : c.sp.name;
    ctx.fillStyle = evoColor; ctx.font='10px sans-serif';
    ctx.fillText(`${dispName} ${tierIcon(c)} ${tierName(c)}`, c.x, c.y-c.r-20);
  }
  // 凍結
  if (c.freeze>0){
    ctx.strokeStyle = '#88e0ff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(c.x,c.y,c.r+3,0,Math.PI*2); ctx.stroke();
  }
  if (c.poison>0){
    ctx.fillStyle = '#88ff44aa'; ctx.beginPath(); ctx.arc(c.x,c.y,c.r+2,0,Math.PI*2); ctx.fill();
  }
}
// 局部座標系：朝向 +x，原點為中心
// v3.0.0: rank-tiered visual overhaul — 5 tiers per shape, evo colors, orbiting particles
function _blendHex(c1, c2, t){
  try{
    const h2n=(s)=>parseInt(s.replace('#','').padStart(6,'0'),16);
    const a=h2n(c1||'#888888'), b=h2n(c2||'#888888');
    const r=Math.round(((a>>16)&0xff)*(1-t)+((b>>16)&0xff)*t);
    const g=Math.round(((a>>8)&0xff)*(1-t)+((b>>8)&0xff)*t);
    const bl=Math.round((a&0xff)*(1-t)+(b&0xff)*t);
    return '#'+((1<<24)|(r<<16)|(g<<8)|bl).toString(16).slice(1);
  }catch(e){ return c1||'#888888'; }
}
// v3.1.0 ART HELPERS — 3D 立體感漸層 + 高光眼睛
// shadeColor: amt>0 = lighter, amt<0 = darker (per-channel ±amt)
function shadeColor(col, amt){
  try{
    let c=(col||'#888888').replace('#','');
    if(c.length===3) c=c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
    const clamp=v=>Math.max(0,Math.min(255,v));
    const r=clamp(parseInt(c.slice(0,2),16)+amt);
    const g=clamp(parseInt(c.slice(2,4),16)+amt);
    const b=clamp(parseInt(c.slice(4,6),16)+amt);
    return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
  }catch(e){ return col||'#888888'; }
}
function _radial(x, y, rr, hiCol, baseCol){
  // 從左上偏移處給光源效果
  const g = ctx.createRadialGradient(x-rr*0.35, y-rr*0.45, rr*0.1, x, y, rr);
  g.addColorStop(0, hiCol);
  g.addColorStop(0.55, baseCol);
  g.addColorStop(1, shadeColor(baseCol, -25));
  return g;
}
function _linGrad(x1,y1,x2,y2,c1,c2){
  const g = ctx.createLinearGradient(x1,y1,x2,y2);
  g.addColorStop(0,c1); g.addColorStop(1,c2); return g;
}
// 帶高光、虹膜、瞳孔的眼睛
function _eye(ex, ey, er, iris){
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = iris || '#111';
  ctx.beginPath(); ctx.arc(ex+er*0.18, ey, er*0.62, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(ex+er*0.22, ey, er*0.32, 0, Math.PI*2); ctx.fill();
  // 高光
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(ex-er*0.18, ey-er*0.22, er*0.28, 0, Math.PI*2); ctx.fill();
}
function drawShape(c){
  const r=c.r, rank=c.rank||1, isP=c.isPlayer, t=G.time;
  const fp=c._fp||(c._fp=Math.random()*Math.PI*2);
  // tier: 0=base 1=R3 2=R5 3=R7 4=R9
  const tier=rank>=9?4:rank>=7?3:rank>=5?2:rank>=3?1:0;
  // evolution colour
  const evoForm=(c.species&&typeof RANK_FORMS!=='undefined')?getRankForm(c):null;
  const eCol=evoForm?evoForm.color:c.color;
  const mainCol=tier>=2?eCol:(tier===1?_blendHex(c.color,eCol,0.55):c.color);
  const dark=shadeColor(mainCol,-40), light=shadeColor(mainCol,50);
  const accent=tier>=2?shadeColor(eCol,60):'#ffffff';
  const outline=rank>=7?shadeColor(eCol,70):(isP?'#ffffff':'#222222');
  ctx.strokeStyle=outline; ctx.lineWidth=rank>=7?2.5:isP?2:1.5;
  const pulse=Math.sin(t*5+fp), pulse2=Math.sin(t*7+fp+1.2);
  const shape=c.sp?c.sp.shape:'';

  /* ── HUMANOID (swordsman / cultivator) ─────────────────────────────── */
  if(shape==='humanoid'){
    // Tier 3-4: divine wings behind body
    if(tier>=3){
      const wa=0.6+0.15*pulse; ctx.globalAlpha=0.55+0.15*pulse;
      ctx.fillStyle=_blendHex(mainCol,'#ffffff',0.4);
      ctx.beginPath();
      ctx.moveTo(-r*0.1,0);
      ctx.bezierCurveTo(-r*0.6,-r*1.8,-r*2.0,-r*1.6,-r*1.4,-r*0.2);
      ctx.bezierCurveTo(-r*2.0,r*1.6,-r*0.6,r*1.8,-r*0.1,0);
      ctx.fill(); ctx.globalAlpha=1;
    }
    // Tier 1+: shoulder plates
    if(tier>=1){
      ctx.fillStyle=dark;
      ctx.beginPath(); ctx.arc(-r*0.1,-r*0.65,r*0.28,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(-r*0.1, r*0.65,r*0.28,0,Math.PI*2); ctx.fill(); ctx.stroke();
    }
    // Body
    ctx.fillStyle=_radial(0,0,r*0.85,light,mainCol);
    ctx.beginPath(); ctx.ellipse(0,0,r*0.85,r*0.7,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
    // Weapon
    if(tier>=3){
      ctx.strokeStyle='#fffbe0'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(r*0.55,-r*0.25); ctx.lineTo(r*2.1,-r*0.25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r*0.55, r*0.25); ctx.lineTo(r*2.1, r*0.25); ctx.stroke();
      ctx.strokeStyle=accent; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(r*0.55,-r*0.25); ctx.lineTo(r*2.1,-r*0.25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r*0.55, r*0.25); ctx.lineTo(r*2.1, r*0.25); ctx.stroke();
    } else if(tier>=2){
      ctx.strokeStyle='#ffcc44'; ctx.lineWidth=4;
      ctx.beginPath(); ctx.moveTo(r*0.6,0); ctx.lineTo(r*2.2,0); ctx.stroke();
      ctx.strokeStyle='#fff'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(r*0.6,0); ctx.lineTo(r*2.2,0); ctx.stroke();
    } else {
      ctx.strokeStyle='#ddddcc'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(r*0.6,0); ctx.lineTo(r*1.9,0); ctx.stroke();
    }
    ctx.strokeStyle=outline; ctx.lineWidth=isP?2:1.5;
    // Head
    ctx.fillStyle=_radial(r*0.45,0,r*0.42,shadeColor(light,30),light);
    ctx.beginPath(); ctx.arc(r*0.45,0,r*0.42,0,Math.PI*2); ctx.fill(); ctx.stroke();
    // Rank 9 halo
    if(tier>=4){
      ctx.strokeStyle='#ffff99'; ctx.lineWidth=2; ctx.globalAlpha=0.7+0.3*pulse;
      ctx.beginPath(); ctx.ellipse(r*0.45,-r*0.78,r*0.44,r*0.1,0,0,Math.PI*2); ctx.stroke();
      ctx.globalAlpha=1;
    }
    _eye(r*0.65,-r*0.1,r*0.11, tier>=3?'#ffaa00':'#1a1a2e');
  }

  /* ── REPTILE (lizard / croc / dino) ─────────────────────────────────── */
  else if(shape==='reptile'){
    // Body
    ctx.fillStyle=_radial(0,0,r*1.3,light,mainCol);
    ctx.beginPath(); ctx.ellipse(0,0,r*1.3,r*0.62,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
    // 鱗紋（高階）
    if(tier>=2){
      ctx.strokeStyle=shadeColor(mainCol,-50); ctx.lineWidth=1; ctx.globalAlpha=0.5;
      for(let i=-3;i<=3;i++){
        ctx.beginPath();
        ctx.arc(i*r*0.28,0,r*0.18,Math.PI*0.2,Math.PI*0.8);
        ctx.stroke();
      }
      ctx.globalAlpha=1; ctx.strokeStyle=outline; ctx.lineWidth=isP?2:1.5;
    }
    // Back spines — count grows with tier
    const spines=2+tier*1.5|0;
    ctx.fillStyle=dark; ctx.strokeStyle=outline; ctx.lineWidth=1;
    for(let i=0;i<spines;i++){
      const sx=r*(0.9-i*(1.8/spines));
      const sh=r*(0.3+tier*0.1);
      ctx.beginPath(); ctx.moveTo(sx,-r*0.58); ctx.lineTo(sx-r*0.1,-r*0.58-sh); ctx.lineTo(sx+r*0.1,-r*0.58); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.strokeStyle=outline; ctx.lineWidth=isP?2:1.5;
    // Tail
    ctx.fillStyle=dark;
    ctx.beginPath(); ctx.moveTo(-r*1.2,0); ctx.lineTo(-r*(2.2+tier*0.15),r*0.15); ctx.lineTo(-r*(2.2+tier*0.15),-r*0.15); ctx.closePath(); ctx.fill(); ctx.stroke();
    // Head
    ctx.fillStyle=_radial(r*1.18,0,r*0.42,shadeColor(light,25),light);
    ctx.beginPath(); ctx.ellipse(r*1.18,0,r*(0.42+tier*0.04),r*0.36,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
    // Tier 2+: fire breath（漸層 + 多層火焰）
    if(tier>=2){
      const fl=0.55+0.35*pulse; ctx.globalAlpha=fl;
      const fEnd=r*(2.6+tier*0.3);
      ctx.fillStyle=_linGrad(r*1.58,0,fEnd,0,'#ffee44',tier>=3?'#ff2200':'#ff7700');
      ctx.beginPath(); ctx.moveTo(r*1.58,0); ctx.lineTo(fEnd,-r*(0.4+0.18*pulse)); ctx.lineTo(fEnd*1.15,0); ctx.lineTo(fEnd,r*(0.4+0.18*pulse)); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#ffffaa'; ctx.globalAlpha=fl*0.6;
      ctx.beginPath(); ctx.moveTo(r*1.58,0); ctx.lineTo(fEnd*0.85,-r*0.2); ctx.lineTo(fEnd*0.95,0); ctx.lineTo(fEnd*0.85,r*0.2); ctx.closePath(); ctx.fill();
      ctx.globalAlpha=1;
    }
    // Legs
    ctx.fillStyle=dark;
    [[r*0.6,r*0.64],[r*0.6,-r*0.64],[-r*0.5,r*0.64],[-r*0.5,-r*0.64]].forEach(([lx,ly])=>{
      ctx.beginPath(); ctx.arc(lx,ly,r*0.22,0,Math.PI*2); ctx.fill(); ctx.stroke();
    });
    _eye(r*1.32,-r*0.12,r*0.11, tier>=2?'#cc1100':'#1a1a2e');
  }

  /* ── BEAST (wolf / dog) ──────────────────────────────────────────────── */
  else if(shape==='beast'){
    // Body — 漸層毛皮質感
    ctx.fillStyle=_radial(0,-r*0.1,r*1.15,light,mainCol);
    ctx.beginPath(); ctx.ellipse(0,0,r*1.15,r*0.75,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
    // 腹部淺色
    ctx.fillStyle=_blendHex(light,'#ffffff',0.3); ctx.globalAlpha=0.55;
    ctx.beginPath(); ctx.ellipse(0,r*0.32,r*0.85,r*0.4,0,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
    // Fur spikes tier 1+
    if(tier>=1){
      ctx.fillStyle=light; ctx.strokeStyle=outline; ctx.lineWidth=1;
      const spk=3+tier;
      for(let i=0;i<spk;i++){
        const a=(-0.7+i*(1.4/spk))*Math.PI-Math.PI*0.5;
        const x1=Math.cos(a)*r*0.88, y1=Math.sin(a)*r*0.88;
        const x2=Math.cos(a)*(r*(1.25+tier*0.08)), y2=Math.sin(a)*(r*(1.25+tier*0.08));
        const x3=Math.cos(a+0.22)*r*0.88, y3=Math.sin(a+0.22)*r*0.88;
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.strokeStyle=outline; ctx.lineWidth=isP?2:1.5;
    }
    // Tail
    ctx.strokeStyle=dark; ctx.lineWidth=r*0.25;
    ctx.beginPath(); ctx.moveTo(-r,0); ctx.quadraticCurveTo(-r*1.8,-r*0.5,-r*2.1,r*0.2); ctx.stroke();
    ctx.lineWidth=isP?2:1.5; ctx.strokeStyle=outline;
    // Legs
    ctx.fillStyle=dark;
    [[r*0.5,r*0.72],[r*0.5,-r*0.72],[-r*0.4,r*0.72],[-r*0.4,-r*0.72]].forEach(([lx,ly])=>{
      ctx.beginPath(); ctx.ellipse(lx,ly,r*0.22,r*0.3,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
    });
    // Head
    ctx.fillStyle=_radial(r*1.06,-r*0.1,r*0.52,shadeColor(light,30),light);
    ctx.beginPath(); ctx.arc(r*1.06,0,r*0.52,0,Math.PI*2); ctx.fill(); ctx.stroke();
    // 鼻吻
    ctx.fillStyle=dark;
    ctx.beginPath(); ctx.ellipse(r*1.46,r*0.06,r*0.18,r*0.13,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(r*1.55,r*0.04,r*0.07,0,Math.PI*2); ctx.fill();
    // Ears
    ctx.fillStyle=dark;
    ctx.beginPath(); ctx.moveTo(r*1.22,-r*0.4); ctx.lineTo(r*1.5,-r*(0.8+tier*0.08)); ctx.lineTo(r*0.92,-r*0.5); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(r*1.22, r*0.4); ctx.lineTo(r*1.5, r*(0.8+tier*0.08)); ctx.lineTo(r*0.92, r*0.5); ctx.closePath(); ctx.fill();
    // Tier 3+: constellation mark on forehead
    if(tier>=3){
      ctx.fillStyle='#ffee44'; ctx.globalAlpha=0.85+0.15*pulse;
      ctx.beginPath(); ctx.arc(r*1.06,0,r*0.2,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
    }
    _eye(r*1.28,-r*0.16,r*0.12, tier>=3?'#ffaa00':tier>=2?'#aa3300':'#1a1a2e');
  }

  /* ── BIRD (eagle / owl / bat) ────────────────────────────────────────── */
  else if(shape==='bird'){
    const flap=Math.sin(t*8+fp)*0.38;
    const ws=1.55+tier*0.28;
    // Tier 2+: energy/flame wing glow
    if(tier>=2){
      ctx.fillStyle=tier>=3?'#ff6600':'#ffffaa'; ctx.globalAlpha=0.45+0.25*pulse;
      ctx.beginPath(); ctx.moveTo(-r*0.45,0); ctx.lineTo(-r*0.75,-r*ws*1.35-flap*r); ctx.lineTo(-r*1.4,-r*0.5); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-r*0.45,0); ctx.lineTo(-r*0.75, r*ws*1.35+flap*r); ctx.lineTo(-r*1.4, r*0.5); ctx.closePath(); ctx.fill();
      ctx.globalAlpha=1;
    }
    // Wings
    ctx.fillStyle=dark;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-r*0.42,-r*ws-flap*r); ctx.lineTo(-r*1.1,-r*0.42); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-r*0.42, r*ws+flap*r); ctx.lineTo(-r*1.1, r*0.42); ctx.closePath(); ctx.fill(); ctx.stroke();
    // Body
    ctx.fillStyle=_radial(0,-r*0.1,r*0.92,light,mainCol);
    ctx.beginPath(); ctx.ellipse(0,0,r*0.92,r*0.46,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
    // 胸羽紋理
    ctx.fillStyle=shadeColor(mainCol,-25); ctx.globalAlpha=0.45;
    for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.ellipse(-r*0.1+i*r*0.25,r*0.05,r*0.18,r*0.32,0,0,Math.PI*2); ctx.fill(); }
    ctx.globalAlpha=1;
    // Head
    ctx.fillStyle=_radial(r*0.72,-r*0.08,r*0.4,shadeColor(light,30),light);
    ctx.beginPath(); ctx.arc(r*0.72,0,r*0.40,0,Math.PI*2); ctx.fill(); ctx.stroke();
    // Tier 4: crown spikes
    if(tier>=4){
      ctx.fillStyle='#ffee44';
      for(let i=0;i<3;i++){
        const a=-0.4+i*0.4;
        ctx.beginPath(); ctx.moveTo(r*0.72+Math.cos(a+Math.PI/2)*r*0.32, Math.sin(a+Math.PI/2)*r*0.32);
        ctx.lineTo(r*0.72+Math.cos(a+Math.PI/2)*r*0.55, Math.sin(a+Math.PI/2)*r*(0.32+0.4));
        ctx.lineTo(r*0.72+Math.cos(a+Math.PI/2+0.35)*r*0.32, Math.sin(a+Math.PI/2+0.35)*r*0.32);
        ctx.closePath(); ctx.fill();
      }
    }
    // Beak
    ctx.fillStyle='#ffcc44';
    ctx.beginPath(); ctx.moveTo(r*1.04,-r*0.09); ctx.lineTo(r*(1.58+tier*0.04),0); ctx.lineTo(r*1.04,r*0.09); ctx.closePath(); ctx.fill(); ctx.stroke();
    _eye(r*0.82,-r*0.15,r*0.12, tier>=2?'#cc2200':'#1a1a2e');
  }

  /* ── FISH (shark / eel) ──────────────────────────────────────────────── */
  else if(shape==='fish'){
    // Tier 2+: armour plates
    if(tier>=2){
      ctx.fillStyle=dark; ctx.globalAlpha=0.5;
      for(let i=-1;i<=1;i++) { ctx.beginPath(); ctx.ellipse(i*r*0.45,0,r*0.22,r*0.5,0,0,Math.PI*2); ctx.fill(); }
      ctx.globalAlpha=1;
    }
    // Body — 上深下淺（魚的反向偽裝）
    ctx.fillStyle=_linGrad(0,-r*0.6,0,r*0.6,shadeColor(mainCol,-30),_blendHex(light,'#ffffff',0.4));
    ctx.beginPath(); ctx.ellipse(0,0,r*1.22,r*(0.56+tier*0.04),0,0,Math.PI*2); ctx.fill(); ctx.stroke();
    // 鰓
    ctx.strokeStyle=shadeColor(mainCol,-50); ctx.lineWidth=1.2; ctx.globalAlpha=0.65;
    ctx.beginPath(); ctx.arc(r*0.55,0,r*0.3,Math.PI*0.7,Math.PI*1.3); ctx.stroke();
    ctx.beginPath(); ctx.arc(r*0.4,0,r*0.3,Math.PI*0.7,Math.PI*1.3); ctx.stroke();
    ctx.globalAlpha=1; ctx.strokeStyle=outline; ctx.lineWidth=isP?2:1.5;
    // Tail fin
    ctx.fillStyle=dark;
    const ts=1+tier*0.18;
    ctx.beginPath(); ctx.moveTo(-r*1.12,0); ctx.lineTo(-r*1.95*ts,-r*0.72*ts); ctx.lineTo(-r*1.62,0); ctx.lineTo(-r*1.95*ts,r*0.72*ts); ctx.closePath(); ctx.fill(); ctx.stroke();
    // Dorsal fin
    ctx.beginPath(); ctx.moveTo(0,-r*0.56); ctx.lineTo(-r*0.32,-r*(1.12+tier*0.18)); ctx.lineTo(r*0.32,-r*0.56); ctx.closePath(); ctx.fill(); ctx.stroke();
    // Pectoral fin
    ctx.beginPath(); ctx.moveTo(r*0.28,r*0.53); ctx.lineTo(-r*0.12,r*0.98); ctx.lineTo(r*0.52,r*0.56); ctx.closePath(); ctx.fill(); ctx.stroke();
    // Tier 3+: electric spine glow
    if(tier>=3){
      ctx.strokeStyle=accent; ctx.lineWidth=2; ctx.globalAlpha=0.55+0.38*pulse;
      ctx.beginPath(); ctx.moveTo(-r*1.0,0); ctx.lineTo(r*1.15,0); ctx.stroke();
      ctx.globalAlpha=1; ctx.strokeStyle=outline; ctx.lineWidth=isP?2:1.5;
    }
    _eye(r*0.72,-r*0.16,r*0.12, tier>=2?'#0044dd':'#1a1a2e');
    // Mouth
    ctx.strokeStyle=dark; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(r*(1.0+tier*0.05),r*0.1); ctx.lineTo(r*(1.22+tier*0.05),0); ctx.stroke();
  }

  /* ── DRAGON (longSnake / serpent) ───────────────────────────────────── */
  else if(shape==='dragon'){
    // Sinuous body
    const segs=4+tier;
    for(let i=segs-1;i>=0;i--){
      const tt=i/segs, sx=-tt*r*2.6, sy=Math.sin(t*4+fp-tt*3)*r*0.55*tt;
      const sr=r*(1-tt*0.54);
      ctx.fillStyle=i%2===0?mainCol:dark; ctx.strokeStyle=outline; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(sx,sy,sr,0,Math.PI*2); ctx.fill(); ctx.stroke();
    }
    ctx.strokeStyle=outline; ctx.lineWidth=isP?2:1.5;
    // Head
    ctx.fillStyle=_radial(r*0.62,-r*0.1,r*0.65,shadeColor(light,30),light);
    ctx.beginPath(); ctx.ellipse(r*0.62,0,r*(0.65+tier*0.04),r*0.5,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
    // 鬚
    if(tier>=1){
      ctx.strokeStyle=accent; ctx.lineWidth=1.5; ctx.globalAlpha=0.8;
      ctx.beginPath(); ctx.moveTo(r*1.18,-r*0.15); ctx.quadraticCurveTo(r*1.8,-r*0.4-pulse*r*0.1,r*2.0,-r*0.1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r*1.18, r*0.15); ctx.quadraticCurveTo(r*1.8, r*0.4+pulse*r*0.1,r*2.0, r*0.1); ctx.stroke();
      ctx.globalAlpha=1; ctx.strokeStyle=outline; ctx.lineWidth=isP?2:1.5;
    }
    // Horns
    ctx.fillStyle=tier>=2?accent:dark;
    ctx.beginPath(); ctx.moveTo(r*0.52,-r*0.42); ctx.lineTo(r*0.22,-r*(0.95+tier*0.18)); ctx.lineTo(r*0.68,-r*0.52); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r*0.52, r*0.42); ctx.lineTo(r*0.22, r*(0.95+tier*0.18)); ctx.lineTo(r*0.68, r*0.52); ctx.closePath(); ctx.fill(); ctx.stroke();
    // Tier 2+: fire breath
    if(tier>=2){
      const fl=0.45+0.3*pulse; ctx.globalAlpha=fl;
      ctx.fillStyle=tier>=3?'#ff3300':'#ff8800';
      ctx.beginPath(); ctx.moveTo(r*1.28,-r*0.22); ctx.lineTo(r*(2.55+tier*0.2),-r*(0.38+0.14*pulse)); ctx.lineTo(r*(2.55+tier*0.2),r*(0.38+0.14*pulse)); ctx.lineTo(r*1.28,r*0.22); ctx.closePath(); ctx.fill();
      ctx.globalAlpha=1;
    }
    _eye(r*0.85,-r*0.12,r*0.11,'#cc1100');
  }

  /* ── INSECT (scorpion) ───────────────────────────────────────────────── */
  else if(shape==='insect'){
    // Tier 1+: insect wings
    if(tier>=1){
      ctx.fillStyle=tier>=3?'rgba(180,220,255,0.75)':dark; ctx.globalAlpha=0.78+0.12*pulse;
      ctx.beginPath(); ctx.moveTo(r*0.2,-r*0.48); ctx.lineTo(-r*0.5,-r*(0.95+tier*0.22)); ctx.lineTo(r*0.55,-r*0.48); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r*0.2, r*0.48); ctx.lineTo(-r*0.5, r*(0.95+tier*0.22)); ctx.lineTo(r*0.55, r*0.48); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.globalAlpha=1;
    }
    // Abdomen
    ctx.fillStyle=_radial(-r*0.82,-r*0.1,r*0.62,mainCol,dark);
    ctx.beginPath(); ctx.ellipse(-r*0.82,0,r*0.62,r*0.56,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
    // Thorax
    ctx.fillStyle=_radial(0,-r*0.1,r*0.56,light,mainCol);
    ctx.beginPath(); ctx.ellipse(0,0,r*0.56,r*0.5,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
    // Head
    ctx.fillStyle=_radial(r*0.72,-r*0.1,r*0.46,shadeColor(light,30),light);
    ctx.beginPath(); ctx.ellipse(r*0.72,0,r*0.46,r*0.42,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
    // 複眼
    _eye(r*0.88,-r*0.18,r*0.1,'#aa0033');
    _eye(r*0.88, r*0.18,r*0.1,'#aa0033');
    // Legs
    ctx.strokeStyle=dark; ctx.lineWidth=2;
    for(let i=0;i<3;i++){
      const lx=-r*0.3+i*r*0.42;
      ctx.beginPath(); ctx.moveTo(lx, r*0.32); ctx.lineTo(lx+r*0.22, r*0.98); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lx,-r*0.32); ctx.lineTo(lx+r*0.22,-r*0.98); ctx.stroke();
    }
    ctx.strokeStyle=outline; ctx.lineWidth=isP?2:1.5;
    // Pincers — bigger & glowing at high tier
    ctx.fillStyle=tier>=3?accent:dark;
    ctx.beginPath(); ctx.moveTo(r*1.08,-r*0.32); ctx.lineTo(r*(1.52+tier*0.1),-r*(0.62+tier*0.06)); ctx.lineTo(r*1.42,-r*0.32); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r*1.08, r*0.32); ctx.lineTo(r*(1.52+tier*0.1), r*(0.62+tier*0.06)); ctx.lineTo(r*1.42, r*0.32); ctx.closePath(); ctx.fill(); ctx.stroke();
    // Stinger — pulses at tier 2+
    ctx.fillStyle=tier>=2?accent:dark;
    const sp=tier>=2?0.5+0.5*Math.abs(pulse):1; ctx.globalAlpha=sp;
    ctx.beginPath(); ctx.moveTo(-r*1.42,0); ctx.lineTo(-r*(1.95+tier*0.12),-r*0.55); ctx.lineTo(-r*1.65,0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.globalAlpha=1;
  }

  /* ── DEFAULT ─────────────────────────────────────────────────────────── */
  else {
    ctx.fillStyle=mainCol;
    ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill(); ctx.stroke();
  }

  /* ── RANK 7+ orbiting orbs (universal) ───────────────────────────────── */
  if(tier>=3){
    const nOrbs=tier>=4?6:4;
    for(let i=0;i<nOrbs;i++){
      const a=(i/nOrbs)*Math.PI*2+t*(1.8+tier*0.35);
      ctx.globalAlpha=0.55+0.35*Math.sin(a+t*4);
      ctx.fillStyle=accent;
      ctx.beginPath(); ctx.arc(Math.cos(a)*r*1.52,Math.sin(a)*r*1.52,r*0.12,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
  }
  /* ── RANK 9: divine cross rays ───────────────────────────────────────── */
  if(tier>=4){
    ctx.strokeStyle='rgba(255,255,255,0.55)'; ctx.lineWidth=1.5;
    for(let i=0;i<4;i++){
      const a=(i/4)*Math.PI*2+t*0.6;
      ctx.globalAlpha=0.4+0.3*Math.sin(a+t*2);
      ctx.beginPath(); ctx.moveTo(Math.cos(a)*r*0.4,Math.sin(a)*r*0.4); ctx.lineTo(Math.cos(a)*r*2.1,Math.sin(a)*r*2.1); ctx.stroke();
    }
    ctx.globalAlpha=1;
  }
}

function drawProjectiles(){
  for (const p of G.projectiles){
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth=1; ctx.stroke();
  }
}
function drawShockwaves(){
  for (const s of G.shockwaves){
    const alpha = clamp(s.life/(s.lifeMax||s.life||0.5),0,1);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = s.color; ctx.lineWidth = s.thin?3:5;
    ctx.beginPath();
    if (s.arc && s.arc<Math.PI*2){
      ctx.arc(s.x,s.y,s.r,(s.facing||0)-s.arc/2,(s.facing||0)+s.arc/2);
    } else {
      ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
    }
    ctx.stroke();
    ctx.globalAlpha=1;
  }
}
function drawParticles(){
  for (const p of G.particles){
    if (p.line){ ctx.strokeStyle=p.color; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.line.x,p.line.y); ctx.stroke(); continue; }
    if (p.gaze){ ctx.strokeStyle=p.color; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.gaze.target.x,p.gaze.target.y); ctx.stroke(); continue; }
    ctx.fillStyle = p.color; ctx.globalAlpha = clamp(p.life,0,1);
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r||2,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  }
}
function drawFloats(){
  for (const f of G.floats){
    ctx.globalAlpha = clamp(f.life/f.maxLife,0,1);
    ctx.fillStyle = f.color; ctx.font = `bold ${f.size}px sans-serif`; ctx.textAlign='center';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(f.text, f.x, f.y);
    ctx.fillText(f.text, f.x, f.y);
    ctx.globalAlpha = 1;
  }
}
function drawCrosshair(){
  ctx.strokeStyle = '#ffffff80'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(MOUSE.x, MOUSE.y, 6, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(MOUSE.x-10,MOUSE.y); ctx.lineTo(MOUSE.x-3,MOUSE.y);
  ctx.moveTo(MOUSE.x+3,MOUSE.y); ctx.lineTo(MOUSE.x+10,MOUSE.y);
  ctx.moveTo(MOUSE.x,MOUSE.y-10); ctx.lineTo(MOUSE.x,MOUSE.y-3);
  ctx.moveTo(MOUSE.x,MOUSE.y+3); ctx.lineTo(MOUSE.x,MOUSE.y+10); ctx.stroke();
}

// =====================================================================
// 星圖 v0.9.0 — 星座連線 + 生態標籤 + Boss 標記 + 羅盤 + 比例尺
// =====================================================================
function drawStarMap(){
  const W = window.innerWidth, H = window.innerHeight;
  // 黑底（半透讓星空透出感覺）
  ctx.fillStyle = 'rgba(4,2,12,0.92)';
  ctx.fillRect(0,0,W,H);
  // 計算地圖區（保留邊距讓 UI 不擋）
  const PAD = 60;
  const aspect = WORLD.w / WORLD.h;
  let mw = W - PAD*2, mh = H - PAD*2 - 40;
  if (mw/mh > aspect) mw = mh*aspect; else mh = mw/aspect;
  const mx = (W - mw)/2, my = PAD + 20;
  const sx = mw/WORLD.w, sy = mh/WORLD.h;
  // 星空（地圖外）
  for (const st of G.stars){
    if (st.x<0||st.x>WORLD.w||st.y<0||st.y>WORLD.h){
      const px = mx + (st.x/WORLD.w)*mw, py = my + (st.y/WORLD.h)*mh;
      if (px<0||px>W||py<0||py>H) continue;
      const a = 0.3 + 0.4*Math.abs(Math.sin(G.time*st.tw + st.ph));
      ctx.globalAlpha = a; ctx.fillStyle = '#e8e8ff';
      ctx.beginPath(); ctx.arc(px,py,st.r*0.6,0,Math.PI*2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  // 星雲（淺淺一層）
  for (const n of G.nebula){
    const px = mx + (n.x/WORLD.w)*mw, py = my + (n.y/WORLD.h)*mh;
    const pr = n.r * Math.min(sx,sy);
    const g = ctx.createRadialGradient(px,py,0,px,py,pr);
    g.addColorStop(0, n.color+'44'); g.addColorStop(1, n.color+'00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px,py,pr,0,Math.PI*2); ctx.fill();
  }
  // 地圖本體：用 miniCache
  if (G.terrain && G.terrain.miniCache){
    ctx.globalAlpha = 0.85;
    try { ctx.drawImage(G.terrain.miniCache, mx, my, mw, mh); } catch(e){}
    ctx.globalAlpha = 1;
  }
  // 邊框 + 觸手指示
  ctx.strokeStyle = '#6633aa'; ctx.lineWidth = 2;
  ctx.strokeRect(mx, my, mw, mh);
  // 邊界觸手符號
  for (const t of G.tendrils){
    let tx=mx, ty=my;
    if (t.side==='top'){ tx = mx + (t.pos/WORLD.w)*mw; ty = my; }
    else if (t.side==='bottom'){ tx = mx + (t.pos/WORLD.w)*mw; ty = my+mh; }
    else if (t.side==='left'){ tx = mx; ty = my + (t.pos/WORLD.h)*mh; }
    else if (t.side==='right'){ tx = mx+mw; ty = my + (t.pos/WORLD.h)*mh; }
    ctx.fillStyle = '#aa0033'; ctx.beginPath(); ctx.arc(tx,ty,3,0,Math.PI*2); ctx.fill();
  }
  // Lands End中心標記
  const cxw = mx + (WORLD.w/2)*sx, cyw = my + (WORLD.h/2)*sy;
  ctx.strokeStyle = '#aa44ff'; ctx.lineWidth = 1;
  for (let i=0;i<3;i++){
    ctx.beginPath(); ctx.arc(cxw, cyw, 8+i*6+Math.sin(G.time*2+i)*2, 0, Math.PI*2); ctx.stroke();
  }
  ctx.fillStyle = '#aa44ff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Lands End', cxw, cyw - 26);
  // Qi Spring
  for (const qs of G.qiSprings){
    const px = mx + qs.x*sx, py = my + qs.y*sy;
    ctx.fillStyle = '#bb88ff'; ctx.beginPath(); ctx.arc(px,py,4,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#bb88ff66'; ctx.beginPath(); ctx.arc(px,py,qs.r*Math.min(sx,sy),0,Math.PI*2); ctx.stroke();
  }
  // 秘境
  for (const rf of G.rifts){
    const px = mx + rf.x*sx, py = my + rf.y*sy;
    ctx.fillStyle = rf.used?'#444':rf.color; ctx.beginPath(); ctx.arc(px,py,6,0,Math.PI*2); ctx.fill();
    if (!rf.used){ ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.stroke(); }
    ctx.fillStyle = rf.used?'#666':'#fff'; ctx.font='10px sans-serif'; ctx.textAlign='center';
    ctx.fillText(rf.name, px, py - 10);
  }
  // 權柄
  for (const a of G.authorities){
    const px = mx + a.x*sx, py = my + a.y*sy;
    ctx.fillStyle = a.color; ctx.fillRect(px-3,py-3,6,6);
    ctx.fillStyle = a.color; ctx.font='9px sans-serif'; ctx.textAlign='center';
    ctx.fillText(a.icon, px, py + 14);
  }
  // 敵人
  for (const e of G.enemies){
    const px = mx + e.x*sx, py = my + e.y*sy;
    ctx.fillStyle = e.rank>=5 ? '#ff80ff' : (e.rank>=3 ? '#ffaa44' : '#f55');
    const sz = e.rank>=5 ? 3 : 2;
    ctx.fillRect(px-sz/2, py-sz/2, sz, sz);
  }
  // 玩家
  if (G.player){
    const px = mx + G.player.x*sx, py = my + G.player.y*sy;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px,py,6,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = G.player.path.color; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = G.player.path.color; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
    ctx.fillText('You', px, py - 10);
  }
  // v0.9.0: 外神 Boss (all alive)
  for (const _ob of G.bosses){ if (!_ob || _ob.hp<=0) continue;
    const bx = mx + _ob.x*sx, by = my + _ob.y*sy;
    const pul = 6 + Math.sin(G.time*4)*3;
    ctx.fillStyle = _ob.color||'#aa44ff'; ctx.beginPath(); ctx.arc(bx,by,pul,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = _ob.accent||'#ff44aa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx,by,pul+4,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle = _ob.accent||'#ff44aa'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center';
    ctx.fillText('☄ '+_ob.name, bx, by - 16);
    ctx.fillStyle = '#aaa'; ctx.font='10px sans-serif';
    ctx.fillText('HP '+(_ob.hp|0)+'/'+_ob.maxHp, bx, by + 18);
  }
  // v1.3.0 線上玩家
  if(window.Net&&Net.peers)for(const[id,peer] of Net.peers){
    if(!peer||peer.x===undefined)continue;
    const _ppx=mx+peer.x*sx,_ppy=my+peer.y*sy;
    ctx.fillStyle=peer.color||'#88ccff';
    ctx.beginPath();ctx.arc(_ppx,_ppy,5+Math.sin(G.time*3+id)*1,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#fff5';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle='#cce8ff';ctx.font='10px sans-serif';ctx.textAlign='center';
    ctx.fillText((peer.name||('P'+id))+' R'+(peer.rank||1),_ppx,_ppy-10);}
  // v1.0.0: 小 Boss 古修Wraith
  if (G.miniboss && G.miniboss.hp>0){
    const bx = mx + G.miniboss.x*sx, by = my + G.miniboss.y*sy;
    ctx.fillStyle = '#66ccff'; ctx.beginPath(); ctx.arc(bx,by,5,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#88ccff'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle = '#88ccff'; ctx.font='10px sans-serif'; ctx.textAlign='center';
    ctx.fillText('Wraith', bx, by - 8);
  }
  // v1.0.0: 權柄標記（黃色小星）
  for (const a of G.authorities){
    const ax = mx + a.x*sx, ay = my + a.y*sy;
    ctx.fillStyle = a.color; ctx.beginPath(); ctx.arc(ax,ay,3,0,Math.PI*2); ctx.fill();
  }
  // v1.0.0: Ping 標記
  if (G.pingT>0){
    const ppx = mx + G.pingX*sx, ppy = my + G.pingY*sy;
    const pr = 8 + Math.sin(G.time*6)*4;
    ctx.strokeStyle='#ff44aa'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(ppx,ppy,pr,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(ppx,ppy,pr+6,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle='#ff44aa'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
    ctx.fillText('PING '+G.pingT.toFixed(0)+'s', ppx, ppy - 14);
  }
  // v1.0.0: 霧戰（未探索區域加暗）
  if (G.visited && G.revealT<=0){
    const cs = G.visitedCellSize;
    const cellW = (cs/WORLD.w)*mw, cellH = (cs/WORLD.h)*mh;
    ctx.fillStyle = 'rgba(2,1,8,0.78)';
    for (let cy=0;cy<G.visited.length;cy++){
      for (let cx=0;cx<G.visited[0].length;cx++){
        if (!G.visited[cy][cx]) ctx.fillRect(mx + cx*cellW, my + cy*cellH, cellW+0.5, cellH+0.5);
      }
    }
  }
  // v1.0.0: 生態區標籤
  try {
    const cents = _biomeCentroids();
    ctx.font='bold 12px sans-serif'; ctx.textAlign='center';
    for (const c of cents){
      if (c.n < 30) continue;
      const cx2 = mx + c.x*sx, cy2 = my + c.y*sy;
      // 霧戰中只顯示已探索區域標籤
      let visible = G.revealT>0;
      if (!visible && G.visited){
        const gx = (c.x/G.visitedCellSize)|0, gy = (c.y/G.visitedCellSize)|0;
        if (gy>=0 && gy<G.visited.length && gx>=0 && gx<G.visited[0].length && G.visited[gy][gx]) visible = true;
      }
      if (!visible) continue;
      ctx.fillStyle='#00000088'; ctx.fillRect(cx2-30, cy2-10, 60, 16);
      ctx.fillStyle = BIOMES[c.biome] ? '#eeeeff' : '#aaa';
      ctx.fillText(BIOMES[c.biome] ? BIOMES[c.biome].name : c.biome, cx2, cy2+3);
    }
  } catch(e){}
  // 星座連線：玩家 ↔ 所有秘境（紫色光絲）
  if (G.player){
    const ppx = mx + G.player.x*sx, ppy = my + G.player.y*sy;
    ctx.strokeStyle = '#aa44ff44'; ctx.lineWidth = 1; ctx.setLineDash([3,4]);
    for (const rf of G.rifts){ if (!rf.used){ ctx.beginPath(); ctx.moveTo(ppx,ppy); ctx.lineTo(mx+rf.x*sx, my+rf.y*sy); ctx.stroke(); } }
    for (const _ob of G.bosses){ if (_ob && _ob.hp>0){ ctx.strokeStyle='#ff446688'; ctx.beginPath(); ctx.moveTo(ppx,ppy); ctx.lineTo(mx+_ob.x*sx, my+_ob.y*sy); ctx.stroke(); } }
    ctx.setLineDash([]);
  }
  // 羅盤
  ctx.fillStyle = '#88ccff'; ctx.font='bold 14px sans-serif'; ctx.textAlign='center';
  ctx.fillText('N', mx+mw/2, my-6); ctx.fillText('S', mx+mw/2, my+mh+18);
  ctx.textAlign='right'; ctx.fillText('W', mx-6, my+mh/2+5);
  ctx.textAlign='left'; ctx.fillText('E', mx+mw+6, my+mh/2+5);
  // 玩家狀態總覽（左上）
  if (G.player){
    const p = G.player;
    ctx.fillStyle = '#000c'; ctx.fillRect(20, 60, 240, 130);
    ctx.strokeStyle = '#aa44ff'; ctx.strokeRect(20, 60, 240, 130);
    ctx.fillStyle = '#cc99ff'; ctx.font='bold 13px sans-serif'; ctx.textAlign='left';
    ctx.fillText('☄ Cultivation Log', 30, 80);
    ctx.fillStyle = '#fff'; ctx.font='12px sans-serif';
    ctx.fillText(`Tier: ${tierIcon(p)} ${tierName(p)} (${p.rank}/9)`, 30, 100);
    ctx.fillText(`XP: ${p.qi|0} / ${QI_THR[p.rank]||'∞'}`, 30, 116);
    ctx.fillText(`SAN: ${p.sanity|0} / ${p.maxSanity}`, 30, 132);
    ctx.fillText(`Slain Outer Gods: ${p.q.bossKilled||0} · Sanctums: ${p.q.riftsUsed||0}/4`, 30, 148);
    ctx.fillText(`Kills: ${p.q.kills} · Survived: ${G.time.toFixed(0)}s`, 30, 164);
    ctx.fillStyle = '#aaa'; ctx.font='10px sans-serif';
    ctx.fillText(`Next Outer God: ${(G.bossSpawnT||0)|0}s`, 30, 180);
  }
  // 標題 + 提示
  ctx.fillStyle = '#cc99ff'; ctx.font='bold 18px sans-serif'; ctx.textAlign='center';
  ctx.fillText('☄ Star Map · Lands End ☄', W/2, PAD/2 + 6);
  ctx.fillStyle = '#888'; ctx.font='11px sans-serif';
  const stageNamesM = ['Era of Beasts','Era of Cultivation','Era of Stars','Era of the Weird'];
  ctx.fillStyle = '#ffdd66'; ctx.font='bold 13px sans-serif';
  ctx.fillText('★ Chapter '+G.stage+' Era · '+stageNamesM[G.stage-1]+'　|　Time '+G.time.toFixed(0)+'s', W/2, PAD/2 + 28);
  ctx.fillStyle = '#888'; ctx.font='11px sans-serif';
  ctx.fillText('M/Esc close | Left-click = Ping | White=you Purple=XP Color=Sanctum Eye=OuterGod Cyan=Wraith Yellow=Authority', W/2, H - PAD/2 + 6);
}

function drawMinimap(){
  // v2.9.2: responsive — shrink on narrow screens; clear top-right buttons (mute/pause)
  const narrow = window.innerWidth < 720;
  const mw = narrow ? 130 : 200, mh = mw;
  const mx = window.innerWidth - mw - 10;
  const my = narrow ? 56 : 64;  // clear the 44px mute/pause buttons at top:14
  // expose layout so leaderboard can stack below it
  G._minimapRect = { x: mx, y: my, w: mw, h: mh };
  ctx.fillStyle = '#000c'; ctx.fillRect(mx,my,mw,mh);
  // v1.0.0/1.0.1: ping marker + 從玩家連線
  if (G.pingT>0){
    const px = mx + (G.pingX/WORLD.w)*mw, py = my + (G.pingY/WORLD.h)*mh;
    if (G.player){
      const ppx = mx + (G.player.x/WORLD.w)*mw, ppy = my + (G.player.y/WORLD.h)*mh;
      ctx.strokeStyle='#ff44aa88'; ctx.lineWidth=1; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(ppx,ppy); ctx.lineTo(px,py); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.strokeStyle='#ff44aa'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(px,py,4+Math.sin(G.time*6)*2,0,Math.PI*2); ctx.stroke();
    // 螢幕邊指引箭頭：當 Ping 離開可視範圍時，於玩家頭頂顯示方向
  }
  // v1.0.0: 小 Boss marker
  if (G.miniboss && G.miniboss.hp>0){
    const px = mx + (G.miniboss.x/WORLD.w)*mw, py = my + (G.miniboss.y/WORLD.h)*mh;
    ctx.fillStyle='#66ccff'; ctx.beginPath(); ctx.arc(px,py,3,0,Math.PI*2); ctx.fill();
  }
  if (G.bosses.length>0 && G.bosses[0].hp>0){
    const px = mx + (G.bosses[0].x/WORLD.w)*mw, py = my + (G.bosses[0].y/WORLD.h)*mh;
    const pr = 5+Math.sin(G.time*4)*2;
    ctx.fillStyle='#aa44ff'; ctx.beginPath(); ctx.arc(px,py,pr,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#ff44aa'; ctx.lineWidth=1; ctx.stroke();
  }
  // 地形：使用預建快取
  if (G.terrain && G.terrain.miniCache){
    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = true;
    try { ctx.drawImage(G.terrain.miniCache, mx, my, mw, mh); } catch(e){}
    ctx.imageSmoothingEnabled = prevSmoothing;
  } else if (G.terrain){
    // 保底：現場重建
    try {
      const SCALE = 8;
      const off = document.createElement('canvas');
      off.width = G.terrain.cols*SCALE; off.height = G.terrain.rows*SCALE;
      const octx = off.getContext('2d');
      for (let y=0;y<G.terrain.rows;y++) for (let x=0;x<G.terrain.cols;x++){
        const b = G.terrain.map[y][x];
        octx.fillStyle = BIOMES[b].color;
        octx.fillRect(x*SCALE,y*SCALE,SCALE,SCALE);
      }
      G.terrain.miniCache = off;
      ctx.drawImage(off, mx, my, mw, mh);
    } catch(e){}
  }
  ctx.strokeStyle = '#fff8'; ctx.lineWidth=1; ctx.strokeRect(mx,my,mw,mh);
  const sx = mw/WORLD.w, sy = mh/WORLD.h;
  // 視野框
  const vw = window.innerWidth*sx, vh = window.innerHeight*sy;
  ctx.strokeStyle = '#ffff00aa'; ctx.lineWidth = 1;
  ctx.strokeRect(mx+G.cam.x*sx-vw/2, my+G.cam.y*sy-vh/2, vw, vh);
  // 權柄
  for (const a of G.authorities){ ctx.fillStyle=a.color; ctx.fillRect(mx+a.x*sx-3,my+a.y*sy-3,6,6); }
  for (const qs of G.qiSprings){ ctx.fillStyle='#bb88ff'; ctx.beginPath(); ctx.arc(mx+qs.x*sx,my+qs.y*sy,3,0,Math.PI*2); ctx.fill(); }
  for (const rf of G.rifts){ ctx.fillStyle = rf.used ? '#444' : rf.color; ctx.beginPath(); ctx.arc(mx+rf.x*sx,my+rf.y*sy,4,0,Math.PI*2); ctx.fill(); if (!rf.used){ ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.stroke(); } }
  // 敵人（階位越高越亮）
  for (const e of G.enemies){
    ctx.fillStyle = e.rank>=5 ? '#ff80ff' : (e.rank>=3 ? '#ffaa44' : '#f55');
    const s = e.rank>=5?3:2;
    ctx.fillRect(mx+e.x*sx-s/2,my+e.y*sy-s/2,s,s);
  }
  // 玩家
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(mx+G.player.x*sx,my+G.player.y*sy,4,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=G.player.path.color;ctx.lineWidth=2;ctx.stroke();
  if(window.Net&&Net.peers)for(const[,p]of Net.peers){
    if(!p||p.x===undefined)continue;
    ctx.fillStyle=p.color||'#88ccff';ctx.beginPath();ctx.arc(mx+p.x*sx,my+p.y*sy,4,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#fff5';ctx.lineWidth=1.5;ctx.stroke();}
}
// v2.3.0: kill streak banner
function drawStreakBanner(){
  if (!G.streakBannerT || G.streakBannerT<=0) return;
  G.streakBannerT -= 1/60;
  const cx = (window.innerWidth||800)/2;
  const cy = (window.innerHeight||600)*0.28;
  const a = Math.min(1, G.streakBannerT * 2);
  ctx.save();
  ctx.globalAlpha = a;
  const scale = 1 + Math.min(0.2, (3.5 - G.streakBannerT) * 0.15);
  ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.translate(-cx, -cy);
  ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
  ctx.shadowColor = G.streakBannerColor; ctx.shadowBlur = 24;
  ctx.fillStyle = '#000a';
  const tw = ctx.measureText(G.streakBannerText).width;
  ctx.fillRect(cx - tw/2 - 18, cy - 32, tw + 36, 50);
  ctx.fillStyle = G.streakBannerColor;
  ctx.fillText(G.streakBannerText, cx, cy+8);
  ctx.shadowBlur = 0;
  ctx.restore();
}
// v2.3.0: edge arrows pointing to boss / uncaptured rifts
function drawEdgeArrows(){
  if (!G.player || !G.started) return;
  const W = window.innerWidth, H = window.innerHeight;
  const pad = 36;
  const cam = G.cam;
  function worldToScreen(wx, wy){ return { sx: wx - cam.x + W/2, sy: wy - cam.y + H/2 }; }
  function drawArrow(sx, sy, color, label){
    // clamp to screen edge
    const cx = W/2, cy = H/2;
    const dx = sx - cx, dy = sy - cy;
    const ang = Math.atan2(dy, dx);
    const ex = Math.cos(ang), ey = Math.sin(ang);
    // find edge intersection
    let t = Infinity;
    if (ex!==0){ const tx=(dx>0?W/2-pad:-W/2+pad)/ex; if (tx>0) t=Math.min(t,tx); }
    if (ey!==0){ const ty=(dy>0?H/2-pad:-H/2+pad)/ey; if (ty>0) t=Math.min(t,ty); }
    const ax = cx + ex*t, ay = cy + ey*t;
    ctx.save();
    ctx.translate(ax, ay); ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(14,0); ctx.lineTo(-6,-8); ctx.lineTo(-6,8); ctx.closePath();
    ctx.fillStyle = color; ctx.globalAlpha = 0.85; ctx.fill();
    if (label){
      ctx.rotate(-ang); ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#fff'; ctx.globalAlpha=0.9;
      ctx.fillText(label, 0, 22);
    }
    ctx.restore();
  }
  // boss arrows (all alive outer gods)
  for (const _ob of G.bosses){ if (!_ob||_ob.hp<=0) continue;
    const sc = worldToScreen(_ob.x, _ob.y);
    if (sc.sx<0||sc.sx>W||sc.sy<0||sc.sy>H) drawArrow(sc.sx,sc.sy,'#aa44ff','BOSS');
  }
  // uncaptured rifts
  let riftCount=0;
  for (const rf of (G.rifts||[])){
    if (rf.used) continue;
    const sc = worldToScreen(rf.x, rf.y);
    if (sc.sx<0||sc.sx>W||sc.sy<0||sc.sy>H){
      riftCount++;
      if (riftCount<=3) drawArrow(sc.sx,sc.sy, rf.color||'#44ffcc','RIFT');
    }
  }
}

// =====================================================================
// v2.4.0: 進化揭曉動畫
// =====================================================================
function drawEvoReveal(){
  if (!G.evoReveal || G.evoReveal.t <= 0){ G.evoReveal = null; return; }
  G.evoReveal.t -= 1/60;
  if (G.evoReveal.t <= 0){ G.evoReveal = null; return; }
  const { form, rank, t } = G.evoReveal;
  const W = window.innerWidth, H = window.innerHeight;
  const cx = W/2, cy = H/2;
  const totalT = 5.0;
  const elapsed = totalT - t;
  let a = 1;
  if (elapsed < 0.5) a = elapsed / 0.5;
  if (t < 0.8) a = t / 0.8;
  ctx.save();
  ctx.globalAlpha = a * 0.82;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = a;
  const grd = ctx.createRadialGradient(cx, cy-50, 30, cx, cy-50, 200);
  grd.addColorStop(0, form.color + '55');
  grd.addColorStop(1, 'transparent');
  ctx.globalAlpha = a * 0.6;
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(cx, cy-50, 200, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = a;
  const pulse = 1 + 0.07 * Math.sin(elapsed * 7);
  ctx.save();
  ctx.translate(cx, cy - 60);
  ctx.scale(pulse, pulse);
  ctx.font = 'bold 110px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(form.icon, 0, 0);
  ctx.restore();
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = form.color;
  ctx.shadowColor = form.color; ctx.shadowBlur = 28;
  ctx.fillText('\u2726  EVOLUTION  \u2726', cx, cy + 58);
  ctx.shadowBlur = 0;
  ctx.font = 'bold 30px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(form.name, cx, cy + 108);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText('Tier ' + rank + '  \u00b7  tap anywhere to dismiss', cx, cy + 148);
  ctx.restore();
}

// =====================================================================
// v2.4.0: 手機虛擬搖桿 & 按鈕
// =====================================================================
const TOUCH = { joy:null };
const JOY_R = 62;
const JOY_KNOB_R = 26;
function isMobile(){ return ('ontouchstart' in window) && window.innerWidth < 1200; }

function _getTouchBtns(){
  const W = window.innerWidth, H = window.innerHeight;
  return [
    { key:'ldown',  x:W-82,  y:H-110, r:46, label:'\u2694',  isMs:true  },
    { key:'rdown',  x:W-190, y:H-68,  r:32, label:'\ud83d\udee1',  isMs:true  },
    { key:'f',      x:W-82,  y:H-215, r:32, label:'\ud83c\udfaf',  isMs:false },
    { key:'q',      x:W-190, y:H-160, r:30, label:'Q',   isMs:false },
    { key:'e',      x:W-82,  y:H-320, r:30, label:'E',   isMs:false },
    { key:'r',      x:W-190, y:H-255, r:30, label:'R',   isMs:false },
  ];
}

function _fireTouchBtn(btn){
  if (btn.isMs){
    if (btn.key==='ldown'){ MOUSE.ldown=true; setTimeout(function(){ MOUSE.ldown=false; },160); }
    else if (btn.key==='rdown'){ MOUSE.rdown=true; setTimeout(function(){ MOUSE.rdown=false; },160); }
  } else {
    KEYS[btn.key]=true; setTimeout(function(){ KEYS[btn.key]=false; },140);
  }
}

function setupTouch(canvas){
  if (!('ontouchstart' in window)) return;
  function onStart(e){
    e.preventDefault();
    const W=window.innerWidth, H=window.innerHeight;
    for (let i=0;i<e.changedTouches.length;i++){
      const t=e.changedTouches[i];
      const tx=t.clientX, ty=t.clientY;
      if (G.evoReveal) G.evoReveal.t = Math.min(G.evoReveal.t, 0.8);
      let hit=false;
      const btns=_getTouchBtns();
      for (let j=0;j<btns.length;j++){
        const btn=btns[j];
        if (Math.hypot(tx-btn.x, ty-btn.y) < btn.r+8){ _fireTouchBtn(btn); hit=true; break; }
      }
      if (!hit && tx < W * 0.48){
        if (!TOUCH.joy) TOUCH.joy={id:t.identifier,bx:tx,by:ty,dx:0,dy:0};
      } else if (!hit){
        const r=canvas.getBoundingClientRect();
        MOUSE.x=tx-r.left; MOUSE.y=ty-r.top;
        if (G.player){ MOUSE.wx=G.player.x+(tx-W/2); MOUSE.wy=G.player.y+(ty-H/2); }
        MOUSE.ldown=true; setTimeout(function(){ MOUSE.ldown=false; },160);
      }
    }
  }
  function onMove(e){
    e.preventDefault();
    for (let i=0;i<e.changedTouches.length;i++){
      const t=e.changedTouches[i];
      if (!TOUCH.joy || t.identifier!==TOUCH.joy.id) continue;
      let dx=t.clientX-TOUCH.joy.bx, dy=t.clientY-TOUCH.joy.by;
      const len=Math.hypot(dx,dy);
      if (len>JOY_R){ dx=dx/len*JOY_R; dy=dy/len*JOY_R; }
      TOUCH.joy.dx=dx; TOUCH.joy.dy=dy;
    }
  }
  function onEnd(e){
    e.preventDefault();
    for (let i=0;i<e.changedTouches.length;i++){
      const t=e.changedTouches[i];
      if (TOUCH.joy && t.identifier===TOUCH.joy.id) TOUCH.joy=null;
    }
  }
  canvas.addEventListener('touchstart', onStart, {passive:false});
  canvas.addEventListener('touchmove',  onMove,  {passive:false});
  canvas.addEventListener('touchend',   onEnd,   {passive:false});
  canvas.addEventListener('touchcancel',onEnd,   {passive:false});
}

function applyJoystick(){
  if (!TOUCH.joy){
    if (isMobile()){ KEYS['w']=false; KEYS['a']=false; KEYS['s']=false; KEYS['d']=false; }
    return;
  }
  const dx=TOUCH.joy.dx, dy=TOUCH.joy.dy;
  const thr=10;
  KEYS['a']=dx < -thr; KEYS['d']=dx > thr;
  KEYS['w']=dy < -thr; KEYS['s']=dy > thr;
  if (G.player && (Math.abs(dx)>thr||Math.abs(dy)>thr)){
    MOUSE.wx=G.player.x+dx/JOY_R*180;
    MOUSE.wy=G.player.y+dy/JOY_R*180;
  }
}

function drawJoystick(){
  // v2.9.6: disabled — DOM #joystick + #touchButtons are the real touch UI.
  // The canvas-drawn duplicates (MOVE placeholder, extra Q/⚔/🛡/🎯 round buttons) were
  // overlapping and confusing users who tapped the dead canvas placeholder.
  return;
}
function _drawJoystick_LEGACY(){
  if (!G.started || !isMobile()) return;
  const W=window.innerWidth, H=window.innerHeight;
  const btns=_getTouchBtns();
  for (let i=0;i<btns.length;i++){
    const btn=btns[i];
    ctx.save();
    ctx.globalAlpha=0.72;
    ctx.beginPath(); ctx.arc(btn.x,btn.y,btn.r,0,Math.PI*2);
    ctx.fillStyle='#00000099'; ctx.fill();
    ctx.strokeStyle='#ffffff44'; ctx.lineWidth=2; ctx.stroke();
    ctx.globalAlpha=1;
    ctx.font='bold '+Math.round(btn.r*0.72)+'px sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='#ffffff';
    ctx.fillText(btn.label, btn.x, btn.y);
    ctx.restore();
  }
  if (TOUCH.joy){
    const bx=TOUCH.joy.bx, by=TOUCH.joy.by, dx=TOUCH.joy.dx, dy=TOUCH.joy.dy;
    ctx.save();
    ctx.globalAlpha=0.42;
    ctx.beginPath(); ctx.arc(bx,by,JOY_R,0,Math.PI*2);
    ctx.fillStyle='#ffffff22'; ctx.fill();
    ctx.strokeStyle='#ffffff88'; ctx.lineWidth=2; ctx.stroke();
    ctx.beginPath(); ctx.arc(bx+dx,by+dy,JOY_KNOB_R,0,Math.PI*2);
    ctx.fillStyle='#ffffffaa'; ctx.fill();
    ctx.globalAlpha=1;
    ctx.restore();
  } else {
    ctx.save();
    ctx.globalAlpha=0.18;
    ctx.beginPath(); ctx.arc(W*0.2,H*0.78,JOY_R,0,Math.PI*2);
    ctx.strokeStyle='#ffffff'; ctx.lineWidth=2; ctx.stroke();
    ctx.beginPath(); ctx.arc(W*0.2,H*0.78,JOY_KNOB_R,0,Math.PI*2);
    ctx.fillStyle='#ffffff55'; ctx.fill();
    ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='#fff'; ctx.fillText('MOVE',W*0.2,H*0.78);
    ctx.restore();
  }
}

function drawKillFeed(){
  let y = 220;
  for (let i=G.killFeed.length-1;i>=0;i--){
    const k = G.killFeed[i];
    const a = Math.min(1, k.life/k.maxLife*2);
    ctx.globalAlpha = a;
    ctx.fillStyle = '#000a';
    ctx.fillRect(window.innerWidth-260, y-14, 250, 20);
    ctx.fillStyle = k.color;
    ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(k.text, window.innerWidth-18, y);
    y += 24;
  }
  ctx.globalAlpha = 1;
}
function drawLeaderboard(){
  if (!G.leaderboard || !G.leaderboard.length) return;
  // v2.9.2: responsive width + stack BELOW the minimap (no more overlap)
  const narrow = window.innerWidth < 720;
  const lw = narrow ? 180 : 240;
  const lx = (window.innerWidth || canvas.width) - lw - 10;
  // stack below minimap if it exists, else fall back to top
  const mm = G._minimapRect;
  const ly = mm ? (mm.y + mm.h + 8) : (narrow ? 56 : 64);
  const _oc=(window.Net&&Net.online)?Net.peers.size+1:0;
  // v2.3.0: use server LB when online, local otherwise
  const useLB = (_oc>1 && G._serverLB && G._serverLB.length) ? G._serverLB : null;
  const rows = useLB || G.leaderboard;
  // v2.9.2: cap visible rows so we never run off screen on phones
  const titleH = 18, rowH = narrow ? 18 : 22;
  const maxRows = Math.max(3, Math.floor((window.innerHeight - ly - 16 - titleH - 12) / rowH));
  const visRows = rows.slice(0, Math.min(rows.length, maxRows));
  const totalH = 12 + visRows.length * rowH + 6;
  ctx.fillStyle = '#000b'; ctx.fillRect(lx, ly, lw, totalH);
  ctx.strokeStyle = '#ffd66b88'; ctx.lineWidth = 1; ctx.strokeRect(lx, ly, lw, totalH);
  ctx.fillStyle='#ffd66b'; ctx.font= (narrow?'bold 11px':'bold 13px')+' sans-serif'; ctx.textAlign='left';
  ctx.fillText((useLB?'🌐 Global':'📊 Local')+' LB'+(_oc>0?' · '+_oc:''),lx+8,ly+16);
  const rowFontSm = narrow ? '10px sans-serif' : '12px sans-serif';
  const rowFontBd = narrow ? 'bold 10px sans-serif' : 'bold 12px sans-serif';
  for(let i=0;i<visRows.length;i++){
    const c=visRows[i];
    const yy=ly+34+i*rowH;
    const crown = i===0 ? '👑 ' : (i===1?'🥈 ':(i===2?'🥉 ':''));
    if(useLB){
      const isMe = G.player && c.name===G.player.name;
      ctx.fillStyle= isMe?'#ffd700':'#ddd';
      ctx.font= isMe?rowFontBd:rowFontSm;
      ctx.textAlign='left';
      ctx.fillText(`${crown}${i+1}. ${c.name}`,lx+8,yy);
      ctx.fillStyle='#aaa';ctx.textAlign='right';
      ctx.fillText(`R${c.rank} ${c.qi}qi`,lx+lw-8,yy);
    } else if(c._isPeer){
      ctx.fillStyle='#88ccff';ctx.font=rowFontSm;ctx.textAlign='left';
      ctx.fillText(`${crown}${i+1}. ● ${c.name}`,lx+8,yy);
      ctx.fillStyle=c.path.color;ctx.textAlign='right';
      ctx.fillText('R'+c.rank,lx+lw-8,yy);
    }else{
      ctx.fillStyle=c.isPlayer?'#ffffff':'#ddd';
      ctx.font=c.isPlayer?rowFontBd:rowFontSm;ctx.textAlign='left';
      ctx.fillText(`${crown}${i+1}. ${c.name||c.sp.name}`,lx+8,yy);
      ctx.fillStyle=c.path.color;ctx.textAlign='right';
      ctx.fillText(`${tierIcon(c)} ${tierName(c)} ${c.qi}`,lx+lw-8,yy);
    }
    ctx.textAlign='left';
  }
}

// =====================================================================
// HUD
// =====================================================================
function updateHUD(){
  const p = G.player;
  const set = (id,v)=>{ const el=document.getElementById(id); if (el) el.textContent=v; };
  const setW = (id,pct)=>{ const el=document.getElementById(id); if (el) el.style.width=(clamp(pct,0,1)*100).toFixed(1)+'%'; };
  setW('hpFill', p.hp/p.maxHp); set('hpTxt', `${p.hp|0}/${p.maxHp}`);
  // v1.7.0: SAN system removed — keep bar hidden always (DOM still present for legacy compat)
  const sanRow = document.querySelector('#hud .bar.san') || document.querySelector('#sanFill') && document.querySelector('#sanFill').closest('.bar');
  if (sanRow) sanRow.style.display = 'none';
  setW('sanFill', p.sanity/p.maxSanity); set('sanTxt', `${p.sanity|0}/${p.maxSanity}`);
  setW('staFill', p.sta/p.maxSta); set('staTxt', `${p.sta|0}/${p.maxSta}`);
  setW('lifeFill', p.life/p.maxLife); set('lifeTxt', `${p.life|0}s`);
  const need = QI_THR[p.rank] || QI_THR[8];
  const prev = QI_THR[p.rank-1] || 0;
  const _qiSafe = Number.isFinite(p.qi) ? p.qi : 0;
  setW('evoFill', (_qiSafe-prev)/Math.max(1,need-prev));
  set('evoTxt', `${_qiSafe|0}/${need}`);
  // 階位 / 任務 / 解鎖
  const q = currentQuest(p);
  const statsEl = document.getElementById('stats');
  if (statsEl){
    statsEl.innerHTML = `
      <div class="pathLine"><b style="color:${p.path.color}">${p.path.name}</b> · <span style="color:${p.path.color}">${tierIcon(p)} ${tierName(p)}</span>(Tier ${p.rank}/9)— <span style="color:#cccccc">${tierData(p)?tierData(p).pname:''}</span></div>
      <div>Essence x${p.zhenyuan.toFixed(2)} · Dao x${p.daohen.toFixed(2)}</div>
      <div class="cdrow">
        ${(()=>{
          function skBadge(cd, t, name, slot, unlock, rank){
            const rBoost = slot==='Q'&&rank>=3||slot==='E'&&rank>=5||slot==='R'&&rank>=7 ? '★' : '';
            const mega = rank>=9?'⚡':rank>=8?'★★':rank>=7?'★':'';
            if (rank < unlock) return `<span style="color:#555">${slot} 🔒 lv${unlock}</span>`;
            if (t>0) return `<span style="color:#ff8866">${slot} ${t.toFixed(1)}s ${name}</span>`;
            return `<span style="color:#88ff88">${slot}${mega} ✓ ${name}</span>`;
          }
          return skBadge(p.sp.skillQ.cd,p.skillQT,p.sp.skillQ.name,'Q',p.sp.skillQ.unlockRank||1,p.rank)
            +' | '+skBadge(p.sp.skillE.cd,p.skillET,p.sp.skillE.name,'E',p.sp.skillE.unlockRank||1,p.rank)
            +' | '+skBadge(p.sp.skillR.cd,p.skillRT,p.sp.skillR.name,'R',p.sp.skillR.unlockRank||1,p.rank);
        })()}
      </div>
      ${G.boss && G.boss.hp>0 ? `<div class="quest" style="background:#aa44ff33;border-left-color:#aa44ff;color:#dabbff;">☄ Outer God ${G.boss.name} · HP ${G.boss.hp|0}/${G.boss.maxHp}</div>` : `<div style="color:#888;font-size:10px;margin-top:4px">外神降臨：${(G.bossSpawnT||0)|0}s 後</div>`}
      ${q ? `<div class="quest" style="${p.qi>=QI_THR[p.rank]&&!q.req(p)?'background:#ff446644;border-left-color:#ff4466;color:#ffccdd;':''}">${p.qi>=QI_THR[p.rank]&&!q.req(p)?'⚠ Enough XP! Complete quest or reach XP '+(QI_THR[p.rank]*1.8|0)+' Force ascend: ':'Quest: '}${q.desc}　<span class="qprog">[${q.show(p)}]</span> ${q.req(p)?'<span class="qdone">✓</span>':''}</div>` : '<div class="quest qdone">★ Divinity achieved</div>'}
    `;
  }
  // 權柄槽（v0.8.0: 6 槽，按 1-6 釋放）
  const slotsEl = document.getElementById('fruitSlots');
  // v1.6.2: hide authority slots and the auth list panel until rank 2
  const fruitsPanelEl = document.getElementById('fruitsPanel');
  const showAuth = p.rank >= 2;
  if (slotsEl)       slotsEl.style.display       = showAuth ? '' : 'none';
  if (fruitsPanelEl) fruitsPanelEl.style.display = showAuth ? '' : 'none';
  if (slotsEl && showAuth){
    slotsEl.innerHTML = '';
    for (let i=0;i<6;i++){
      const div = document.createElement('div'); div.className='slot';
      const a = p.authoritySlots[i];
      if (a){
        div.style.background = a.color+'44'; div.style.borderColor = a.color;
        div.innerHTML = `<div style="font-weight:700;color:${a.color};font-size:11px">${i+1} ${a.icon}</div><div style="font-size:8px">${a.name}</div>`;
        if (p.authCdT[i]>0) div.innerHTML += `<div class="cdnum">${p.authCdT[i].toFixed(1)}</div>`;
      } else {
        div.innerHTML = `<div style="opacity:0.4;font-size:11px">${i+1}</div>`;
      }
      slotsEl.appendChild(div);
    }
  }
}

// =====================================================================
// WebAudio 音效（純合成，無資產）
// =====================================================================
let AC=null;
function ac(){ if (!AC){ try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } return AC; }
function playSound(type){
  if (!G.soundOn) return;
  const a = ac(); if (!a) return;
  const now = a.currentTime;
  // layered oscillators [freq, wave, vol, dur, freqEnd?]
  const SND = {
    'hit':    [[520,'square',0.05,0.07],[260,'sine',0.02,0.05]],
    'hurt':   [[180,'sawtooth',0.09,0.20],[90,'sine',0.04,0.14]],
    'kill':   [[720,'triangle',0.08,0.25,1080],[360,'sine',0.05,0.20,540]],
    'block':  [[900,'sine',0.07,0.10],[1350,'sine',0.03,0.07]],
    'pickup': [[1100,'triangle',0.04,0.09],[1320,'triangle',0.03,0.14,1760]],
    'promote':[[440,'triangle',0.10,0.70,880],[550,'sine',0.07,0.80,1100],[660,'triangle',0.05,0.90,1320]],
    'auth':   [[140,'sawtooth',0.12,0.65,56],[70,'sine',0.06,0.85]],
    'death':  [[80,'sawtooth',0.13,1.30,24],[120,'sine',0.07,1.10,40]],
    'rankup': [[330,'triangle',0.11,0.85,990],[440,'sine',0.08,1.00,1320]],
  };
  const layers = SND[type] || [[440,'sine',0.05,0.10]];
  for (const [f, wave, vol, dur, fEnd] of layers){
    try {
      const o=a.createOscillator(), g=a.createGain(), flt=a.createBiquadFilter();
      flt.type='lowpass'; flt.frequency.value=Math.min(f*6,8000);
      o.connect(flt); flt.connect(g); g.connect(a.destination);
      o.type=wave; o.frequency.setValueAtTime(f, now);
      if (fEnd) o.frequency.exponentialRampToValueAtTime(fEnd, now+dur);
      g.gain.setValueAtTime(vol, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now+dur);
      o.start(now); o.stop(now+dur);
    } catch(e2) {}
  }
}

// =====================================================================
// v2.6.0: 程序化 BGM（無音樂素材，純 WebAudio 合成）
// 一個低頻 pad drone + 一個基於 G.player.rank 強度層疊的琶音
// =====================================================================
const BGM = { on:false, master:null, padOsc:[], padGain:null, arpInt:null, _step:0, intensity:0 };
const BGM_SCALE = [0, 3, 5, 7, 10, 12, 15, 17];  // 小調五聲音階延伸
function bgmBaseFreq(){ return 110; }  // A2

function startBGM(){
  if (BGM.on) return;
  const a = ac(); if (!a) return;
  BGM.on = true;
  try {
    // 主音量
    BGM.master = a.createGain();
    BGM.master.gain.value = 0;
    BGM.master.connect(a.destination);
    // pad drone — 3 個低頻三角波堆疊
    const drone = [110, 165, 220]; // A2 / E3 / A3
    drone.forEach(f=>{
      const o = a.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const g = a.createGain(); g.gain.value = 0.06;
      const lp = a.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=800;
      o.connect(lp); lp.connect(g); g.connect(BGM.master);
      o.start();
      BGM.padOsc.push({osc:o, gain:g});
    });
    // 淡入 1.5 秒
    BGM.master.gain.setValueAtTime(0, a.currentTime);
    BGM.master.gain.linearRampToValueAtTime(0.28, a.currentTime + 1.5);
    // 琶音序列：每 280ms 一個音符，根據強度增加層數
    BGM._step = 0;
    BGM.arpInt = setInterval(()=>{
      if (!G.soundOn || !BGM.on) return;
      try { _bgmArpTick(); } catch(e){}
    }, 280);
  } catch(e){ BGM.on = false; }
}

function _bgmArpTick(){
  const a = ac(); if (!a) return;
  // 從 G.player 取強度（rank 越高、boss 越接近，琶音越密集）
  let intensity = 0;
  try {
    if (G.player && G.player.rank){
      intensity = Math.min(1, G.player.rank / 7);
    }
    if (G.bosses.some(b=>b&&b.hp>0)) intensity = Math.min(1, intensity + 0.35);
    if (G.killStreak >= 5) intensity = Math.min(1, intensity + 0.2);
  } catch(e){}
  // 每 8 步只播一次的玩家可感層；高強度時每 4 步一次
  const period = intensity > 0.6 ? 2 : intensity > 0.3 ? 3 : 4;
  if ((BGM._step % period) !== 0){ BGM._step++; return; }
  const note = BGM_SCALE[BGM._step % BGM_SCALE.length];
  const f = bgmBaseFreq() * Math.pow(2, (note + 12) / 12);  // up 1 octave for arp
  const o = a.createOscillator();
  o.type = 'sine';
  o.frequency.value = f;
  const g = a.createGain();
  g.gain.setValueAtTime(0, a.currentTime);
  g.gain.linearRampToValueAtTime(0.10 + intensity*0.10, a.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.55);
  o.connect(g); g.connect(BGM.master);
  o.start();
  o.stop(a.currentTime + 0.6);
  // 高強度加八度上音（更亮）
  if (intensity > 0.5){
    const o2 = a.createOscillator(); o2.type='triangle'; o2.frequency.value = f*2;
    const g2 = a.createGain();
    g2.gain.setValueAtTime(0, a.currentTime);
    g2.gain.linearRampToValueAtTime(0.05, a.currentTime + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.45);
    o2.connect(g2); g2.connect(BGM.master);
    o2.start(); o2.stop(a.currentTime + 0.5);
  }
  // v2.8.0: BOSS combat layer — sub-bass kick + dark sawtooth pulse every 4 steps when boss alive
  if (G.bosses.some(b=>b&&b.hp>0) && (BGM._step % 4) === 0){
    // sub-bass kick (descending sine for that "boom" feel)
    const k = a.createOscillator(); k.type='sine';
    k.frequency.setValueAtTime(110, a.currentTime);
    k.frequency.exponentialRampToValueAtTime(35, a.currentTime + 0.25);
    const kg = a.createGain();
    kg.gain.setValueAtTime(0, a.currentTime);
    kg.gain.linearRampToValueAtTime(0.32, a.currentTime + 0.01);
    kg.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.30);
    k.connect(kg); kg.connect(BGM.master);
    k.start(); k.stop(a.currentTime + 0.32);
    // dark sawtooth pulse — ominous boss presence
    const s = a.createOscillator(); s.type='sawtooth';
    s.frequency.value = bgmBaseFreq() * 0.5;  // one octave below
    const sg = a.createGain();
    const slp = a.createBiquadFilter(); slp.type='lowpass'; slp.frequency.value=320;
    sg.gain.setValueAtTime(0, a.currentTime);
    sg.gain.linearRampToValueAtTime(0.10, a.currentTime + 0.05);
    sg.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.7);
    s.connect(slp); slp.connect(sg); sg.connect(BGM.master);
    s.start(); s.stop(a.currentTime + 0.75);
  }
  BGM._step++;
}

function stopBGM(){
  const a = ac();
  if (!BGM.on) return;
  BGM.on = false;
  try {
    if (BGM.master && a){
      BGM.master.gain.cancelScheduledValues(a.currentTime);
      BGM.master.gain.linearRampToValueAtTime(0, a.currentTime + 0.4);
    }
    if (BGM.arpInt) { clearInterval(BGM.arpInt); BGM.arpInt = null; }
    setTimeout(()=>{
      try {
        BGM.padOsc.forEach(p => { try{ p.osc.stop(); }catch(e){} });
        BGM.padOsc = [];
      } catch(e){}
    }, 500);
  } catch(e){}
}

// =====================================================================
// 存檔系統 (v1.4.0)
// =====================================================================
const EVO_SAVE_KEY = 'evo_save_v140';
function saveProgress(opts){
  if (!G.player || !G.started) return;
  if (G.dead && !(opts && opts.onDeath)) return;
  try {
    const prev = getSave() || {};
    let qiBank = prev.qiBank || 0;
    if (opts && opts.onDeath){
      // v1.6.0 retention: bank 10% of run's Qi for next run as starter bonus (cap 2000)
      const earned = Math.floor((G.player.qi||0) * 0.10);
      qiBank = Math.min(2000, qiBank + earned);
    }
    const d = {
      v:'1.6', name:G.player.name, species:G.selectedSpecies,
      rank:G.player.rank, qi:G.player.qi,
      kills:G.player.q ? G.player.q.kills : 0,
      time:Math.floor(G.time), savedAt:Date.now(),
      qiBank: qiBank,
      bestRank: Math.max(prev.bestRank||0, G.player.rank||0),
      bestKills: Math.max(prev.bestKills||0, (G.player.q&&G.player.q.kills)||0)
    };
    localStorage.setItem(EVO_SAVE_KEY, JSON.stringify(d));
  } catch(e) {}
}
function consumeQiBank(){
  try { const s = getSave(); if (!s) return 0; const b = s.qiBank||0; s.qiBank = 0; localStorage.setItem(EVO_SAVE_KEY, JSON.stringify(s)); return b; } catch(e){ return 0; }
}
function getSave(){
  try { return JSON.parse(localStorage.getItem(EVO_SAVE_KEY)); } catch(e) { return null; }
}

// =====================================================================
// v1.7.0: Meta-progression — coins, character unlocks, daily quests
// =====================================================================
const EVO_COINS_KEY = 'evo_coins';
const EVO_UNLOCKS_KEY = 'evo_unlocks';
const EVO_DAILY_QUEST_KEY = 'evo_daily_q';

// Species costs. 0 / undefined = free. Adjust to balance reward.
const SPECIES_LOCKS = {
  swordsman:0, wolf:0, eagle:0, fish:0, scorpion:0,
  archer:120, mage:150, monk:200, assassin:250,
  lizard:80,  croc:180, raptor:300, tyrant:500,
  fox:100,    bear:200, lion:350,   dragon:700,
  owl:150,    falcon:220, phoenix:600,
  shark:250,  kraken:550,
  snake:100,  viper:200,  naga:400,
  centipede:180, beetle:220, mantis:380, locust:450
};

function getCoins(){ try { return parseInt(localStorage.getItem(EVO_COINS_KEY)||'0',10)||0; } catch(e){ return 0; } }
function setCoins(n){ try { localStorage.setItem(EVO_COINS_KEY, String(Math.max(0, n|0))); } catch(e){} }
function addCoins(n){ setCoins(getCoins() + (n|0)); }
function getUnlocks(){ try { return JSON.parse(localStorage.getItem(EVO_UNLOCKS_KEY)||'{}') || {}; } catch(e){ return {}; } }
function isUnlocked(sk){
  const cost = SPECIES_LOCKS[sk]; if (cost===undefined || cost===0) return true;
  const u = getUnlocks(); return !!u[sk];
}
function unlockSpecies(sk){
  const cost = SPECIES_LOCKS[sk]; if (!cost) return true;
  const have = getCoins(); if (have < cost) return false;
  setCoins(have - cost);
  const u = getUnlocks(); u[sk] = 1;
  try { localStorage.setItem(EVO_UNLOCKS_KEY, JSON.stringify(u)); } catch(e){}
  return true;
}
// Award coins at end of run from current G.player stats; also checks daily quest.
function awardRunCoins(){
  let earned = 0;
  try {
    const p = G.player; if (!p) return 0;
    const qi = p.qi|0, rank = p.rank|0, kills = (p.q&&p.q.kills)|0;
    earned = Math.floor(qi/15 + rank*12 + kills*2);
    // Daily quest completion bonus
    const dq = getDailyQuest();
    if (dq && !dq.done){
      let ok = false;
      if (dq.type==='survive') ok = (G.time||0) >= dq.target;
      else if (dq.type==='kills') ok = kills >= dq.target;
      else if (dq.type==='rank') ok = rank >= dq.target;
      if (ok){
        earned += dq.reward|0;
        dq.done = true;
        try{ localStorage.setItem(EVO_DAILY_QUEST_KEY, JSON.stringify(dq)); }catch(e){}
      }
    }
    if (earned > 0) addCoins(earned);
    // v1.8.0: weekly challenge progress + mastery + lifetime
    try { progressWeekly(kills, 1, qi, rank); } catch(e){}
    try { addMasteryKills(G.selectedSpecies, kills); } catch(e){}
    try { bumpLifetime(1, kills, qi, earned); } catch(e){}
  } catch(e){}
  return earned;
}
// One daily quest per UTC day, rotates from a small pool
function getDailyQuest(){
  const today = new Date().toISOString().slice(0,10);
  try {
    const cur = JSON.parse(localStorage.getItem(EVO_DAILY_QUEST_KEY)||'null');
    if (cur && cur.date===today) return cur;
  } catch(e){}
  const pool = [
    {type:'survive', target:300, reward:60,  desc:'Survive 5 minutes in one run'},
    {type:'kills',   target:50,  reward:80,  desc:'Get 50 kills in one run'},
    {type:'rank',    target:4,   reward:100, desc:'Reach Tier 4 in one run'},
    {type:'kills',   target:25,  reward:50,  desc:'Get 25 kills in one run'},
    {type:'survive', target:600, reward:120, desc:'Survive 10 minutes in one run'},
  ];
  const q = {...pool[(Math.random()*pool.length)|0], date:today, done:false};
  try{ localStorage.setItem(EVO_DAILY_QUEST_KEY, JSON.stringify(q)); }catch(e){}
  return q;
}

// =====================================================================
// v1.8.0: Weekly Challenge, Login Streak, Lucky Spin, Character Mastery
// =====================================================================
const EVO_WEEKLY_KEY  = 'evo_weekly_q';
const EVO_STREAK_KEY  = 'evo_login_streak';
const EVO_SPIN_KEY    = 'evo_spin_today';
const EVO_MASTERY_KEY = 'evo_mastery';
const EVO_LIFETIME_KEY = 'evo_lifetime_stats';  // total runs / kills / coins ever
const EVO_CRATE_USED_KEY = '__crate_used_run'; // session-only, reset per run

function _utcDay(){ return new Date().toISOString().slice(0,10); }
function _utcWeek(){
  const d = new Date(); d.setUTCHours(0,0,0,0);
  const day = (d.getUTCDay()+6)%7;  // ISO week starts Mon
  d.setUTCDate(d.getUTCDate()-day);
  return d.toISOString().slice(0,10);
}

// ---- Weekly Challenge (Mon-reset, larger reward) ----
function getWeeklyChallenge(){
  const week = _utcWeek();
  try {
    const cur = JSON.parse(localStorage.getItem(EVO_WEEKLY_KEY)||'null');
    if (cur && cur.week===week) return cur;
  } catch(e){}
  const pool = [
    {type:'totalKills', target:300, reward:400, desc:'Score 300 cumulative kills this week'},
    {type:'totalRuns',  target:15,  reward:350, desc:'Complete 15 runs this week'},
    {type:'highRank',   target:7,   reward:500, desc:'Reach Tier 7 in any single run'},
    {type:'totalQi',    target:8000, reward:450, desc:'Bank 8,000 cumulative Qi this week'},
  ];
  const q = {...pool[(Math.random()*pool.length)|0], week, progress:0, done:false};
  try{ localStorage.setItem(EVO_WEEKLY_KEY, JSON.stringify(q)); }catch(e){}
  return q;
}
function progressWeekly(deltaKills, deltaRuns, deltaQi, runRank){
  const w = getWeeklyChallenge(); if (!w || w.done) return 0;
  if (w.type==='totalKills') w.progress += deltaKills|0;
  else if (w.type==='totalRuns') w.progress += deltaRuns|0;
  else if (w.type==='totalQi') w.progress += deltaQi|0;
  else if (w.type==='highRank') w.progress = Math.max(w.progress||0, runRank|0);
  let earned = 0;
  if (w.progress >= w.target){ earned = w.reward|0; w.done = true; addCoins(earned); }
  try{ localStorage.setItem(EVO_WEEKLY_KEY, JSON.stringify(w)); }catch(e){}
  return earned;
}

// ---- Login Streak (7-day chain, resets if a day missed) ----
const STREAK_REWARDS = [50, 80, 120, 180, 250, 350, 600];  // day 1..7, day 7 = jackpot
function checkLoginStreak(){
  // returns { day, reward, alreadyClaimed }
  const today = _utcDay();
  let s = {};
  try { s = JSON.parse(localStorage.getItem(EVO_STREAK_KEY)||'{}') || {}; } catch(e){ s={}; }
  if (s.lastClaim === today) return { day:s.day||1, reward:0, alreadyClaimed:true };
  const yest = new Date(); yest.setUTCDate(yest.getUTCDate()-1);
  const ystr = yest.toISOString().slice(0,10);
  let day = (s.lastClaim===ystr) ? Math.min(7,(s.day||0)+1) : 1;
  const reward = STREAK_REWARDS[day-1] || 50;
  addCoins(reward);
  s.day = day; s.lastClaim = today;
  try{ localStorage.setItem(EVO_STREAK_KEY, JSON.stringify(s)); }catch(e){}
  return { day, reward, alreadyClaimed:false };
}
function getStreakState(){
  try { return JSON.parse(localStorage.getItem(EVO_STREAK_KEY)||'{}') || {}; } catch(e){ return {}; }
}

// ---- Lucky Spin (1 free per day + 3 ad-bought) ----
const SPIN_PRIZES = [
  {coins:25,  weight:30, label:'25 🪙'},
  {coins:50,  weight:25, label:'50 🪙'},
  {coins:100, weight:18, label:'100 🪙'},
  {coins:200, weight:12, label:'200 🪙'},
  {coins:0,   weight:10, label:'Try again!'},
  {coins:500, weight:4,  label:'JACKPOT 500 🪙'},
  {coins:1000,weight:1,  label:'🌟 MEGA 1000 🪙'},
];
function getSpinState(){
  const today = _utcDay();
  let s = {};
  try { s = JSON.parse(localStorage.getItem(EVO_SPIN_KEY)||'{}') || {}; } catch(e){}
  if (s.date !== today){ s = {date:today, freeUsed:false, adSpinsUsed:0}; try{ localStorage.setItem(EVO_SPIN_KEY, JSON.stringify(s)); }catch(e){} }
  return s;
}
function doSpin(){
  let w = 0; for (const p of SPIN_PRIZES) w += p.weight;
  let r = Math.random()*w;
  for (const p of SPIN_PRIZES){ r -= p.weight; if (r<=0){ if (p.coins>0) addCoins(p.coins); return p; } }
  return SPIN_PRIZES[0];
}
function trySpinFree(){
  const s = getSpinState(); if (s.freeUsed) return null;
  s.freeUsed = true; try{ localStorage.setItem(EVO_SPIN_KEY, JSON.stringify(s)); }catch(e){}
  return doSpin();
}
function trySpinAd(){
  const s = getSpinState(); if ((s.adSpinsUsed|0) >= 3) return null;
  s.adSpinsUsed = (s.adSpinsUsed|0)+1; try{ localStorage.setItem(EVO_SPIN_KEY, JSON.stringify(s)); }catch(e){}
  return doSpin();
}

// ---- Character Mastery (per-species kill counter → permanent +ATK) ----
function getMastery(){
  try { return JSON.parse(localStorage.getItem(EVO_MASTERY_KEY)||'{}') || {}; } catch(e){ return {}; }
}
function addMasteryKills(sk, n){
  if (!sk || !n) return;
  const m = getMastery();
  m[sk] = (m[sk]||0) + (n|0);
  try { localStorage.setItem(EVO_MASTERY_KEY, JSON.stringify(m)); } catch(e){}
}
function masteryAtkBonus(sk){
  const m = getMastery();
  const kills = m[sk]||0;
  // +1% ATK per 50 kills, capped at +20%
  return Math.min(0.20, Math.floor(kills/50) * 0.01);
}
function masteryHpBonus(sk){
  const m = getMastery();
  const kills = m[sk]||0;
  // +1% HP per 100 kills, capped at +10%
  return Math.min(0.10, Math.floor(kills/100) * 0.01);
}

// ---- Lifetime stats (for analytics / weekly hooks) ----
function bumpLifetime(deltaRuns, deltaKills, deltaQi, deltaCoins){
  try {
    const s = JSON.parse(localStorage.getItem(EVO_LIFETIME_KEY)||'{}') || {};
    s.runs   = (s.runs||0)   + (deltaRuns|0);
    s.kills  = (s.kills||0)  + (deltaKills|0);
    s.qi     = (s.qi||0)     + (deltaQi|0);
    s.coins  = (s.coins||0)  + (deltaCoins|0);
    s.firstPlay = s.firstPlay || Date.now();
    localStorage.setItem(EVO_LIFETIME_KEY, JSON.stringify(s));
  } catch(e){}
}

// =====================================================================
// 行動觸控 (v1.4.0)
// =====================================================================
function setupTouch(canvas){
  const touchEl = document.getElementById('touch');
  if (!touchEl) return;
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (!isTouch && window.innerWidth > 900) return;
  touchEl.classList.remove('hidden');

  const joystick = document.getElementById('joystick');
  const stick    = document.getElementById('stick');
  let jCX=0, jCY=0, jTid=-1;

  function jApply(cx, cy){
    const dx=cx-jCX, dy=cy-jCY, mag=Math.hypot(dx,dy), cap=46;
    const nx=mag>cap?dx/mag*cap:dx, ny=mag>cap?dy/mag*cap:dy;
    stick.style.transform = 'translate('+nx+'px,'+ny+'px)';
    KEYS['w']=dy<-14; KEYS['s']=dy>14; KEYS['a']=dx<-14; KEYS['d']=dx>14;
    // v2.9.7: expose joystick vector so player facing can follow movement (one-stick control)
    if (mag > 8){
      TOUCH.joy = { dx, dy, mag, ang: Math.atan2(dy, dx) };
    } else {
      TOUCH.joy = null;
    }
  }
  function jClear(){
    jTid=-1; stick.style.transform='translate(0,0)';
    KEYS['w']=KEYS['s']=KEYS['a']=KEYS['d']=false;
    TOUCH.joy = null;
  }

  joystick.addEventListener('touchstart', e=>{
    e.preventDefault();
    const t=e.changedTouches[0], r=joystick.getBoundingClientRect();
    jCX=r.left+r.width/2; jCY=r.top+r.height/2; jTid=t.identifier;
    jApply(t.clientX, t.clientY);
  }, {passive:false});

  // v2.9.5: only swallow touchmove when it's actually a game-input gesture.
  // Previously this preventDefault'd EVERY touchmove on document → broke iPad menu scroll.
  function _isGameTouch(target){
    if (!target) return false;
    // active joystick drag → always game
    if (jTid !== -1) return true;
    // canvas or touch UI element → game
    if (target === canvas) return true;
    const touchUI = document.getElementById('touch');
    if (touchUI && touchUI.contains(target)) return true;
    // anything else (menu overlay, inputs, buttons, scroll containers) → let it scroll/click
    return false;
  }

  document.addEventListener('touchmove', e=>{
    // Only block default (scroll) when the touch is part of game input.
    // Lets iPad / iOS scroll the species-select menu, death screen, tutorial, etc.
    let block = false;
    for (const t of e.changedTouches){
      if (t.identifier===jTid){ jApply(t.clientX, t.clientY); block = true; }
      else if (_isGameTouch(t.target)){
        const r=canvas.getBoundingClientRect();
        MOUSE.x=t.clientX-r.left; MOUSE.y=t.clientY-r.top;
        block = true;
      }
    }
    if (block) e.preventDefault();
  }, {passive:false});

  document.addEventListener('touchend', e=>{
    for (const t of e.changedTouches){ if (t.identifier===jTid) jClear(); }
  }, {passive:false});
  document.addEventListener('touchcancel', e=>{

  // v1.8.0: rich meta panel — login streak, weekly challenge, lucky spin
  let metaPanel = document.getElementById('metaPanel');
  if (!metaPanel){
    metaPanel = document.createElement('div'); metaPanel.id='metaPanel';
    metaPanel.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:0 0 12px;font-size:12px;';
    list.parentNode.insertBefore(metaPanel, list);
  }
  // 1) Login streak
  const _streak = getStreakState();
  const _streakClaimedToday = (_streak.lastClaim === _utcDay());
  const _streakDay = _streak.day || 0;
  const _streakNext = _streakClaimedToday ? null : STREAK_REWARDS[Math.min(7, (_streakDay)+(_streak.lastClaim===new Date(Date.now()-86400000).toISOString().slice(0,10)?1:1))-1];
  // 2) Weekly challenge
  const _wk = getWeeklyChallenge();
  const _wkPct = Math.min(100, Math.floor(((_wk.progress||0)/_wk.target)*100));
  // 3) Lucky spin
  const _spin = getSpinState();
  const _freeAvail = !_spin.freeUsed;
  const _adAvail = (3-(_spin.adSpinsUsed||0));
  metaPanel.innerHTML = `
    <div style="padding:8px;background:rgba(80,140,200,0.12);border:1px solid #6699cc;border-radius:6px;">
      <div style="font-weight:700;color:#9fc7ee">📅 Login Streak: Day ${_streakDay||0}/7</div>
      <div style="color:#aaa;font-size:11px;margin-top:2px">${_streakClaimedToday?`<span style="color:#7fd07f">✓ +${STREAK_REWARDS[_streakDay-1]||0} coins claimed today</span>`:`<button id="claimStreakBtn" style="margin-top:4px;padding:4px 10px;background:#3a6b3a;color:#ccffcc;border:1px solid #7fd07f;border-radius:4px;cursor:pointer;font-weight:700">▶ Claim +${_streakNext||50} 🪙</button>`}</div>
    </div>
    <div style="padding:8px;background:rgba(180,80,160,0.12);border:1px solid #cc66aa;border-radius:6px;">
      <div style="font-weight:700;color:#ee9fcc">📜 Weekly Challenge</div>
      <div style="color:#ddd;font-size:11px;margin-top:2px">${_wk.desc}</div>
      <div style="margin-top:4px;background:#222;border-radius:3px;height:6px;overflow:hidden"><div style="background:linear-gradient(90deg,#cc66aa,#ff88cc);height:100%;width:${_wkPct}%"></div></div>
      <div style="color:#aaa;font-size:10px;margin-top:2px">${_wk.done?`<span style="color:#7fd07f">✓ +${_wk.reward} coins claimed</span>`:`${_wk.progress||0}/${_wk.target} → +${_wk.reward} 🪙`}</div>
    </div>
    <div style="padding:8px;background:rgba(200,160,60,0.14);border:1px solid #ddaa44;border-radius:6px;">
      <div style="font-weight:700;color:#ffd66b">🎰 Lucky Spin</div>
      <div style="color:#aaa;font-size:11px;margin-top:2px">Free: ${_freeAvail?'1 available':'used today'} · Ad spins left: ${_adAvail}/3</div>
      <div id="spinResult" style="color:#ffd66b;font-size:11px;margin-top:2px;min-height:14px"></div>
      <div style="display:flex;gap:4px;margin-top:4px;">
        <button id="spinFreeBtn" ${_freeAvail?'':'disabled'} style="flex:1;padding:4px;background:${_freeAvail?'#3a6b3a':'#333'};color:${_freeAvail?'#ccffcc':'#666'};border:1px solid ${_freeAvail?'#7fd07f':'#555'};border-radius:4px;cursor:${_freeAvail?'pointer':'not-allowed'};font-weight:700;font-size:11px">Free Spin</button>
        <button id="spinAdBtn" ${_adAvail>0?'':'disabled'} style="flex:1;padding:4px;background:${_adAvail>0?'#6b3a3a':'#333'};color:${_adAvail>0?'#ffcccc':'#666'};border:1px solid ${_adAvail>0?'#d07f7f':'#555'};border-radius:4px;cursor:${_adAvail>0?'pointer':'not-allowed'};font-weight:700;font-size:11px">▶ Ad Spin</button>
      </div>
    </div>`;
  // Wire buttons
  const _csb = document.getElementById('claimStreakBtn');
  if (_csb){
    _csb.onclick = ()=>{
      const r = checkLoginStreak();
      try{ playSound('promote'); }catch(e){}
      buildMenu();
    };
  }
  const _sfb = document.getElementById('spinFreeBtn');
  if (_sfb){
    _sfb.onclick = ()=>{
      const prize = trySpinFree();
      if (prize){
        document.getElementById('spinResult').textContent = '🎲 ' + prize.label;
        try{ playSound(prize.coins>=200?'promote':'pickup'); }catch(e){}
        setTimeout(buildMenu, 1200);
      }
    };
  }
  const _sab = document.getElementById('spinAdBtn');
  if (_sab){
    _sab.onclick = async ()=>{
      if (!window.SDK || !SDK.ready || typeof SDK.rewardedBreak!=='function'){
        // Fallback: still allow but no real ad
        const prize = trySpinAd();
        if (prize){ document.getElementById('spinResult').textContent = '🎲 ' + prize.label; setTimeout(buildMenu, 1200); }
        return;
      }
      _sab.disabled = true; _sab.textContent = 'Loading…';
      let ok = false;
      try { ok = await SDK.rewardedBreak(); } catch(e){}
      if (ok !== false){
        const prize = trySpinAd();
        if (prize){
          document.getElementById('spinResult').textContent = '🎲 ' + prize.label;
          try{ playSound(prize.coins>=200?'promote':'pickup'); }catch(e){}
          setTimeout(buildMenu, 1200);
        }
      } else { _sab.disabled = false; _sab.textContent = '▶ Ad Spin'; }
    };
  }
    for (const t of e.changedTouches){ if (t.identifier===jTid) jClear(); }
  }, {passive:false});

  function tapBtn(id, fn){
    const el=document.getElementById(id); if (!el) return;
    el.addEventListener('touchstart', e=>{ e.preventDefault(); fn(true);  }, {passive:false});
    el.addEventListener('touchend',   e=>{ e.preventDefault(); fn(false); }, {passive:false});
    el.addEventListener('touchcancel',e=>{ e.preventDefault(); fn(false); }, {passive:false});
  }
  tapBtn('btnAtk', v=>{ MOUSE.ldown=v; });
  tapBtn('btnDef', v=>{ MOUSE.rdown=v; });
  tapBtn('btnSpr', v=>{ KEYS['x']=v; });
  tapBtn('btnRng', v=>{ if(v&&G.player&&G.started) doRanged(G.player); });
  tapBtn('btnQ',   v=>{ KEYS['q']=v; });
  tapBtn('btnE',   v=>{ KEYS['e']=v; });
  tapBtn('btnR',   v=>{ KEYS['r']=v; });
  tapBtn('btnF1',  v=>{ KEYS['1']=v; });
  tapBtn('btnF2',  v=>{ KEYS['2']=v; });
  tapBtn('btnF3',  v=>{ KEYS['3']=v; });
  tapBtn('btnMap', v=>{ if(v&&G.started){ G.mapOpen=!G.mapOpen; } });

  canvas.addEventListener('touchstart', e=>{
    e.preventDefault();
    for (const t of e.changedTouches){
      if (t.identifier===jTid) continue;
      const r=canvas.getBoundingClientRect();
      MOUSE.x=t.clientX-r.left; MOUSE.y=t.clientY-r.top;
    }
  }, {passive:false});
}

// =====================================================================
// 選單
// =====================================================================
// v2.6.0: 在菜單種族卡片上跑 live preview 動畫（共用 drawShape，視覺風格一致）
let _menuPreviewRAF = 0;
let _menuPreviewT = 0;
function startMenuPreviews(){
  if (_menuPreviewRAF) return;
  const _saveCtx = ctx;
  const loop = ()=>{
    _menuPreviewRAF = 0;
    const menu = document.getElementById('menu');
    // v3.4.1: re-query canvases each frame (DOM may be rebuilt by buildMenu)
    // and keep polling while menu element exists — don't early-stop on hidden,
    // otherwise startup race (buildMenu called before menu shown) leaves blanks.
    if (!menu){ try { ctx = _saveCtx; } catch(e){} return; }
    if (menu.classList.contains('hidden')){
      _menuPreviewRAF = requestAnimationFrame(loop);
      return;
    }
    const cvsList = Array.from(menu.querySelectorAll('canvas.speciesPreview'));
    if (!cvsList.length){
      _menuPreviewRAF = requestAnimationFrame(loop);
      return;
    }
    _menuPreviewT += 1/60;
    const _saveGtime = G.time;
    try {
      for (const cvs of cvsList){
        const sk = cvs.dataset.sk;
        const sp = SPECIES[sk]; if (!sp) continue;
        const pcx = cvs.getContext('2d');
        pcx.clearRect(0,0,cvs.width,cvs.height);
        // v3.4.4: AI-art portrait path (preferred when available)
        const _portrait = getPortrait(sk, 1);
        if (_portrait){
          pcx.save();
          pcx.globalAlpha = 1;
          const _haloR = Math.min(cvs.width, cvs.height)*0.55;
          const _halo = pcx.createRadialGradient(cvs.width/2, cvs.height/2, 6, cvs.width/2, cvs.height/2, _haloR);
          _halo.addColorStop(0, (sp.color||'#888888')+'55');
          _halo.addColorStop(1, 'rgba(0,0,0,0)');
          pcx.fillStyle = _halo; pcx.fillRect(0,0,cvs.width,cvs.height);
          const _bob2 = Math.sin(_menuPreviewT*1.6 + sk.charCodeAt(0))*2;
          const _iw = _portrait.naturalWidth || _portrait.width;
          const _ih = _portrait.naturalHeight || _portrait.height;
          const _pad = 4;
          const _maxW = cvs.width - _pad*2, _maxH = cvs.height - _pad*2;
          const _scale = Math.min(_maxW/_iw, _maxH/_ih);
          const _dw = _iw*_scale, _dh = _ih*_scale;
          const _dx = (cvs.width - _dw)/2, _dy = (cvs.height - _dh)/2 + _bob2;
          try { pcx.drawImage(_portrait, _dx, _dy, _dw, _dh); } catch(e){}
          pcx.restore();
          continue;
        }
        const grd = pcx.createRadialGradient(cvs.width/2, cvs.height/2, 4, cvs.width/2, cvs.height/2, 60);
        grd.addColorStop(0, sp.color+'30');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        pcx.fillStyle = grd; pcx.fillRect(0,0,cvs.width,cvs.height);
        G.time = _menuPreviewT;
        const bob = Math.sin(_menuPreviewT*1.8 + sk.charCodeAt(0))*4;
        const facing = Math.sin(_menuPreviewT*0.7)*0.3;
        const r = 22;
        pcx.save();
        // v3.4.2: reset state that may persist from a previous frame's drawShape call
        pcx.globalAlpha = 1;
        pcx.translate(cvs.width/2, cvs.height/2 + bob);
        pcx.rotate(facing);
        // v3.4.2: draw preview using pcx directly (no global ctx swap needed)
        // This avoids any risk of corrupting the main canvas ctx reference
        try {
          ctx = pcx;
          const fake = {
            x:0, y:0, r:r, facing:0, vx:0, vy:0,
            color:sp.color, sp:sp, _fp:sk.charCodeAt(0), isPlayer:false,
            rank:1, hp:1, maxHp:1,
          };
          try { drawShape(fake); } catch(e){
            // drawShape failed — fallback: colored circle + species icon
            if (typeof console !== 'undefined') console.warn('[preview drawShape]', sk, e && (e.message||e));
            pcx.globalAlpha = 0.9;
            pcx.fillStyle = sp.color || '#888888';
            pcx.beginPath(); pcx.arc(0, 0, r*0.85, 0, Math.PI*2); pcx.fill();
            pcx.strokeStyle = '#ffffff55'; pcx.lineWidth = 1.5; pcx.stroke();
            pcx.globalAlpha = 1;
            pcx.fillStyle = '#ffffff';
            pcx.font = Math.floor(r*1.1)+'px serif';
            pcx.textAlign = 'center'; pcx.textBaseline = 'middle';
            pcx.fillText(sp.icon || '?', 0, r*0.08);
          }
        } finally {
          ctx = _saveCtx;
        }
        pcx.restore();
      }
    } finally {
      G.time = _saveGtime;
    }
    _menuPreviewRAF = requestAnimationFrame(loop);
  };
  _menuPreviewRAF = requestAnimationFrame(loop);
}

function buildMenu(){
  const list = document.getElementById('speciesList'); list.innerHTML='';
  // v1.7.0: coin banner + daily quest meta bar at top of menu
  let topBar = document.getElementById('metaBar');
  if (!topBar){
    topBar = document.createElement('div'); topBar.id='metaBar';
    topBar.style.cssText = 'display:flex;gap:14px;align-items:center;justify-content:center;flex-wrap:wrap;margin:6px 0 10px;padding:8px 12px;background:rgba(180,140,60,0.12);border:1px solid #cc9944;border-radius:8px;font-size:13px;';
    list.parentNode.insertBefore(topBar, list);
  }
  const _coins = getCoins();
  const _dq = getDailyQuest();
  const _dqTxt = _dq ? (_dq.done ? `<span style="color:#7fd07f">✓ Daily: ${_dq.desc} (+${_dq.reward} coins claimed)</span>` : `<span style="color:#ffd66b">★ Daily Quest: ${_dq.desc} → +${_dq.reward} coins</span>`) : '';
  // v2.5.0: form codex progress (drives replay — "gotta evolve them all")
  const _haveF = formsDiscoveredCount();
  const _totF  = totalFormsCount();
  const _pctF  = Math.floor((_haveF/_totF)*100);
  const _formsTxt = `<span style="color:#9fd09f">📖 Forms: ${_haveF}/${_totF} (${_pctF}%)</span>`;
  topBar.innerHTML = `<span style="font-weight:700;color:#ffd66b;font-size:16px">🪙 ${_coins} coins</span> ${_formsTxt} ${_dqTxt}`;

  const byPath = {};
  for (const k of Object.keys(SPECIES)){ const sp = SPECIES[k]; (byPath[sp.path]=byPath[sp.path]||[]).push(k); }
  for (const pk of Object.keys(PATHS)){
    const arr = byPath[pk]; if (!arr) continue;
    const grp = document.createElement('div'); grp.className='pathGroup';
    const h = document.createElement('div'); h.className='pathHeader'; h.style.color=PATHS[pk].color;
    h.textContent = `${PATHS[pk].icon} ${PATHS[pk].name} → ${PATHS[pk].tiers[8].name}`;
    grp.appendChild(h);
    for (const sk of arr){
      const sp = SPECIES[sk];
      const div = document.createElement('div'); div.className='species';
      // v1.7.0: lock badge UI
      const cost = SPECIES_LOCKS[sk];
      const locked = (cost!==undefined && cost>0 && !isUnlocked(sk));
      let lockBadge = '';
      if (locked){
        const canBuy = getCoins() >= cost;
        div.style.opacity = '0.7';
        lockBadge = `<div style="float:right;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;background:${canBuy?'#3a6b3a':'#552222'};color:${canBuy?'#ccffcc':'#ffaaaa'};border:1px solid ${canBuy?'#7fd07f':'#aa5555'}">🔒 ${cost} ${canBuy?'(click to unlock)':'(need more)'}</div>`;
      } else if (cost>0){
        lockBadge = `<div style="float:right;padding:2px 6px;border-radius:4px;font-size:10px;background:#2a4a2a;color:#9fd09f">✓ Unlocked</div>`;
      }
      div.innerHTML = `${lockBadge}<div style="font-weight:700;color:${sp.color}">${sp.icon} ${sp.name}</div>
        <canvas class="speciesPreview" width="120" height="80" data-sk="${sk}" style="display:block;margin:6px auto 4px;background:linear-gradient(180deg,rgba(40,30,60,0.5),rgba(20,12,32,0.6));border:1px solid #553;border-radius:6px;"></canvas>
        <div class="nums">HP ${sp.base.hp} · ATK ${sp.base.atk} · SPD ${sp.base.spd} ${sp.base.rngDmg?`· Ranged ${sp.base.rngDmg}`:'(melee only)'}</div>
        <div class="skills">Q ${sp.skillQ.name} · E ${sp.skillE.name} (tier ${sp.skillE.unlockRank}) · R ${sp.skillR.name} (tier ${sp.skillR.unlockRank})</div>${(()=>{
          // v1.8.0: mastery progress bar
          try {
            const mk = (getMastery()[sk]||0);
            const ab = masteryAtkBonus(sk), hb = masteryHpBonus(sk);
            if (mk<=0) return '';
            const nextStep = mk - (mk % 50) + 50;
            const pct = Math.floor(((mk%50)/50)*100);
            return `<div style="margin-top:4px;font-size:10px;color:#9fd09f">⚔ Mastery: ${mk} kills (+${(ab*100).toFixed(0)}% ATK, +${(hb*100).toFixed(0)}% HP) <span style="color:#888">→ ${nextStep}</span><div style="background:#222;border-radius:2px;height:3px;margin-top:1px"><div style="background:#7fd07f;height:100%;width:${pct}%"></div></div></div>`;
          } catch(e){ return ''; }
        })()}`;
      div.onclick = ()=>{
        // v1.7.0: locked species — try to unlock first
        if (SPECIES_LOCKS[sk]>0 && !isUnlocked(sk)){
          if (unlockSpecies(sk)){
            try{ playSound('promote'); }catch(e){}
            buildMenu();
          } else {
            try{ playSound('hurt'); }catch(e){}
            const need = SPECIES_LOCKS[sk] - getCoins();
            try { pushKillFeed(`Need ${need} more coins to unlock ${sp.name}`, '#ff6688'); } catch(e){}
          }
          return;
        }
        document.querySelectorAll('.species').forEach(d=>d.classList.remove('sel'));
        div.classList.add('sel');
        G.selectedSpecies = sk;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('startBtn').textContent = `Play as ${sp.name} · Join ${PATHS[pk].name}`;
      };
      grp.appendChild(div);
    }
    list.appendChild(grp);
  }
  // v2.6.0: start live animated previews on each species card
  try { startMenuPreviews(); } catch(e){}
  // show save info banner
  const _sv = getSave();
  let _siel = document.getElementById('saveInfo');
  if (!_siel){
    _siel = document.createElement('div'); _siel.id='saveInfo';
    const _sb = document.getElementById('startBtn');
    _sb.parentNode.insertBefore(_siel, _sb);
  }
  if (_sv){
    const _sd = new Date(_sv.savedAt);
    _siel.className='saveInfo';
    const _qb = (_sv.qiBank||0)|0;
    // v1.6.2: daily login bonus — give +80 Qi-banked once per UTC day
    let _daily = '';
    try {
      const today = new Date().toISOString().slice(0,10);
      const last  = localStorage.getItem('evo_daily_last');
      if (last !== today){
        const cur = JSON.parse(localStorage.getItem(EVO_SAVE_KEY)) || {};
        cur.qiBank = Math.min(2000, (cur.qiBank||0) + 80);
        localStorage.setItem(EVO_SAVE_KEY, JSON.stringify(cur));
        localStorage.setItem('evo_daily_last', today);
        _daily = ' &nbsp;&middot;&nbsp; <span style="color:#7fd07f">★ +80 Daily Login Bonus claimed!</span>';
      }
    } catch(e){}
    _siel.innerHTML = '<div class="saveBox">Last run: <b>'+(_sv.name||'?')+'</b> &nbsp;Tier '+_sv.rank+'&nbsp;&middot;&nbsp;Kills '+_sv.kills+'&nbsp;&middot;&nbsp;'+Math.floor(_sv.time/60)+'m'+(_sv.time%60)+'s&nbsp;&middot;&nbsp;'+_sd.toLocaleDateString('en-US')+(_qb>0?' &nbsp;&middot;&nbsp; <span style="color:#bb88ff">+'+_qb+' XP banked</span>':'')+_daily+'</div>';
  } else {
    // v1.6.2: first-visit daily bonus stub
    try {
      const today = new Date().toISOString().slice(0,10);
      const last  = localStorage.getItem('evo_daily_last');
      if (last !== today){
        localStorage.setItem(EVO_SAVE_KEY, JSON.stringify({v:'1.6',qiBank:80,savedAt:Date.now()}));
        localStorage.setItem('evo_daily_last', today);
        _siel.className='saveInfo';
        _siel.innerHTML = '<div class="saveBox"><span style="color:#7fd07f">★ +80 Qi Welcome Bonus! Bank ready for your first run.</span></div>';
      } else { _siel.innerHTML=''; }
    } catch(e){ _siel.innerHTML=''; }
  }
}

// =====================================================================
// 啟動
// =====================================================================
// =====================================================================
// v1.2.0 多人聯機渲染與 UI
// =====================================================================
function drawRemotePeers(){
  if (!window.Net || !Net.peers) return;
  const now = performance.now();
  for (const [id, peer] of Net.peers){
    if (!peer || peer.x===undefined) continue;
    // 插值平滑：用 px/py/pt → x/y
    let drawX = peer.x, drawY = peer.y;
    if (peer.px !== undefined && peer.pt){
      const a = Math.min(1, (now - peer.pt) / (1000/Net.sendHz));
      drawX = peer.px + (peer.x - peer.px) * a;
      drawY = peer.py + (peer.y - peer.py) * a;
    }
    const r = peer.r || 14;
    // 光環（受擊紅閃）
    const flash = peer.hitT>0 ? Math.min(1, peer.hitT/0.3) : 0;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = flash>0 ? '#ff5566' : (peer.color || '#88ccff');
    ctx.beginPath(); ctx.arc(drawX, drawY, r*2.2, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    // v1.5.0: render with drawShape when species known
    const _spDef = (peer.species && typeof SPECIES!=='undefined') ? SPECIES[peer.species] : null;
    if (_spDef){
      const fake = {
        x:drawX, y:drawY, r:r, facing:peer.facing||0, vx:0, vy:0,
        color:peer.color||_spDef.color, sp:_spDef, _fp:(id*17)%100, isPlayer:false,
        rank:peer.rank||1, hp:peer.hp||1, maxHp:peer.maxHp||1,
      };
      try {
        // v2.9.9: must save/translate/rotate like drawCreature does, otherwise
        // drawShape draws at canvas origin (0,0) instead of the peer's world position
        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(peer.facing||0);
        drawShape(fake);
        ctx.restore();
      } catch(e){
        ctx.fillStyle = peer.color || '#88ccff';
        ctx.beginPath(); ctx.arc(drawX, drawY, r, 0, Math.PI*2); ctx.fill();
      }
    } else {
      ctx.fillStyle = peer.color || '#88ccff';
      ctx.beginPath(); ctx.arc(drawX, drawY, r, 0, Math.PI*2); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#fff';
      ctx.stroke();
    }
    if (typeof peer.facing === 'number'){
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(drawX, drawY);
      ctx.lineTo(drawX + Math.cos(peer.facing)*(r+8), drawY + Math.sin(peer.facing)*(r+8));
      ctx.stroke();
    }
    // PvP 三角標記
    ctx.fillStyle = '#ff4466';
    ctx.beginPath();
    ctx.moveTo(drawX, drawY - r - 14);
    ctx.lineTo(drawX - 5, drawY - r - 4);
    ctx.lineTo(drawX + 5, drawY - r - 4);
    ctx.closePath(); ctx.fill();
    // HP 條
    if (peer.maxHp){
      const bw = Math.max(36, r*2.2), bh = 5;
      const bx = drawX - bw/2, by = drawY + r + 6;
      ctx.fillStyle = '#000a'; ctx.fillRect(bx-1, by-1, bw+2, bh+2);
      ctx.fillStyle = '#222'; ctx.fillRect(bx, by, bw, bh);
      const ratio = Math.max(0, Math.min(1, peer.hp/peer.maxHp));
      ctx.fillStyle = ratio>0.5?'#5eea7a':(ratio>0.2?'#ffd166':'#ff5566');
      ctx.fillRect(bx, by, bw*ratio, bh);
    }
    // 名牌
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px system-ui,sans-serif';
    ctx.textAlign = 'center';
    const label = (peer.name||('Player#'+id)) + ' · ' + (peer.path||'?') + ' R' + (peer.rank||1);
    ctx.strokeStyle = '#000a'; ctx.lineWidth = 3;
    ctx.strokeText(label, drawX, drawY - r - 18);
    ctx.fillText(label, drawX, drawY - r - 18);
    // Chat泡泡
    if (peer.chatT>0 && peer.chatText){
      ctx.font = '13px system-ui,sans-serif';
      const tw = ctx.measureText(peer.chatText).width;
      ctx.fillStyle = '#000c';
      ctx.fillRect(drawX-tw/2-6, drawY - r - 50, tw+12, 22);
      ctx.fillStyle = '#ffeb70';
      ctx.fillText(peer.chatText, drawX, drawY - r - 34);
    }
    ctx.textAlign = 'left';
  }
}

function openChatInput(){
  if (G._chatOpen) return;
  G._chatOpen = true;
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;left:50%;bottom:80px;transform:translateX(-50%);z-index:9999;background:#000c;border:1px solid #88ccff;padding:8px 12px;border-radius:6px;font:14px system-ui;';
  wrap.innerHTML = '<span style="color:#88ccff;margin-right:6px">Chat</span><input id="_chatInput" maxlength="180" style="width:380px;background:#111;color:#fff;border:1px solid #444;padding:4px 8px;border-radius:4px;outline:none"/> <span style="color:#888;font-size:11px">Enter to send · Esc to cancel</span>';
  document.body.appendChild(wrap);
  const inp = wrap.querySelector('#_chatInput');
  inp.focus();
  const close = ()=>{ G._chatOpen=false; wrap.remove(); };
  inp.addEventListener('keydown', (ev)=>{
    ev.stopPropagation();
    if (ev.key==='Enter'){
      const v = inp.value.trim();
      if (v && window.Net){ Net.sendChat(v); pushKillFeed('💬 You: '+v, '#ffeb70'); }
      close();
    } else if (ev.key==='Escape'){ close(); }
  });
}

function drawOnlineBadge(){
  if (!window.Net) return;
  ctx.save();
  ctx.font = 'bold 13px system-ui,sans-serif';
  const txt = Net.online ? ('● Online '+(Net.peers.size+1)+' players · ID '+(Net.myId||'?')+' · T chat') : '○ Connecting…';
  const tw = ctx.measureText(txt).width;
  ctx.fillStyle = '#000a';
  ctx.fillRect(10, window.innerHeight-34, tw+18, 24);
  ctx.fillStyle = Net.online ? '#5eea7a' : '#ff8866';
  ctx.fillText(txt, 18, window.innerHeight-17);
  ctx.restore();
}

async function startGame(){
  if (!G.selectedSpecies) return;
  if (window.SDK && SDK.ready && !G._firstAdShown){
    G._firstAdShown = true;
    try { await SDK.commercialBreak(); } catch(e){}
  }
  document.getElementById('menu').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  // v2.7.0: show pause button in-game
  try { const _pb = document.getElementById('pauseBtn'); if (_pb) _pb.classList.add('show'); } catch(e){}
  G.enemies=[]; G.minions=[]; G.projectiles=[]; G.pickups=[]; G.spirits=[]; G.authorities=[]; G.particles=[]; G.floats=[]; G.shockwaves=[]; G.hazards=[];
  G.dead=false; G.won=false; G.time=0;
  // v2.8.0: reset death-cinema state on new run
  G._deathCinT = 0; G._deathOverlayShown = false; G._deathReason = null;
  G.tutorialT = 0; G.tutorialStep = 0;
  G.firstHunt = { active:true, shown:false, t:45 };
  // v2.5.0: reset per-run metric flags + bump run counter
  G._metricsLogged = { firstKill:false, firstEvo:false };
  G._runStartT = (G.time||0);
  try { bumpMetric('runs', 1); } catch(e){}
  // mark starter form as discovered (rank 1)
  try { markFormSeen(G.selectedSpecies, 1); } catch(e){}
  // v2.6.0: 進入遊戲時啟動 BGM
  try { startBGM(); } catch(e){}
  // v2.7.0: 第一次玩啟動 tutorial
  try { startTutorial(); } catch(e){}
  G.player = makeCreature(G.selectedSpecies, WORLD.w/2, WORLD.h/2 - 1500, true);
  // 玩家額外加成：基礎 +30% HP / +50% DEF（容錯）
  G.player.bonusDefMult = 1.5;
  G.player.maxHp = Math.floor(G.player.maxHp * 1.3);
  G.player.hp = G.player.maxHp;
  recalcStats(G.player);
  G.player.hp = G.player.maxHp; G.player.sta = G.player.maxSta;
  G.player.invuln = 10; // 10s spawn protection
  // v1.6.0 retention bonus: consume banked Qi from previous run — v1.8.3: DISABLED auto-apply (was instant level on start). Banked Qi now stays as a small comeback boost capped at 30.
  try {
    const _bonus = Math.min(30, consumeQiBank());
    if (_bonus>0){
      G.player.qi = (G.player.qi||0) + _bonus;
      logMsg('★ Welcome back! +'+_bonus+' Qi from your last run', 'promote');
      try{ addFloat(G.player.x, G.player.y-40, '+'+_bonus+' Qi (banked, capped)', '#bb88ff', 18, 2.0); }catch(e){}
    }
  } catch(e){}
  // Camera snap to player
  G.cam.x = G.cam.tx = G.player.x;
  G.cam.y = G.cam.ty = G.player.y;
  G.cam.shake = 0; G.cam.flash = 0; G.cam.hitFlash = 0;
  spawnInitialWorld();
  if (typeof resize==='function') resize();
  G.started = true;
  if (window.SDK) SDK.gameplayStart();
  logMsg(`You chose [${G.player.sp.name}] · ${G.player.path.name}`, 'promote');
  logMsg('★ First goal: kill the nearest creature and trigger your first evolution hook.', 'promote');
  logMsg('★ 10s spawn protection — get used to controls before attacking!', 'promote');
  logMsg(isMobile() ? 'Controls: left thumb move / right buttons attack-defend-cast / tap right side to quick slash' : 'Controls: WASD move / LMB melee / RMB defend / F ranged / QER skills / X dash / 1-6 Authority / M map', 'promote');
  logMsg('★ EVOLUTION BRAWL: kill enemies for Qi & loot. Higher-rank enemies drop Authority fruits!', 'promote');
  logMsg('★ 9 unique Authorities scattered on the map — also dropped by rank 3+ enemies on death.', 'promote');
  logMsg('★ Outer God descends every 5 min for +1500 Qi. Sanctums grant power. 5 eras escalate the war.', 'promote');
  // v1.2.0 多人聯機
  const _ni=document.getElementById('playerName');
  const _nv=_ni?_ni.value.trim().slice(0,16):'';
  G.player.name=_nv||('Player#'+((Math.random()*9000|0)+1000));
  if (window.Net){
    Net.onWelcome = (m)=>{ logMsg('★ Connected to multiplayer server (your ID: '+m.id+', currently online: '+((m.peers||[]).length+1)+' players)','promote'); };
    Net.onHit = (fromId, dmg, kind)=>{
      if (!G.player || G.player.hp<=0) return;
      const peer = Net.peers.get(fromId);
      const fake = { isPlayer:false, isRemotePeerAttacker:true, name:(peer&&peer.name)||('Player#'+fromId), x:(peer&&peer.x)||G.player.x, y:(peer&&peer.y)||G.player.y, hp:1, atk:dmg, perks:{} };
      dealDamage(fake, G.player, dmg, '#ff6688');
      if(G.player.hp<=0&&window.Net&&Net.sendDead){
        const _kp=Net.peers.get(fromId);
        Net.sendDead(fromId,(_kp&&_kp.name)||('Player#'+fromId));
      }
    };
    Net.onChat = (fromId, text)=>{
      const peer = Net.peers.get(fromId);
      const nm = (peer&&peer.name)||('Player#'+fromId);
      pushKillFeed('💬 '+nm+': '+text, '#ffeb70');
      logMsg('💬 '+nm+'：'+text,'kill');
      if (peer){ peer.chatText=text; peer.chatT=5; }
    };
    Net.onPvpKill=(killerId,killerName,victimId,victimName)=>{
      const iKilled=(killerId===Net.myId);
      if(iKilled){
        pushKillFeed('You killed '+victimName,'#ffd66b');
        if(G.player){G.player.q.kills++;tryPromote(G.player);}
        try{playSound('kill');}catch(e){}
      }else{
        const isMe=(victimId===Net.myId);
        pushKillFeed(killerName+' killed '+(isMe?'You':victimName),isMe?'#ff4466':'#ff8866');
      }
    };
    Net.onEnemyKill = (nid)=>{
      const _ee = G.enemies.find(x=>x.nid===nid);
      if (_ee && _ee.hp>0){ _ee.hp=0; _ee._dead=true; }
    };
    // v3.2.0: skip multiplayer on platform builds (Poki/CrazyGames) — avoid
    // bleeding bandwidth to our own Render server when distributed on portals.
    // Standalone (own domain) still gets multiplayer.
    const _plat = (window.SDK && SDK.platform) || 'standalone';
    if (_plat === 'standalone'){
      Net.connect();
    } else {
      logMsg('★ Solo mode (platform build)', 'promote');
    }
  }
}
async function restartGame(){
  if (window.SDK && SDK.ready) SDK.gameplayStop();
  // v2.5.0: track restart (replay-rate metric for Poki/CrazyGames retention)
  try { bumpMetric('restarts', 1); } catch(e){}
  // v2.6.0: 死亡返回菜單時停 BGM（startGame 會再啟）
  try { stopBGM(); } catch(e){}
  // v2.7.0: clear any lingering restart-countdown interval
  try { if (G._deathRestartCdInt){ clearInterval(G._deathRestartCdInt); G._deathRestartCdInt = 0; } } catch(e){}
  // v2.8.0: reset cinema-death state so next death plays again
  try { G._deathCinT = 0; G._deathOverlayShown = false; G._deathReason = null; } catch(e){}
  // v2.7.0: hide pause UI when returning to menu
  try {
    const _pb = document.getElementById('pauseBtn'); if (_pb) _pb.classList.remove('show');
    const _po = document.getElementById('pauseOverlay'); if (_po) _po.classList.add('hidden');
    G.paused = false;
  } catch(e){}
  document.getElementById('death').classList.add('hidden');
  document.getElementById('win').classList.add('hidden');
  const _rev = document.getElementById('reviveBtn'); if (_rev) _rev.classList.add('hidden');
  const _cdb = document.getElementById('coinDoubleBtn'); if (_cdb) _cdb.classList.add('hidden');
  G.started=false; G.selectedSpecies=null; G._reviveUsed=false; G._coinDoubleUsed=false; G._crateUsed=false;
  G.killFeed=[]; G.leaderboard=[]; G.deathBy=''; G.errorCount=0;
  if (window.SDK && SDK.ready){ try { await SDK.commercialBreak(); } catch(e){} }
  document.getElementById('menu').classList.remove('hidden');
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('startBtn').disabled=true;
  document.getElementById('startBtn').textContent='Choose a species to start';
  try { buildMenu(); } catch(e){}
}
window.addEventListener('load', async ()=>{
  setupCanvas();
  setupInput(document.getElementById('game'));
  const _sdkP = (window.SDK ? SDK.init() : Promise.resolve()).catch(()=>{});
  buildMenu();
  document.getElementById('startBtn').onclick = startGame;
  document.getElementById('restartBtn').onclick = restartGame;
  document.getElementById('winRestartBtn').onclick = restartGame;

  // v1.6.0: Quick Start (random species) — Poki best practice: 1-click play
  const _qs = document.getElementById('quickStartBtn');
  if (_qs) _qs.onclick = ()=>{
    const keys = Object.keys(SPECIES);
    G.selectedSpecies = keys[(Math.random()*keys.length)|0];
    startGame();
  };

  // v1.6.0: 30-second tutorial overlay
  const _tutBtn = document.getElementById('tutorialBtn');
  const _tutEl  = document.getElementById('tutorial');
  const _tutClose = document.getElementById('tutCloseBtn');
  if (_tutBtn && _tutEl){
    _tutBtn.onclick = ()=>{ _tutEl.classList.remove('hidden'); };
  }
  if (_tutClose && _tutEl){
    _tutClose.onclick = ()=>{ _tutEl.classList.add('hidden'); };
  }
  // Auto-show tutorial on first visit
  try {
    if (!localStorage.getItem('evo_tut_seen')){
      setTimeout(()=>{ if (_tutEl) _tutEl.classList.remove('hidden'); }, 600);
      localStorage.setItem('evo_tut_seen','1');
    }
  } catch(e){}

  // v1.6.0: Privacy / Terms inline overlays (required for Poki/CrazyGames)
  const _legalEl = document.getElementById('legal');
  const _legalT  = document.getElementById('legalTitle');
  const _legalB  = document.getElementById('legalBody');
  const _legalC  = document.getElementById('legalCloseBtn');
  const _privacyHTML = '<p>Lands End does not collect any personal data. Your chosen nickname and game progress (current tier, banked Qi, kill count) are stored only in your browser <code>localStorage</code> and never transmitted to our servers.</p>'
    +'<p>For multiplayer, your nickname, in-game position, HP, and species are broadcast in real time to the multiplayer relay so other players can see you. No IP addresses, accounts, or tracking cookies are stored on the server.</p>'
    +'<p>The game may show advertisements via the Poki SDK or CrazyGames SDK when embedded on those platforms. Those ad networks have their own privacy policies — see <a href="https://poki.com/en/privacy" target="_blank" rel="noopener">poki.com/privacy</a> and <a href="https://www.crazygames.com/privacy" target="_blank" rel="noopener">crazygames.com/privacy</a>.</p>'
    +'<p>This game is intended for general audiences (13+). It contains stylized combat between abstract creature shapes and is not directed at children under 13.</p>'
    +'<p>To clear your local save, open browser DevTools (F12) → Application → Local Storage → delete entries starting with <code>evo_</code>.</p>';
  const _termsHTML = '<p>By playing Lands End you agree to use the game for personal, non-commercial entertainment. The game is provided "as is" without warranty of any kind.</p>'
    +'<p>Do not exploit bugs, run modified clients, harass other players via chat, or attempt to disrupt the multiplayer service. We reserve the right to block clients that abuse the relay.</p>'
    +'<p>You retain ownership of any nickname you submit. We are not responsible for content typed by other players in the global chat.</p>'
    +'<p>The game is open-source-spirited and may be updated, modified, or discontinued at any time without notice.</p>';
  function _openLegal(kind){
    if (!_legalEl) return;
    _legalT.textContent = (kind==='terms') ? 'Terms of Service' : 'Privacy Policy';
    _legalB.innerHTML   = (kind==='terms') ? _termsHTML : _privacyHTML;
    _legalEl.classList.remove('hidden');
  }
  const _pl = document.getElementById('privacyLink');
  const _tl = document.getElementById('termsLink');
  if (_pl) _pl.onclick = (ev)=>{ ev.preventDefault(); _openLegal('privacy'); };
  if (_tl) _tl.onclick = (ev)=>{ ev.preventDefault(); _openLegal('terms');   };
  if (_legalC) _legalC.onclick = ()=>{ _legalEl.classList.add('hidden'); };
  setupTouch(document.getElementById('game'));
  const _unlock = ()=>{ try{ ac(); }catch(e){} };
  document.addEventListener('touchstart', _unlock, {once:true});
  document.addEventListener('click',      _unlock, {once:true});
  const _mb = document.getElementById('muteBtn');
  if (_mb){
    _mb.onclick = ()=>{
      G.soundOn = !G.soundOn;
      _mb.textContent = G.soundOn ? '🔊' : '🔇';
      try{ localStorage.setItem('evo_mute', G.soundOn?'0':'1'); }catch(e){}
      // v2.6.0: BGM follows mute toggle
      try { if (!G.soundOn) stopBGM(); else if (G.started && !G.dead) startBGM(); } catch(e){}
    };
    try{ if (localStorage.getItem('evo_mute')==='1'){ G.soundOn=false; _mb.textContent='🔇'; } }catch(e){}
  }
  // v2.7.0: pause button + pause overlay handlers
  const _pbtn = document.getElementById('pauseBtn');
  if (_pbtn){ _pbtn.onclick = ()=>{ if (G.started && !G.dead && !G.won) togglePause(); }; }
  const _pRes = document.getElementById('pauseResumeBtn');
  if (_pRes){ _pRes.onclick = ()=>{ if (G.paused) togglePause(); }; }
  const _pSnd = document.getElementById('pauseSoundBtn');
  if (_pSnd){ _pSnd.onclick = ()=>{ if (_mb) _mb.click(); _pSnd.textContent = G.soundOn ? '🔊 Sound' : '🔇 Muted'; }; }
  const _pQuit = document.getElementById('pauseQuitBtn');
  if (_pQuit){ _pQuit.onclick = ()=>{
    if (G.paused) togglePause();
    try { restartGame(); } catch(e){}
  }; }
  document.addEventListener('visibilitychange', ()=>{
    if (document.hidden){ G.paused=true; }
    else {
      // v2.7.0: don't auto-unpause if user manually opened pause overlay
      const _po = document.getElementById('pauseOverlay');
      if (_po && !_po.classList.contains('hidden')) return;
      G.paused=false;
    }
  });
  window.addEventListener('blur',  ()=>{ G.paused=true; });
  window.addEventListener('focus', ()=>{
    const _po = document.getElementById('pauseOverlay');
    if (_po && !_po.classList.contains('hidden')) return;
    G.paused=false;
  });
  window.addEventListener('evo:ad-start', ()=>{ G.paused=true; });
  window.addEventListener('evo:ad-end',   ()=>{ G.paused=false; });
  await _sdkP;
  if (window.SDK) SDK.gameLoadingFinished();
  const _ld = document.getElementById('loading');
  if (_ld) _ld.classList.add('hidden');
  const _menuEl = document.getElementById('menu');
  if (_menuEl) _menuEl.classList.remove('hidden');
  requestAnimationFrame(loop);
});
