// 終焉之地 The Land's End — Prototype v0.6.4
// v0.6.4 地圖細紋理、AI 降戰意、物種平衡收斂、簡化操作
'use strict';

// =====================================================================
// 常數
// =====================================================================
const WORLD = { w: 6400, h: 6400 };
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
//   dotAura    : 周圍 220px 持續毒霧 8 dmg/s
//   pushAura   : 周圍 200px 持續擊退
//   revive     : 死亡時自動復活一次
//   vision     : 視野倍率（用於小地圖偵測）
// =====================================================================
const PATHS = {
  human: {
    name:'人之道', color:'#ffd66b', icon:'人',
    tiers:[
      { name:'練氣武徒', pname:'氣血暢通', pdesc:'攻速 +15%',                 p:{spd:1.15} },
      { name:'凝勁拳師', pname:'內勁外發', pdesc:'攻擊 +10%、暴擊 +10%',       p:{atk:1.10, crit:0.10} },
      { name:'開脈劍客', pname:'經脈洞開', pdesc:'攻擊 +15%、攻擊範圍 +10%',   p:{atk:1.15, range:1.10} },
      { name:'入微宗師', pname:'招式入微', pdesc:'暴擊 +15%、吸血 5%',         p:{crit:0.15, lifesteal:0.05} },
      { name:'通玄武聖', pname:'通玄至理', pdesc:'攻擊 +25%、防禦 +15%',       p:{atk:1.25, def:1.15} },
      { name:'真武羅漢', pname:'金身不壞', pdesc:'生命 +40%、防禦 +30%',       p:{hp:1.40, def:1.30} },
      { name:'神兵武尊', pname:'兵刃化神', pdesc:'攻擊範圍 +40%、攻擊 +20%',    p:{range:1.40, atk:1.20} },
      { name:'武神臨世', pname:'神威反震', pdesc:'受擊時釋放反震衝擊波',         p:{reflect:1, atk:1.30} },
      { name:'太上武祖', pname:'武道圓滿', pdesc:'攻擊 +50%、擊殺回 40% HP',    p:{atk:1.50, killheal:0.40} },
    ],
  },
  dragon: {
    name:'龍之道', color:'#88e0ff', icon:'龍',
    tiers:[
      { name:'初鱗蛟',   pname:'鱗甲初生', pdesc:'防禦 +20%',                  p:{def:1.20} },
      { name:'雙角虺',   pname:'額角崢嶸', pdesc:'抗擊退 +50%、生命 +10%',     p:{knockRes:0.5, hp:1.10} },
      { name:'吞精螭',   pname:'吞食精氣', pdesc:'吸血 +8%、攻擊 +10%',         p:{lifesteal:0.08, atk:1.10} },
      { name:'蟠龍王',   pname:'龍威盤踞', pdesc:'生命 +30%、防禦 +15%',        p:{hp:1.30, def:1.15} },
      { name:'引雷應龍', pname:'引雷貫穿', pdesc:'攻擊 +20%、命中附加 5/s 雷傷', p:{atk:1.20, dot:5} },
      { name:'開目燭龍', pname:'開目晝明', pdesc:'暴擊 +20%、視野 +30%',        p:{crit:0.20, vision:1.30} },
      { name:'祖龍真君', pname:'龍祖威儀', pdesc:'攻擊 +40%、體型 +10%',        p:{atk:1.40, size:1.10} },
      { name:'真龍天君', pname:'真龍咆哮', pdesc:'普攻附加範圍 AoE、生命 +30%',   p:{aoeOnHit:1, hp:1.30} },
      { name:'太初神龍', pname:'開天之姿', pdesc:'攻擊+50%、生命+50%、減速光環', p:{atk:1.50, hp:1.50, slowAura:1} },
    ],
  },
  beast: {
    name:'獸之道', color:'#e0a060', icon:'獸',
    tiers:[
      { name:'噬血幼獸', pname:'嗜血爪牙', pdesc:'攻擊 +10%、吸血 3%',          p:{atk:1.10, lifesteal:0.03} },
      { name:'山林凶獸', pname:'兇性大發', pdesc:'攻擊 +15%、速度 +5%',          p:{atk:1.15, spd:1.05} },
      { name:'通靈妖獸', pname:'通靈本能', pdesc:'速度 +15%、暴擊 +5%',          p:{spd:1.15, crit:0.05} },
      { name:'啟智靈獸', pname:'妖識初啟', pdesc:'暴擊 +15%、吸血 5%',           p:{crit:0.15, lifesteal:0.05} },
      { name:'顯威神獸', pname:'戰意如潮', pdesc:'擊殺回 25% HP、攻擊 +15%',     p:{killheal:0.25, atk:1.15} },
      { name:'雷霆聖獸', pname:'雷霆鎮魂', pdesc:'普攻附加範圍 AoE、攻擊 +20%',   p:{aoeOnHit:1, atk:1.20} },
      { name:'過界大妖', pname:'妖體膨脹', pdesc:'體型 +20%、生命 +30%',          p:{size:1.20, hp:1.30} },
      { name:'蠻荒獸君', pname:'蠻荒之力', pdesc:'攻擊 +40%、生命 +40%',          p:{atk:1.40, hp:1.40} },
      { name:'鴻荒獸祖', pname:'獸祖出世', pdesc:'攻擊 +50%、減速光環',           p:{atk:1.50, slowAura:1} },
    ],
  },
  bird: {
    name:'羽之道', color:'#cce0ff', icon:'羽',
    tiers:[
      { name:'初羽雛鳥', pname:'羽輕風起', pdesc:'速度 +20%',                    p:{spd:1.20} },
      { name:'御風飛羽', pname:'御風長嘯', pdesc:'體力 +30%、速度 +10%',          p:{sta:1.30, spd:1.10} },
      { name:'劇毒妖羽', pname:'妖羽淬毒', pdesc:'命中附加 4/s 毒傷',             p:{dot:4} },
      { name:'金翅破雲', pname:'金翅穿甲', pdesc:'攻擊無視 30% 防禦',             p:{pierce:0.30} },
      { name:'雷羽天驕', pname:'雷羽鏈電', pdesc:'攻擊 +20%、普攻附加 AoE',       p:{atk:1.20, aoeOnHit:1} },
      { name:'風神鳥嘯', pname:'風嘯擊退', pdesc:'擊退 +50%、攻擊 +20%',          p:{knockMul:1.5, atk:1.20} },
      { name:'大鵬展翼', pname:'大鵬羽動', pdesc:'速度 +30%、攻擊範圍 +20%',      p:{spd:1.30, range:1.20} },
      { name:'雷帝神鳥', pname:'雷帝降臨', pdesc:'攻擊 +30%、毒霧光環',            p:{atk:1.30, dotAura:1} },
      { name:'不死鳳凰', pname:'涅槃復生', pdesc:'死亡時自動復活一次、攻擊 +40%',   p:{revive:1, atk:1.40} },
    ],
  },
  fish: {
    name:'鱗之道', color:'#88c0ff', icon:'鱗',
    tiers:[
      { name:'浮游幼魚', pname:'滑鱗游動', pdesc:'速度 +15%',                    p:{spd:1.15} },
      { name:'過溪河鯉', pname:'河鯉化氣', pdesc:'生命再生 +1.5/s',                p:{regen:1.5} },
      { name:'化蛟魚君', pname:'蛟首咬合', pdesc:'攻擊 +20%',                     p:{atk:1.20} },
      { name:'龍魚翻江', pname:'龍魚翻江', pdesc:'生命 +25%、攻擊 +15%',           p:{hp:1.25, atk:1.15} },
      { name:'水靈震淵', pname:'水靈震懾', pdesc:'周圍擊退光環',                    p:{pushAura:1} },
      { name:'海皇臨世', pname:'海皇威儀', pdesc:'攻擊 +30%、防禦 +20%',            p:{atk:1.30, def:1.20} },
      { name:'深淵巨君', pname:'深淵巨體', pdesc:'生命 +50%、體型 +15%',            p:{hp:1.50, size:1.15} },
      { name:'滄海龍王', pname:'龍王噬浪', pdesc:'攻擊範圍 +40%、攻擊 +20%',         p:{range:1.40, atk:1.20} },
      { name:'太古海神', pname:'海神之怒', pdesc:'攻擊+30%、生命+30%、減速光環',     p:{atk:1.30, hp:1.30, slowAura:1} },
    ],
  },
  insect: {
    name:'蟲之道', color:'#c0ff60', icon:'蟲',
    tiers:[
      { name:'蠶食幼蟲', pname:'蠶食回復', pdesc:'吸血 5%',                       p:{lifesteal:0.05} },
      { name:'蛻變妖蟲', pname:'蛻甲化形', pdesc:'防禦 +20%、生命 +10%',           p:{def:1.20, hp:1.10} },
      { name:'血蝠飲血', pname:'血蝠吸髓', pdesc:'吸血 +15%、攻擊 +10%',           p:{lifesteal:0.15, atk:1.10} },
      { name:'立巢蟲后', pname:'蟲群環繞', pdesc:'攻擊 +15%、生命 +20%',           p:{atk:1.15, hp:1.20} },
      { name:'王蟲擴疆', pname:'蟲后膨脹', pdesc:'生命 +40%、體型 +10%',           p:{hp:1.40, size:1.10} },
      { name:'蠶食蟲皇', pname:'蟲皇劇毒', pdesc:'命中附加 6/s 毒傷',               p:{dot:6} },
      { name:'橫掃蟲帝', pname:'蟲帝威壓', pdesc:'攻擊 +30%、攻擊範圍 +20%',        p:{atk:1.30, range:1.20} },
      { name:'入夢蟲祖', pname:'蟲祖噬魂', pdesc:'攻擊 +20%、毒霧光環',              p:{atk:1.20, dotAura:1} },
      { name:'太古蟲神', pname:'蟲神冠首', pdesc:'攻擊+40%、減速光環、毒霧光環',     p:{atk:1.40, slowAura:1, dotAura:1} },
    ],
  },
};
function tierName(p){ return (p.path.tiers[p.rank-1] && p.path.tiers[p.rank-1].name) || '凡人'; }
function tierData(p){ return p.path.tiers[p.rank-1]; }
function aggregatePerks(p){
  const out = { atk:1, def:1, hp:1, spd:1, sta:1, size:1, range:1, vision:1,
                crit:0, lifesteal:0, killheal:0, regen:0, dot:0, pierce:0,
                knockRes:0, knockMul:1,
                reflect:0, aoeOnHit:0, slowAura:0, dotAura:0, pushAura:0, revive:0 };
  for (let i=0;i<p.rank;i++){
    const t = p.path.tiers[i]; if (!t||!t.p) continue;
    for (const k in t.p){
      if (k==='atk'||k==='def'||k==='hp'||k==='spd'||k==='sta'||k==='size'||k==='range'||k==='vision'||k==='knockMul') out[k]*=t.p[k];
      else if (k==='reflect'||k==='aoeOnHit'||k==='slowAura'||k==='dotAura'||k==='pushAura'||k==='revive') out[k] = Math.max(out[k], t.p[k]);
      else out[k]+=t.p[k];
    }
  }
  return out;
}

