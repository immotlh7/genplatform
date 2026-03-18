const BRIDGE_URL = process.env.BRIDGE_API_URL || 'http://localhost:3001';

async function fetchBridge(endpoint: string) {
  try {
    const res = await fetch(`${BRIDGE_URL}${endpoint}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    return { data: await res.json() };
  } catch (e: any) {
    return { error: e.message || 'Bridge API unavailable' };
  }
}

export const getHealth = () => fetchBridge('/api/health');
export const getSkills = () => fetchBridge('/api/skills');
export const getMemoryTree = () => fetchBridge('/api/memory');
export const getMemoryFile = (path: string) => fetchBridge(`/api/memory-file?path=${encodeURIComponent(path)}`);
export const getCronJobs = () => fetchBridge('/api/cron');
export const getSystemMetrics = () => fetchBridge('/api/system/metrics');
export const getStatus = () => fetchBridge('/api/status');
export const getLogs = () => fetchBridge('/api/logs');
export const getSessions = () => fetchBridge('/api/sessions');
