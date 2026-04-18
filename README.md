# ⚡ DataBridge — IP-Based Data Transfer & Chat

> **Connect any device. Share anything. No limits.**
> Real-time chat and file transfer (0 KB → 50 GB) over IP — works across different networks using ngrok. No Bluetooth, no USB, no same-WiFi requirement. Just an IP and a name.

---

## ✨ Features

🌐 **IP-Based Connection**
- Connect devices from **different cities, different networks**
- Works via LAN (same network) or **internet via ngrok**
- No pairing, no Bluetooth, no USB — just share the URL

💬 **Real-Time Chat**
- Instant messaging between up to **5 users**
- Join/Leave notifications with **timestamp**
- **Edit** and **Delete** your own messages
- **Private messages** — visible only to selected users 🔒
- Typing indicator

📁 **File Transfer (0 KB → 50 GB)**
- Send **any file type** — videos, photos, APKs, ZIPs, documents
- Select **multiple files** in a single click
- Real-time **progress bar** (1%... 23%... 89%... 100%)
- Files appear as **clickable links** — opens in new tab to stream or download
- Send to **specific users** or **everyone** at once
- Up to **5 simultaneous senders and receivers**

🎨 **Stickers**
- 15 built-in emoji stickers
- Send to everyone or privately

👥 **User Management**
- Max **5 users** per session
- Live user chips shown at top
- Capacity dots on login page

---

## 📂 Project Structure

```
IP-Based-Data-Transfer-Chat/
│
├── [FOLDER] ngrok-v3-stable-windows-amd64/
│   ├── ngrok-v3-stable-windows-amd64.zip   ← ngrok installer zip (Windows)
│   └── ngrok.exe                           ← ngrok executable (Windows)
│
├── [FOLDER] node_modules/          ← Auto-installed dependencies
├── [FILE]   package-lock.json      ← Dependency lock file
├── [FILE]   package.json           ← Project config & scripts
├── [FOLDER] public/                ← Frontend pages
│   ├── index.html                  ← Login page (shows IP, name entry)
│   └── chat.html                   ← Chat + file transfer UI
├── [FILE]   run.bat                ← One-click launcher (Windows)
├── [FILE]   server.js              ← Main backend (Express + Socket.IO)
└── [FOLDER] uploads/               ← Auto-created; stores transferred files
```

> The `uploads/` folder and all required directories are **auto-created** when the server starts.

---

## ⚙️ Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/rsamwilson2323-cloud/IP-Based-Data-Transfer-Chat.git
cd IP-Based-Data-Transfer-Chat
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Start the Server

```bash
node server.js
```

**Windows users** — just double-click `run.bat` ✅

---

## 📦 Requirements

```
Node.js       v16 or above
express       ^4.18.2
socket.io     ^4.7.2
multer        ^1.4.5-lts.1
@ngrok/ngrok  ^1.4.0
```

Install all at once:
```bash
npm install
```

---

## 🌐 ngrok — Public Internet Access

The `ngrok-v3-stable-windows-amd64` folder contains everything needed for internet access across different networks.

| File | Purpose |
|---|---|
| `ngrok-v3-stable-windows-amd64.zip` | Full ngrok v3 installer package for Windows |
| `ngrok.exe` | Ready-to-use ngrok executable (no install needed) |

> **ngrok is auto-started by the server** — no manual terminal command needed.
> The public URL is printed automatically in the terminal on startup:

```
┌──────────────────────────────────────────────────┐
│  🌍 PUBLIC URL — Share with ANYONE, ANYWHERE!     │
│                                                  │
│  👉  https://abc123.ngrok-free.app               │
│                                                  │
│  ✅ This URL works even from other cities!        │
└──────────────────────────────────────────────────┘
```

Share this link with anyone — they can join from **Coimbatore, Tirunelveli, or anywhere in the world.**

---

## ▶️ Usage

### Local Network (Same WiFi)

1. Run `node server.js` or double-click `run.bat`
2. Terminal prints your **LAN IP**, e.g. `http://192.168.1.5:4000`
3. Share that URL with anyone on the same network
4. They open it in any browser → enter a name → done ✅

### Internet Access (Different Networks / Cities)

The server auto-starts **ngrok** on launch and prints a public URL — share it with anyone in the world instantly.

---

## 🖥️ How It Works

```
Device A                  Server (Node.js)               Device B
   │                           │                             │
   │──── join(name) ──────────▶│                             │
   │                           │◀──── join(name) ────────────│
   │                           │                             │
   │──── send file ───────────▶│ (multer saves to uploads/)  │
   │◀─── progress % ───────────│────── file link ───────────▶│
   │                           │                             │
   │──── private msg ─────────▶│──── only to target ────────▶│
   │                           │   (others never receive it) │
```

**Socket.IO** handles all real-time events.
**Multer** streams large files directly to disk — no memory limit.
**ngrok** creates a secure public tunnel for cross-network access.

---

## 🧠 Key Technical Details

| Feature | Implementation |
|---|---|
| Real-time messaging | Socket.IO WebSocket |
| File upload | Multer (disk storage, 50 GB limit) |
| File delivery | Static file server → link in chat |
| Progress tracking | XHR `upload.progress` event |
| Private messages | Socket-ID targeted delivery only |
| Public tunnel | ngrok `@ngrok/ngrok` SDK (auto-start) |
| Max users | Server-enforced at 5 |

---

## 🔒 Private Messaging

When you send a private message or file:
- Only the **selected recipient(s)** receive it
- The **sender** sees it with a 🔒 badge
- **No other user** can see it — not even in chat history
- Private messages are **never stored** in the server history

---

## ⚠️ Important Notes

- Files are accessible **while the server is running**
- When the server stops, file links become inactive (by design — no permanent storage)
- Supports **phones, laptops, tablets** — any modern browser
- All data transfers happen **through your server** as the bridge

---

## 🚀 Future Improvements

🔊 Sound alerts for new messages
📊 Transfer speed display (MB/s)
🗂️ File history / download log
🔐 Room password protection
📱 PWA / mobile app version
🧠 AI-based content moderation
📡 Peer-to-peer WebRTC mode

---

## ⚠️ Disclaimer

This project is intended for **educational and personal use only**.
It is not intended to replace enterprise-grade file transfer solutions.
The developer is not responsible for misuse of the application.

---

## 👨‍💻 Author

**Sam Wilson**

🌐 GitHub — [rsamwilson2323-cloud](https://github.com/rsamwilson2323-cloud)
💼 LinkedIn — [sam-wilson-14b554385](https://www.linkedin.com/in/sam-wilson-14b554385)

---

## 📜 License

This project is licensed under the **MIT License**.

---

<div align="center">
  <b>⚡ DataBridge — Because distance shouldn't limit data.</b>
</div>
