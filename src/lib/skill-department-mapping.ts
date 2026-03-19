// Maps skills to departments that use them
export const skillToDepartments: Record<string, string[]> = {
  // Research Department
  'deep-research-pro': ['research'],
  'exa-search': ['research'],
  'tavily-search': ['research'],
  
  // Architecture & Planning
  'task-planner': ['architect'],
  'project-architect': ['architect'],
  
  // Frontend Development
  'developer': ['frontend', 'backend'],
  'senior-dev': ['frontend'],
  'coding-agent': ['frontend'],
  
  // Backend Development
  'api-builder': ['backend'],
  
  // Quality Assurance
  'critical-code-reviewer': ['qa'],
  
  // Security
  'security-scanner': ['security'],
  'security-audit-toolkit': ['security'],
  'security-audit': ['security'],
  
  // Self-Improvement
  'self-improving-agent': ['improvement'],
  
  // Multiple departments
  'github': ['frontend', 'backend', 'qa'],
  'notion': ['architect', 'research'],
  'summarize': ['research', 'qa'],
  'weather': ['research'],
  'tmux': ['frontend', 'backend'],
  'memory-consolidator': ['improvement'],
  'ontology': ['architect', 'improvement'],
  'pr-manager': ['qa', 'frontend', 'backend'],
  'self-improver': ['improvement'],
  'team-protocol': ['architect'],
  'system-health': ['security', 'improvement'],
  'web': ['frontend'],
  'skill-creator': ['improvement', 'architect'],
  'gog': ['research', 'architect'],
  'node-connect': ['security', 'backend'],
  'healthcheck': ['security'],
  'auto-continue': ['improvement'],
  'claude-code-rules': ['frontend', 'backend'],
  'memory-cleaner': ['improvement']
};

// Department info
export const departments = [
  { id: 'research', name: 'Research', icon: '🔬' },
  { id: 'architect', name: 'Architecture', icon: '📋' },
  { id: 'frontend', name: 'Frontend', icon: '💻' },
  { id: 'backend', name: 'Backend', icon: '⚙️' },
  { id: 'qa', name: 'QA', icon: '🔍' },
  { id: 'security', name: 'Security', icon: '🛡️' },
  { id: 'improvement', name: 'Self-Improvement', icon: '📈' }
];

// Skill categories
export const skillCategories = {
  development: ['developer', 'senior-dev', 'coding-agent', 'api-builder', 'web', 'claude-code-rules'],
  research: ['deep-research-pro', 'exa-search', 'tavily-search', 'summarize', 'weather', 'gog'],
  security: ['security-scanner', 'security-audit-toolkit', 'security-audit', 'healthcheck', 'system-health', 'node-connect'],
  productivity: ['task-planner', 'project-architect', 'notion', 'tmux', 'pr-manager', 'team-protocol', 'auto-continue', 'skill-creator', 'ontology']
};

export function getDepartmentsForSkill(skillName: string): { id: string; name: string; icon: string }[] {
  const deptIds = skillToDepartments[skillName] || [];
  return departments.filter(dept => deptIds.includes(dept.id));
}

export function getCategoryForSkill(skillName: string): string {
  for (const [category, skills] of Object.entries(skillCategories)) {
    if (skills.includes(skillName)) {
      return category;
    }
  }
  return 'utility'; // default category
}