// 每階加成（rank 1→2 用 index 0）
const RANK_BONUS = [
  { hp:30, atk:5,  def:2, spd:4,  sta:8,  life:30, zy:0.10, dh:0.10 },
  { hp:40, atk:7,  def:3, spd:5,  sta:10, life:35, zy:0.12, dh:0.12 },
  { hp:55, atk:10, def:4, spd:6,  sta:12, life:45, zy:0.15, dh:0.15 },
  { hp:75, atk:14, def:6, spd:7,  sta:14, life:55, zy:0.18, dh:0.18 },
  { hp:100,atk:20, def:9, spd:8,  sta:16, life:70, zy:0.22, dh:0.22 },
  { hp:140,atk:30, def:13,spd:10, sta:20, life:90, zy:0.28, dh:0.28 },
  { hp:200,atk:45, def:18,spd:12, sta:24, life:120,zy:0.35, dh:0.35 },
  { hp:300,atk:70, def:25,spd:15, sta:30, life:180,zy:0.50, dh:0.50 },
];
// 修為門檻（rank N 需要 QI_THR[N]）— 大幅降低、玩起來爽
const QI_THR = [0, 25, 70, 150, 270, 450, 700, 1050, 1500, 2100];

// =====================================================================
// 物種
// =====================================================================
const SPECIES = {
  // 人之道
  swordsman: { path:'human', name:'劍客', icon:'劍', color:'#ffd66b', shape:'humanoid',
    base:{hp:130,atk:15,def:5,spd:185,sta:90,life:240, r:18, atkR:55, atkCd:0.4, rngR:480, rngCd:0.8, rngDmg:12, rngSpd:540},
    skillQ:{name:'三連箭', cd:3.5, type:'arrow3', desc:'扇形射出 3 箭，每箭 ×0.7 傷害'},
    skillE:{name:'劍意斬', cd:6,  type:'cleave',  desc:'前方扇形 180° 大範圍斬擊，×3 傷害', unlockRank:3},
    skillR:{name:'萬劍訣', cd:18, type:'sword_rain', desc:'環繞 24 把劍同時射向最近敵人', unlockRank:6},
  },
  lizard: { path:'beast', name:'蜥蜴', icon:'蜥', color:'#7fd07f', shape:'reptile',
    base:{hp:150,atk:16,def:6,spd:170,sta:80,life:200, r:20, atkR:58, atkCd:0.42},
    skillQ:{name:'旋風斬', cd:3, type:'spin', desc:'360° 旋轉斬擊，×2 傷害 + 擊退'},
    skillE:{name:'尾甩', cd:5,  type:'tail',  desc:'掃尾 280° 範圍擊飛敵人', unlockRank:3},
    skillR:{name:'狂暴形態', cd:18, type:'rage', desc:'10s 攻速 ×2 護甲 ×2', unlockRank:6},
  },
  croc: { path:'beast', name:'鱷魚', icon:'鱷', color:'#6aa86a', shape:'reptile',
    base:{hp:170,atk:18,def:8,spd:155,sta:80,life:240, r:22, atkR:55, atkCd:0.5},
    skillQ:{name:'死亡翻滾', cd:3.5, type:'roll', desc:'前衝撕咬，路徑上敵人受 ×2 傷害 + 流血'},
    skillE:{name:'鎖頷', cd:6, type:'grab', desc:'抓住最近敵人 2s，每 0.3s 撕咬一次', unlockRank:3},
    skillR:{name:'血河', cd:22, type:'bloodpool', desc:'吐血池，敵人踩到流血', unlockRank:6},
  },
  dino: { path:'dragon', name:'恐龍', icon:'恐', color:'#7a8a3a', shape:'beast',
    base:{hp:180,atk:20,def:10,spd:150,sta:80,life:260, r:26, atkR:65, atkCd:0.5},
    skillQ:{name:'踏擊', cd:3, type:'stomp', desc:'250 半徑 AoE 震波 + 暈眩 1s'},
    skillE:{name:'尾砸', cd:6, type:'tail',  desc:'巨型尾砸 320° 範圍 ×3 傷害', unlockRank:3},
    skillR:{name:'霸王咆哮', cd:20, type:'roar', desc:'全螢幕敵人後退 + 暈眩 3s', unlockRank:6},
  },
  wolf: { path:'beast', name:'狼', icon:'狼', color:'#a0a0a0', shape:'beast',
    base:{hp:130,atk:15,def:5,spd:195,sta:100,life:200, r:18, atkR:55, atkCd:0.388},
    skillQ:{name:'撲擊', cd:2.5, type:'pounce', desc:'快速撲向目標 + 撕咬 ×2 傷害'},
    skillE:{name:'群狼召喚', cd:8, type:'summon_wolf', desc:'召喚 3 隻幻影狼 15s', unlockRank:3},
    skillR:{name:'狂血嗜殺', cd:20, type:'frenzy', desc:'12s 攻速 ×2 + 擊殺回滿血', unlockRank:6},
  },
  // 龍
  longSnake: { path:'dragon', name:'蛟蛇', icon:'蛟', color:'#88e0ff', shape:'dragon',
    base:{hp:160,atk:17,def:7,spd:170,sta:90,life:260, r:22, atkR:60, atkCd:0.45, rngR:460, rngCd:1.1, rngDmg:18, rngSpd:520},
    skillQ:{name:'龍息', cd:3, type:'breath', desc:'前方 400px 火焰錐 ×0.6/tick'},
    skillE:{name:'纏繞', cd:6, type:'whirl', desc:'環繞自身的能量帶持續 3s', unlockRank:3},
    skillR:{name:'真龍降世', cd:25, type:'dragon_form', desc:'15s 體型 ×1.5，攻 +100%', unlockRank:6},
  },
  // 羽
  eagle: { path:'bird', name:'雄鷹', icon:'鷹', color:'#cce0ff', shape:'bird',
    base:{hp:110,atk:13,def:4,spd:200,sta:120,life:200, r:16, atkR:50, atkCd:0.38, rngR:540, rngCd:0.6, rngDmg:10, rngSpd:640},
    skillQ:{name:'俯衝', cd:3, type:'dive', desc:'快速衝向滑鼠位置，撞擊 ×3 傷害'},
    skillE:{name:'雷羽風暴', cd:6, type:'feather_storm', desc:'發射 12 道羽刃 ×0.5 傷害', unlockRank:3},
    skillR:{name:'雷霆貫穿', cd:20, type:'thunder_dive', desc:'天降閃電貫穿全螢幕', unlockRank:6},
  },
  owl: { path:'bird', name:'夜梟', icon:'梟', color:'#aabbcc', shape:'bird',
    base:{hp:115,atk:14,def:4,spd:190,sta:100,life:220, r:16, atkR:52, atkCd:0.4, rngR:520, rngCd:0.7, rngDmg:14, rngSpd:580},
    skillQ:{name:'幽影箭', cd:3, type:'shadow_arrow', desc:'穿透箭 ×2 傷害'},
    skillE:{name:'夜幕', cd:8, type:'darkness', desc:'8s 隱身 + 攻擊有 50% 暴擊', unlockRank:3},
    skillR:{name:'死亡之眼', cd:20, type:'death_gaze', desc:'瞄準目標 1.5s 後造成 999 真傷', unlockRank:6},
  },
  // 鱗
  shark: { path:'fish', name:'鯊魚', icon:'鯊', color:'#88c0ff', shape:'fish',
    base:{hp:220,atk:24,def:8,spd:170,sta:100,life:220, r:24, atkR:60, atkCd:0.4},
    skillQ:{name:'三連咬', cd:3, type:'combo3', desc:'三次連咬 ×0.8 傷害 + 流血'},
    skillE:{name:'血腥狂暴', cd:6, type:'bloodrage', desc:'感知低血敵人 6s + 攻速 ×1.5', unlockRank:3},
    skillR:{name:'深淵召喚', cd:22, type:'abyss', desc:'召喚 5 隻幻影鯊圍攻', unlockRank:6},
  },
  electroEel: { path:'fish', name:'電鰻', icon:'鰻', color:'#aaffe0', shape:'fish',
    base:{hp:120,atk:13,def:4,spd:170,sta:120,life:200, r:18, atkR:50, atkCd:0.4, rngR:480, rngCd:0.5, rngDmg:9, rngSpd:660},
    skillQ:{name:'放電', cd:3, type:'shock', desc:'250 半徑電擊 + 暈眩 0.5s'},
    skillE:{name:'雷電鏈', cd:6, type:'chain', desc:'8 跳鏈電每跳 ×0.6 傷害', unlockRank:3},
    skillR:{name:'天雷', cd:20, type:'sky_lightning', desc:'天降 15 道閃電隨機落點', unlockRank:6},
  },
  // 蟲
  scorpion: { path:'insect', name:'蠍', icon:'蠍', color:'#c0ff60', shape:'insect',
    base:{hp:140,atk:15,def:7,spd:160,sta:90,life:220, r:18, atkR:55, atkCd:0.42, rngR:430, rngCd:0.9, rngDmg:12, rngSpd:500},
    skillQ:{name:'毒尾', cd:3, type:'poison_sting', desc:'長矛突刺，命中敵人 6s DOT 5/s'},
    skillE:{name:'毒霧', cd:7, type:'poison_cloud', desc:'200 半徑毒雲 6s 持續傷害', unlockRank:3},
    skillR:{name:'蟲皇之毒', cd:22, type:'plague', desc:'全圖敵人中毒 10s，每秒 30 傷', unlockRank:6},
  },
};

