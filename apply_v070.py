#!/usr/bin/env python3
"""Apply v0.7.0 changes to game.js."""
import re, sys

with open('game.js','r',encoding='utf-8') as f:
    s = f.read()

def replace_once(a, b, label):
    global s
    n = s.count(a)
    if n != 1:
        print(f'[FAIL] {label}: found {n} matches')
        sys.exit(1)
    s = s.replace(a, b)
    print(f'[OK]   {label}')

replace_once(
    "// 終焉之地 The Land's End — Prototype v0.6.4\n// v0.6.4 地圖細紋理、AI 降戰意、物種平衡收斂、簡化操作",
    "// 終焉之地 The Land's End — Prototype v0.7.0\n// v0.7.0 克蘇魯星空 + 觸手 + 秘境 + 靈氣泉 + 紋理快取 + 修為門檻下調 + FPS 顯示",
    'version header'
)

replace_once(
    "// 修為門檻（rank N 需要 QI_THR[N]）— 大幅降低、玩起來爽\nconst QI_THR = [0, 25, 70, 150, 270, 450, 700, 1050, 1500, 2100];",
    "// 修為門檻（rank N 需要 QI_THR[N]）— v0.7.0 再次收斂，玩起來更爽\nconst QI_THR = [0, 15, 40, 90, 160, 270, 430, 650, 950, 1350];",
    'QI_THR'
)

replace_once(
    "const G = {\n  player:null, enemies:[], minions:[], projectiles:[], pickups:[], spirits:[], authorities:[],\n  particles:[], floats:[], shockwaves:[], hazards:[],\n  terrain:null, cam:{x:0,y:0,tx:0,ty:0,shake:0,flash:0,flashColor:'#fff',hitFlash:0},\n  time:0, started:false, dead:false, won:false,\n  selectedSpecies:null, msg:'', killFeed:[], leaderboard:[], errorCount:0, lastError:'',\n  soundOn:true, lastHitTime:0, deathBy:'',\n};",
    "const G = {\n  player:null, enemies:[], minions:[], projectiles:[], pickups:[], spirits:[], authorities:[],\n  particles:[], floats:[], shockwaves:[], hazards:[],\n  qiSprings:[], rifts:[], stars:[], nebula:[], tendrils:[],\n  terrain:null, cam:{x:0,y:0,tx:0,ty:0,shake:0,flash:0,flashColor:'#fff',hitFlash:0},\n  time:0, started:false, dead:false, won:false,\n  selectedSpecies:null, msg:'', killFeed:[], leaderboard:[], errorCount:0, lastError:'',\n  soundOn:true, lastHitTime:0, deathBy:'',\n  fps:60, frameAcc:0, frameN:0,\n};",
    'G state'
)

# Find generateTerrain function and inject biomeTex code at end + add new functions after
m = re.search(r'function generateTerrain\(\)\{', s)
assert m, 'generateTerrain not found'
i = m.end()
depth = 1
while depth > 0 and i < len(s):
    if s[i] == '{': depth += 1
    elif s[i] == '}': depth -= 1
    i += 1
end_idx = i  # offset AFTER the closing brace

inject = """
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
      G.terrain.biomeTex[bk] = tx;
    }
  } catch(e){ console.warn('[biomeTex]',e); G.terrain.biomeTex = null; }
"""

new_funcs = """

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

function generateNodes(){
  G.qiSprings = [];
  const cx = WORLD.w/2, cy = WORLD.h/2;
  for (let i=0;i<6;i++){
    const ang = (i/6)*Math.PI*2 + Math.PI/6;
    const D = 2200;
    G.qiSprings.push({
      x: cx + Math.cos(ang)*D, y: cy + Math.sin(ang)*D,
      r: 140, tcd: 3, pulse: Math.random()*Math.PI*2,
    });
  }
  G.rifts = [];
  const riftDefs = [
    {name:'修為秘境',  icon:'修', color:'#bb88ff', reward:'qi'},
    {name:'生機秘境',  icon:'生', color:'#ff7080', reward:'heal'},
    {name:'力之秘境',  icon:'力', color:'#ffd66b', reward:'power'},
    {name:'外神秘境',  icon:'★', color:'#aa44ff', reward:'all'},
  ];
  for (let i=0;i<riftDefs.length;i++){
    const ang = (i/riftDefs.length)*Math.PI*2;
    const D = 2800;
    G.rifts.push({
      ...riftDefs[i],
      x: cx + Math.cos(ang)*D, y: cy + Math.sin(ang)*D,
      r: 60, used:false, pulse: Math.random()*Math.PI*2,
    });
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
    ctx.fillText('靈氣泉', qs.x, qs.y - r - 8);
  }
}

function drawRifts(){
  for (const rf of G.rifts){
    rf.pulse += 0.05;
    if (rf.used){
      ctx.fillStyle = '#221122aa';
      ctx.beginPath(); ctx.arc(rf.x, rf.y, rf.r*0.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#888'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('（已開啟）'+rf.name, rf.x, rf.y);
      continue;
    }
    const r = rf.r;
    const g = ctx.createRadialGradient(rf.x,rf.y,0,rf.x,rf.y,r*1.8);
    g.addColorStop(0, rf.color+'aa'); g.addColorStop(0.4, rf.color+'55'); g.addColorStop(1, rf.color+'00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(rf.x,rf.y,r*1.8,0,Math.PI*2); ctx.fill();
    for (let i=0;i<6;i++){
      const a = rf.pulse*0.8 + i*Math.PI/3;
      const rr = r*0.9 + Math.sin(rf.pulse*2 + i)*8;
      ctx.strokeStyle = rf.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(rf.x, rf.y, rr, a, a + Math.PI/4); ctx.stroke();
    }
    ctx.fillStyle = rf.color; ctx.font='bold 26px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(rf.icon, rf.x, rf.y);
    ctx.fillStyle='#fff'; ctx.font='bold 13px sans-serif';
    ctx.fillText(rf.name, rf.x, rf.y - r - 10);
    ctx.fillStyle=rf.color; ctx.font='11px sans-serif';
    ctx.fillText('靠近觸發', rf.x, rf.y + r + 14);
  }
}
"""

