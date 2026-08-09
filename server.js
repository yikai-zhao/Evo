#!/usr/bin/env node
// =====================================================================
// Evo multiplayer relay server v3.8.0
// Adds rooms + matchmaking on top of the v1.2 relay.
//
// Room model
//   - Each client lives in exactly one room. Default = "global" lobby.
//   - state/hit/fx/chat/enemy_kill/dead/party messages scope to room.
//   - "global" is the legacy free-for-all (unlimited) for solo-mode peeks.
//   - Match rooms have capacity (default 28). Auto-matchmaking joins the
//     fullest non-full room, else creates a new one.
//   - Private rooms use a 4-char ALPHA code. Anyone with the code can join
//     if it isn't full.
//
// New messages (client → server)
//   { t:'mm_find',  cap?:28 }      → join/create a public match
//   { t:'mm_create' }              → make a private room, returns code
//   { t:'mm_join',  code:'ABCD' }  → join private room by code
//   { t:'mm_leave' }               → return to "global"
//
// New messages (server → client)
//   { t:'room', code, capacity, peers:[{id,name}], isPrivate }
// =====================================================================
const http = require('http');
const fs   = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = parseInt(process.argv[2] || process.env.PORT || '8080', 10);
const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : ROOT;
try { fs.mkdirSync(DATA_DIR, { recursive:true }); } catch(e){ console.error('[storage] unable to create data directory:', e.message); }
const DEFAULT_CAP = 28;
const MAX_ROOM_CAP = 28;
const GLOBAL_ROOM = 'global';
const CHAT_WINDOW_MS = 5000;
const CHAT_MAX_PER_WINDOW = 5;
const HIT_WINDOW_MS = 1000;
const HIT_MAX_PER_WINDOW = 18;
const ANALYTICS_WINDOW_MS = 10000;
const ANALYTICS_MAX_PER_WINDOW = 40;
const ANALYTICS_EVENTS = new Set(['ad_offer_shown','ad_clicked','ad_completed','ad_failed','revive_used','match_respawn_used','run_end']);
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');
let analytics = {};
try { analytics = JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf8')) || {}; } catch(e){ analytics = {}; }
let analyticsWriteTimer = null;

function persistJson(file, data){
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFile(tmp, JSON.stringify(data, null, 2), (writeErr)=>{
    if (writeErr){ console.error('[storage] write failed:', writeErr.message); return; }
    fs.rename(tmp, file, (renameErr)=>{ if (renameErr) console.error('[storage] rename failed:', renameErr.message); });
  });
}

function clampRoomCap(cap){
  return Math.max(2, Math.min(MAX_ROOM_CAP, Math.floor(+cap || DEFAULT_CAP)));
}
function consumeRate(c, key, windowMs, maxCount){
  const now = Date.now();
  const slot = c.rates[key] || { start:now, count:0 };
  if (now - slot.start >= windowMs){ slot.start = now; slot.count = 0; }
  slot.count++;
  c.rates[key] = slot;
  return slot.count <= maxCount;
}
function recordAnalytics(event, data){
  if (!ANALYTICS_EVENTS.has(event)) return;
  const day = new Date().toISOString().slice(0,10);
  const bucket = analytics[day] = analytics[day] || { events:{}, placements:{}, outcomes:{} };
  bucket.events[event] = (bucket.events[event]||0) + 1;
  const placement = String((data&&data.placement)||'').slice(0,32).replace(/[^a-z0-9_-]/gi, '');
  const outcome = String((data&&data.outcome)||'').slice(0,16).replace(/[^a-z0-9_-]/gi, '');
  if (placement){
    const p = bucket.placements[placement] = bucket.placements[placement] || {};
    p[event] = (p[event]||0) + 1;
  }
  if (event === 'run_end' && outcome) bucket.outcomes[outcome] = (bucket.outcomes[outcome]||0) + 1;
  if (!analyticsWriteTimer){
    analyticsWriteTimer = setTimeout(()=>{
      analyticsWriteTimer = null;
      persistJson(ANALYTICS_FILE, analytics);
    }, 1000);
  }
}

// ---- v3.9.0: leaderboard persistence ----
const LB_FILE = path.join(DATA_DIR, 'leaderboard.json');
const LB_MAX = 200;
let _lbCache = [];
try { _lbCache = JSON.parse(fs.readFileSync(LB_FILE, 'utf8')); if (!Array.isArray(_lbCache)) _lbCache = []; } catch(e){ _lbCache = []; }
function getTopScores(n){
  return _lbCache.slice(0, n|0).map((e, i) => ({ ...e, rank: i+1 }));
}
function submitScore(entry){
  // sanity: name 1-24 chars, score positive int, kills/rank positive ints, path string
  if (!entry || typeof entry !== 'object') return null;
  const name = String(entry.name || 'Anon').slice(0, 24).replace(/[\x00-\x1f<>]/g, '');
  const score = Math.max(0, Math.min(9999999, Math.floor(+entry.score || 0)));
  if (score <= 0) return null;
  const item = {
    name,
    score,
    rank: Math.max(1, Math.min(9, Math.floor(+entry.rank || 1))),
    kills: Math.max(0, Math.min(9999, Math.floor(+entry.kills || 0))),
    timeS: Math.max(0, Math.min(3600, Math.floor(+entry.timeS || 0))),
    path: String(entry.path || '?').slice(0, 12),
    won: !!entry.won,
    ts: Date.now(),
  };
  _lbCache.push(item);
  _lbCache.sort((a, b) => b.score - a.score);
  if (_lbCache.length > LB_MAX) _lbCache.length = LB_MAX;
  // best-effort persist (async, never blocks)
  try { persistJson(LB_FILE, _lbCache); } catch(e){}
  const idx = _lbCache.indexOf(item);
  return { ...item, rank: idx + 1 };
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
};

// ---- HTTP static (also serves the game in production) ----
const httpServer = http.createServer((req, res) => {
  if (req.url === '/health'){
    res.writeHead(200, {'Content-Type':'application/json'});
    return res.end(JSON.stringify({
      ok:true, clients: clients.size, rooms: rooms.size, time: Date.now()
    }));
  }
  if (req.url === '/analytics' || req.url.startsWith('/analytics?')){
    const required = process.env.ANALYTICS_TOKEN || '';
    const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const supplied = bearer || new URL(req.url, 'http://localhost').searchParams.get('token') || '';
    if (required && supplied !== required){ res.writeHead(403); return res.end('Forbidden'); }
    res.writeHead(200, {'Content-Type':'application/json', 'Cache-Control':'no-store'});
    return res.end(JSON.stringify({ days:analytics }));
  }
  // v3.9.0: global leaderboard (top 50 by score, persisted to disk)
  if (req.url === '/leaderboard' || req.url.startsWith('/leaderboard?')){
    res.writeHead(200, {
      'Content-Type':'application/json',
      'Cache-Control':'public, max-age=15',
      'Access-Control-Allow-Origin':'*',
    });
    return res.end(JSON.stringify({ top: getTopScores(50) }));
  }
  if (req.method === 'POST' && req.url === '/leaderboard'){
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 4096) req.destroy(); });
    req.on('end', () => {
      try {
        const entry = JSON.parse(body);
        const saved = submitScore(entry);
        res.writeHead(200, {'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*'});
        res.end(JSON.stringify({ ok: !!saved, rank: saved ? saved.rank : null }));
      } catch(e){ res.writeHead(400); res.end('bad json'); }
    });
    return;
  }
  if (req.method === 'OPTIONS' && req.url === '/leaderboard'){
    res.writeHead(204, {
      'Access-Control-Allow-Origin':'*',
      'Access-Control-Allow-Methods':'GET, POST',
      'Access-Control-Allow-Headers':'Content-Type',
    });
    return res.end();
  }
  const urlPath = req.url.split('?')[0];
  const filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT){
    res.writeHead(403); return res.end('Forbidden');
  }
  const ext = path.extname(filePath).toLowerCase();
  if (!MIME[ext]){ res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, data) => {
    if (err){ res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, {
      'Content-Type': MIME[ext],
      'Cache-Control': 'public, max-age=60',
    });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

// ---- Room registry ----
let nextId = 1;
const clients = new Map();             // id -> { ws, name, last, ip, room, rank }
const rooms   = new Map();             // code -> { code, capacity, members:Set<id>, isPrivate, createdAt }

function ensureRoom(code, capacity, isPrivate){
  let r = rooms.get(code);
  if (!r){
    r = { code, capacity:code===GLOBAL_ROOM ? 9999 : clampRoomCap(capacity), members: new Set(), isPrivate: !!isPrivate, createdAt: Date.now() };
    rooms.set(code, r);
  }
  return r;
}
ensureRoom(GLOBAL_ROOM, 9999, false); // never full, never garbage-collected

function genCode(){
  const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1
  for (let attempts=0; attempts<50; attempts++){
    let c = '';
    for (let i=0;i<4;i++) c += alpha[(Math.random()*alpha.length)|0];
    if (!rooms.has(c)) return c;
  }
  return 'R' + Math.floor(Math.random()*1e6).toString(36).toUpperCase().slice(0,3);
}

function leaveRoom(id){
  const c = clients.get(id); if (!c) return;
  const r = rooms.get(c.room); if (!r) return;
  r.members.delete(id);
  // tell everyone in old room
  broadcastRoom({ t:'leave', id }, c.room);
  // GC empty non-global rooms
  if (r.members.size === 0 && r.code !== GLOBAL_ROOM){
    rooms.delete(r.code);
  } else {
    // notify the room about the new roster
    sendRoomInfo(r);
  }
  c.room = null;
}

function joinRoom(id, code, capacity, isPrivate){
  const c = clients.get(id); if (!c) return null;
  if (c.room) leaveRoom(id);
  const r = ensureRoom(code, code===GLOBAL_ROOM ? 9999 : clampRoomCap(capacity), isPrivate);
  if (r.members.size >= r.capacity) return null;
  r.members.add(id);
  c.room = r.code;
  // sync the updated roster to everyone in the room, including the newcomer
  sendRoomInfo(r);
  // broadcast join to peers in this room
  broadcastRoom({ t:'join', id, name: c.name }, r.code, id);
  // tell the joining client about the room + welcome peer list
  const peers = [...r.members].filter(x => x !== id).map(pid => {
    const pc = clients.get(pid);
    return { id: pid, name: pc ? pc.name : '?' };
  });
  send(id, { t:'room', code: r.code, capacity: r.capacity, peers, isPrivate: r.isPrivate });
  return r;
}

function sendRoomInfo(r){
  const peers = [...r.members].map(pid => {
    const pc = clients.get(pid);
    return { id: pid, name: pc ? pc.name : '?', rank: pc ? (pc.rank||1) : 1 };
  });
  for (const pid of r.members){
    send(pid, { t:'room', code: r.code, capacity: r.capacity, peers: peers.filter(p=>p.id!==pid), isPrivate: r.isPrivate });
  }
}

function findPublicMatch(id, cap){
  cap = clampRoomCap(cap);
  // pick the fullest non-full public room (sticky matchmaking — fill rooms before opening new ones)
  let best = null;
  for (const r of rooms.values()){
    if (r.isPrivate) continue;
    if (r.code === GLOBAL_ROOM) continue;
    if (r.members.size >= r.capacity) continue;
    if (r.capacity !== cap) continue;
    if (!best || r.members.size > best.members.size) best = r;
  }
  if (!best){
    const code = 'M' + genCode().slice(1); // M-prefixed = public match room
    best = ensureRoom(code, cap, false);
  }
  return joinRoom(id, best.code, cap, false);
}

// ---- Per-room broadcast ----
function broadcastRoom(obj, code, exceptId = null){
  const r = rooms.get(code); if (!r) return;
  const s = JSON.stringify(obj);
  for (const pid of r.members){
    if (pid === exceptId) continue;
    const c = clients.get(pid);
    if (c && c.ws.readyState === 1) c.ws.send(s);
  }
}
function send(id, obj){
  const c = clients.get(id);
  if (c && c.ws.readyState === 1) c.ws.send(JSON.stringify(obj));
}

// ---- Server leaderboard (per-room) ----
const serverLB = new Map();  // playerName -> { name, rank, qi, path, ts }
function updateServerLB(name, rank, qi, path){
  if (!name || typeof rank !== 'number') return;
  const prev = serverLB.get(name);
  if (!prev || qi > prev.qi){
    serverLB.set(name, { name, rank, qi, path, ts: Date.now() });
  }
}
function getTopLB(n=10){
  return [...serverLB.values()].sort((a,b)=>b.qi-a.qi).slice(0,n);
}

// ---- Connection handling ----
wss.on('connection', (ws, req) => {
  const id = nextId++;
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '?').toString().split(',')[0];
  clients.set(id, { ws, name: '?', last: Date.now(), ip, room: null, rank: 1, rates:{} });
  console.log(`[+] client ${id} from ${ip}  (total ${clients.size})`);

  // Join the global lobby by default; client can mm_find/join to leave
  joinRoom(id, GLOBAL_ROOM, 9999, false);
  // legacy welcome (id only — peers come from `room` message)
  send(id, { t:'welcome', id });

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch(e){ return; }
    if (!msg || typeof msg.t !== 'string') return;
    const c = clients.get(id); if (!c) return;
    c.last = Date.now();
    msg.from = id;

    switch (msg.t){
      // ---- room/matchmaking ----
      case 'mm_find':
        findPublicMatch(id, clampRoomCap(msg.cap));
        break;
      case 'mm_create': {
        const code = genCode();
        joinRoom(id, code, clampRoomCap(msg.cap), true);
        break;
      }
      case 'mm_join':
        if (typeof msg.code === 'string' && msg.code.length >= 3 && msg.code.length <= 8){
          const code = msg.code.toUpperCase();
          const existing = rooms.get(code);
          const r = existing ? joinRoom(id, code, existing.capacity, existing.isPrivate) : null;
          if (!r) send(id, { t:'mm_error', reason:'room_full_or_invalid' });
        }
        break;
      case 'mm_leave':
        joinRoom(id, GLOBAL_ROOM, 9999, false);
        break;

      // ---- gameplay (scoped to room) ----
      case 'state':
        if (typeof msg.name === 'string') c.name = msg.name.slice(0,16);
        if (typeof msg.rank === 'number') c.rank = msg.rank|0;
        if (msg.name && typeof msg.qi === 'number') updateServerLB(msg.name, msg.rank||1, msg.qi, msg.path||'');
        broadcastRoom(msg, c.room, id);
        break;
      case 'hit':
        // direct-target relay (still must be in the same room)
        if (typeof msg.target === 'number' && consumeRate(c, 'hit', HIT_WINDOW_MS, HIT_MAX_PER_WINDOW)){
          const tc = clients.get(msg.target);
          const maxDamage = 500 + Math.max(1, Math.min(9, c.rank||1)) * 500;
          msg.dmg = Math.max(1, Math.min(maxDamage, Math.floor(+msg.dmg || 1)));
          if (tc && tc.room === c.room && msg.target !== id) send(msg.target, msg);
        }
        break;
      case 'chat':
        if (typeof msg.text === 'string' && msg.text.length < 200 && consumeRate(c, 'chat', CHAT_WINDOW_MS, CHAT_MAX_PER_WINDOW)){
          msg.text = msg.text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '').trim();
          if (msg.text) broadcastRoom(msg, c.room);
        }
        break;
      case 'analytics':
        if (typeof msg.event === 'string' && consumeRate(c, 'analytics', ANALYTICS_WINDOW_MS, ANALYTICS_MAX_PER_WINDOW)){
          recordAnalytics(msg.event, msg.data && typeof msg.data === 'object' ? msg.data : {});
        }
        break;
      case 'fx':
      case 'enemy_kill':
      case 'party':
        broadcastRoom(msg, c.room, id);
        break;
      case 'dead':
        msg.victimId = id;
        broadcastRoom(msg, c.room);
        console.log(`[PvP/${c.room}] ${msg.killerId} → ${id}`);
        break;
      case 'ping':
        ws.send(JSON.stringify({ t:'pong', echo: msg.echo || 0, ts: Date.now() }));
        break;
    }
  });

  ws.on('close', () => {
    leaveRoom(id);
    clients.delete(id);
    console.log(`[-] client ${id} gone (total ${clients.size})`);
  });
  ws.on('error', (e) => console.warn(`[!] client ${id} err`, e.message));
});