// =====================================================================
// 各途徑專屬晉階儀式（每途徑 8 條，呼應種族特色）
// =====================================================================
function qK(n){ return p=>p.q.kills>=n; }
function qKShow(n){ return p=>`擊殺 ${Math.min(p.q.kills,n)}/${n}`; }
const PATH_QUESTS = {
  human: [
    { desc:'初試身手：擊殺 3 名生物（武者要證明自己）',  req:qK(3),  show:qKShow(3) },
    { desc:'行走江湖：探索 3 種地形',                  req:p=>p.q.terrains.size>=3, show:p=>`地形 ${p.q.terrains.size}/3` },
    { desc:'宗師之眼：擊殺 1 隻 3 階以上敵人',          req:p=>p.q.killHighTier>=1, show:p=>`高階 ${p.q.killHighTier}/1` },
    { desc:'大宗師：累計擊殺 12 名生物',                req:qK(12), show:qKShow(12) },
    { desc:'尋訪權柄：拾取 1 個權柄',                  req:p=>p.q.authorities>=1, show:p=>`權柄 ${p.q.authorities}/1` },
    { desc:'武聖之威：釋放權柄 4 次',                  req:p=>p.q.casts>=4, show:p=>`釋放 ${Math.min(p.q.casts,4)}/4` },
    { desc:'武神試煉：進入終焉之地',                    req:p=>p.q.enteredEnd, show:p=>p.q.enteredEnd?'已抵達':'未抵達' },
    { desc:'地仙圓滿：集齊 3 個權柄',                  req:p=>p.q.authorities>=3, show:p=>`權柄 ${p.q.authorities}/3` },
  ],
  dragon: [
    { desc:'蛟現於野：擊殺 3 隻生靈',                   req:qK(3),  show:qKShow(3) },
    { desc:'虺行四方：探索 4 種地形',                  req:p=>p.q.terrains.size>=4, show:p=>`地形 ${p.q.terrains.size}/4` },
    { desc:'螭吻吞噬：擊殺 1 隻 3 階以上敵人',          req:p=>p.q.killHighTier>=1, show:p=>`高階 ${p.q.killHighTier}/1` },
    { desc:'蟠龍盤踞：累計擊殺 15 隻',                  req:qK(15), show:qKShow(15) },
    { desc:'應龍承雲：拾取 1 個權柄',                  req:p=>p.q.authorities>=1, show:p=>`權柄 ${p.q.authorities}/1` },
    { desc:'燭龍開目：擊殺 1 隻 5 階以上敵人',          req:p=>p.q.killEpic>=1, show:p=>`王階 ${p.q.killEpic}/1` },
    { desc:'祖龍降世：進入終焉之地',                    req:p=>p.q.enteredEnd, show:p=>p.q.enteredEnd?'已抵達':'未抵達' },
    { desc:'神龍醒世：集齊 4 個權柄',                  req:p=>p.q.authorities>=4, show:p=>`權柄 ${p.q.authorities}/4` },
  ],
  beast: [
    { desc:'幼獸覓食：靠近果實 + 擊殺 2 隻',            req:qK(2),  show:qKShow(2) },
    { desc:'凶獸現世：累計擊殺 8 隻',                   req:qK(8),  show:qKShow(8) },
    { desc:'妖獸縱橫：探索 3 種地形',                  req:p=>p.q.terrains.size>=3, show:p=>`地形 ${p.q.terrains.size}/3` },
    { desc:'靈獸通玄：拾取 1 個權柄',                  req:p=>p.q.authorities>=1, show:p=>`權柄 ${p.q.authorities}/1` },
    { desc:'神獸顯威：擊殺 2 隻 3 階以上敵人',          req:p=>p.q.killHighTier>=2, show:p=>`高階 ${p.q.killHighTier}/2` },
    { desc:'聖獸雷霆：釋放權柄 4 次',                  req:p=>p.q.casts>=4, show:p=>`釋放 ${Math.min(p.q.casts,4)}/4` },
    { desc:'大妖過界：進入終焉之地',                    req:p=>p.q.enteredEnd, show:p=>p.q.enteredEnd?'已抵達':'未抵達' },
    { desc:'獸神冕成：累計擊殺 30 隻',                  req:qK(30), show:qKShow(30) },
  ],
  bird: [
    { desc:'雛鳥初飛：探索 2 種地形',                  req:p=>p.q.terrains.size>=2, show:p=>`地形 ${p.q.terrains.size}/2` },
    { desc:'御風長空：擊殺 5 隻生物',                   req:qK(5),  show:qKShow(5) },
    { desc:'妖鳥傲世：擊殺 1 隻 3 階以上敵人',          req:p=>p.q.killHighTier>=1, show:p=>`高階 ${p.q.killHighTier}/1` },
    { desc:'金翅破雲：探索 5 種地形',                  req:p=>p.q.terrains.size>=5, show:p=>`地形 ${p.q.terrains.size}/5` },
    { desc:'雷鳥伏魔：拾取 1 個權柄',                  req:p=>p.q.authorities>=1, show:p=>`權柄 ${p.q.authorities}/1` },
    { desc:'風神鳥嘯：釋放權柄 5 次',                  req:p=>p.q.casts>=5, show:p=>`釋放 ${Math.min(p.q.casts,5)}/5` },
    { desc:'大鵬展翼：進入終焉之地',                    req:p=>p.q.enteredEnd, show:p=>p.q.enteredEnd?'已抵達':'未抵達' },
    { desc:'雷鳥神位：擊殺 3 隻 5 階以上敵人',          req:p=>p.q.killEpic>=3, show:p=>`王階 ${p.q.killEpic}/3` },
  ],
  fish: [
    { desc:'幼魚潛游：擊殺 3 隻',                       req:qK(3),  show:qKShow(3) },
    { desc:'入溪入河：到訪水域（沼/水）',               req:p=>p.q.terrains.has('water')||p.q.terrains.has('swamp'), show:p=>(p.q.terrains.has('water')||p.q.terrains.has('swamp'))?'已抵達':'未抵達' },
    { desc:'大魚化蛟：累計擊殺 10 隻',                  req:qK(10), show:qKShow(10) },
    { desc:'蛟魚成龍：拾取 1 個權柄',                  req:p=>p.q.authorities>=1, show:p=>`權柄 ${p.q.authorities}/1` },
    { desc:'龍魚翻江：擊殺 2 隻 3 階以上敵人',          req:p=>p.q.killHighTier>=2, show:p=>`高階 ${p.q.killHighTier}/2` },
    { desc:'水靈震海：釋放權柄 4 次',                  req:p=>p.q.casts>=4, show:p=>`釋放 ${Math.min(p.q.casts,4)}/4` },
    { desc:'海王臨世：進入終焉之地',                    req:p=>p.q.enteredEnd, show:p=>p.q.enteredEnd?'已抵達':'未抵達' },
    { desc:'海皇加冕：集齊 4 個權柄',                  req:p=>p.q.authorities>=4, show:p=>`權柄 ${p.q.authorities}/4` },
  ],
  insect: [
    { desc:'幼蟲覓血：擊殺 4 隻生物',                   req:qK(4),  show:qKShow(4) },
    { desc:'妖蟲蛻變：探索 3 種地形',                  req:p=>p.q.terrains.size>=3, show:p=>`地形 ${p.q.terrains.size}/3` },
    { desc:'蟲后立巢：拾取 1 個權柄',                  req:p=>p.q.authorities>=1, show:p=>`權柄 ${p.q.authorities}/1` },
    { desc:'王蟲擴疆：累計擊殺 18 隻',                  req:qK(18), show:qKShow(18) },
    { desc:'蟲皇蠶食：擊殺 2 隻 3 階以上敵人',          req:p=>p.q.killHighTier>=2, show:p=>`高階 ${p.q.killHighTier}/2` },
    { desc:'蟲帝橫掃：釋放權柄 5 次',                  req:p=>p.q.casts>=5, show:p=>`釋放 ${Math.min(p.q.casts,5)}/5` },
    { desc:'蟲祖入夢：進入終焉之地',                    req:p=>p.q.enteredEnd, show:p=>p.q.enteredEnd?'已抵達':'未抵達' },
    { desc:'蟲神冠首：擊殺 2 隻 5 階以上敵人',          req:p=>p.q.killEpic>=2, show:p=>`王階 ${p.q.killEpic}/2` },
  ],
};