# Inject biomeTex code BEFORE the closing brace of generateTerrain, append new_funcs AFTER
before = s[:end_idx-1]  # everything up to and excluding the closing `}`
after  = s[end_idx:]     # everything after the closing `}`
s = before + inject + "}\n" + new_funcs + after
print(f'[OK]   injected biomeTex + 6 new functions (new len={len(s)})')

replace_once(
    "function spawnInitialWorld(){\n  generateTerrain();\n  generateDecor();\n  for (let i=0;i<320;i++) spawnPickup();\n  for (let i=0;i<160;i++) spawnSpirit();",
    "function spawnInitialWorld(){\n  generateTerrain();\n  generateDecor();\n  generateCosmos();\n  generateNodes();\n  for (let i=0;i<320;i++) spawnPickup();\n  for (let i=0;i<160;i++) spawnSpirit();\n  for (const qs of G.qiSprings){\n    for (let i=0;i<30;i++){\n      const ang=Math.random()*Math.PI*2, dd=rand(20, qs.r*0.9);\n      G.spirits.push({x:qs.x+Math.cos(ang)*dd, y:qs.y+Math.sin(ang)*dd, pulse:Math.random()*Math.PI*2, qi:6});\n    }\n  }",
    'spawnInitialWorld'
)

old_dt = "  for (let y=y0;y<y1;y++){\n    for (let x=x0;x<x1;x++){\n      const b = G.terrain.map[y][x];\n      const base = BIOMES[b].color;\n      ctx.fillStyle = base;\n      ctx.fillRect(x*TILE, y*TILE, TILE, TILE);\n      // 細分 8x8 sub-cell + 偽隨機色差 — 打散大方塊的「巨型像素」感\n      const SUB = 8, ss = TILE/SUB;\n      const seed = (x*2654435761 ^ y*40503) >>> 0;\n      let s = seed;\n      for (let sy=0; sy<SUB; sy++){\n        for (let sx=0; sx<SUB; sx++){\n          s = (s*1664525 + 1013904223) >>> 0;\n          const v = ((s>>>16) & 0x1f) - 16; // -16~+15\n          ctx.fillStyle = shadeColor(base, Math.floor(v*0.6));\n          ctx.fillRect(x*TILE + sx*ss, y*TILE + sy*ss, ss+0.5, ss+0.5);\n        }\n      }\n    }\n  }"
new_dt = "  for (let y=y0;y<y1;y++){\n    for (let x=x0;x<x1;x++){\n      const b = G.terrain.map[y][x];\n      const tex = G.terrain.biomeTex && G.terrain.biomeTex[b];\n      if (tex){\n        ctx.drawImage(tex, x*TILE, y*TILE);\n      } else {\n        ctx.fillStyle = BIOMES[b].color;\n        ctx.fillRect(x*TILE, y*TILE, TILE, TILE);\n      }\n    }\n  }"
replace_once(old_dt, new_dt, 'drawTerrain biomeTex')

replace_once(
    "    drawTerrain();\n    drawSpirits();\n    drawPickups();\n    drawAuthoritiesWorld();",
    "    drawCosmicBG();\n    drawTerrain();\n    drawTendrils();\n    drawQiSprings();\n    drawRifts();\n    drawSpirits();\n    drawPickups();\n    drawAuthoritiesWorld();",
    'render wiring'
)

