# WORK-RULES.md - Development Guidelines

## PROTECTED FILES - NEVER MODIFY

The following files are protected and must NEVER be modified in any future task:

### Self-Development System
- src/app/dashboard/self-dev/** (all files in this directory)
- src/app/api/self-dev/** (all API routes for self-dev)
- src/components/self-dev/** (all self-dev components)

### Core Layout Files
- src/app/layout.tsx
- src/app/(dashboard)/layout.tsx (sidebar.tsx)
- src/components/layout/navbar.tsx
- src/app/globals.css

These files are critical infrastructure. Any modification could break the entire system.

## Development Rules

1. Always check this file before making changes
2. Never modify protected files
3. When in doubt, ask before modifying core infrastructure
4. Commit frequently with clear messages
5. Test builds after major changes