// =====================================================================
// 權柄（巨型 AoE，必須超強）
// =====================================================================
const AUTHORITIES = [
  { id:'fire',    name:'烈焰權柄',  color:'#ff5530', icon:'焰', cd:14,
    desc:'天降火雨，全螢幕 240 傷 + 40 DOT × 6s' },
  { id:'frost',   name:'冰封權柄',  color:'#88e0ff', icon:'冰', cd:16,
    desc:'凍結全螢幕敵人 6s，造成 120 傷' },
  { id:'thunder', name:'雷霆權柄',  color:'#fff080', icon:'雷', cd:14,
    desc:'30 跳鏈式閃電，每跳 180 傷' },
  { id:'gale',    name:'颶風權柄',  color:'#aaffcc', icon:'風', cd:12,
    desc:'600 半徑擊飛 + 100 傷 + 4s 減速' },
  { id:'life',    name:'生命權柄',  color:'#80ff80', icon:'生', cd:30,
    desc:'回滿 HP + 永久 +100 HP + 60s 回血 12/s' },
  { id:'titan',   name:'巨化權柄',  color:'#ffaa30', icon:'巨', cd:25,
    desc:'30s 體型 ×2.2 攻擊 ×2.5 護甲 ×2' },
  { id:'time',    name:'時光權柄',  color:'#cc88ff', icon:'時', cd:30,
    desc:'全圖敵人停止 8s + 永久 +10 分鐘壽命' },
];

// =====================================================================
// 地形
// =====================================================================
const BIOMES = {
  plain:  { name:'平原', color:'#3a4a2a' },
  forest: { name:'森林', color:'#1a3520' },
  desert: { name:'沙漠', color:'#aa9050' },
  swamp:  { name:'沼澤', color:'#3a4530' },
  water:  { name:'水域', color:'#1f3a55' },
  mtn:    { name:'山地', color:'#555560' },
  snow:   { name:'雪原', color:'#aac0d0' },
  end:    { name:'終焉之地', color:'#08020c' },
};

