import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { getModel } from './model-router';

/**
 * Create a raw Anthropic SDK client.
 */
export function createClaudeClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

interface ClaudeOptions {
  model?: string;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * Send a single prompt to Claude and return the text response.
 */
export async function askClaude(
  prompt: string,
  options: ClaudeOptions = {},
): Promise<string> {
  const client = createClaudeClient();
  const model = options.model ?? getModel('operational');
  const maxTokens = options.maxTokens ?? 2048;

  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    ...(options.systemPrompt ? { system: options.systemPrompt } : {}),
    messages: [{ role: 'user', content: prompt }],
  });

  const block = message.content[0];
  return block.type === 'text' ? block.text : '';
}

/**
 * Stream a Claude response. Returns the raw SDK stream.
 */
export function streamClaude(
  prompt: string,
  options: ClaudeOptions = {},
) {
  const client = createClaudeClient();
  const model = options.model ?? getModel('operational');
  const maxTokens = options.maxTokens ?? 2048;

  return client.messages.stream({
    model,
    max_tokens: maxTokens,
    ...(options.systemPrompt ? { system: options.systemPrompt } : {}),
    messages: [{ role: 'user', content: prompt }],
  });
}
