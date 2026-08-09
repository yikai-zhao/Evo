#!/usr/bin/env node
'use strict';

const WebSocket = require('ws');

const WS_URL = process.env.WS_URL || 'ws://127.0.0.1:8080/ws';
const CLIENT_COUNT = Number(process.env.CLIENT_COUNT || 28);
const LOAD_SECONDS = Number(process.env.LOAD_SECONDS || 5);
const SEND_HZ = Number(process.env.SEND_HZ || 5);
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 10000);
const MIN_DELIVERY_RATE = Number(process.env.MIN_DELIVERY_RATE || 0.9);
const MAX_P95_MS = Number(process.env.MAX_P95_MS || 500);

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

function connect(label){
	return new Promise((resolve, reject) => {
		const ws = new WebSocket(WS_URL);
		const client = { label, ws, events:[], stateCount:0, latencies:[] };
		const timer = setTimeout(() => reject(new Error(`${label} connection timeout`)), TIMEOUT_MS);
		ws.on('message', raw => {
			try {
				const msg = JSON.parse(raw.toString());
				client.events.push(msg);
				if (msg.t === 'state' && msg.loadTest) client.stateCount++;
				if (msg.t === 'pong' && typeof msg.echo === 'number') client.latencies.push(Date.now() - msg.echo);
			} catch (e) {}
		});
		ws.once('open', () => { clearTimeout(timer); resolve(client); });
		ws.once('error', error => { clearTimeout(timer); reject(new Error(`${label} connection failed: ${error.message}`)); });
	});
}

async function waitFor(client, predicate, timeout = TIMEOUT_MS){
	const started = Date.now();
	while (Date.now() - started < timeout){
		const index = client.events.findIndex(predicate);
		if (index >= 0) return client.events.splice(index, 1)[0];
		await wait(20);
	}
	throw new Error(`${client.label} timed out waiting for message`);
}

function percentile(values, ratio){
	const sorted = values.slice().sort((a, b) => a - b);
	return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))] || Infinity;
}

async function main(){
	assert(CLIENT_COUNT === 28, 'commercial load gate must run with exactly 28 clients');
	const clients = await Promise.all(Array.from({ length:CLIENT_COUNT }, (_, index) => connect(`C${index + 1}`)));
	try {
		await Promise.all(clients.map(client => waitFor(client, msg => msg.t === 'welcome', 3000)));

		const owner = clients[0];
		owner.ws.send(JSON.stringify({ t:'mm_create', cap:CLIENT_COUNT }));
		const created = await waitFor(owner, msg => msg.t === 'room' && msg.code !== 'global');
		const roomCode = created.code;
		await Promise.all(clients.slice(1).map(async client => {
			client.ws.send(JSON.stringify({ t:'mm_join', code:roomCode }));
			await waitFor(client, msg => msg.t === 'room' && msg.code === roomCode);
		}));
		await waitFor(owner, msg => msg.t === 'room' && msg.code === roomCode && msg.peers?.length === CLIENT_COUNT - 1);
		console.log(`[load] room ${roomCode} filled: ${CLIENT_COUNT}/${created.capacity}`);

		clients.forEach(client => { client.stateCount = 0; client.events.length = 0; });
		const ticks = LOAD_SECONDS * SEND_HZ;
		for (let seq = 0; seq < ticks; seq++){
			for (let index = 0; index < clients.length; index++){
				clients[index].ws.send(JSON.stringify({
					t:'state', loadTest:true, seq, name:`Load${index + 1}`,
					x:index * 10, y:seq * 10, hp:100, rank:1, qi:seq,
				}));
			}
			await wait(1000 / SEND_HZ);
		}
		await wait(500);
		const expectedPerClient = (CLIENT_COUNT - 1) * ticks;
		const deliveryRates = clients.map(client => client.stateCount / expectedPerClient);
		const minimumDelivery = Math.min(...deliveryRates);
		assert(minimumDelivery >= MIN_DELIVERY_RATE, `state delivery ${(minimumDelivery * 100).toFixed(1)}% below ${(MIN_DELIVERY_RATE * 100).toFixed(0)}%`);
		console.log(`[load] state delivery min ${(minimumDelivery * 100).toFixed(1)}% (${expectedPerClient} expected/client)`);

		for (let round = 0; round < 3; round++){
			const sentAt = Date.now();
			clients.forEach(client => client.ws.send(JSON.stringify({ t:'ping', echo:sentAt })));
			await wait(150);
		}
		const latencies = clients.flatMap(client => client.latencies);
		assert(latencies.length === CLIENT_COUNT * 3, `received ${latencies.length}/${CLIENT_COUNT * 3} pong replies`);
		const p95 = percentile(latencies, 0.95);
		assert(p95 <= MAX_P95_MS, `ping p95 ${p95}ms exceeds ${MAX_P95_MS}ms`);
		console.log(`[load] ping p95 ${p95}ms across ${latencies.length} samples`);

		const departed = clients.pop();
		departed.ws.close();
		await waitFor(owner, msg => msg.t === 'room' && msg.code === roomCode && msg.peers?.length === CLIENT_COUNT - 2);
		const replacement = await connect('C28-reconnect');
		clients.push(replacement);
		await waitFor(replacement, msg => msg.t === 'welcome', 3000);
		replacement.ws.send(JSON.stringify({ t:'mm_join', code:roomCode }));
		await waitFor(replacement, msg => msg.t === 'room' && msg.code === roomCode);
		await waitFor(owner, msg => msg.t === 'room' && msg.code === roomCode && msg.peers?.length === CLIENT_COUNT - 1);
		console.log('[load] disconnect and replacement reconnect passed');
		console.log('[load] PASS');
	} finally {
		clients.forEach(client => { try { client.ws.close(); } catch (e) {} });
		await wait(200);
	}
}

main().catch(error => {
	console.error('[load] FAIL:', error.message);
	process.exit(1);
});
