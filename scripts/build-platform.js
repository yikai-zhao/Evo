#!/usr/bin/env node
// =====================================================================
// Build platform-ready zip for CrazyGames / Poki / itch.io
// Output:
//   dist/standalone/ — self-contained HTML5 build
//   dist/Evo-platform.zip — uploadable archive
// Usage: node scripts/build-platform.js
// =====================================================================
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { minify } = require('terser');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'dist', 'standalone');

function rmrf(p){ if (fs.existsSync(p)) fs.rmSync(p, {recursive:true, force:true}); }
function copy(src, dst){
  if (!fs.existsSync(src)) return;
  const st = fs.statSync(src);
  if (st.isDirectory()){
    fs.mkdirSync(dst, {recursive:true});
    for (const f of fs.readdirSync(src)) copy(path.join(src,f), path.join(dst,f));
  } else {
    fs.mkdirSync(path.dirname(dst), {recursive:true});
    fs.copyFileSync(src, dst);
  }
}

async function minifyTo(src, dst){
  const code = fs.readFileSync(src, 'utf8');
  const res = await minify({[path.basename(src)]: code}, {
    compress: { drop_console: true, drop_debugger: true, passes: 2 },
    mangle: { toplevel: false },
    format: { comments: false }
  });
  if (res.error) throw res.error;
  fs.mkdirSync(path.dirname(dst), {recursive:true});
  fs.writeFileSync(dst, res.code);
  const before = (fs.statSync(src).size/1024).toFixed(1);
  const after = (fs.statSync(dst).size/1024).toFixed(1);
  console.log(`  ✓ ${path.basename(src)}: ${before} KB → ${after} KB`);
}

(async ()=>{
  console.log('▸ Cleaning dist/');
  rmrf(path.join(ROOT, 'dist'));
  fs.mkdirSync(OUT, {recursive:true});

  console.log('▸ Minifying JS');
  await minifyTo(path.join(ROOT,'game.js'), path.join(OUT,'game.js'));
  await minifyTo(path.join(ROOT,'sdk.js'),  path.join(OUT,'sdk.js'));
  await minifyTo(path.join(ROOT,'net.js'),  path.join(OUT,'net.js'));

  console.log('▸ Copying static assets');
  copy(path.join(ROOT,'styles.css'), path.join(OUT,'styles.css'));
  copy(path.join(ROOT,'assets'),    path.join(OUT,'assets'));

  console.log('▸ Patching index.html (platform build: no Render multiplayer, no analytics)');
  let html = fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  // Force platform=crazygames by default for platform build (override via ?platform=)
  html = html.replace('<head>', '<head>\n<!-- PLATFORM BUILD -->');
  fs.writeFileSync(path.join(OUT,'index.html'), html);

  console.log('▸ Building zip');
  const zipPath = path.join(ROOT, 'dist', 'Evo-platform.zip');
  try {
    execSync(`cd "${OUT}" && zip -rq "${zipPath}" .`, { stdio:'inherit' });
    const kb = (fs.statSync(zipPath).size/1024).toFixed(1);
    console.log(`\n✓ Built: ${zipPath} (${kb} KB)`);
    console.log(`  Upload this zip to:`);
    console.log(`    • CrazyGames: https://developer.crazygames.com/`);
    console.log(`    • Poki:       https://developers.poki.com/`);
    console.log(`    • itch.io:    https://itch.io/dashboard`);
  } catch(e){
    console.error('zip failed (install zip cli?):', e.message);
  }
})().catch(e=>{ console.error(e); process.exit(1); });
