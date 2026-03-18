export interface Skill {
  id: string
  name: string
  description: string
  category: 'dev' | 'research' | 'security' | 'productivity'
  status: 'active' | 'inactive'
  version?: string
  lastUsed?: string
}

export const skillsData: Skill[] = [
  {
    id: 'self-improving-agent',
    name: 'Self Improving Agent',
    description: 'Self-improving agent system that analyzes conversation quality and identifies improvement opportunities',
    category: 'dev',
    status: 'active',
    version: '1.0.0',
    lastUsed: '2024-03-18'
  },
  {
    id: 'critical-code-reviewer',
    name: 'Critical Code Reviewer',
    description: 'Conduct rigorous, adversarial code reviews with zero tolerance for mediocrity',
    category: 'dev',
    status: 'active',
    version: '1.2.0',
    lastUsed: '2024-03-17'
  },
  {
    id: 'deep-research-pro',
    name: 'Deep Research Pro',
    description: 'Multi-source deep research agent. Searches the web, synthesizes findings, and delivers cited reports',
    category: 'research',
    status: 'active',
    version: '2.1.0',
    lastUsed: '2024-03-18'
  },
  {
    id: 'security-scanner',
    name: 'Security Scanner',
    description: 'Automated security scanning and vulnerability detection for web applications, APIs, and infrastructure',
    category: 'security',
    status: 'active',
    version: '1.5.0',
    lastUsed: '2024-03-16'
  },
  {
    id: 'exa-search',
    name: 'Exa Search',
    description: 'Advanced web search capabilities with semantic understanding',
    category: 'research',
    status: 'active',
    version: '3.0.0',
    lastUsed: '2024-03-18'
  },
  {
    id: 'senior-dev',
    name: 'Senior Dev',
    description: 'Production development workflow with TODO tracking, Graphite PRs, and GitHub issues',
    category: 'dev',
    status: 'active',
    version: '2.0.0',
    lastUsed: '2024-03-17'
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Write clean, maintainable code with debugging, testing, and architectural best practices',
    category: 'dev',
    status: 'active',
    version: '1.8.0',
    lastUsed: '2024-03-18'
  },
  {
    id: 'web',
    name: 'Web Development',
    description: 'Build, debug, and deploy websites with HTML, CSS, JavaScript, modern frameworks, and production best practices',
    category: 'dev',
    status: 'active',
    version: '2.2.0',
    lastUsed: '2024-03-18'
  },
  {
    id: 'agent-dev-workflow',
    name: 'Agent Dev Workflow',
    description: 'Orchestrate coding agents to implement coding tasks through a structured workflow',
    category: 'dev',
    status: 'active',
    version: '1.4.0',
    lastUsed: '2024-03-17'
  },
  {
    id: 'dev-progress-governor',
    name: 'Dev Progress Governor',
    description: 'Govern execution hygiene for software projects with git commit discipline and progress tracking',
    category: 'dev',
    status: 'active',
    version: '1.1.0',
    lastUsed: '2024-03-17'
  },
  {
    id: 'tavily-search',
    name: 'Tavily Search',
    description: 'Real-time web search and information retrieval with AI-powered synthesis',
    category: 'research',
    status: 'active',
    version: '2.5.0',
    lastUsed: '2024-03-18'
  },
  {
    id: 'summarize',
    name: 'Summarize',
    description: 'Summarize URLs or files with the summarize CLI (web, PDFs, images, audio, YouTube)',
    category: 'productivity',
    status: 'active',
    version: '1.6.0',
    lastUsed: '2024-03-18'
  },
  {
    id: 'agent-team-orchestration',
    name: 'Agent Team Orchestration',
    description: 'Orchestrate multi-agent teams with defined roles, task lifecycles, and handoff protocols',
    category: 'dev',
    status: 'active',
    version: '1.3.0',
    lastUsed: '2024-03-16'
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Notion API for creating and managing pages, databases, and blocks',
    category: 'productivity',
    status: 'active',
    version: '2.0.0',
    lastUsed: '2024-03-15'
  },
  {
    id: 'wacli',
    name: 'WACLI',
    description: 'WhatsApp CLI integration for messaging and automation',
    category: 'productivity',
    status: 'active',
    version: '1.0.0',
    lastUsed: '2024-03-14'
  },
  {
    id: 'mh-wacli',
    name: 'MH WACLI',
    description: 'Enhanced WhatsApp CLI with advanced messaging features',
    category: 'productivity',
    status: 'active',
    version: '1.2.0',
    lastUsed: '2024-03-14'
  },
  {
    id: 'security-audit-toolkit',
    name: 'Security Audit',
    description: 'Audit codebases and infrastructure for security issues with OWASP compliance',
    category: 'security',
    status: 'active',
    version: '2.1.0',
    lastUsed: '2024-03-16'
  },
  {
    id: 'coding-agent',
    name: 'Coding Agent',
    description: 'Delegate coding tasks to Codex, Claude Code, or Pi agents via background process',
    category: 'dev',
    status: 'active',
    version: '1.7.0',
    lastUsed: '2024-03-17'
  },
  {
    id: 'healthcheck',
    name: 'Healthcheck',
    description: 'Host security hardening and risk-tolerance configuration for OpenClaw deployments',
    category: 'security',
    status: 'active',
    version: '1.4.0',
    lastUsed: '2024-03-15'
  },
  {
    id: 'skill-creator',
    name: 'Skill Creator',
    description: 'Create, edit, improve, or audit AgentSkills with structured validation',
    category: 'dev',
    status: 'active',
    version: '1.5.0',
    lastUsed: '2024-03-16'
  },
  {
    id: 'tmux',
    name: 'Tmux',
    description: 'Remote-control tmux sessions for interactive CLIs by sending keystrokes and scraping pane output',
    category: 'productivity',
    status: 'active',
    version: '1.3.0',
    lastUsed: '2024-03-12'
  },
  {
    id: 'weather',
    name: 'Weather',
    description: 'Get current weather and forecasts via wttr.in or Open-Meteo',
    category: 'productivity',
    status: 'active',
    version: '1.1.0',
    lastUsed: '2024-03-18'
  },
  {
    id: 'commander',
    name: 'Commander',
    description: 'Command translator - converts Arabic ideas into detailed English commands for Telegram groups',
    category: 'productivity',
    status: 'active',
    version: '1.0.0',
    lastUsed: '2024-03-17'
  },
  {
    id: 'role-researcher',
    name: 'Role: Researcher',
    description: 'Deep research and analysis for new ideas and projects',
    category: 'research',
    status: 'active',
    version: '1.0.0',
    lastUsed: '2024-03-18'
  },
  {
    id: 'role-architect',
    name: 'Role: Architect',
    description: 'Technical architecture and project planning',
    category: 'dev',
    status: 'active',
    version: '1.0.0',
    lastUsed: '2024-03-18'
  },
  {
    id: 'role-frontend-dev',
    name: 'Role: Frontend Dev',
    description: 'Build user interfaces with Next.js and shadcn/ui',
    category: 'dev',
    status: 'active',
    version: '1.0.0',
    lastUsed: '2024-03-18'
  },
  {
    id: 'role-backend-dev',
    name: 'Role: Backend Dev',
    description: 'Build APIs, database, authentication, and server logic',
    category: 'dev',
    status: 'active',
    version: '1.0.0',
    lastUsed: '2024-03-18'
  }
]

// Helper functions
export const getSkillsByCategory = (category: string) => {
  return skillsData.filter(skill => skill.category === category)
}

export const getSkillsStats = () => {
  const total = skillsData.length
  const active = skillsData.filter(skill => skill.status === 'active').length
  const categories = {
    dev: skillsData.filter(skill => skill.category === 'dev').length,
    research: skillsData.filter(skill => skill.category === 'research').length,
    security: skillsData.filter(skill => skill.category === 'security').length,
    productivity: skillsData.filter(skill => skill.category === 'productivity').length
  }
  
  return { total, active, categories }
}