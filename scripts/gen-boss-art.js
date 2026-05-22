// v2.9.1 — programmatic AI-style boss portraits.
// Generates 5 painterly 1024×1024 SVGs and rasterizes to PNG via sharp.
// Style: dark cosmic cultivation, glow auras, gold rune ring, painterly silhouettes.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.join(__dirname, '..', 'assets', 'bosses');
fs.mkdirSync(OUT, { recursive: true });

const W = 1024, H = 1024, CX = W/2, CY = H/2;

// shared layers ------------------------------------------------------------
function bgVoid(color1, color2) {
  return `
  <defs>
    <radialGradient id="void" cx="50%" cy="50%" r="65%">
      <stop offset="0%" stop-color="${color1}" stop-opacity="0.95"/>
      <stop offset="55%" stop-color="${color2}" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#000" stop-opacity="1"/>
    </radialGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${color1}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${color1}" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
    <filter id="softglow"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#void)"/>
  <circle cx="${CX}" cy="${CY}" r="460" fill="url(#halo)"/>`;
}

function starField(count = 80) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    const r = Math.random() * 1.4 + 0.3;
    const a = Math.random() * 0.7 + 0.2;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#fff" opacity="${a.toFixed(2)}"/>`;
  }
  return s;
}

function runeRing(radius, count, color, glyphColor = '#ffd66b') {
  let s = `<circle cx="${CX}" cy="${CY}" r="${radius}" fill="none" stroke="${color}" stroke-opacity="0.35" stroke-width="2"/>`;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI/2;
    const x = CX + Math.cos(a) * radius;
    const y = CY + Math.sin(a) * radius;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="${glyphColor}" opacity="0.9" filter="url(#softglow)"/>`;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#fff"/>`;
  }
  return s;
}

function nameBadge(/*name, subtitle, color*/) {
  // intentionally empty — game.js draws the actual name overlay in the boss-intro splash
  return '';
}