// ---- Heartbeat: drop idle clients ----
setInterval(() => {
  const now = Date.now();
  for (const [id, c] of clients){
    if (now - c.last > 30000){
      try { c.ws.close(); } catch(e){}
      leaveRoom(id);
      clients.delete(id);
      console.log(`[~] client ${id} timeout`);
    }
  }
}, 10000);

// ---- Periodic leaderboard broadcast (room-scoped) ----
setInterval(() => {
  const lb = getTopLB(10);
  if (lb.length === 0) return;
  const s = JSON.stringify({ t:'server_lb', lb });
  for (const [, c] of clients) if (c.ws.readyState === 1) c.ws.send(s);
}, 15000);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[Evo WS v3.8.0] listening on :${PORT} (path /ws) — rooms enabled`);
});

// ---- v3.16.0: Self-ping keepalive — prevents Render free-tier cold start (14m spin-down) ----
// Pings /health every 10 minutes so the server stays warm
if (process.env.RENDER_EXTERNAL_URL){
  const https = require('https');
  const SELF_URL = process.env.RENDER_EXTERNAL_URL + '/health';
  setInterval(() => {
    try {
      https.get(SELF_URL, r => r.resume()).on('error', ()=>{});
    } catch(e){}
  }, 10 * 60 * 1000); // 10 minutes
  console.log(`[Evo] keepalive ping registered → ${SELF_URL}`);
}
