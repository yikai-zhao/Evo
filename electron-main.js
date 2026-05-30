/**
 * electron-main.js — Steam / desktop route (v3.13.0)
 * Usage:  npm run start:electron
 * Build:  npm run build:electron  (requires npm i electron electron-builder)
 */
'use strict';

const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const fs   = require('fs');

// ──────────────────────────────────────────────
// Embedded dev-server (serves index.html + assets without CORS issues)
// ──────────────────────────────────────────────
const PORT = 49742; // arbitrary high port; not exposed externally

let server;
function startLocalServer() {
  const root = __dirname;
  server = http.createServer((req, res) => {
    // Basic path traversal guard
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') urlPath = '/index.html';
    const safe = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(root, safe);

    if (!filePath.startsWith(root)) {
      res.writeHead(403); res.end(); return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      const ext = path.extname(filePath).toLowerCase();
      const mime = {
        '.html': 'text/html', '.js': 'application/javascript',
        '.css': 'text/css',   '.png': 'image/png',
        '.jpg': 'image/jpeg', '.gif': 'image/gif',
        '.json': 'application/json', '.woff2': 'font/woff2',
      }[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      res.end(data);
    });
  });
  server.listen(PORT, '127.0.0.1');
}

// ──────────────────────────────────────────────
// Window creation
// ──────────────────────────────────────────────
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:  1280,
    height: 720,
    minWidth:  960,
    minHeight: 540,
    title: 'Evo — Twilight of the Gods',
    backgroundColor: '#0a0a12',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      // No preload needed — game runs entirely in renderer via canvas
    },
  });

  // Load via local HTTP to avoid file:// CORS & Web-Worker restrictions
  mainWindow.loadURL(`http://127.0.0.1:${PORT}/index.html?platform=steam`);

  // Open DevTools only in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Open external links (e.g. social buttons) in OS browser, not Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ──────────────────────────────────────────────
// App lifecycle
// ──────────────────────────────────────────────
app.on('ready', () => {
  startLocalServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (server) server.close();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// IPC: allow renderer to request fullscreen toggle
ipcMain.on('toggle-fullscreen', () => {
  if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen());
});
