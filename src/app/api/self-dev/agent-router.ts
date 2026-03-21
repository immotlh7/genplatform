/**
 * Agent Router — Routes tasks to specialized agents based on file paths and department
 */

const GATEWAY_URL = 'http://127.0.0.1:18789/v1/chat/completions';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || 'bd8c8bd58ce00e2cebbcff1d7c406fdb5eca73f38da0d7df';

export type AgentId = 'main' | 'frontend-dev' | 'backend-dev' | 'improvement-agent';

/**
 * Determine which agent should handle a task based on file paths and description
 */
export function routeTask(task: any): AgentId {
  const filePaths = (task.microTasks || [])
    .map((mt: any) => mt.filePath || '')
    .filter(Boolean);
  
  const description = (task.originalDescription || '').toLowerCase();
  const department = (task.department || '').toLowerCase();

  // Explicit department routing
  if (department === 'frontend' || department === 'ui') return 'frontend-dev';
  if (department === 'backend' || department === 'api') return 'backend-dev';
  if (department === 'analysis' || department === 'improvement') return 'improvement-agent';

  // File-path based routing
  const frontendPaths = filePaths.filter((fp: string) =>
    (fp.includes('/components/') || fp.includes('/app/dashboard/') || fp.includes('/app/projects/'))
    && !fp.includes('/api/')
  );
  const backendPaths = filePaths.filter((fp: string) =>
    fp.includes('/api/') || fp.includes('/genplatform-api/') || fp.includes('/data/')
  );

  if (frontendPaths.length > backendPaths.length) return 'frontend-dev';
  if (backendPaths.length > frontendPaths.length) return 'backend-dev';

  // Description-based routing
  if (description.includes('component') || description.includes('ui') || description.includes('page') || description.includes('design') || description.includes('tailwind')) {
    return 'frontend-dev';
  }
  if (description.includes('api') || description.includes('route') || description.includes('database') || description.includes('endpoint')) {
    return 'backend-dev';
  }

  return 'main';
}

/**
 * Send a task to a specific agent via OpenClaw Gateway
 */
export async function sendToAgent(
  agentId: AgentId,
  message: string,
  sessionKey?: string
): Promise<{ success: boolean; reply: string }> {
  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
        'x-openclaw-agent-id': agentId,
        ...(sessionKey ? { 'x-openclaw-session-key': sessionKey } : {})
      },
      body: JSON.stringify({
        model: 'openclaw',
        messages: [{ role: 'user', content: message }],
        user: `self-dev-${agentId}`
      })
    });

    if (!response.ok) {
      return { success: false, reply: `Gateway error: ${response.status}` };
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';
    return { success: true, reply };
  } catch (e: any) {
    return { success: false, reply: `Error: ${e.message}` };
  }
}

/**
 * Get agent info for logging
 */
export function getAgentInfo(agentId: AgentId) {
  const info: Record<AgentId, { name: string; emoji: string }> = {
    'main': { name: 'Main Agent', emoji: '🤖' },
    'frontend-dev': { name: 'Frontend Dev', emoji: '🖥️' },
    'backend-dev': { name: 'Backend Dev', emoji: '⚙️' },
    'improvement-agent': { name: 'Improvement Agent', emoji: '🧠' }
  };
  return info[agentId] || info['main'];
}