// ─────────────────────────────────────────────────────────────────────────
// 1. EYE — Elder Day · Star-Touching Eye
function svgEye() {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  s += bgVoid('#5a2a8a', '#1a0a30');
  s += starField(120);
  s += runeRing(420, 18, '#aa66ff');
  // tentacles (8 curved arms)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x1 = CX + Math.cos(a) * 200;
    const y1 = CY + Math.sin(a) * 200;
    const x2 = CX + Math.cos(a + 0.4) * 380;
    const y2 = CY + Math.sin(a + 0.4) * 380;
    const x3 = CX + Math.cos(a + 0.6) * 460;
    const y3 = CY + Math.sin(a + 0.6) * 460;
    s += `<path d="M ${CX} ${CY} Q ${x1.toFixed(0)} ${y1.toFixed(0)} ${x2.toFixed(0)} ${y2.toFixed(0)} T ${x3.toFixed(0)} ${y3.toFixed(0)}" stroke="#aa44ff" stroke-width="14" stroke-linecap="round" fill="none" opacity="0.75" filter="url(#softglow)"/>`;
    s += `<path d="M ${CX} ${CY} Q ${x1.toFixed(0)} ${y1.toFixed(0)} ${x2.toFixed(0)} ${y2.toFixed(0)} T ${x3.toFixed(0)} ${y3.toFixed(0)}" stroke="#dd99ff" stroke-width="3" stroke-linecap="round" fill="none"/>`;
  }
  // outer iris glow
  s += `<circle cx="${CX}" cy="${CY}" r="220" fill="#1a0033"/>`;
  s += `<circle cx="${CX}" cy="${CY}" r="200" fill="#aa44ff" opacity="0.6" filter="url(#glow)"/>`;
  // sclera
  s += `<circle cx="${CX}" cy="${CY}" r="170" fill="#fff" opacity="0.95"/>`;
  // iris gradient
  s += `<defs><radialGradient id="iris" cx="50%" cy="50%"><stop offset="0%" stop-color="#000"/><stop offset="70%" stop-color="#5a1a8a"/><stop offset="100%" stop-color="#aa44ff"/></radialGradient></defs>`;
  s += `<circle cx="${CX}" cy="${CY}" r="120" fill="url(#iris)"/>`;
  // veins
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2;
    const r1 = 125, r2 = 165;
    s += `<line x1="${(CX+Math.cos(a)*r1).toFixed(1)}" y1="${(CY+Math.sin(a)*r1).toFixed(1)}" x2="${(CX+Math.cos(a)*r2).toFixed(1)}" y2="${(CY+Math.sin(a)*r2).toFixed(1)}" stroke="#aa0033" stroke-width="${(1+Math.random()*1.5).toFixed(1)}" opacity="0.7"/>`;
  }
  // pupil
  s += `<ellipse cx="${CX}" cy="${CY}" rx="35" ry="55" fill="#000"/>`;
  s += `<circle cx="${CX-15}" cy="${CY-25}" r="14" fill="#fff" opacity="0.85"/>`;
  // crown of small stars around
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI * 2 / 12 - Math.PI/2;
    const r = 280;
    const x = CX + Math.cos(a) * r, y = CY + Math.sin(a) * r;
    s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="5" fill="#fff" filter="url(#softglow)"/>`;
  }
  s += nameBadge('Elder Day · Star-Touching Eye', '— Outer God I —', '#cc88ff');
  s += `</svg>`;
  return s;
}

// 2. MAW — Ravager · Thousand-Mouth Devourer
function svgMaw() {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  s += bgVoid('#5a1010', '#1a0000');
  s += starField(60);
  s += runeRing(420, 20, '#ff4444');
  // sphere body
  s += `<defs><radialGradient id="mawbody" cx="40%" cy="35%"><stop offset="0%" stop-color="#552020"/><stop offset="60%" stop-color="#1a0000"/><stop offset="100%" stop-color="#000"/></radialGradient></defs>`;
  s += `<circle cx="${CX}" cy="${CY}" r="240" fill="#ff4444" opacity="0.5" filter="url(#glow)"/>`;
  s += `<circle cx="${CX}" cy="${CY}" r="220" fill="url(#mawbody)" stroke="#aa2222" stroke-width="2"/>`;
  // vertical mouth gash
  s += `<defs><radialGradient id="mawthroat" cx="50%" cy="50%"><stop offset="0%" stop-color="#ffaa30"/><stop offset="40%" stop-color="#ff3300"/><stop offset="100%" stop-color="#330000"/></radialGradient></defs>`;
  s += `<ellipse cx="${CX}" cy="${CY}" rx="55" ry="170" fill="url(#mawthroat)" filter="url(#softglow)"/>`;
  s += `<ellipse cx="${CX}" cy="${CY}" rx="25" ry="120" fill="#000"/>`;
  // fang ring around mouth
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const rx = 50 + Math.abs(Math.cos(a)) * 8;
    const ry = 165;
    const ex = CX + Math.cos(a) * rx;
    const ey = CY + Math.sin(a) * ry;
    const tx = CX + Math.cos(a) * (rx - 30);
    const ty = CY + Math.sin(a) * (ry - 20);
    s += `<polygon points="${(ex-6).toFixed(1)},${ey.toFixed(1)} ${(ex+6).toFixed(1)},${ey.toFixed(1)} ${tx.toFixed(1)},${ty.toFixed(1)}" fill="#fff" opacity="0.95"/>`;
  }
  // outer tongue lashes
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI/4;
    const x1 = CX + Math.cos(a) * 220;
    const y1 = CY + Math.sin(a) * 220;
    const x2 = CX + Math.cos(a + 0.3) * 380;
    const y2 = CY + Math.sin(a + 0.3) * 380;
    s += `<path d="M ${CX} ${CY} Q ${x1.toFixed(0)} ${y1.toFixed(0)} ${x2.toFixed(0)} ${y2.toFixed(0)}" stroke="#cc1010" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.8" filter="url(#softglow)"/>`;
  }
  // ember particles
  for (let i = 0; i < 30; i++) {
    const x = CX + (Math.random()-0.5) * 700;
    const y = CY + (Math.random()-0.5) * 700;
    s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(Math.random()*3+1).toFixed(1)}" fill="#ffaa30" opacity="${(Math.random()*0.6+0.3).toFixed(2)}" filter="url(#softglow)"/>`;
  }
  s += nameBadge('Ravager · Thousand-Mouth Devourer', '— Outer God II —', '#ff6644');
  s += `</svg>`;
  return s;
}

