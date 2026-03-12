# OPERATIVE HQ — Build Plan & Asset Guide

## What Was Built
A Commandos: Behind Enemy Lines-inspired agent command dashboard.
Each Claude Code agent = a commando unit on a tactical map.
Fully interactive: select units, send orders, spawn agents, toggle fog of war.

inspired by https://www.getagentcraft.com/docs
---

## Phase 2: Live Data — Server Hook Layer

AgentCraft works by installing hooks into Claude Code's settings.json that fire
HTTP events to a local server. You replicate the same pattern.

### Hook Installation

Claude Code supports hooks in `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [{
          "type": "command",
          "command": "curl -s -X POST http://localhost:2469/hook -H 'Content-Type: application/json' -d '{\"event\":\"tool_start\",\"tool\":\"$TOOL_NAME\",\"session\":\"$SESSION_ID\"}'"
        }]
      }
    ],
    "PostToolUse": [...],
    "Stop": [...]
  }
}
```

### Events to Capture

| Event | Hook | Payload |
|---|---|---|
| Agent starts | `PreToolUse` | session_id, tool, input |
| Agent completes tool | `PostToolUse` | session_id, tool, output |
| Agent finishes | `Stop` | session_id, summary |
| Agent needs input | `Notification` | session_id, message |

### Node.js Server (port 2469)

```bash
npm init -y
npm install express cors ws
```

```javascript
// server.js
const express = require('express');
const { WebSocketServer } = require('ws');
const app = express();
app.use(express.json());
app.use(require('cors')());

const sessions = {}; // session_id → unit state
const wss = new WebSocketServer({ port: 2470 });

app.post('/hook', (req, res) => {
  const { event, session, tool } = req.body;
  if (!sessions[session]) {
    sessions[session] = {
      id: session,
      status: 'active',
      task: tool,
      progress: 0,
      tokens: 0,
    };
  }
  // Update state
  if (event === 'tool_start') sessions[session].task = tool;
  if (event === 'stop') sessions[session].status = 'idle';
  // Broadcast to all dashboard clients
  broadcast({ type: 'update', sessions });
  res.json({ ok: true });
});

app.get('/state', (req, res) => res.json(sessions));

function broadcast(data) {
  wss.clients.forEach(c => {
    if (c.readyState === 1) c.send(JSON.stringify(data));
  });
}

app.listen(2469, () => console.log('Operative HQ server on :2469'));
```

### Dashboard WebSocket Connection

Add to dashboard HTML:

```javascript
const ws = new WebSocket('ws://localhost:2470');
ws.onmessage = (e) => {
  const { sessions } = JSON.parse(e.data);
  // Map sessions to UNITS array and re-render
  Object.values(sessions).forEach(s => {
    const unit = UNITS.find(u => u.id === s.id);
    if (unit) { unit.task = s.task; unit.status = s.status; }
    else UNITS.push(mapSessionToUnit(s));
  });
  renderRoster();
  renderTokens();
};
```

---

## Phase 3: Packaging

### Option A — Electron Desktop App
```bash
npm install -g electron
# Wrap server + dashboard in Electron
# Menubar icon, auto-starts with system
```

### Option B — Tauri (Rust, smaller binary)
```bash
cargo install tauri-cli
# ~4MB vs Electron's ~100MB
```

### Option C — Browser PWA (simplest)
- Serve dashboard as static file from Express
- Open `http://localhost:2469` in browser
- Add to Dock/Taskbar as PWA

---

## Asset Guide: Commandos-Style Art (Legal)

### Free Approaches

**1. Pixel art sprites (best)**
- **Itch.io** — search "top-down commando sprite" — many CC0/CC-BY packs
  - "Military Top Down" by Kenney (kenney.nl) — public domain, professional quality
  - Kenney's "Tiny Dungeon", "Tiny Battles" packs have soldier sprites
- **OpenGameArt.org** — filter by CC0 for commercial-safe assets
- **Craftpix.net** — free section has top-down military packs

**2. Kenney Assets (top recommendation)**
- kenney.nl/assets — everything is CC0 (public domain)
- "Topdown Tanks", "Tiny Dungeon", "Topdown Shooter" packs
- Consistent pixel art style, Commandos-adjacent aesthetic
- Free for commercial use, no attribution required

**3. Generate your own**
- Midjourney/DALL-E prompt: "16x16 pixel art top-down isometric soldier sprite sheet, olive drab uniform, 1990s SNES style, transparent background"
- DALL-E 3 can produce usable sprite sheets for prototype
- For production: commission on Fiverr (~$50-150 for a full sprite sheet)

### Commissioned Art Path
- **Fiverr**: search "pixel art game character sprite"
  - 6 commando archetypes (Green Beret, Sniper, Sapper, Spy, Driver, Marine)
  - Budget: ~$200-400 for full set with animations
- **Brief to give artist**: "Top-down view, 32x32 or 48x48 pixels, olive/khaki military palette,
  WWII-era Commandos game style (Pyro Studios, 1998). 6 character types with idle and walk animations."

### Map / Terrain Assets
- **Tiled Map Editor** (mapeditor.org) — free, exports JSON
- Kenney "Topdown Shooter" tileset — includes terrain, buildings, roads
- Load Tiled maps into dashboard via canvas rendering

---

## Approaching AgentCraft / Open Source Collaboration

The AgentCraft repo is open source (GitHub: idosal/agentcraft).
Options to engage:

1. **Fork and theme** — legal, straightforward. Fork the repo, replace the fantasy
   RTS theme with the Commandos theme. Submit as a community skin/theme PR.

2. **Open a GitHub issue** — "Commandos theme / custom skin support?"
   AgentCraft already has Race Skins (Orc, Human, Elf, Undead) —
   they clearly support themeing. Propose a skin system contribution.

3. **Discord outreach** — discord.gg/nEaZAH7C7F — reach @idosal1 directly.
   Offer the Commandos theme as a contribution.

4. **Build standalone** — what we built here — a fully custom dashboard
   using the same hook pattern. No dependency on AgentCraft.

**Recommended path:** Build standalone (done) → polish with real assets →
open a conversation with @idosal1 on X/Discord about collaboration.
The author is clearly receptive (actively building community features).

---

## Roadmap

| Phase | Deliverable | Effort |
|---|---|---|
| ✅ 1 | Static dashboard UI (Commandos aesthetic) | Done |
| 2 | Node.js hook server + WebSocket live data | 1 day |
| 3 | Replace SVG sprites with Kenney pixel art | 2 hours |
| 4 | Tiled map integration (real terrain) | 1 day |
| 5 | Electron/Tauri packaging | 1 day |
| 6 | Mobile PWA with push notifications | 2 days |
| 7 | Multi-project support (P1/P2/P3 as sectors) | 1 day |
