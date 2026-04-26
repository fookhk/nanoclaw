/**
 * Ollama Pre-Router for NanoClaw
 *
 * Classifies inbound messages as BASIC or COMPLEX using a local Ollama model.
 * BASIC messages are answered directly by Ollama, skipping the Claude container.
 * COMPLEX messages (or any Ollama failure) return null so the caller falls through
 * to the normal container path — this function never breaks existing behaviour.
 */

import { OLLAMA_ROUTER_MODEL, OLLAMA_URL } from './config.js';
import { log } from './log.js';

const TIMEOUT_MS = 10_000;

async function ollamaGenerate(prompt: string, system?: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const body: Record<string, unknown> = {
      model: OLLAMA_ROUTER_MODEL,
      prompt,
      stream: false,
    };
    if (system) body.system = system;

    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      log.debug('Ollama router: non-OK response', { status: res.status });
      return null;
    }

    const data = (await res.json()) as { response?: string };
    return data.response ?? null;
  } catch (err) {
    log.debug('Ollama router: request failed', { err });
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Attempt to handle a message locally via Ollama.
 *
 * @param userMessage - The raw text of the last user message.
 * @returns The Ollama response string if the message is BASIC, or null if it
 *          is COMPLEX or Ollama is unavailable (caller should use Claude container).
 */
export async function routeWithOllama(userMessage: string): Promise<string | null> {
  // Step 1: classify
  const classificationPrompt =
    `Classify this message as "BASIC" or "COMPLEX".\n` +
    `BASIC: Greetings, simple questions, general knowledge, short factual answers, ` +
    `calculations, weather, definitions, translations.\n` +
    `COMPLEX: Coding, debugging, long-form writing, reasoning over files or tools, ` +
    `system commands, home server queries, or anything needing external data.\n` +
    `Message: "${userMessage}"\n` +
    `Answer with ONLY the single word BASIC or COMPLEX.`;

  const classification = await ollamaGenerate(classificationPrompt);
  if (!classification) return null;

  const isBasic = classification.trim().toUpperCase().startsWith('BASIC');
  if (!isBasic) {
    log.debug('Ollama router: COMPLEX → container', { classification: classification.trim() });
    return null;
  }

  log.debug('Ollama router: BASIC → local response');

  // Step 2: answer
  const response = await ollamaGenerate(userMessage);
  if (!response) return null;

  return response.trim();
}
