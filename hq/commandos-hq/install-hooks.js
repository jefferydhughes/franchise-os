#!/usr/bin/env node
// ─── OPERATIVE HQ — Hook Installer ──────────────────────────────────────────
// Installs Claude Code hooks into ~/.claude/settings.json
// These hooks fire HTTP events to the Operative HQ server on port 2469
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');
const os = require('os');

const SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');
const HQ_URL = 'http://localhost:2469/hook';

const HOOKS = {
  PreToolUse: [
    {
      matcher: "",
      hooks: [
        {
          type: "command",
          command: `curl -s -X POST ${HQ_URL} -H 'Content-Type: application/json' -d '{"event":"PreToolUse","session":"'$CLAUDE_SESSION_ID'","tool":"'$TOOL_NAME'"}'`
        }
      ]
    }
  ],
  PostToolUse: [
    {
      matcher: "",
      hooks: [
        {
          type: "command",
          command: `curl -s -X POST ${HQ_URL} -H 'Content-Type: application/json' -d '{"event":"PostToolUse","session":"'$CLAUDE_SESSION_ID'","tool":"'$TOOL_NAME'"}'`
        }
      ]
    }
  ],
  Stop: [
    {
      matcher: "",
      hooks: [
        {
          type: "command",
          command: `curl -s -X POST ${HQ_URL} -H 'Content-Type: application/json' -d '{"event":"Stop","session":"'$CLAUDE_SESSION_ID'"}'`
        }
      ]
    }
  ],
  Notification: [
    {
      matcher: "",
      hooks: [
        {
          type: "command",
          command: `curl -s -X POST ${HQ_URL} -H 'Content-Type: application/json' -d '{"event":"Notification","session":"'$CLAUDE_SESSION_ID'","message":"notification"}'`
        }
      ]
    }
  ]
};

function install() {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║    ☠  OPERATIVE HQ — Hook Installer  ☠         ║
  ╚══════════════════════════════════════════════════╝
  `);

  // Ensure .claude directory exists
  const claudeDir = path.dirname(SETTINGS_PATH);
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
    console.log(`  Created: ${claudeDir}`);
  }

  // Read existing settings
  let settings = {};
  if (fs.existsSync(SETTINGS_PATH)) {
    try {
      const raw = fs.readFileSync(SETTINGS_PATH, 'utf8');
      settings = JSON.parse(raw);
      console.log(`  Found existing settings at: ${SETTINGS_PATH}`);
    } catch (e) {
      console.log(`  Warning: Could not parse existing settings. Creating fresh.`);
    }
  } else {
    console.log(`  No existing settings found. Creating new.`);
  }

  // Backup
  if (fs.existsSync(SETTINGS_PATH)) {
    const backupPath = SETTINGS_PATH + '.backup.' + Date.now();
    fs.copyFileSync(SETTINGS_PATH, backupPath);
    console.log(`  Backup saved: ${backupPath}`);
  }

  // Merge hooks
  if (!settings.hooks) settings.hooks = {};

  for (const [event, hookArray] of Object.entries(HOOKS)) {
    if (!settings.hooks[event]) {
      settings.hooks[event] = hookArray;
      console.log(`  + Added hook: ${event}`);
    } else {
      // Check if our hook already exists
      const existing = settings.hooks[event].find(h =>
        h.hooks && h.hooks.some(hh => hh.command && hh.command.includes('localhost:2469'))
      );
      if (existing) {
        console.log(`  = Hook already installed: ${event}`);
      } else {
        settings.hooks[event].push(...hookArray);
        console.log(`  + Appended hook: ${event}`);
      }
    }
  }

  // Write
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
  console.log(`
  ✅ Hooks installed successfully!

  Settings: ${SETTINGS_PATH}
  Target:   ${HQ_URL}

  Start the server:  npm start
  Open dashboard:    http://localhost:2469
  `);
}

function uninstall() {
  console.log('  Removing Operative HQ hooks...');

  if (!fs.existsSync(SETTINGS_PATH)) {
    console.log('  No settings file found. Nothing to remove.');
    return;
  }

  let settings;
  try {
    settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  } catch (e) {
    console.log('  Error reading settings.');
    return;
  }

  if (!settings.hooks) {
    console.log('  No hooks found.');
    return;
  }

  for (const event of Object.keys(settings.hooks)) {
    settings.hooks[event] = settings.hooks[event].filter(h =>
      !(h.hooks && h.hooks.some(hh => hh.command && hh.command.includes('localhost:2469')))
    );
    if (settings.hooks[event].length === 0) {
      delete settings.hooks[event];
    }
  }

  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
  console.log('  ✅ Hooks removed.');
}

// CLI
const cmd = process.argv[2];
if (cmd === 'uninstall' || cmd === '--uninstall') {
  uninstall();
} else {
  install();
}
