export interface MemoryFile {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
  size?: number
  lastModified?: string
  content?: string
  children?: MemoryFile[]
}

export const memoryData: MemoryFile[] = [
  {
    id: 'owner-md',
    name: 'OWNER.md',
    path: '/OWNER.md',
    type: 'file',
    size: 1024,
    lastModified: '2024-03-18T10:30:00Z',
    content: '# Owner Profile\n\nMain workspace owner configuration and preferences.'
  },
  {
    id: 'projects',
    name: 'projects',
    path: '/projects',
    type: 'folder',
    lastModified: '2024-03-18T09:15:00Z',
    children: [
      {
        id: 'projects-index',
        name: 'INDEX.md',
        path: '/projects/INDEX.md',
        type: 'file',
        size: 2048,
        lastModified: '2024-03-18T09:15:00Z',
        content: '# Projects Index\n\nOverview of all active and completed projects.'
      },
      {
        id: 'genplatform',
        name: 'genplatform.md',
        path: '/projects/genplatform.md',
        type: 'file',
        size: 8192,
        lastModified: '2024-03-18T12:00:00Z',
        content: '# GenPlatform.ai Mission Control Dashboard\n\n## Overview\nComplete Next.js dashboard for AI agent management...'
      },
      {
        id: 'role-system',
        name: 'role-system.md',
        path: '/projects/role-system.md',
        type: 'file',
        size: 4096,
        lastModified: '2024-03-18T11:30:00Z',
        content: '# Role-Based Development System\n\n## Roles\n1. Research Analyst\n2. Solutions Architect\n3. Frontend Developer...'
      },
      {
        id: 'openclaw-skills',
        name: 'openclaw-skills.md',
        path: '/projects/openclaw-skills.md',
        type: 'file',
        size: 3072,
        lastModified: '2024-03-17T16:45:00Z',
        content: '# OpenClaw Skills Development\n\nCollection of custom skills for the OpenClaw platform.'
      }
    ]
  },
  {
    id: 'areas',
    name: 'areas',
    path: '/areas',
    type: 'folder',
    lastModified: '2024-03-17T14:20:00Z',
    children: [
      {
        id: 'development',
        name: 'development.md',
        path: '/areas/development.md',
        type: 'file',
        size: 5120,
        lastModified: '2024-03-17T14:20:00Z',
        content: '# Development Area\n\n## Ongoing Responsibilities\n- Code quality maintenance\n- Technical debt management\n- Developer workflow optimization...'
      },
      {
        id: 'design',
        name: 'design.md',
        path: '/areas/design.md',
        type: 'file',
        size: 3584,
        lastModified: '2024-03-16T10:30:00Z',
        content: '# Design Area\n\n## Design System\n- shadcn/ui components\n- Tailwind CSS patterns\n- Dark mode standards...'
      },
      {
        id: 'research',
        name: 'research.md',
        path: '/areas/research.md',
        type: 'file',
        size: 4608,
        lastModified: '2024-03-17T09:15:00Z',
        content: '# Research Area\n\n## Research Methodologies\n- Market analysis\n- Competitor research\n- Technology evaluation...'
      },
      {
        id: 'automation',
        name: 'automation.md',
        path: '/areas/automation.md',
        type: 'file',
        size: 2560,
        lastModified: '2024-03-15T13:45:00Z',
        content: '# Automation Area\n\n## Automation Workflows\n- Cron job management\n- CI/CD pipelines\n- Monitoring systems...'
      }
    ]
  },
  {
    id: 'resources',
    name: 'resources',
    path: '/resources',
    type: 'folder',
    lastModified: '2024-03-16T11:00:00Z',
    children: [
      {
        id: 'competitors',
        name: 'competitors.md',
        path: '/resources/competitors.md',
        type: 'file',
        size: 6144,
        lastModified: '2024-03-16T11:00:00Z',
        content: '# Competitor Analysis\n\n## Direct Competitors\n- Zapier\n- Make.com\n- n8n\n\n## Analysis Framework...'
      },
      {
        id: 'tools',
        name: 'tools.md',
        path: '/resources/tools.md',
        type: 'file',
        size: 4096,
        lastModified: '2024-03-15T15:30:00Z',
        content: '# Development Tools\n\n## Essential Tools\n- VSCode\n- GitHub\n- Vercel\n- OpenClaw\n\n## Configuration...'
      },
      {
        id: 'learnings',
        name: 'learnings.md',
        path: '/resources/learnings.md',
        type: 'file',
        size: 7680,
        lastModified: '2024-03-17T08:45:00Z',
        content: '# Key Learnings\n\n## Technical Insights\n- Next.js App Router patterns\n- TypeScript best practices\n- Component architecture...'
      },
      {
        id: 'design-standards',
        name: 'design-standards.md',
        path: '/resources/design-standards.md',
        type: 'file',
        size: 5632,
        lastModified: '2024-03-16T14:15:00Z',
        content: '# Design Standards\n\n## Color System\n- Zinc palette for dark mode\n- Consistent spacing (4px grid)\n- Typography hierarchy...'
      }
    ]
  },
  {
    id: 'tacit',
    name: 'tacit',
    path: '/tacit',
    type: 'folder',
    lastModified: '2024-03-18T08:30:00Z',
    children: [
      {
        id: 'my-preferences',
        name: 'my-preferences.md',
        path: '/tacit/my-preferences.md',
        type: 'file',
        size: 2048,
        lastModified: '2024-03-18T08:30:00Z',
        content: '# Personal Preferences\n\n## Code Style\n- TypeScript strict mode\n- Functional components\n- Clean architecture...'
      },
      {
        id: 'patterns',
        name: 'patterns.md',
        path: '/tacit/patterns.md',
        type: 'file',
        size: 3584,
        lastModified: '2024-03-17T12:20:00Z',
        content: '# Development Patterns\n\n## Successful Patterns\n- Component composition\n- Hook-based state management\n- API route patterns...'
      },
      {
        id: 'mistakes',
        name: 'mistakes.md',
        path: '/tacit/mistakes.md',
        type: 'file',
        size: 2816,
        lastModified: '2024-03-16T16:45:00Z',
        content: '# Common Mistakes\n\n## Anti-patterns to Avoid\n- Prop drilling\n- Premature optimization\n- Inconsistent naming...'
      },
      {
        id: 'improvements',
        name: 'improvements.md',
        path: '/tacit/improvements.md',
        type: 'file',
        size: 4352,
        lastModified: '2024-03-18T07:15:00Z',
        content: '# Improvement Opportunities\n\n## Recent Findings\n- Component reusability\n- Performance optimizations\n- User experience enhancements...'
      }
    ]
  },
  {
    id: 'security',
    name: 'security',
    path: '/security',
    type: 'folder',
    lastModified: '2024-03-17T18:00:00Z',
    children: [
      {
        id: 'audit-log',
        name: 'audit-log.md',
        path: '/security/audit-log.md',
        type: 'file',
        size: 3072,
        lastModified: '2024-03-17T18:00:00Z',
        content: '# Security Audit Log\n\n## Recent Audits\n- 2024-03-17: System security scan\n- 2024-03-15: Dependencies audit\n- 2024-03-12: Access control review...'
      },
      {
        id: 'threats',
        name: 'threats.md',
        path: '/security/threats.md',
        type: 'file',
        size: 1536,
        lastModified: '2024-03-16T09:30:00Z',
        content: '# Threat Detection Log\n\n## Detected Threats\nNo threats detected in the last 30 days.\n\n## Monitoring Status\n- Active monitoring: ✅\n- Real-time alerts: ✅'
      }
    ]
  },
  {
    id: 'daily',
    name: 'daily',
    path: '/daily',
    type: 'folder',
    lastModified: '2024-03-18T12:30:00Z',
    children: [
      {
        id: 'daily-2024-03-18',
        name: '2024-03-18.md',
        path: '/daily/2024-03-18.md',
        type: 'file',
        size: 4096,
        lastModified: '2024-03-18T12:30:00Z',
        content: '# Daily Log - March 18, 2024\n\n## Completed Tasks\n- Fixed authentication system\n- Implemented PARA structure\n- Enhanced skills page...'
      },
      {
        id: 'daily-2024-03-17',
        name: '2024-03-17.md',
        path: '/daily/2024-03-17.md',
        type: 'file',
        size: 3584,
        lastModified: '2024-03-17T23:45:00Z',
        content: '# Daily Log - March 17, 2024\n\n## Completed Tasks\n- Created role definition skills\n- Worked on GenPlatform dashboard\n- Security improvements...'
      },
      {
        id: 'daily-2024-03-16',
        name: '2024-03-16.md',
        path: '/daily/2024-03-16.md',
        type: 'file',
        size: 2816,
        lastModified: '2024-03-16T23:30:00Z',
        content: '# Daily Log - March 16, 2024\n\n## Completed Tasks\n- Design system documentation\n- Component improvements\n- Code reviews...'
      }
    ]
  },
  {
    id: 'learning',
    name: 'learning',
    path: '/learning',
    type: 'folder',
    lastModified: '2024-03-17T16:00:00Z',
    children: [
      {
        id: 'nextjs-patterns',
        name: 'nextjs-patterns.md',
        path: '/learning/nextjs-patterns.md',
        type: 'file',
        size: 5120,
        lastModified: '2024-03-17T16:00:00Z',
        content: '# Next.js Learning Notes\n\n## App Router Patterns\n- Route groups\n- Layout composition\n- Server vs client components...'
      },
      {
        id: 'typescript-advanced',
        name: 'typescript-advanced.md',
        path: '/learning/typescript-advanced.md',
        type: 'file',
        size: 6656,
        lastModified: '2024-03-16T20:15:00Z',
        content: '# Advanced TypeScript\n\n## Type System Mastery\n- Utility types\n- Conditional types\n- Template literal types...'
      },
      {
        id: 'ai-integration',
        name: 'ai-integration.md',
        path: '/learning/ai-integration.md',
        type: 'file',
        size: 4608,
        lastModified: '2024-03-15T19:45:00Z',
        content: '# AI Integration Patterns\n\n## Best Practices\n- API rate limiting\n- Context management\n- Error handling strategies...'
      }
    ]
  }
]