// 3. CROWN — Sovereign · Frozen-Abyss Crown
function svgCrown() {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  s += bgVoid('#1a4a8a', '#020a20');
  s += starField(100);
  s += runeRing(420, 16, '#66ccff', '#aaeeff');
  // hex body
  let hexPts = '';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI/2;
    hexPts += `${(CX + Math.cos(a) * 200).toFixed(1)},${(CY + Math.sin(a) * 200).toFixed(1)} `;
  }
  s += `<defs><radialGradient id="ice" cx="40%" cy="35%"><stop offset="0%" stop-color="#cceeff"/><stop offset="60%" stop-color="#3380cc"/><stop offset="100%" stop-color="#0a1a3a"/></radialGradient></defs>`;
  s += `<polygon points="${hexPts}" fill="#66ccff" opacity="0.5" filter="url(#glow)"/>`;
  s += `<polygon points="${hexPts}" fill="url(#ice)" stroke="#aaeeff" stroke-width="3"/>`;
  // crown ice shards (8 spikes pointing up)
  for (let i = 0; i < 8; i++) {
    const a = (-Math.PI/2) + (i - 3.5) * 0.22;
    const baseX = CX + Math.cos(a) * 180;
    const baseY = CY + Math.sin(a) * 180;
    const tipX = CX + Math.cos(a) * (310 + Math.abs(i-3.5)*8);
    const tipY = CY + Math.sin(a) * (310 + Math.abs(i-3.5)*8);
    const wx = Math.cos(a + Math.PI/2) * 12;
    const wy = Math.sin(a + Math.PI/2) * 12;
    s += `<polygon points="${(baseX-wx).toFixed(1)},${(baseY-wy).toFixed(1)} ${(baseX+wx).toFixed(1)},${(baseY+wy).toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)}" fill="#cceeff" opacity="0.92" stroke="#fff" stroke-width="1.5"/>`;
  }
  // central frost eye
  s += `<circle cx="${CX}" cy="${CY}" r="80" fill="#000"/>`;
  s += `<circle cx="${CX}" cy="${CY}" r="68" fill="#aaeeff" opacity="0.85"/>`;
  s += `<circle cx="${CX}" cy="${CY}" r="40" fill="#fff"/>`;
  s += `<circle cx="${CX-5}" cy="${CY-10}" r="18" fill="#0a2a5a"/>`;
  // snowflake particles
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    const r = Math.random() * 6 + 3;
    s += `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)})" opacity="${(Math.random()*0.5+0.4).toFixed(2)}">`;
    for (let k = 0; k < 6; k++) {
      const aa = (k / 6) * Math.PI * 2;
      s += `<line x1="0" y1="0" x2="${(Math.cos(aa)*r).toFixed(1)}" y2="${(Math.sin(aa)*r).toFixed(1)}" stroke="#cceeff" stroke-width="1"/>`;
    }
    s += `</g>`;
  }
  s += nameBadge('Sovereign · Frozen-Abyss Crown', '— Outer God III —', '#aaeeff');
  s += `</svg>`;
  return s;
}

