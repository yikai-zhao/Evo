#!/usr/bin/env node
// =====================================================================
// Evo multiplayer relay server v3.8.0
// Adds rooms + matchmaking on top of the v1.2 relay.
//
// Room model
//   - Each client lives in exactly one room. Default = "global" lobby.
//   - state/hit/fx/chat/enemy_kill/dead/party messages scope to room.
//   - "global" is the legacy free-for-all (unlimited) for solo-mode peeks.
//   - Match rooms have capacity (default 8). Auto-matchmaking joins the
//     fullest non-full room, else creates a new one.
//   - Private rooms use a 4-char ALPHA code. Anyone with the code can join
//     if it isn't full.
//
// New messages (client → server)
//   { t:'mm_find',  cap?:8 }       → join/create a public match
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

const PORT = parseInt(process.argv[2] || process.env.PORT || '8081', 10);
const ROOT = __dirname;
const DEFAULT_CAP = 8;
const GLOBAL_ROOM = 'global';

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
    r = { code, capacity, members: new Set(), isPrivate: !!isPrivate, createdAt: Date.now() };
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
  const r = ensureRoom(code, capacity || DEFAULT_CAP, isPrivate);
  if (r.members.size >= r.capacity) return null;
  r.members.add(id);
  c.room = r.code;
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
  cap = cap || DEFAULT_CAP;
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
  clients.set(id, { ws, name: '?', last: Date.now(), ip, room: null, rank: 1 });
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
        findPublicMatch(id, msg.cap || DEFAULT_CAP);
        break;
      case 'mm_create': {
        const code = genCode();
        joinRoom(id, code, msg.cap || DEFAULT_CAP, true);
        break;
      }
      case 'mm_join':
        if (typeof msg.code === 'string' && msg.code.length >= 3 && msg.code.length <= 8){
          const r = joinRoom(id, msg.code.toUpperCase(), DEFAULT_CAP, true);
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
        if (typeof msg.target === 'number'){
          const tc = clients.get(msg.target);
          if (tc && tc.room === c.room) send(msg.target, msg);
        }
        break;
      case 'chat':
        if (typeof msg.text === 'string' && msg.text.length < 200) broadcastRoom(msg, c.room);
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