// =====================================================================
// 道具
// =====================================================================
const PICKUPS = [
  { id:'spirit',   name:'靈氣',     color:'#bb88ff', icon:'氣', rare:false, weight:60, qi:8 },
  { id:'bigspirit',name:'靈氣團',   color:'#dd99ff', icon:'氣', rare:true,  weight:8,  qi:40 },
  { id:'heal',     name:'療癒果',   color:'#ff5566', icon:'療', rare:false, weight:25, heal:60 },
  { id:'bighp',    name:'血元丹',   color:'#ff2244', icon:'血', rare:true,  weight:5,  bighp:80 },
  { id:'sta',      name:'氣力果',   color:'#7fd07f', icon:'力', rare:false, weight:20, sta:50 },
  { id:'zhenyuan', name:'真元丹',   color:'#ffd66b', icon:'元', rare:true,  weight:5,  zy:0.15 },
  { id:'daohen',   name:'道痕殘片', color:'#ddccff', icon:'痕', rare:true,  weight:5,  dh:0.15 },
  { id:'cdreset',  name:'清淨珠',   color:'#aaffff', icon:'清', rare:true,  weight:6,  cdreset:true },
  { id:'lifegem',  name:'壽元晶',   color:'#cc88ff', icon:'壽', rare:true,  weight:4,  life:90 },
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
  terrain:null, cam:{x:0,y:0,tx:0,ty:0,shake:0,flash:0,flashColor:'#fff',hitFlash:0},
  time:0, started:false, dead:false, won:false,
  selectedSpecies:null, msg:'', killFeed:[], leaderboard:[], errorCount:0, lastError:'',
  soundOn:true, lastHitTime:0, deathBy:'',
};
const FAKE_NAMES = ['魔女','玄名','梵人','紅嬜','隱者','社鋒','闇哲','太陽','高堤','恍惚','規則','欺詐','秘主','振箪','指揮','蛟之者','黑夜','學生','虛減','舊日','吞噬','快樂','虛偽','火舌','雮明','巐崙','企鵝','火之使徒','靈媒','國王'];
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
      if (dc < 400) b='end';
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
    bonusAtkMult:1, bonusSpdMult:1, bonusDefMult:1, bonusSizeMult:1,
    q:{ kills:0, killHighTier:0, killEpic:0, casts:0, terrains:new Set(), enteredEnd:false, authorities:0 },
    aiState:'wander', aiTarget:null, aiTimer:0,
    unlocks:[],
    color: sp.color,
    name: isPlayer ? '你' : randomName(),
  };
  recalcStats(c);
  c.hp = c.maxHp; c.sta = c.maxSta; c.life = c.maxLife;
  return c;
}
function recalcStats(p){
  let hp=p.base.hp, atk=p.base.atk, def=p.base.def, spd=p.base.spd, sta=p.base.sta, life=p.base.life;
  for (let i=0;i<p.rank-1;i++){
    const b=RANK_BONUS[i]; hp+=b.hp; atk+=b.atk; def+=b.def; spd+=b.spd; sta+=b.sta; life+=b.life;
  }
  const zy=p.zhenyuan;
  const perk = aggregatePerks(p);
  p.perks = perk;
  p.maxHp = Math.floor(hp*zy*perk.hp);
  p.maxSta = Math.floor(sta*zy*perk.sta);
  p.maxLife = Math.floor(life*zy);
  p.atk = Math.floor(atk*zy*p.bonusAtkMult*perk.atk);
  p.def = Math.floor(def*zy*p.bonusDefMult*perk.def);
  p.spd = Math.floor(spd*zy*p.bonusSpdMult*perk.spd);
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
function currentQuest(p){ if (p.rank>=9) return null; const list = PATH_QUESTS[p.pathKey] || PATH_QUESTS.human; return list[p.rank-1]; }
function tryPromote(p){
  let promoted = false;
  let safety = 12;
  while (p.rank < 9 && safety-->0){
    if (p.qi < QI_THR[p.rank]) break; // 注意：rank=1 想升 2 需要 QI_THR[1]
    const q = currentQuest(p);
    if (q && !q.req(p)) break;
    const b = RANK_BONUS[p.rank-1];
    p.rank++;
    p.zhenyuan += b.zy;
    p.daohen += b.dh;
    recalcStats(p);
    p.hp = p.maxHp; p.sta = p.maxSta; p.life = p.maxLife; // 晉階回滿所有狀態
    if (p.isPlayer) p.invuln = Math.max(p.invuln, 3); // 晉階短暫無敵
    promoted = true;
    if (p.isPlayer){
      const td = tierData(p);
      const title = td?td.name:'?';
      logMsg(`★ 晉【${title}】（第 ${p.rank} 階） — 領悟「${td?td.pname:''}」：${td?td.pdesc:''}`, 'promote');
      pushKillFeed(`★ 晉階 ${title}：${td?td.pname:''}`, p.path.color);
      playSound('promote');
      flash(p.path.color, 0.5);
      shake(20);
      for (let i=0;i<80;i++) G.particles.push({x:p.x,y:p.y,vx:rand(-400,400),vy:rand(-400,400),life:1.4,color:p.path.color, r:3});
      G.shockwaves.push({x:p.x,y:p.y,r:0,max:280,life:0.9,color:p.path.color});
      addFloat(p.x, p.y-30, `晉階！${title}`, p.path.color, 24, 2);
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
  generateTerrain();
  generateDecor();
  for (let i=0;i<320;i++) spawnPickup();
  for (let i=0;i<160;i++) spawnSpirit();
  for (let i=0;i<7;i++){
    const a = AUTHORITIES[i];
    const ang = (i/7)*Math.PI*2;
    const D = 1800;
    G.authorities.push({...a, x: WORLD.w/2 + Math.cos(ang)*D, y: WORLD.h/2 + Math.sin(ang)*D, pulse:0});
  }
  // 出生點周遭塞一些靈氣與道具讓玩家先成長
  if (G.player){
    for (let i=0;i<30;i++){
      const ang=Math.random()*Math.PI*2, d=rand(80,400);
      G.spirits.push({x:G.player.x+Math.cos(ang)*d, y:G.player.y+Math.sin(ang)*d, pulse:Math.random()*Math.PI*2, qi:8});
    }
    for (let i=0;i<8;i++){
      const ang=Math.random()*Math.PI*2, d=rand(150,500);
      const def = weightedPickup();
      G.pickups.push({...def, x:G.player.x+Math.cos(ang)*d, y:G.player.y+Math.sin(ang)*d, pulse:0});
    }
  }
  // 敵人（出生點 2000px 內為絕對安全區；初始數量降為 60 較少壓力）
  for (let i=0;i<60;i++) spawnEnemy(true);
}
function spawnPickup(){
  const def = weightedPickup();
  G.pickups.push({...def, x:rand(80,WORLD.w-80), y:rand(80,WORLD.h-80), pulse:Math.random()*Math.PI*2});
}
function spawnSpirit(){
  G.spirits.push({x:rand(80,WORLD.w-80), y:rand(80,WORLD.h-80), pulse:Math.random()*Math.PI*2, qi:5});
}
function spawnEnemy(initial=false){
  const keys = Object.keys(SPECIES);
  const sp = keys[(Math.random()*keys.length)|0];
  const safeDist = initial ? 2000 : 1100;
  let x,y, tries=0;
  do { x=rand(100,WORLD.w-100); y=rand(100,WORLD.h-100); tries++; }
  while (G.player && dist({x,y},G.player) < safeDist && tries<20);
  const e = makeCreature(sp, x, y, false);
  // 階位：靠近出生點越弱；遊戲時間越長外圍越強
  let maxTier;
  if (G.player){
    const d = dist({x,y},G.player);
    if (d < 2500) maxTier = 1;
    else if (d < 3800) maxTier = 1 + Math.floor(G.time/90);
    else maxTier = 2 + Math.floor(G.time/60);
  } else maxTier = 1;
  maxTier = Math.max(1, Math.min(7, maxTier));
  const tier = 1 + Math.floor(Math.random()*maxTier);
  for (let r=1;r<tier;r++){
    const b=RANK_BONUS[r-1]; e.zhenyuan+=b.zy; e.daohen+=b.dh;
  }
  e.rank = tier;
  recalcStats(e); e.hp=e.maxHp; e.sta=e.maxSta;
  G.enemies.push(e);
}

// =====================================================================
// 輸入
// =====================================================================
function setupInput(canvas){
  window.addEventListener('keydown', e=>{
    KEYS[e.key.toLowerCase()]=true;
    if (e.key===' ') e.preventDefault();
  });
  window.addEventListener('keyup', e=>{ KEYS[e.key.toLowerCase()]=false; });
  canvas.addEventListener('mousemove', e=>{
    const r = canvas.getBoundingClientRect();
    MOUSE.x = (e.clientX-r.left); MOUSE.y = (e.clientY-r.top);
  });
  canvas.addEventListener('mousedown', e=>{
    if (e.button===0) MOUSE.ldown = true;
    if (e.button===2) MOUSE.rdown = true;
    e.preventDefault();
  });
  canvas.addEventListener('mouseup', e=>{
    if (e.button===0) MOUSE.ldown = false;
    if (e.button===2) MOUSE.rdown = false;
  });
  canvas.addEventListener('contextmenu', e=>e.preventDefault());
}

// =====================================================================
// 玩家更新
// =====================================================================
function updatePlayer(p, dt){
  // 狀態
  if (p.invuln>0) p.invuln-=dt;
  if (p.bleed>0){ p.hp -= 6*dt; p.bleed-=dt; }
  if (p.poison>0){ p.hp -= 10*p.daohen*dt; p.poison-=dt; }
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

  // 壽命扣減（玩家）
  if (p.isPlayer){ p.life -= dt; if (p.life<=0){ die('壽元耗盡'); return; } }

  // 移動
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

  // 朝向：使用滑鼠
  p.facing = Math.atan2(MOUSE.wy - p.y, MOUSE.wx - p.x);

  // 地形紀錄
  const t = terrainAt(p.x,p.y);
  p.q.terrains.add(t);
  if (t==='end' && !p.q.enteredEnd){ p.q.enteredEnd = true; logMsg('★ 進入終焉之地','promote'); }

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
  if (KEYS['q'] && p.skillQT<=0){ castSkill(p, p.sp.skillQ); p.skillQT = p.sp.skillQ.cd; }
  if (KEYS['e'] && p.skillET<=0 && p.rank>=(p.sp.skillE.unlockRank||1)){ castSkill(p, p.sp.skillE); p.skillET = p.sp.skillE.cd; }
  if (KEYS['r'] && p.skillRT<=0 && p.rank>=(p.sp.skillR.unlockRank||1)){ castSkill(p, p.sp.skillR); p.skillRT = p.sp.skillR.cd; }

  // 權柄
  if (KEYS['1'] && p.authoritySlots[0] && p.authCdT[0]<=0){ castAuthority(p,0); p.authCdT[0] = p.authoritySlots[0].cd; }
  if (KEYS['2'] && p.authoritySlots[1] && p.authCdT[1]<=0){ castAuthority(p,1); p.authCdT[1] = p.authoritySlots[1].cd; }
  if (KEYS['3'] && p.authoritySlots[2] && p.authCdT[2]<=0){ castAuthority(p,2); p.authCdT[2] = p.authoritySlots[2].cd; }

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
  if (!target || target.hp<=0) return;
  if (target.invuln>0){ addFloat(target.x, target.y-target.r, '免', '#ffff80', 12, 0.5); return; }
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
      addFloat(attacker.x, attacker.y-attacker.r, `反 ${reflect}`, '#88e0ff', 12, 0.6);
      if (attacker.hp<=0) onKill(target, attacker);
    }
    addFloat(target.x, target.y-target.r, '擋', '#88e0ff', 14, 0.5);
    playSound('block');
  }
  // 暗夜暴擊
  if (attacker && attacker.darkT>0 && Math.random()<0.5){ final*=2; isCrit=true; }
  final = Math.max(1, Math.round(final));
  target.hp -= final;
  addFloat(target.x, target.y-target.r, ''+final, isCrit?'#ffeb40':color, isCrit?16:12, 0.7);
  // 進階能力：吸血
  if (ap && ap.lifesteal>0 && attacker.hp>0 && attacker!==target){
    const heal = Math.max(1, Math.round(final*ap.lifesteal));
    attacker.hp = Math.min(attacker.maxHp, attacker.hp+heal);
    if (attacker.isPlayer) addFloat(attacker.x, attacker.y-attacker.r-10, `+${heal}`, '#ff80c0', 11, 0.5);
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
      addFloat(attacker.x, attacker.y-attacker.r, `震 ${rd}`, '#ffd66b', 12, 0.6);
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
  playSound('kill');
  // Kill feed
  if (attacker){
    const an = attacker.isPlayer?'你':(attacker.name||attacker.sp.name);
    const tn = target.isPlayer?'你':(target.name||target.sp.name);
    pushKillFeed(`${an} 击殺了 ${tn}`, attacker.isPlayer ? '#ffd66b' : (target.isPlayer ? '#ff4040' : '#aaa'));
    // 記錄玩家死亡原因
    if (target.isPlayer) G.deathBy = `被 ${attacker.sp.name}【${tierName(attacker)}】擊殺`;
  }
  // 玩家擊殺
  if (attacker && attacker.isPlayer){
    attacker.q.kills++;
    if (target.rank>=3) attacker.q.killHighTier++;
    if (target.rank>=5) attacker.q.killEpic++;
    const qiReward = 8 + target.rank*6;
    attacker.qi += qiReward;
    addFloat(target.x, target.y-20, `+${qiReward} 修為`, '#bb88ff', 14, 1.2);
    logMsg(`擊殺 ${target.sp.name}（${tierName(target)}）+${qiReward} 修為`);
    tryPromote(attacker);
  }
  // 進階能力：擊殺回血
  if (attacker && attacker.perks && attacker.perks.killheal>0 && attacker.hp>0){
    const h = Math.round(attacker.maxHp * attacker.perks.killheal);
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + h);
    if (attacker.isPlayer) addFloat(attacker.x, attacker.y-attacker.r-20, `+${h} 血`, '#80ff80', 14, 0.8);
  }
  // 掉落
  for (let i=0;i<Math.min(8, 2+target.rank*2);i++){
    G.spirits.push({x:target.x+rand(-20,20), y:target.y+rand(-20,20), pulse:Math.random()*Math.PI*2, qi:5+target.rank*2, vx:rand(-100,100), vy:rand(-100,100), life:0.5});
  }
  if (Math.random()<0.3){
    const def = weightedPickup();
    G.pickups.push({...def, x:target.x, y:target.y, pulse:0});
  }
  for (let i=0;i<15;i++) G.particles.push({x:target.x,y:target.y,vx:rand(-220,220),vy:rand(-220,220),life:0.6,color:target.color,r:2});
  // 移除
  if (target===G.player){ die(G.deathBy || '被擊殺'); }
}

// =====================================================================
// 技能執行
// =====================================================================
function castSkill(p, s){
  const dh = p.daohen;
  const type = s.type;
  shake(4);
  if (p.isPlayer) logMsg(`▶ ${s.name}`);
  switch(type){
    case 'arrow3': for (let i=-1;i<=1;i++) fireProjectile(p, p.facing+i*0.25, p.rngDmg*0.7*dh, p.rngSpd, p.color); break;
    case 'cleave': aoeSlash(p, 200, Math.PI, p.atk*3*dh, '#ffe080'); break;
    case 'sword_rain': swordRain(p, 24, p.atk*1.5*dh); break;
    case 'spin': aoeSlash(p, 180, Math.PI*2, p.atk*2*dh, p.color); knockbackAround(p, 180, 300); break;
    case 'tail': aoeSlash(p, 220, Math.PI*1.5, p.atk*3*dh, p.color); knockbackAround(p, 220, 400); break;
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
    if (best && best.hp>0){ best.hp -= 999; addFloat(best.x,best.y,'死亡凝視','#aa00ff',18,1.5); onKill(p,best);}
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
  logMsg(`【${a.name}】 釋放！`, 'promote');
  pushKillFeed(`你釋放 ${a.name}`, a.color);
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
      p.qi += s.qi || 5;
      addFloat(s.x,s.y,`+${s.qi||5} 修為`,'#bb88ff',10,0.6);
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
      if (p.authoritySlots.length<3){
        p.authoritySlots.push(a); p.authCdT.push(0); p.q.authorities++;
        logMsg(`★ 獲得【${a.name}】`, 'promote');
        pushKillFeed(`你獲得權柄 ${a.name}`, a.color);
        playSound('promote');
        flash(a.color,0.5); shake(10);
        a._gone = true;
      }
    }
  }
  G.authorities = G.authorities.filter(a=>!a._gone);
  tryPromote(p);
}
function applyPickup(p, it){
  playSound('pickup');
  if (it.qi){ p.qi += it.qi; addFloat(p.x,p.y-20,`+${it.qi} 修為`,'#bb88ff',12,1); }
  if (it.heal){ p.hp = Math.min(p.maxHp, p.hp+it.heal); addFloat(p.x,p.y-20,`+${it.heal} HP`,'#ff6677',12,1); }
  if (it.bighp){ p.maxHp += it.bighp; p.hp += it.bighp; addFloat(p.x,p.y-20,`+${it.bighp} 上限`,'#ff2244',14,1); }
  if (it.sta){ p.sta = Math.min(p.maxSta, p.sta+it.sta); }
  if (it.zy){ p.zhenyuan += it.zy; recalcStats(p); addFloat(p.x,p.y-20,`真元 +${(it.zy*100)|0}%`,'#ffd66b',14,1.2); }
  if (it.dh){ p.daohen += it.dh; addFloat(p.x,p.y-20,`道痕 +${(it.dh*100)|0}%`,'#ddccff',14,1.2); }
  if (it.cdreset){ p.skillQT=p.skillET=p.skillRT=0; for (let i=0;i<p.authCdT.length;i++) p.authCdT[i]=0; addFloat(p.x,p.y-20,'CD 重置','#aaffff',14,1.2); }
  if (it.life){ p.life = Math.min(p.maxLife, p.life+it.life); addFloat(p.x,p.y-20,`+${it.life}s 壽元`,'#cc88ff',14,1.2); }
  logMsg(`拾取 ${it.name}`);
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
  } else {
    e.facing = angTo(e,tgt);
    // 近戰範圍內：攻擊
    if (td < e.atkR + e.r + tgt.r){
      e.vx*=0.5; e.vy*=0.5;
      if (e.atkCdT<=0 && Math.random()<0.7){ doMelee(e); e.atkCdT = e.atkCd * 1.35; }
    } else if (e.rngDmg>0 && td<e.rngR && e.rngCdT<=0 && Math.random()<0.22){
      doRanged(e); e.rngCdT = e.rngCd*2.2;
    } else {
      const ang=angTo(e,tgt); const sp = e.spd*0.85*(e.slow>0?0.5:1);
      e.vx=Math.cos(ang)*sp; e.vy=Math.sin(ang)*sp;
    }
    // AI 技能釋放機率大幅下調（1/8 以下）
    if (e.skillQT<=0 && td<380 && Math.random()<0.0012 && !(tgt && tgt.isPlayer && tgt.invuln>0)){ try{ castSkill(e, e.sp.skillQ); }catch(err){ console.warn('AI skill err', err);} e.skillQT = e.sp.skillQ.cd * 1.5; }
  }
  e.x = clamp(e.x+e.vx*dt, 20, WORLD.w-20);
  e.y = clamp(e.y+e.vy*dt, 20, WORLD.h-20);
  // AI 修為（很慢、由擊殺）
}