// 4. PHOENIX — Ashen Phoenix · Cycle-Breaker
function svgPhoenix() {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  s += bgVoid('#5a2a00', '#1a0500');
  s += starField(40);
  s += runeRing(440, 20, '#ffaa30');
  // wings (huge stretched curves left & right)
  const wingPath = (sign) => {
    const x0 = CX, y0 = CY + 20;
    const c1x = CX + sign * 260, c1y = CY - 220;
    const c2x = CX + sign * 460, c2y = CY - 40;
    const c3x = CX + sign * 380, c3y = CY + 200;
    return `M ${x0} ${y0} Q ${c1x} ${c1y} ${c2x} ${c2y} Q ${(c2x+c3x)/2} ${(c2y+c3y)/2 - 50} ${c3x} ${c3y} Z`;
  };
  s += `<defs>
    <linearGradient id="wing" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffeecc"/>
      <stop offset="40%" stop-color="#ffaa30"/>
      <stop offset="100%" stop-color="#aa1010"/>
    </linearGradient>
    <radialGradient id="bodyfire" cx="50%" cy="40%">
      <stop offset="0%" stop-color="#fff5aa"/>
      <stop offset="40%" stop-color="#ffaa30"/>
      <stop offset="100%" stop-color="#5a1010"/>
    </radialGradient>
  </defs>`;
  s += `<path d="${wingPath(-1)}" fill="url(#wing)" opacity="0.85" filter="url(#softglow)"/>`;
  s += `<path d="${wingPath(1)}" fill="url(#wing)" opacity="0.85" filter="url(#softglow)"/>`;
  // feather strokes
  for (let side of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const t = 0.3 + i * 0.09;
      const sx = CX + side * (180 + i*30);
      const sy = CY - 100 + i * 30;
      const ex = CX + side * (300 + i*22);
      const ey = CY - 60 + i * 35;
      s += `<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="#fff5aa" stroke-width="2" opacity="0.6"/>`;
    }
  }
  // body
  s += `<ellipse cx="${CX}" cy="${CY+10}" rx="120" ry="160" fill="url(#bodyfire)" filter="url(#softglow)"/>`;
  s += `<ellipse cx="${CX}" cy="${CY+10}" rx="120" ry="160" fill="none" stroke="#aa3300" stroke-width="2"/>`;
  // head & beak
  s += `<circle cx="${CX}" cy="${CY-90}" r="55" fill="#ffaa30" stroke="#aa3300" stroke-width="2"/>`;
  s += `<polygon points="${CX-12},${CY-70} ${CX+12},${CY-70} ${CX},${CY-30}" fill="#552200"/>`;
  // eyes
  s += `<circle cx="${CX-22}" cy="${CY-100}" r="9" fill="#ff2200"/><circle cx="${CX-22}" cy="${CY-100}" r="3" fill="#fff"/>`;
  s += `<circle cx="${CX+22}" cy="${CY-100}" r="9" fill="#ff2200"/><circle cx="${CX+22}" cy="${CY-100}" r="3" fill="#fff"/>`;
  // tail flames (3 streamers)
  for (let i = -1; i <= 1; i++) {
    const x1 = CX + i * 30;
    const y1 = CY + 160;
    const x2 = CX + i * 90;
    const y2 = CY + 360;
    s += `<path d="M ${x1} ${y1} Q ${CX + i*180} ${CY + 280} ${x2} ${y2}" stroke="#ff5500" stroke-width="14" fill="none" stroke-linecap="round" opacity="0.85" filter="url(#softglow)"/>`;
    s += `<path d="M ${x1} ${y1} Q ${CX + i*180} ${CY + 280} ${x2} ${y2}" stroke="#ffee88" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }
  // ember particles
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(Math.random()*2.5+0.8).toFixed(1)}" fill="#ffaa30" opacity="${(Math.random()*0.6+0.3).toFixed(2)}"/>`;
  }
  s += nameBadge('Ashen Phoenix · Cycle-Breaker', '— Outer God IV —', '#ffcc66');
  s += `</svg>`;
  return s;
}

