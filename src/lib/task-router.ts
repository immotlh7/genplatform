// Task routing engine that analyzes tasks and determines the best department
export interface TaskRoutingResult {
  department: string;
  confidence: number; // 0-1
  reasoning: string;
}

interface DepartmentRules {
  name: string;
  keywords: string[];
  weight: number;
}

const departmentRules: DepartmentRules[] = [
  {
    name: 'Frontend Development',
    keywords: ['frontend', 'ui', 'page', 'component', 'css', 'tailwind', 'react', 'nextjs', 'jsx', 'tsx', 'style', 'layout', 'responsive', 'design', 'interface'],
    weight: 10
  },
  {
    name: 'Backend Development',
    keywords: ['api', 'endpoint', 'database', 'supabase', 'express', 'route', 'backend', 'server', 'auth', 'middleware', 'controller', 'model', 'schema', 'rest', 'graphql'],
    weight: 10
  },
  {
    name: 'Quality Assurance',
    keywords: ['test', 'review', 'qa', 'quality', 'lint', 'check', 'bug', 'fix', 'verify', 'validate', 'ensure', 'testing', 'coverage', 'unit', 'integration'],
    weight: 10
  },
  {
    name: 'Security',
    keywords: ['security', 'audit', 'vulnerability', 'encrypt', 'auth', 'permission', 'access', 'token', 'csrf', 'xss', 'sql', 'injection', 'secure', 'protect', 'firewall'],
    weight: 10
  },
  {
    name: 'Research',
    keywords: ['research', 'analyze', 'market', 'competitor', 'study', 'investigate', 'explore', 'discover', 'compare', 'evaluate', 'assess', 'survey', 'data', 'insights'],
    weight: 10
  },
  {
    name: 'Architecture',
    keywords: ['plan', 'architecture', 'design', 'sprint', 'roadmap', 'structure', 'system', 'diagram', 'flow', 'blueprint', 'strategy', 'framework', 'pattern', 'organize'],
    weight: 10
  },
  {
    name: 'Self-Improvement',
    keywords: ['improve', 'optimize', 'performance', 'refactor', 'enhance', 'upgrade', 'efficiency', 'speed', 'clean', 'maintain', 'polish', 'streamline', 'modernize'],
    weight: 10
  }
];

export function routeTask(taskName: string, taskDescription: string = ''): TaskRoutingResult {
  const text = `${taskName} ${taskDescription}`.toLowerCase();
  const scores: Map<string, number> = new Map();
  const matches: Map<string, string[]> = new Map();

  // Calculate scores for each department
  for (const dept of departmentRules) {
    let score = 0;
    const matchedKeywords: string[] = [];
    
    for (const keyword of dept.keywords) {
      if (text.includes(keyword)) {
        score += dept.weight;
        matchedKeywords.push(keyword);
      }
    }
    
    if (score > 0) {
      scores.set(dept.name, score);
      matches.set(dept.name, matchedKeywords);
    }
  }

  // Find the best department
  let bestDepartment = 'Architecture'; // Default to planning
  let bestScore = 0;
  let bestMatches: string[] = [];

  for (const [dept, score] of scores.entries()) {
    if (score > bestScore) {
      bestScore = score;
      bestDepartment = dept;
      bestMatches = matches.get(dept) || [];
    }
  }

  // Calculate confidence (0-1)
  // Max realistic score would be ~50 (5 keyword matches)
  const confidence = Math.min(bestScore / 50, 1);

  // Generate reasoning
  let reasoning = '';
  if (bestMatches.length > 0) {
    reasoning = `Matched keywords: ${bestMatches.join(', ')}`;
  } else {
    reasoning = 'No specific keywords matched, defaulting to Architecture for planning';
  }

  return {
    department: bestDepartment,
    confidence,
    reasoning
  };
}

// Map department names to assignedRole values used in tasks
export function departmentToRole(department: string): string {
  const roleMap: { [key: string]: string } = {
    'Frontend Development': 'frontend',
    'Backend Development': 'backend',
    'Quality Assurance': 'qa',
    'Security': 'security',
    'Research': 'research',
    'Architecture': 'architect',
    'Self-Improvement': 'improvement'
  };
  
  return roleMap[department] || 'architect';
}