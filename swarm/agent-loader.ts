import * as fs from 'fs';
import * as path from 'path';

export function loadAgentPrompt(agentSlug: string): string {
  const agentPath = path.join(__dirname, 'agents', `${agentSlug}.md`);
  if (!fs.existsSync(agentPath)) {
    throw new Error(`Agent not found: ${agentSlug} (looked at ${agentPath})`);
  }
  return fs.readFileSync(agentPath, 'utf-8');
}

export function loadAgentFrontmatter(agentSlug: string): Record<string, string> {
  const content = loadAgentPrompt(agentSlug);
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const lines = match[1].split('\n');
  return Object.fromEntries(
    lines
      .filter(l => l.includes(':'))
      .map(l => {
        const [key, ...val] = l.split(':');
        return [key.trim(), val.join(':').trim()];
      })
  );
}
