// ============================================================
//  DataBridge Server  –  server.js
//  Run:  node server.js
//  Requires: npm install express socket.io multer @ngrok/ngrok
// ============================================================

const express   = require('express');
const http      = require('http');
const { Server }= require('socket.io');
const multer    = require('multer');
const path      = require('path');
const fs        = require('fs');
const os        = require('os');

// ── Auto-create folders ──────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const PUBLIC_DIR  = path.join(__dirname, 'public');

[UPLOADS_DIR, PUBLIC_DIR].forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
    console.log('📁 Created folder:', d);
  }
});

// ── Verify public HTML files exist ───────────────────────────
const indexFile = path.join(PUBLIC_DIR, 'index.html');
const chatFile  = path.join(PUBLIC_DIR, 'chat.html');

if (!fs.existsSync(indexFile)) {
  console.error('❌ ERROR: public/index.html not found!');
  process.exit(1);
}
if (!fs.existsSync(chatFile)) {
  console.error('❌ ERROR: public/chat.html not found!');
  process.exit(1);
}

// ── App & server ─────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  maxHttpBufferSize: 1e10,
  pingTimeout:       120000,
  pingInterval:      25000
});

// ── Multer ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._\-]/g, '_');
    cb(null, safe);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 * 1024 } });

// ── Static routes ─────────────────────────────────────────────
app.use(express.static(PUBLIC_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

// ── State ────────────────────────────────────────────────────
const MAX_USERS = 5;
const users     = {};
const messages  = [];   // only PUBLIC messages stored here
let   publicURL = null;

// ── Helper ────────────────────────────────────────────────────
function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

function isPrivate(targets) {
  return targets && Array.isArray(targets) && !targets.includes('all');
}

// ── REST API ──────────────────────────────────────────────────
app.get('/api/info', (req, res) => {
  const ip = getLocalIP();
  res.json({
    lan:    `http://${ip}:${PORT}`,
    local:  `http://localhost:${PORT}`,
    public: publicURL || null
  });
});

app.get('/api/users', (req, res) => {
  res.json(Object.values(users));
});

app.post('/api/upload', upload.array('files'), (req, res) => {
  if (!req.files || !req.files.length) {
    return res.status(400).json({ error: 'No files received' });
  }
  res.json({
    files: req.files.map(f => ({
      originalName: f.originalname,
      filename:     f.filename,
      size:         f.size,
      url:          `/uploads/${f.filename}`
    }))
  });
});

// ── Socket.IO ─────────────────────────────────────────────────
io.on('connection', socket => {

  socket.on('join', ({ name }) => {
    if (Object.keys(users).length >= MAX_USERS) {
      socket.emit('join_error', 'Room is full (max 5 users)'); return;
    }
    if (Object.values(users).find(u => u.name.toLowerCase() === name.toLowerCase())) {
      socket.emit('join_error', 'Name already taken, choose another'); return;
    }
    users[socket.id] = { name, id: socket.id };
    // Only send public message history to joining user
    socket.emit('join_ok', { name, id: socket.id, history: messages });
    const evt = { type: 'system', text: `${name} joined`, time: Date.now() };
    messages.push(evt);
    io.emit('system_event', evt);
    io.emit('users_update', Object.values(users));
  });

  socket.on('message', ({ text, targets }) => {
    const user = users[socket.id]; if (!user) return;
    const msg = {
      id: `${socket.id}-${Date.now()}`, type: 'text',
      from: user.name, fromId: socket.id,
      text, targets, time: Date.now(), edited: false
    };
    // PRIVATE: do NOT store in shared history — only deliver to target(s) + sender
    if (!isPrivate(targets)) messages.push(msg);
    _deliver(msg, targets, socket);
  });

  socket.on('file_message', ({ files, targets }) => {
    const user = users[socket.id]; if (!user) return;
    const msg = {
      id: `${socket.id}-${Date.now()}`, type: 'file',
      from: user.name, fromId: socket.id,
      files, targets, time: Date.now()
    };
    if (!isPrivate(targets)) messages.push(msg);
    _deliver(msg, targets, socket);
  });

  socket.on('sticker', ({ url, targets }) => {
    const user = users[socket.id]; if (!user) return;
    const msg = {
      id: `${socket.id}-${Date.now()}`, type: 'sticker',
      from: user.name, fromId: socket.id,
      url, targets, time: Date.now()
    };
    if (!isPrivate(targets)) messages.push(msg);
    _deliver(msg, targets, socket);
  });

  socket.on('edit_message', ({ msgId, newText }) => {
    const user = users[socket.id]; if (!user) return;
    const msg = messages.find(m => m.id === msgId && m.fromId === socket.id);
    if (!msg || msg.type !== 'text') return;
    msg.text = newText; msg.edited = true;
    // edit_message only exists in public messages[] — broadcast to all is fine
    io.emit('message_edited', { msgId, newText });
  });

  socket.on('delete_message', ({ msgId }) => {
    const user = users[socket.id]; if (!user) return;
    const idx = messages.findIndex(m => m.id === msgId && m.fromId === socket.id);
    if (idx === -1) return;
    messages.splice(idx, 1);
    // delete_message only exists in public messages[] — broadcast to all is fine
    io.emit('message_deleted', { msgId });
  });

  socket.on('typing', () => {
    const user = users[socket.id];
    if (user) socket.broadcast.emit('user_typing', { name: user.name });
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      delete users[socket.id];
      const evt = { type: 'system', text: `${user.name} left`, time: Date.now() };
      messages.push(evt);
      io.emit('system_event', evt);
      io.emit('users_update', Object.values(users));
    }
  });
});

// ── Deliver helper ────────────────────────────────────────────
// PUBLIC  (targets = ['all'])  → send to everyone via io.emit
// PRIVATE (targets = [id,...]) → send ONLY to those socket IDs + sender
function _deliver(msg, targets, senderSocket) {
  if (!isPrivate(targets)) {
    io.emit('new_message', msg);
  } else {
    const ids = new Set([...targets, senderSocket.id]);
    ids.forEach(id => {
      const s = io.sockets.sockets.get(id);
      if (s) s.emit('new_message', msg);
    });
  }
}

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

server.listen(PORT, '0.0.0.0', async () => {
  const ip = getLocalIP();

  console.log('\n┌──────────────────────────────────────────────────┐');
  console.log('│         ⚡  DataBridge  –  Running!               │');
  console.log('├──────────────────────────────────────────────────┤');
  console.log(`│  💻 Local   ➜  http://localhost:${PORT}               │`);
  console.log(`│  📡 LAN     ➜  http://${ip}:${PORT}          │`);
  console.log('│  🌐 Public  ➜  Starting ngrok...                  │');
  console.log('└──────────────────────────────────────────────────┘');

  try {
    const ngrok = require('@ngrok/ngrok');
    const NGROK_AUTHTOKEN = 'PASTE_YOUR_NGROK_AUTHTOKEN_HERE';
    const listener = await ngrok.forward({ addr: PORT, authtoken: NGROK_AUTHTOKEN });
    publicURL = listener.url();

    console.log('\n┌──────────────────────────────────────────────────┐');
    console.log('│  🌍 PUBLIC URL — Share with ANYONE, ANYWHERE!     │');
    console.log('│                                                  │');
    console.log(`│  👉  ${publicURL}`);
    console.log('│                                                  │');
    console.log('│  ✅ This URL works even from other cities!        │');
    console.log('└──────────────────────────────────────────────────┘\n');

  } catch (e) {
    console.log('\n⚠️  ngrok failed. Run manually: ngrok http ' + PORT + '\n');
  }
});
