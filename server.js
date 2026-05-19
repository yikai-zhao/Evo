#!/usr/bin/env node
// 終焉之地 — 多人中繼伺服器 v1.2.0
// 純訊息中繼 (relay) 架構：每個客戶端本地模擬世界，僅互相同步玩家狀態
//   - 玩家位置/血量/階位/物種 10Hz 廣播
//   - 攻擊事件（hit report） 由發起者推送，伺服器轉發（信任攻擊者；原型用）
//   - 聊天訊息、上線/離線通知
//
// 啟動： node server.js [port]
// 預設 port 8081；前端用 wss://<codespace>-8081.app.github.dev 連線

const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = parseInt(process.argv[2] || process.env.PORT || '8081', 10);

const httpServer = http.createServer((req, res) => {
  if (req.url === '/health'){ res.writeHead(200,{'Content-Type':'application/json'});
    return res.end(JSON.stringify({ ok:true, clients: wss.clients.size, time: Date.now() }));
  }
  res.writeHead(200,{'Content-Type':'text/plain'});
  res.end('Evo WS relay alive — connect via /ws');
});

const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

let nextId = 1;
const clients = new Map();   // id -> { ws, name, last }

function broadcast(obj, exceptId = null){
  const s = JSON.stringify(obj);
  for (const [id, c] of clients){
    if (id === exceptId) continue;
    if (c.ws.readyState === 1) c.ws.send(s);
  }
}

function send(id, obj){
  const c = clients.get(id);
  if (c && c.ws.readyState === 1) c.ws.send(JSON.stringify(obj));
}

wss.on('connection', (ws, req) => {
  const id = nextId++;
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '?').toString().split(',')[0];
  clients.set(id, { ws, name: '?', last: Date.now(), ip });
  console.log(`[+] client ${id} from ${ip}  (total ${clients.size})`);

  // 給新客戶端：你的 id + 其他在線玩家清單
  ws.send(JSON.stringify({ t:'welcome', id, peers: [...clients.keys()].filter(k=>k!==id) }));
  broadcast({ t:'join', id }, id);

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch(e){ return; }
    if (!msg || typeof msg.t !== 'string') return;
    const c = clients.get(id); if (!c) return;
    c.last = Date.now();
    // 標註發送者，防偽
    msg.from = id;

    switch (msg.t){
      case 'state':      // 玩家狀態（position/hp/rank/path/species/dir）— 廣播
        if (typeof msg.name === 'string') c.name = msg.name.slice(0,16);
        broadcast(msg, id);
        break;
      case 'hit':        // 攻擊命中報告 {target, dmg, kind}
        if (typeof msg.target === 'number') send(msg.target, msg);
        break;
      case 'chat':       // 全域聊天
        if (typeof msg.text === 'string' && msg.text.length < 200) broadcast(msg);
        break;
      case 'fx':         // 視覺效果同步（權柄釋放、晉階等）
        broadcast(msg, id);
        break;
      case 'enemy_kill': // v1.4.0 sync enemy deaths
        broadcast(msg, id);
        break;
      case 'dead':
        msg.victimId=id;
        broadcast(msg);
        console.log('[PvP] kill '+msg.killerId+' -> '+id);
        break;
      case 'ping':
        ws.send(JSON.stringify({ t:'pong', echo: msg.echo || 0, ts: Date.now() }));
        break;
      default:
        // ignore
        break;
    }
  });

  ws.on('close', () => {
    clients.delete(id);
    broadcast({ t:'leave', id });
    console.log(`[-] client ${id} gone (total ${clients.size})`);
  });

  ws.on('error', (e) => { console.warn(`[!] client ${id} err`, e.message); });
});

// 心跳清理：30s 無訊息斷線
setInterval(() => {
  const now = Date.now();
  for (const [id, c] of clients){
    if (now - c.last > 30000){
      try { c.ws.close(); } catch(e){}
      clients.delete(id);
      broadcast({ t:'leave', id });
      console.log(`[~] client ${id} timeout`);
    }
  }
}, 10000);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[Evo WS] listening on :${PORT} (path /ws)`);
});
