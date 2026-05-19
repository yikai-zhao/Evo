// 終焉之地 — 客戶端網路模組 v1.2.0
// 與 server.js (relay) 對接：發送本地玩家狀態、接收其他玩家、PvP hit report
//
// 使用：
//   Net.connect();                    // 自動偵測 wss/ws
//   Net.update(player, dt);           // 每幀呼叫：節流發送 state
//   Net.sendHit(targetId, dmg, kind); // 命中遠端玩家
//   Net.sendChat(text);
//   Net.peers                         // Map<id, {x,y,hp,maxHp,rank,name,color,r,facing,path,species,lastT,hitT}>
//   Net.myId
//   Net.online                        // bool
//   Net.onHit = function(fromId, dmg, kind){...}
//   Net.onChat = function(fromId, text){...}

(function(){
  const Net = window.Net = {
    ws: null,
    online: false,
    myId: null,
    peers: new Map(),
    _sendT: 0,
    sendHz: 12,
    onHit: null,
    onChat: null,
    onWelcome: null,
    log: [],
    lastTry: 0,
    url: '',
  };

  function detectUrl(){
    // 同網域 (Codespace 對外 https → 自動 wss)，host 把 -8080 換成 -8081
    try{
      const loc = window.location;
      let host = loc.host;
      // GitHub Codespaces pattern: <name>-8080.app.github.dev → <name>-8081.app.github.dev
      host = host.replace(/-8080\./, '-8081.');
      // 本機 dev：localhost:8080 → localhost:8081
      host = host.replace(/:8080\b/, ':8081');
      const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${host}/ws`;
    }catch(e){ return 'ws://localhost:8081/ws'; }
  }

  Net.connect = function(){
    if (Net.ws && (Net.ws.readyState === 0 || Net.ws.readyState === 1)) return;
    const now = Date.now();
    if (now - Net.lastTry < 2000) return;
    Net.lastTry = now;
    Net.url = detectUrl();
    Net.log.push('[net] connecting '+Net.url);
    try{
      const ws = new WebSocket(Net.url);
      Net.ws = ws;
      ws.onopen = () => {
        Net.online = true;
        Net.log.push('[net] open');
      };
      ws.onmessage = (ev) => {
        let m; try{ m = JSON.parse(ev.data); }catch(e){ return; }
        handle(m);
      };
      ws.onclose = () => {
        Net.online = false;
        Net.log.push('[net] closed');
        Net.peers.clear();
      };
      ws.onerror = (e) => {
        Net.log.push('[net] error');
      };
    }catch(e){
      Net.log.push('[net] connect throw '+e.message);
    }
  };

  function handle(m){
    switch (m.t){
      case 'welcome':
        Net.myId = m.id;
        Net.log.push('[net] welcome id='+m.id+' peers='+(m.peers||[]).length);
        if (Net.onWelcome) Net.onWelcome(m);
        break;
      case 'state': {
        if (typeof m.from !== 'number') break;
        let p = Net.peers.get(m.from);
        if (!p){ p = {}; Net.peers.set(m.from, p); }
        // 平滑：保留前一位置做插值
        if (p.x !== undefined){ p.px = p.x; p.py = p.y; p.pt = performance.now(); }
        Object.assign(p, {
          x:m.x, y:m.y, hp:m.hp, maxHp:m.maxHp, rank:m.rank, name:m.name,
          color:m.color, r:m.r, facing:m.facing, path:m.path, species:m.species,
          sanity:m.sanity, alive: m.hp > 0,
        });
        p.lastT = performance.now();
        if (p.hitT === undefined) p.hitT = 0;
        break;
      }
      case 'hit':
        if (Net.onHit && typeof m.from === 'number') Net.onHit(m.from, m.dmg||0, m.kind||'melee');
        break;
      case 'chat':
        if (Net.onChat) Net.onChat(m.from, m.text);
        break;
      case 'leave':
        Net.peers.delete(m.id);
        break;
      case 'dead':
        if(Net.onPvpKill)Net.onPvpKill(m.from,m.killerName||('玩家#'+m.from),m.victimId,m.victimName||'玩家');
        break;
      case 'fx':
        // 之後可視覺化遠端玩家權柄釋放
        break;
      case 'pong':
        // RTT 量測待擴展
        break;
      case 'enemy_kill':
        if (Net.onEnemyKill) Net.onEnemyKill(m.nid);
        break;
    }
  }

  Net.update = function(player, dt){
    if (!Net.online || !Net.ws || Net.ws.readyState !== 1 || !player) return;
    Net._sendT -= dt;
    if (Net._sendT > 0) return;
    Net._sendT = 1 / Net.sendHz;
    try{
      Net._myName=(player.name||'').slice(0,16);
      Net.ws.send(JSON.stringify({
        t:'state',
        x: player.x|0, y: player.y|0,
        hp: player.hp|0, maxHp: player.maxHp|0,
        rank: player.rank|0,
        name: (player.name||'').slice(0,16),
        color: player.color,
        r: player.r|0,
        facing: +(player.facing||0).toFixed(2),
        path: player.path && player.path.name,
        species: player.species,
        sanity: player.sanity|0,
      }));
    }catch(e){}
    // GC peers (5s 未更新視為斷線)
    const now = performance.now();
    for (const [id, p] of Net.peers){
      if (now - (p.lastT||0) > 5000) Net.peers.delete(id);
    }
  };

  Net.sendHit = function(targetId, dmg, kind){
    if (!Net.online || !Net.ws || Net.ws.readyState !== 1) return;
    try{ Net.ws.send(JSON.stringify({ t:'hit', target: targetId, dmg: dmg|0, kind: kind||'melee' })); }catch(e){}
  };

  Net.sendChat = function(text){
    if (!Net.online || !Net.ws || Net.ws.readyState !== 1) return;
    try{ Net.ws.send(JSON.stringify({ t:'chat', text: String(text).slice(0,180) })); }catch(e){}
  };

  Net.sendDead=function(killerId,killerName){
    if(!Net.online||!Net.ws||Net.ws.readyState!==1)return;
    try{Net.ws.send(JSON.stringify({t:'dead',killerId,killerName:String(killerName||'').slice(0,16),victimName:(Net._myName||'').slice(0,16)}));}catch(e){}
  };
  Net.onPvpKill=null;
  Net.onEnemyKill=null;
  Net.sendEnemyKill=function(nid){
    if(!Net.online||!Net.ws||Net.ws.readyState!==1)return;
    try{Net.ws.send(JSON.stringify({t:'enemy_kill',nid}));}catch(e){}
  };
  Net.sendFx = function(kind, data){
    if (!Net.online || !Net.ws || Net.ws.readyState !== 1) return;
    try{ Net.ws.send(JSON.stringify(Object.assign({ t:'fx', kind }, data||{}))); }catch(e){}
  };
  setInterval(()=>{if(!Net.online&&Net.url)Net.connect();},4000);
})();
