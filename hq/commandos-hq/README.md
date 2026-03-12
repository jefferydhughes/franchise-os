# ☠ OPERATIVE HQ — Agent Command & Control

Commandos: Behind Enemy Lines-themed dashboard for monitoring Claude Code agents in real-time.

## Quick Start

```bash
cd commandos-hq
npm install
npm start
```

Open **http://localhost:2469** in your browser.

## Install Claude Code Hooks

```bash
npm run install-hooks
```

This adds hooks to `~/.claude/settings.json` that fire HTTP events to the dashboard whenever Claude Code uses a tool, completes a task, or needs input.

## How It Works

1. **Claude Code hooks** fire `curl` requests to `localhost:2469/hook` on every tool use
2. **Express server** receives events, tracks agent state, broadcasts via WebSocket
3. **Dashboard** renders agents as commando units on a tactical map in real-time

## Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/` | GET | Dashboard UI |
| `/hook` | POST | Receive Claude Code hook events |
| `/state` | GET | Current state (JSON) |
| `/health` | GET | Server health check |
| `/spawn` | POST | Manually create an agent |
| `/abort` | POST | Terminate an agent session |

## Hook Events

| Event | Trigger | Effect |
|---|---|---|
| `PreToolUse` | Agent starts using a tool | Unit status → BUSY |
| `PostToolUse` | Agent completes a tool | Unit status → ACTIVE, progress advances |
| `Stop` | Agent session ends | Unit status → IDLE |
| `Notification` | Agent needs input | Unit status → WAITING |

## Keyboard Shortcuts

| Key | Action |
|---|---|
| Q | Spawn agent |
| W | Send order |
| V | Toggle fog of war |
| P | Pause selected unit |
| R | Resume selected unit |
| M | Add mission |
| X | Abort selected unit |
| D | Toggle demo mode |
| Shift+E | Extract all |

## Demo Mode

Press **D** or click the **DEMO** button to populate the dashboard with simulated agents. Useful for showcasing without running Claude Code.

## Uninstall Hooks

```bash
node install-hooks.js uninstall
```