// =====================================================================
// 投射物 / 危險區 / 召喚物
// =====================================================================
function updateProjectiles(dt){
  for (const pr of G.projectiles){
    pr.x += pr.vx*dt; pr.y += pr.vy*dt; pr.life-=dt;
    if (pr.life<=0 || pr.x<0||pr.y<0||pr.x>WORLD.w||pr.y>WORLD.h){ pr._gone=true; continue; }
    const targets = pr.owner.isPlayer ? G.enemies : (pr.owner.isMinion ? G.enemies.filter(e=>e!==pr.owner) : [G.player, ...G.minions]);
    for (const t of targets){
      if (!t || t.hp<=0 || pr.hit.has(t)) continue;
      if (Math.hypot(t.x-pr.x,t.y-pr.y) < t.r+pr.r){
        dealDamage(pr.owner, t, pr.dmg, pr.color);
        pr.hit.add(t); pr.pierce--;
        if (pr.pierce<=0){ pr._gone=true; break; }
      }
    }
  }
  G.projectiles = G.projectiles.filter(p=>!p._gone);
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
function die(reason){
  if (G.dead) return;
  // 進階能力：不死鳳凰 — 復活一次
  if (G.player && G.player.perks && G.player.perks.revive>0 && !G.player._revivedOnce){
    G.player._revivedOnce = true;
    G.player.hp = G.player.maxHp;
    G.player.sta = G.player.maxSta;
    G.player.invuln = 4;
    G.shockwaves.push({x:G.player.x,y:G.player.y,r:0,max:500,life:1.2,color:'#ffaa30'});
    for (let i=0;i<120;i++) G.particles.push({x:G.player.x,y:G.player.y,vx:rand(-500,500),vy:rand(-500,500),life:1.6,color:'#ffaa30',r:3});
    flash('#ffaa30', 0.7); shake(30); playSound('promote');
    pushKillFeed('★ 涅槃復生！', '#ffaa30');
    logMsg('★ 涅槃復生！不死鳳凰之力使你重新站起','promote');
    return;
  }
  G.dead = true;
  playSound('death');
  document.getElementById('death').classList.remove('hidden');
  document.getElementById('deathReason').textContent = reason || G.deathBy || '不明原因';
  document.getElementById('deathStats').textContent = `階位：${tierName(G.player)} | 擊殺：${G.player.q.kills} | 高階：${G.player.q.killHighTier} | 修為：${G.player.qi} | 生存 ${G.time.toFixed(0)}s`;
}
function winGame(){
  if (G.won) return;
  G.won = true;
  document.getElementById('win').classList.remove('hidden');
  document.getElementById('winStats').textContent = `${G.player.path.name} — 達成神位【${G.player.path.tiers[8].name}】！`;
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
  canvas.width = window.innerWidth*dpr;
  canvas.height = window.innerHeight*dpr;
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
    const t = `★ 出生保護 ${p.invuln.toFixed(1)}s ★`;
    ctx.strokeText(t, cx, 60); ctx.fillText(t, cx, 60);
  }
  if (p.defending){
    ctx.fillStyle = '#88e0ff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    const t = '防禦中（80% 減傷 + 反射）';
    ctx.strokeText(t, cx, window.innerHeight-90); ctx.fillText(t, cx, window.innerHeight-90);
  }
}
let lastT=0;
function loop(t){
  const dt = Math.min(0.05, (t-lastT)/1000 || 0); lastT=t;
  try {
    if (G.started && !G.dead && !G.won) update(dt);
    render();
  } catch(err){
    G.errorCount++;
    G.lastError = String(err);
    console.error('[loop error]', err);
    if (G.errorCount<5) pushKillFeed('⚠ 內部錯誤已安全恢復', '#ff8888');
  }
  requestAnimationFrame(loop);
}
function update(dt){
  G.time += dt;
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
  // NaN 守衛
  if (!isFinite(G.player.x) || !isFinite(G.player.y)){
    G.player.x = WORLD.w/2; G.player.y = WORLD.h/2; G.player.vx=0; G.player.vy=0;
    pushKillFeed('⚠ 位置重置', '#ff8888');
  }
  for (const e of G.enemies){ try{ aiUpdate(e, dt); }catch(err){ e.hp=0; console.warn('ai err',err);} }
  for (const m of G.minions){ try{ aiUpdate(m, dt); }catch(err){ m.hp=0;} m.life-=dt; if (m.life<=0) m.hp=0; }
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
  if (G.particles.length>400) G.particles.splice(0, G.particles.length-400);
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
  while (G.enemies.length < 70) spawnEnemy();
  // 補充靈氣與道具
  if (G.spirits.length<100 && Math.random()<0.5) spawnSpirit();
  if (G.pickups.length<200 && Math.random()<0.2) spawnPickup();
  // 更新排行榜
  updateLeaderboard();
  // HUD
  updateHUD();
}
function updateLeaderboard(){
  const all = [G.player, ...G.enemies];
  all.sort((a,b)=> (b.rank*1000 + b.qi) - (a.rank*1000 + a.qi));
  G.leaderboard = all.slice(0,5);
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
    drawTerrain();
    drawSpirits();
    drawPickups();
    drawAuthoritiesWorld();
    drawHazards();
    for (const m of G.minions) try{ drawCreature(m); }catch(e){}
    for (const e of G.enemies) try{ drawCreature(e); }catch(err){}
    try{ drawCreature(G.player); }catch(e){}
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
  try{ drawKillFeed(); }catch(e){}
  try{ drawLeaderboard(); }catch(e){}
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
      const base = BIOMES[b].color;
      ctx.fillStyle = base;
      ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
      // 細分 8x8 sub-cell + 偽隨機色差 — 打散大方塊的「巨型像素」感
      const SUB = 8, ss = TILE/SUB;
      const seed = (x*2654435761 ^ y*40503) >>> 0;
      let s = seed;
      for (let sy=0; sy<SUB; sy++){
        for (let sx=0; sx<SUB; sx++){
          s = (s*1664525 + 1013904223) >>> 0;
          const v = ((s>>>16) & 0x1f) - 16; // -16~+15
          ctx.fillStyle = shadeColor(base, Math.floor(v*0.6));
          ctx.fillRect(x*TILE + sx*ss, y*TILE + sy*ss, ss+0.5, ss+0.5);
        }
      }
    }
  }
  // 裝飾物
  drawDecor(x0,y0,x1,y1);
  // 終焉之地中心動畫
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
  const isP = c.isPlayer;
  // 階位光環
  if (c.rank>=3){
    const aR = c.r + 6 + c.rank;
    ctx.strokeStyle = c.path.color; ctx.lineWidth = Math.min(5, c.rank-2);
    ctx.beginPath(); ctx.arc(c.x,c.y,aR,0,Math.PI*2); ctx.stroke();
  }
  // 無敵盾光（出生保護或衝刺）
  if (c.invuln>0){
    ctx.strokeStyle = '#ffff80';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.4 + 0.4*Math.sin(G.time*8);
    ctx.beginPath(); ctx.arc(c.x,c.y,c.r+10,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // 身體（依物種形狀繪製）
  ctx.save();
  ctx.translate(c.x,c.y); ctx.rotate(c.facing);
  if (c.darkT>0 && !isP) ctx.globalAlpha = 0.4;
  drawShape(c);
  ctx.globalAlpha = 1;
  ctx.restore();
  // icon
  ctx.fillStyle = '#000'; ctx.font = `bold ${Math.floor(c.r*0.8)}px sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(c.sp.icon, c.x, c.y);
  // HP bar
  if (!isP){
    const w = Math.max(30, c.r*2);
    ctx.fillStyle = '#000c'; ctx.fillRect(c.x-w/2, c.y-c.r-14, w, 5);
    ctx.fillStyle = c.hp/c.maxHp>0.4?'#5f5':'#f44'; ctx.fillRect(c.x-w/2, c.y-c.r-14, w*clamp(c.hp/c.maxHp,0,1), 5);
    ctx.fillStyle = c.path.color; ctx.font='10px sans-serif';
    ctx.fillText(`${c.sp.name} ${tierName(c)}`, c.x, c.y-c.r-20);
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
function drawShape(c){
  const r = c.r, col = c.color;
  const dark = shadeColor(col, -30);
  const light = shadeColor(col, 30);
  const isP = c.isPlayer;
  const outline = isP ? '#fff' : '#000';
  ctx.lineWidth = isP ? 2 : 1.5;
  ctx.strokeStyle = outline;
  switch(c.sp.shape){
    case 'humanoid': {
      // 身體（橢圓）+ 頭 + 武器
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(0,0,r*0.85,r*0.7,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
      // 武器（前方長劍）
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(r*0.6,0); ctx.lineTo(r*1.9,0); ctx.stroke();
      ctx.strokeStyle = outline; ctx.lineWidth = isP?2:1.5;
      // 頭
      ctx.fillStyle = light;
      ctx.beginPath(); ctx.arc(r*0.4,0,r*0.4,0,Math.PI*2); ctx.fill(); ctx.stroke();
      break;
    }
    case 'reptile': {
      // 細長身體 + 尾巴 + 4 條腿
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(0,0,r*1.3,r*0.6,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
      // 尾巴
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.moveTo(-r*1.2,0); ctx.lineTo(-r*2.2,r*0.15); ctx.lineTo(-r*2.2,-r*0.15); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 頭
      ctx.fillStyle = light;
      ctx.beginPath(); ctx.ellipse(r*1.1,0,r*0.4,r*0.35,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
      // 腿
      ctx.fillStyle = dark;
      [[r*0.6,r*0.6],[r*0.6,-r*0.6],[-r*0.5,r*0.6],[-r*0.5,-r*0.6]].forEach(([lx,ly])=>{
        ctx.beginPath(); ctx.arc(lx,ly,r*0.22,0,Math.PI*2); ctx.fill(); ctx.stroke();
      });
      // 眼
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(r*1.25,-r*0.12,r*0.08,0,Math.PI*2); ctx.fill();
      break;
    }
    case 'beast': {
      // 身體 + 大腿 + 尾 + 頭
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(0,0,r*1.15,r*0.75,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
      // 尾
      ctx.strokeStyle = dark; ctx.lineWidth = r*0.25;
      ctx.beginPath(); ctx.moveTo(-r,0); ctx.quadraticCurveTo(-r*1.8,-r*0.4,-r*2,r*0.2); ctx.stroke();
      ctx.lineWidth = isP?2:1.5; ctx.strokeStyle = outline;
      // 腿
      ctx.fillStyle = dark;
      [[r*0.5,r*0.7],[r*0.5,-r*0.7],[-r*0.4,r*0.7],[-r*0.4,-r*0.7]].forEach(([lx,ly])=>{
        ctx.beginPath(); ctx.ellipse(lx,ly,r*0.22,r*0.3,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
      });
      // 頭
      ctx.fillStyle = light;
      ctx.beginPath(); ctx.arc(r*1.05,0,r*0.5,0,Math.PI*2); ctx.fill(); ctx.stroke();
      // 耳
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.moveTo(r*1.2,-r*0.4); ctx.lineTo(r*1.4,-r*0.7); ctx.lineTo(r*0.9,-r*0.5); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(r*1.2,r*0.4); ctx.lineTo(r*1.4,r*0.7); ctx.lineTo(r*0.9,r*0.5); ctx.closePath(); ctx.fill();
      // 眼
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(r*1.25,-r*0.15,r*0.09,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(r*1.28,-r*0.15,r*0.04,0,Math.PI*2); ctx.fill();
      break;
    }
    case 'bird': {
      // 三角身體 + 雙翼
      ctx.fillStyle = col;
      // 翼（隨時間擺動）
      const flap = Math.sin(G.time*8 + (c._fp = c._fp||Math.random()*10))*0.3;
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-r*0.4, -r*1.6 - flap*r);
      ctx.lineTo(-r*1.0, -r*0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-r*0.4,  r*1.6 + flap*r);
      ctx.lineTo(-r*1.0,  r*0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 身體
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(0,0,r*0.9,r*0.45,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
      // 喙
      ctx.fillStyle = '#ffcc44';
      ctx.beginPath(); ctx.moveTo(r*0.9,-r*0.1); ctx.lineTo(r*1.5,0); ctx.lineTo(r*0.9,r*0.1); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 眼
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(r*0.6,-r*0.18,r*0.1,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(r*0.62,-r*0.18,r*0.05,0,Math.PI*2); ctx.fill();
      break;
    }
    case 'fish': {
      // 流線型身體 + 尾鰭 + 背鰭
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(0,0,r*1.2,r*0.6,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
      // 尾鰭
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.moveTo(-r*1.1,0); ctx.lineTo(-r*1.9,-r*0.7); ctx.lineTo(-r*1.6,0); ctx.lineTo(-r*1.9,r*0.7); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 背鰭
      ctx.beginPath(); ctx.moveTo(0,-r*0.55); ctx.lineTo(-r*0.3,-r*1.1); ctx.lineTo(r*0.3,-r*0.55); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 腹鰭
      ctx.beginPath(); ctx.moveTo(0,r*0.55); ctx.lineTo(-r*0.3,r*0.9); ctx.lineTo(r*0.3,r*0.55); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 眼
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(r*0.7,-r*0.15,r*0.1,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(r*0.72,-r*0.15,r*0.05,0,Math.PI*2); ctx.fill();
      // 嘴
      ctx.strokeStyle = dark; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(r*1.0,r*0.1); ctx.lineTo(r*1.2,0); ctx.stroke();
      break;
    }
    case 'dragon': {
      // 蛇身：多段圓
      const segs = 5;
      for (let i=segs-1;i>=0;i--){
        const t = i/segs;
        const sx = -t*r*2.5;
        const sy = Math.sin(G.time*4 - t*3)*r*0.5*t;
        const sr = r*(1-t*0.55);
        ctx.fillStyle = i%2===0 ? col : dark;
        ctx.beginPath(); ctx.arc(sx,sy,sr,0,Math.PI*2); ctx.fill(); ctx.stroke();
      }
      // 頭
      ctx.fillStyle = light;
      ctx.beginPath(); ctx.ellipse(r*0.5,0,r*0.6,r*0.45,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
      // 角
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.moveTo(r*0.4,-r*0.35); ctx.lineTo(r*0.1,-r*0.9); ctx.lineTo(r*0.55,-r*0.45); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r*0.4,r*0.35); ctx.lineTo(r*0.1,r*0.9); ctx.lineTo(r*0.55,r*0.45); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 眼
      ctx.fillStyle = '#ff3344'; ctx.beginPath(); ctx.arc(r*0.7,-r*0.12,r*0.08,0,Math.PI*2); ctx.fill();
      break;
    }
    case 'insect': {
      // 三段體 + 6 腿 + 螯
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(-r*0.8,0,r*0.6,r*0.55,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(0,0,r*0.55,r*0.5,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = light;
      ctx.beginPath(); ctx.ellipse(r*0.7,0,r*0.45,r*0.4,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
      // 6 腿
      ctx.strokeStyle = dark; ctx.lineWidth = 2;
      for (let i=0;i<3;i++){
        const lx = -r*0.3 + i*r*0.4;
        ctx.beginPath(); ctx.moveTo(lx, r*0.3); ctx.lineTo(lx+r*0.2, r*0.95); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(lx,-r*0.3); ctx.lineTo(lx+r*0.2,-r*0.95); ctx.stroke();
      }
      ctx.strokeStyle = outline; ctx.lineWidth = isP?2:1.5;
      // 螯/前肢
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.moveTo(r*1.05,-r*0.3); ctx.lineTo(r*1.5,-r*0.6); ctx.lineTo(r*1.4,-r*0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r*1.05,r*0.3); ctx.lineTo(r*1.5,r*0.6); ctx.lineTo(r*1.4,r*0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 尾刺
      ctx.beginPath(); ctx.moveTo(-r*1.4,0); ctx.lineTo(-r*1.9,-r*0.5); ctx.lineTo(-r*1.6,0); ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }
    default: {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill(); ctx.stroke();
    }
  }
}
function shadeColor(hex, percent){
  let c = hex.replace('#','');
  if (c.length===3) c = c.split('').map(x=>x+x).join('');
  const num = parseInt(c,16);
  let r = (num>>16) + percent;
  let g = ((num>>8)&0xff) + percent;
  let b = (num&0xff) + percent;
  r = clamp(r,0,255); g = clamp(g,0,255); b = clamp(b,0,255);
  return '#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);
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
function drawMinimap(){
  const mw = 200, mh = 200, mx = window.innerWidth-mw-10, my = 10;
  ctx.fillStyle = '#000c'; ctx.fillRect(mx,my,mw,mh);
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
  // 敵人（階位越高越亮）
  for (const e of G.enemies){
    ctx.fillStyle = e.rank>=5 ? '#ff80ff' : (e.rank>=3 ? '#ffaa44' : '#f55');
    const s = e.rank>=5?3:2;
    ctx.fillRect(mx+e.x*sx-s/2,my+e.y*sy-s/2,s,s);
  }
  // 玩家
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(mx+G.player.x*sx,my+G.player.y*sy,4,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = G.player.path.color; ctx.lineWidth=2; ctx.stroke();
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
  const lx = 12, ly = 12, lw = 240;
  ctx.fillStyle = '#000b'; ctx.fillRect(lx, ly, lw, 12 + G.leaderboard.length*22 + 6);
  ctx.strokeStyle = '#ffd66b88'; ctx.lineWidth = 1; ctx.strokeRect(lx, ly, lw, 12 + G.leaderboard.length*22 + 6);
  ctx.fillStyle = '#ffd66b'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('☘ 修為榜 TOP 5', lx+8, ly+18);
  for (let i=0;i<G.leaderboard.length;i++){
    const c = G.leaderboard[i];
    const yy = ly + 38 + i*22;
    ctx.fillStyle = c.isPlayer ? '#ffffff' : '#ddd';
    ctx.font = c.isPlayer ? 'bold 12px sans-serif' : '12px sans-serif';
    ctx.fillText(`${i+1}. ${c.name||c.sp.name}`, lx+8, yy);
    ctx.fillStyle = c.path.color; ctx.textAlign = 'right';
    ctx.fillText(`${tierName(c)} ${c.qi}`, lx+lw-8, yy);
    ctx.textAlign = 'left';
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
  setW('staFill', p.sta/p.maxSta); set('staTxt', `${p.sta|0}/${p.maxSta}`);
  setW('lifeFill', p.life/p.maxLife); set('lifeTxt', `${p.life|0}s`);
  const need = QI_THR[p.rank] || QI_THR[8];
  const prev = QI_THR[p.rank-1] || 0;
  setW('evoFill', (p.qi-prev)/Math.max(1,need-prev));
  set('evoTxt', `${p.qi}/${need}`);
  // 階位 / 任務 / 解鎖
  const q = currentQuest(p);
  const statsEl = document.getElementById('stats');
  if (statsEl){
    statsEl.innerHTML = `
      <div class="pathLine"><b style="color:${p.path.color}">${p.path.name}</b> · <span style="color:${p.path.color}">${tierName(p)}</span>（第 ${p.rank}/9 階）— <span style="color:#cccccc">${tierData(p)?tierData(p).pname:''}</span></div>
      <div>真元 ×${p.zhenyuan.toFixed(2)} · 道痕 ×${p.daohen.toFixed(2)}</div>
      <div class="cdrow">Q ${p.skillQT>0?p.skillQT.toFixed(1):'★'} ${p.sp.skillQ.name} | E ${p.skillET>0?p.skillET.toFixed(1):(p.rank>=(p.sp.skillE.unlockRank||1)?'★':'?')} ${p.sp.skillE.name} | R ${p.skillRT>0?p.skillRT.toFixed(1):(p.rank>=(p.sp.skillR.unlockRank||1)?'★':'?')} ${p.sp.skillR.name}</div>
      ${q ? `<div class="quest">任務：${q.desc}　<span class="qprog">[${q.show(p)}]</span> ${q.req(p)?'<span class="qdone">✓</span>':''}</div>` : '<div class="quest qdone">★ 已達神位</div>'}
    `;
  }
  // 權柄槽
  const slotsEl = document.getElementById('fruitSlots');
  if (slotsEl){
    slotsEl.innerHTML = '';
    for (let i=0;i<3;i++){
      const div = document.createElement('div'); div.className='slot';
      const a = p.authoritySlots[i];
      if (a){
        div.style.background = a.color+'44'; div.style.borderColor = a.color;
        div.innerHTML = `<div style="font-weight:700;color:${a.color}">${i+1} ${a.icon}</div><div style="font-size:9px">${a.name}</div>`;
        if (p.authCdT[i]>0) div.innerHTML += `<div class="cdnum">${p.authCdT[i].toFixed(1)}</div>`;
      } else {
        div.innerHTML = `<div style="opacity:0.4">${i+1}</div>`;
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
  const o = a.createOscillator(), g = a.createGain();
  o.connect(g); g.connect(a.destination);
  let f=440, dur=0.08, vol=0.05, wave='sine';
  switch(type){
    case 'hit':   f=520; dur=0.06; vol=0.06; wave='square'; break;
    case 'hurt':  f=180; dur=0.18; vol=0.10; wave='sawtooth'; break;
    case 'kill':  f=720; dur=0.22; vol=0.10; wave='triangle'; break;
    case 'block': f=900; dur=0.10; vol=0.08; wave='sine'; break;
    case 'pickup':f=1100;dur=0.08; vol=0.05; wave='triangle'; break;
    case 'promote': f=660; dur=0.5; vol=0.12; wave='triangle'; break;
    case 'auth':  f=140; dur=0.6; vol=0.14; wave='sawtooth'; break;
    case 'death': f=80;  dur=1.2; vol=0.15; wave='sawtooth'; break;
  }
  o.type = wave; o.frequency.setValueAtTime(f, now);
  if (type==='promote'||type==='kill') o.frequency.exponentialRampToValueAtTime(f*1.5, now+dur);
  if (type==='death'||type==='auth') o.frequency.exponentialRampToValueAtTime(f*0.4, now+dur);
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now+dur);
  o.start(now); o.stop(now+dur);
}

// =====================================================================
// 選單
// =====================================================================
function buildMenu(){
  const list = document.getElementById('speciesList'); list.innerHTML='';
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
      div.innerHTML = `<div style="font-weight:700;color:${sp.color}">${sp.icon} ${sp.name}</div>
        <div class="nums">HP ${sp.base.hp} · ATK ${sp.base.atk} · SPD ${sp.base.spd} ${sp.base.rngDmg?`· 遠程 ${sp.base.rngDmg}`:'（純近戰）'}</div>
        <div class="skills">Q ${sp.skillQ.name} · E ${sp.skillE.name}（${sp.skillE.unlockRank}階） · R ${sp.skillR.name}（${sp.skillR.unlockRank}階）</div>`;
      div.onclick = ()=>{
        document.querySelectorAll('.species').forEach(d=>d.classList.remove('sel'));
        div.classList.add('sel');
        G.selectedSpecies = sk;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('startBtn').textContent = `成為 ${sp.name} · 加入 ${PATHS[pk].name}`;
      };
      grp.appendChild(div);
    }
    list.appendChild(grp);
  }
}

// =====================================================================
// 啟動
// =====================================================================
function startGame(){
  if (!G.selectedSpecies) return;
  document.getElementById('menu').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  G.enemies=[]; G.minions=[]; G.projectiles=[]; G.pickups=[]; G.spirits=[]; G.authorities=[]; G.particles=[]; G.floats=[]; G.shockwaves=[]; G.hazards=[];
  G.dead=false; G.won=false; G.time=0;
  G.player = makeCreature(G.selectedSpecies, WORLD.w/2, WORLD.h/2 - 1500, true);
  // 玩家額外加成：基礎 +30% HP / +50% DEF（容錯）
  G.player.bonusDefMult = 1.5;
  G.player.maxHp = Math.floor(G.player.maxHp * 1.3);
  G.player.hp = G.player.maxHp;
  recalcStats(G.player);
  G.player.hp = G.player.maxHp; G.player.sta = G.player.maxSta;
  G.player.invuln = 10; // 出生 10 秒無敵
  // 相機立即對齊玩家位置，避免開局「無限放大」與黑屏錯覺
  G.cam.x = G.cam.tx = G.player.x;
  G.cam.y = G.cam.ty = G.player.y;
  G.cam.shake = 0; G.cam.flash = 0; G.cam.hitFlash = 0;
  spawnInitialWorld();
  if (typeof resize==='function') resize();
  G.started = true;
  logMsg(`你選擇了【${G.player.sp.name}】 · ${G.player.path.name}`, 'promote');
  logMsg('★ 出生保護 10 秒：先熟悉操作再進攻！', 'promote');
  logMsg('操作：WASD 移動 / 左鍵近戰 / 右鍵防禦反擊 / F 遠程 / Q E R 技能 / X 衝刺 / 1 2 3 權柄', 'promote');
  logMsg('★ 各途徑專屬晉階儀式，仔細看左下任務描述！', 'promote');
}
function restartGame(){
  document.getElementById('death').classList.add('hidden');
  document.getElementById('win').classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
  document.getElementById('hud').classList.add('hidden');
  G.started=false; G.selectedSpecies=null;
  G.killFeed=[]; G.leaderboard=[]; G.deathBy=''; G.errorCount=0;
  document.getElementById('startBtn').disabled=true;
  document.getElementById('startBtn').textContent='選擇物種後開始';
}
window.addEventListener('load', ()=>{
  setupCanvas();
  setupInput(document.getElementById('game'));
  buildMenu();
  document.getElementById('startBtn').onclick = startGame;
  document.getElementById('restartBtn').onclick = restartGame;
  document.getElementById('winRestartBtn').onclick = restartGame;
  requestAnimationFrame(loop);
});
