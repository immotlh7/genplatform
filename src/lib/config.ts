export const config = {
  // Authentication
  dashboardPassword: process.env.DASHBOARD_PASSWORD || 'admin123',
  
  // OpenClaw paths
  openclawPath: process.env.OPENCLAW_PATH || '/root/.openclaw',
  workspacePath: process.env.OPENCLAW_PATH ? `${process.env.OPENCLAW_PATH}/workspace` : '/root/.openclaw/workspace',
  cronPath: process.env.OPENCLAW_PATH ? `${process.env.OPENCLAW_PATH}/cron` : '/root/.openclaw/cron',
  
  // Security
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
  
  // App info
  appName: 'GenPlatform.ai',
  appVersion: '1.0.0',
  
  // API endpoints
  api: {
    baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  }
}

export default config