export const getMemoryStats = () => {
  let totalFiles = 0
  let totalSize = 0
  
  const countFiles = (items: MemoryFile[]) => {
    items.forEach(item => {
      if (item.type === 'file') {
        totalFiles++
        totalSize += item.size || 0
      } else if (item.children) {
        countFiles(item.children)
      }
    })
  }
  
  countFiles(memoryData)
  
  return {
    files: totalFiles,
    folders: memoryData.filter(item => item.type === 'folder').length,
    totalSize: Math.round((totalSize / 1024) * 100) / 100, // Convert to KB and round
    categories: {
      projects: memoryData.find(item => item.id === 'projects')?.children?.length || 0,
      areas: memoryData.find(item => item.id === 'areas')?.children?.length || 0,
      resources: memoryData.find(item => item.id === 'resources')?.children?.length || 0,
      tacit: memoryData.find(item => item.id === 'tacit')?.children?.length || 0
    }
  }
}

export const searchMemoryFiles = (query: string): MemoryFile[] => {
  const results: MemoryFile[] = []
  const searchTerm = query.toLowerCase()
  
  const searchInFiles = (items: MemoryFile[]) => {
    items.forEach(item => {
      if (
        item.name.toLowerCase().includes(searchTerm) ||
        (item.content && item.content.toLowerCase().includes(searchTerm))
      ) {
        results.push(item)
      }
      if (item.children) {
        searchInFiles(item.children)
      }
    })
  }
  
  searchInFiles(memoryData)
  return results
}

export const getFileByPath = (path: string): MemoryFile | null => {
  const findFile = (items: MemoryFile[]): MemoryFile | null => {
    for (const item of items) {
      if (item.path === path) {
        return item
      }
      if (item.children) {
        const found = findFile(item.children)
        if (found) return found
      }
    }
    return null
  }
  
  return findFile(memoryData)
}