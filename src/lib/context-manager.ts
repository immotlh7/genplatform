/**
 * Context Window Manager
 * Prevents context accumulation and ensures system never stops
 */

const MAX_HISTORY = 15;
const MAX_TOKENS = 200000;
const SOFT_RESET_THRESHOLD = 0.80; // 80%
const HARD_RESET_THRESHOLD = 0.90; // 90%

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function estimateTokens(messages: Message[]): number {
  return Math.ceil(JSON.stringify(messages).length / 4);
}

export function getContextUsagePercent(messages: Message[]): number {
  return (estimateTokens(messages) / MAX_TOKENS) * 100;
}

export function trimContext(messages: Message[]): Message[] {
  if (messages.length === 0) return messages;

  const usagePercent = getContextUsagePercent(messages);

  if (usagePercent > HARD_RESET_THRESHOLD * 100) {
    // Hard reset: keep system prompt + last 5 messages
    const systemMsg = messages.find(m => m.role === 'system');
    const recent = messages.filter(m => m.role !== 'system').slice(-5);
    console.log(`[CONTEXT] Hard reset: ${usagePercent.toFixed(1)}% → keeping system + 5 messages`);
    return systemMsg ? [systemMsg, ...recent] : recent;
  }

  if (usagePercent > SOFT_RESET_THRESHOLD * 100) {
    // Soft reset: keep system prompt + last 10 messages
    const systemMsg = messages.find(m => m.role === 'system');
    const recent = messages.filter(m => m.role !== 'system').slice(-10);
    console.log(`[CONTEXT] Soft reset: ${usagePercent.toFixed(1)}% → keeping system + 10 messages`);
    return systemMsg ? [systemMsg, ...recent] : recent;
  }

  if (messages.length > MAX_HISTORY) {
    // Normal trim: keep system prompt + last MAX_HISTORY messages
    const systemMsg = messages.find(m => m.role === 'system');
    const recent = messages.filter(m => m.role !== 'system').slice(-MAX_HISTORY);
    return systemMsg ? [systemMsg, ...recent] : recent;
  }

  return messages;
}

export function getContextStatus(messages: Message[]) {
  const used = estimateTokens(messages);
  const percent = Math.round((used / MAX_TOKENS) * 100);
  return {
    used,
    total: MAX_TOKENS,
    percent,
    usedK: Math.round(used / 1000),
    status: percent > 90 ? 'critical' : percent > 80 ? 'warning' : 'ok'
  };
}
