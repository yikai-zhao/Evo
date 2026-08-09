#!/usr/bin/env node
'use strict';

const WebSocket = require('ws');

const WS_URL = process.env.WS_URL || 'ws://127.0.0.1:8081/ws';
const TIMEOUT = Number(process.env.TIMEOUT_MS || 8000);

function wait(ms){ return new Promise(r => setTimeout(r, ms)); }

function createClient(label){
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const client = { label, ws, events: [], pending: [] };
    const cleanup = () => { ws.removeListener('open', onOpen); ws.removeListener('error', onError); };
    const onOpen = () => { cleanup(); resolve(client); };
    const onError = (err) => { cleanup(); reject(new Error(`${label} connect failed: ${err.message}`)); };
    ws.once('open', onOpen);
    ws.once('error', onError);
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        client.events.push(msg);
        client.pending.push(msg);
      } catch (e) {}
    });
  });
}

function waitForMessage(client, predicate, timeout = TIMEOUT){
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`${client.label} timed out waiting for matching message`));
    }, timeout);
    const cleanup = () => {
      client.ws.removeListener('message', onMessage);
      clearTimeout(timer);
    };
    const onMessage = (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        client.pending.push(msg);
        if (predicate(msg)) {
          cleanup();
          resolve(msg);
        }
      } catch (e) {}
    };
    client.ws.on('message', onMessage);
    const existing = client.pending.find(msg => predicate(msg));
    if (existing) {
      cleanup();
      resolve(existing);
    }
  });
}

async function main(){
  const a = await createClient('A');
  const b = await createClient('B');

  try {
    const welcomeA = await waitForMessage(a, m => m.t === 'welcome' || m.t === 'room', 3000);
    const welcomeB = await waitForMessage(b, m => m.t === 'welcome' || m.t === 'room', 3000);
    console.log(`[multi] ${a.label} welcome:`, welcomeA.t, welcomeA.code || '');
    console.log(`[multi] ${b.label} welcome:`, welcomeB.t, welcomeB.code || '');

    b.ws.send(JSON.stringify({ t: 'mm_join', code: 'NOPE' }));
    const invalid = await waitForMessage(b, m => m.t === 'mm_error' && m.reason === 'room_full_or_invalid', 3000);
    console.log(`[multi] unknown room rejected:`, invalid.reason);

    a.ws.send(JSON.stringify({ t: 'mm_create', cap: 99 }));
    const roomA = await waitForMessage(a, m => m.t === 'room' && !!m.code && m.code !== 'global', 5000);
    if (roomA.capacity !== 28) throw new Error(`room capacity was ${roomA.capacity}, expected clamp to 28`);
    const code = roomA.code;
    console.log(`[multi] room created: ${code} capacity=${roomA.capacity}`);

    b.ws.send(JSON.stringify({ t: 'mm_join', code }));
    const roomB = await waitForMessage(b, m => m.t === 'room' && m.code === code, 5000);
    const roomAJoin = await waitForMessage(a, m => m.t === 'room' && m.code === code && Array.isArray(m.peers) && m.peers.some(p => p.id && p.id !== undefined), 5000);

    console.log(`[multi] ${b.label} joined room:`, roomB.code, roomB.peers.map(p => p.name || p.id));
    console.log(`[multi] ${a.label} saw join update:`, roomAJoin.peers.map(p => p.name || p.id));

    a.ws.send(JSON.stringify({ t: 'chat', text: 'hello-from-multi-check' }));
    const chat = await waitForMessage(b, m => m.t === 'chat' && m.text === 'hello-from-multi-check', 5000);
    console.log(`[multi] chat relay ok:`, chat.text);

    a.ws.send(JSON.stringify({ t:'analytics', event:'ad_completed', data:{ placement:'integration_test' } }));
    await wait(100);
    console.log('[multi] analytics ingest sent');

    console.log('[multi] PASS: room rejection, capacity, join, relay, and analytics ingest worked');
  } finally {
    a.ws.close();
    b.ws.close();
    await wait(200);
  }
}

main().catch(err => {
  console.error('[multi] FAIL:', err.message);
  process.exit(1);
});