// 5. SERPENT — Nine-Headed Verdant Serpent
function svgSerpent() {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  s += bgVoid('#0a3a1a', '#01100a');
  s += starField(70);
  s += runeRing(440, 18, '#44dd66', '#aaffaa');
  // central core
  s += `<defs><radialGradient id="serpcore" cx="40%" cy="35%"><stop offset="0%" stop-color="#aaffaa"/><stop offset="50%" stop-color="#2a8a4a"/><stop offset="100%" stop-color="#01200a"/></radialGradient></defs>`;
  s += `<circle cx="${CX}" cy="${CY}" r="200" fill="#44dd66" opacity="0.45" filter="url(#glow)"/>`;
  s += `<circle cx="${CX}" cy="${CY}" r="160" fill="url(#serpcore)" stroke="#1a5a2a" stroke-width="3"/>`;
  // scale arcs on core
  for (let r = 30; r < 160; r += 22) {
    s += `<circle cx="${CX}" cy="${CY+r/3}" r="${r}" fill="none" stroke="#1a5a2a" stroke-width="1.2" opacity="0.55"/>`;
  }
  // 9 serpent heads radiating outward
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 - Math.PI/2;
    const sweep = Math.sin(i * 2.1) * 0.35;
    const neckLen = 320;
    const midX = CX + Math.cos(a + sweep) * (neckLen * 0.5);
    const midY = CY + Math.sin(a + sweep) * (neckLen * 0.5);
    const headX = CX + Math.cos(a) * neckLen;
    const headY = CY + Math.sin(a) * neckLen;
    // neck
    s += `<path d="M ${CX} ${CY} Q ${midX.toFixed(0)} ${midY.toFixed(0)} ${headX.toFixed(0)} ${headY.toFixed(0)}" stroke="#2a8a4a" stroke-width="34" stroke-linecap="round" fill="none"/>`;
    s += `<path d="M ${CX} ${CY} Q ${midX.toFixed(0)} ${midY.toFixed(0)} ${headX.toFixed(0)} ${headY.toFixed(0)}" stroke="#44dd66" stroke-width="14" stroke-linecap="round" fill="none" opacity="0.7"/>`;
    // head (ellipse oriented along direction)
    const ang = Math.atan2(headY - midY, headX - midX);
    s += `<g transform="translate(${headX.toFixed(0)} ${headY.toFixed(0)}) rotate(${(ang*180/Math.PI).toFixed(1)})">`;
    s += `<ellipse cx="0" cy="0" rx="50" ry="28" fill="#2a8a4a" stroke="#1a4a2a" stroke-width="2"/>`;
    s += `<ellipse cx="-10" cy="0" rx="40" ry="22" fill="#44dd66"/>`;
    // eyes (glowing yellow)
    s += `<circle cx="15" cy="-10" r="6" fill="#ffee44" filter="url(#softglow)"/>`;
    s += `<circle cx="15" cy="10" r="6" fill="#ffee44" filter="url(#softglow)"/>`;
    s += `<circle cx="15" cy="-10" r="2.5" fill="#000"/>`;
    s += `<circle cx="15" cy="10" r="2.5" fill="#000"/>`;
    // fangs
    s += `<polygon points="38,-6 44,-2 40,6" fill="#fff"/>`;
    s += `<polygon points="38,6 44,2 40,-6" fill="#fff"/>`;
    s += `</g>`;
  }
  // mist particles
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(Math.random()*5+2).toFixed(1)}" fill="#44dd66" opacity="${(Math.random()*0.25+0.1).toFixed(2)}" filter="url(#softglow)"/>`;
  }
  s += nameBadge('Nine-Headed Verdant Serpent', '— Outer God V —', '#88ee99');
  s += `</svg>`;
  return s;
}

// ─────────────────────────────────────────────────────────────────────────
const jobs = [
  { name: 'eye', svg: svgEye },
  { name: 'maw', svg: svgMaw },
  { name: 'crown', svg: svgCrown },
  { name: 'phoenix', svg: svgPhoenix },
  { name: 'serpent', svg: svgSerpent },
];

(async () => {
  for (const j of jobs) {
    const svg = j.svg();
    const svgPath = path.join(OUT, j.name + '.svg');
    const pngPath = path.join(OUT, j.name + '.png');
    fs.writeFileSync(svgPath, svg);
    await sharp(Buffer.from(svg)).png().toFile(pngPath);
    const stat = fs.statSync(pngPath);
    console.log(`✓ ${j.name}.png  (${(stat.size/1024).toFixed(1)} KB)`);
  }
  console.log('\nDone. 5 boss portraits → assets/bosses/*.png');
})();