old_auto = "  G.authorities = G.authorities.filter(a=>!a._gone);\n  tryPromote(p);\n}"
new_auto = """  G.authorities = G.authorities.filter(a=>!a._gone);
  for (const qs of G.qiSprings){
    if (dist(p, qs) < qs.r){
      p.qi += 12 * (1/60);
      if (!qs._floatT || G.time - qs._floatT > 0.8){ addFloat(p.x,p.y-30,'靈氣泉 +修為','#bb88ff',12,0.8); qs._floatT = G.time; }
    }
    qs.tcd -= 1/60;
    if (qs.tcd<=0){
      qs.tcd = 3;
      for (let i=0;i<2;i++){
        const ang = Math.random()*Math.PI*2, dd = rand(20, qs.r*0.9);
        G.spirits.push({x:qs.x+Math.cos(ang)*dd, y:qs.y+Math.sin(ang)*dd, pulse:Math.random()*Math.PI*2, qi:6});
      }
    }
  }
  for (const rf of G.rifts){
    if (rf.used) continue;
    if (dist(p, rf) < rf.r){ rf.used = true; grantRiftReward(p, rf); }
  }
  tryPromote(p);
}
function grantRiftReward(p, rf){
  logMsg('★ 開啟【'+rf.name+'】！', 'promote');
  pushKillFeed('★ '+rf.name, rf.color);
  try{ playSound('promote'); }catch(e){}
  try{ flash(rf.color, 0.7); shake(18); }catch(e){}
  for (let i=0;i<60;i++) G.particles.push({x:rf.x,y:rf.y,vx:rand(-400,400),vy:rand(-400,400),life:1.2,color:rf.color,r:3});
  G.shockwaves.push({x:rf.x,y:rf.y,r:0,max:400,life:1,color:rf.color});
  if (rf.reward==='qi'){
    p.qi += 200; addFloat(p.x,p.y-30,'+200 修為','#bb88ff',18,1.5);
  } else if (rf.reward==='heal'){
    p.maxHp = Math.floor(p.maxHp*1.15); p.hp = p.maxHp; p.maxLife += 60; p.life = p.maxLife;
    addFloat(p.x,p.y-30,'生命強化 +15%','#ff7080',18,1.5);
  } else if (rf.reward==='power'){
    p.zhenyuan += 0.3; p.daohen += 0.3; recalcStats(p); p.hp = p.maxHp;
    addFloat(p.x,p.y-30,'真元 +30% 道痕 +30%','#ffd66b',18,1.5);
  } else if (rf.reward==='all'){
    p.qi += 120; p.zhenyuan += 0.2; p.daohen += 0.2; p.maxHp = Math.floor(p.maxHp*1.1); recalcStats(p); p.hp = p.maxHp;
    addFloat(p.x,p.y-30,'外神饋贈 · 全屬性提升','#aa44ff',18,1.8);
  }
}"""
replace_once(old_auto, new_auto, 'autoPickup + grantRiftReward')

old_loop = "function loop(t){\n  const dt = Math.min(0.05, (t-lastT)/1000 || 0); lastT=t;\n  try {\n    if (G.started && !G.dead && !G.won) update(dt);\n    render();"
new_loop = "function loop(t){\n  const dt = Math.min(0.05, (t-lastT)/1000 || 0); lastT=t;\n  G.frameAcc += dt; G.frameN++;\n  if (G.frameAcc >= 0.5){ G.fps = Math.round(G.frameN / G.frameAcc); G.frameAcc = 0; G.frameN = 0; }\n  try {\n    if (G.started && !G.dead && !G.won) update(dt);\n    render();"
replace_once(old_loop, new_loop, 'loop FPS counter')

old_mm = "  // 權柄\n  for (const a of G.authorities){ ctx.fillStyle=a.color; ctx.fillRect(mx+a.x*sx-3,my+a.y*sy-3,6,6); }"
new_mm = "  // 權柄\n  for (const a of G.authorities){ ctx.fillStyle=a.color; ctx.fillRect(mx+a.x*sx-3,my+a.y*sy-3,6,6); }\n  for (const qs of G.qiSprings){ ctx.fillStyle='#bb88ff'; ctx.beginPath(); ctx.arc(mx+qs.x*sx,my+qs.y*sy,3,0,Math.PI*2); ctx.fill(); }\n  for (const rf of G.rifts){ ctx.fillStyle = rf.used ? '#444' : rf.color; ctx.beginPath(); ctx.arc(mx+rf.x*sx,my+rf.y*sy,4,0,Math.PI*2); ctx.fill(); if (!rf.used){ ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.stroke(); } }"
replace_once(old_mm, new_mm, 'minimap markers')

old_fps = "  try{ drawStatusBanner(); }catch(e){}\n  try{ drawKillFeed(); }catch(e){}\n  try{ drawLeaderboard(); }catch(e){}"
new_fps = "  try{ drawStatusBanner(); }catch(e){}\n  try{ drawKillFeed(); }catch(e){}\n  try{ drawLeaderboard(); }catch(e){}\n  ctx.fillStyle = G.fps<30 ? '#ff6666' : (G.fps<50 ? '#ffcc66' : '#88ff88');\n  ctx.font = 'bold 11px monospace'; ctx.textAlign = 'left';\n  ctx.fillText('FPS '+G.fps, 8, window.innerHeight-8);"
replace_once(old_fps, new_fps, 'FPS display')

with open('game.js','w',encoding='utf-8') as f:
    f.write(s)
print('\n[DONE] all v0.7.0 patches applied. Final length:', len(s))
