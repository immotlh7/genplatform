/**
 * Account Rotation Manager
 * Seamlessly rotates between Claude API keys on rate limit
 */

interface Account {
  id: string;
  apiKey: string;
  status: 'active' | 'limited' | 'degraded';
  lastUsed: number;
  limitedUntil?: number;
}

const ACCOUNTS: Account[] = [
  {
    id: 'account1',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    status: 'active',
    lastUsed: 0,
  },
  {
    id: 'account2',
    apiKey: process.env.ANTHROPIC_API_KEY_2 || process.env.ANTHROPIC_API_KEY || '',
    status: 'active',
    lastUsed: 0,
  },
];

let currentIndex = 0;

export function getActiveAccount(): Account {
  const now = Date.now();

  // Check if any limited account has recovered
  for (const acc of ACCOUNTS) {
    if (acc.status === 'limited' && acc.limitedUntil && now > acc.limitedUntil) {
      acc.status = 'active';
      acc.limitedUntil = undefined;
      console.log(`[ROTATION] Account ${acc.id} recovered`);
    }
  }

  // Find next active account (round-robin)
  for (let i = 0; i < ACCOUNTS.length; i++) {
    const idx = (currentIndex + i) % ACCOUNTS.length;
    if (ACCOUNTS[idx].status === 'active' && ACCOUNTS[idx].apiKey) {
      currentIndex = (idx + 1) % ACCOUNTS.length;
      ACCOUNTS[idx].lastUsed = now;
      return ACCOUNTS[idx];
    }
  }

  // All limited — return least recently limited, wait will be handled by caller
  const sorted = [...ACCOUNTS].sort((a, b) => (a.limitedUntil || 0) - (b.limitedUntil || 0));
  return sorted[0];
}

export function markRateLimited(accountId: string, retryAfterMs = 60000): void {
  const acc = ACCOUNTS.find(a => a.id === accountId);
  if (acc) {
    acc.status = 'limited';
    acc.limitedUntil = Date.now() + retryAfterMs;
    console.log(`[ROTATION] Account ${accountId} rate limited until ${new Date(acc.limitedUntil).toISOString()}`);
  }
}

export function getRotationStatus() {
  return ACCOUNTS.map(acc => ({
    id: acc.id,
    status: acc.status,
    lastUsed: acc.lastUsed ? new Date(acc.lastUsed).toISOString() : null,
    limitedUntil: acc.limitedUntil ? new Date(acc.limitedUntil).toISOString() : null,
  }));
}

export async function callWithRotation<T>(
  fn: (apiKey: string) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const account = getActiveAccount();

    try {
      return await fn(account.apiKey);
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.includes('rate') || msg.includes('429') || msg.includes('limit')) {
        markRateLimited(account.id, 65000); // 65 seconds
        console.log(`[ROTATION] Switching account after rate limit on ${account.id}`);
        if (attempt < maxRetries - 1) continue;
      }
      throw error;
    }
  }
  throw new Error('All accounts exhausted');
}
