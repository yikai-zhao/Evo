#!/usr/bin/env node
// =====================================================================
// Build platform-ready zips for CrazyGames / Poki / itch.io.
// Output:
//   dist/<platform>/                        — minified self-contained build
//   dist/Evo-<platform>-v<VERSION>.zip      — uploadable archive
//
// Usage:
//   node scripts/build-platform.js                  # builds all 3 platforms
//   node scripts/build-platform.js --platform=poki  # single platform
// =====================================================================
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { minify } = require('terser');

const ROOT = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const VERSION = pkg.version;

// Each platform gets its own build. The same code can be live on
// CrazyGames + GameMonetize + itch.io simultaneously (no exclusivity).
// Only Poki may require exclusivity if you sign their high-eCPM contract.
const PLATFORMS = {
  crazygames: { sdkHint: 'crazygames', label: 'CrazyGames', extraHtml: '<!-- platform=crazygames -->' },
  poki:       { sdkHint: 'poki',       label: 'Poki',       extraHtml: '<!-- platform=poki -->' },
  itch:       { sdkHint: 'standalone', label: 'itch.io',    extraHtml: '<!-- platform=itch -->' },
};

const arg = process.argv.find(a => a.startsWith('--platform='));
const only = arg ? arg.split('=')[1] : null;

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
  console.log(`  \u2713 ${path.basename(src)}: ${before} KB \u2192 ${after} KB`);
}

async function buildOne(platformKey){
  const conf = PLATFORMS[platformKey];
  if (!conf) throw new Error('unknown platform ' + platformKey);
  const OUT = path.join(ROOT, 'dist', platformKey);
  console.log(`\n\u2550\u2550 Building ${conf.label} (${platformKey}) \u2550\u2550`);
  rmrf(OUT);
  fs.mkdirSync(OUT, {recursive:true});

  console.log('\u25b8 Minifying JS');
  await minifyTo(path.join(ROOT,'game.js'), path.join(OUT,'game.js'));
  await minifyTo(path.join(ROOT,'sdk.js'),  path.join(OUT,'sdk.js'));
  await minifyTo(path.join(ROOT,'net.js'),  path.join(OUT,'net.js'));

  console.log('\u25b8 Copying static assets');
  copy(path.join(ROOT,'styles.css'), path.join(OUT,'styles.css'));
  copy(path.join(ROOT,'assets'),    path.join(OUT,'assets'));

  console.log('\u25b8 Patching index.html (cache-bust + platform hint)');
  let html = fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  // Re-write all ?v= to current package.json version (idempotent)
  html = html.replace(/\?v=[\d.]+/g, '?v=' + VERSION);
  // Inject platform marker (SDK uses window.__EVO_PLATFORM__ to pick embed)
  html = html.replace('<head>', '<head>\n' + conf.extraHtml);
  html = html.replace('</head>', `<script>window.__EVO_PLATFORM__='${conf.sdkHint}';</script></head>`);
  fs.writeFileSync(path.join(OUT,'index.html'), html);

  console.log('\u25b8 Building zip');
  const zipPath = path.join(ROOT, 'dist', `Evo-${platformKey}-v${VERSION}.zip`);
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  try {
    execSync(`cd "${OUT}" && zip -rq "${zipPath}" .`, { stdio:'inherit' });
    const kb = (fs.statSync(zipPath).size/1024).toFixed(1);
    console.log(`\u2713 ${conf.label} built: ${path.relative(ROOT,zipPath)} (${kb} KB)`);
  } catch(e){
    console.error('zip failed (install zip cli?):', e.message);
  }
}

(async ()=>{
  console.log(`\u25b8 Cleaning dist/`);
  rmrf(path.join(ROOT, 'dist'));
  fs.mkdirSync(path.join(ROOT, 'dist'), {recursive:true});

  const list = only ? [only] : Object.keys(PLATFORMS);
  for (const p of list) await buildOne(p);

  console.log(`\n\u2713 Done. v${VERSION}`);
  console.log(`  Upload targets:`);
  console.log(`    \u2022 dist/Evo-crazygames-v${VERSION}.zip  \u2192 https://developer.crazygames.com/`);
  console.log(`    \u2022 dist/Evo-poki-v${VERSION}.zip        \u2192 https://developers.poki.com/`);
  console.log(`    \u2022 dist/Evo-itch-v${VERSION}.zip        \u2192 https://itch.io/dashboard`);
})().catch(e=>{ console.error(e); process.exit(1); });
