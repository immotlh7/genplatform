import { Button } from "@/components/ui/button"
import { 
  FolderOpen, 
  ListTodo, 
  Lightbulb, 
  MessageCircle, 
  Plus,
  FileText,
  Users,
  Zap,
  Search
} from "lucide-react"
import Link from "next/link"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

function EmptyState({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  actionHref,
  onAction 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          {description}
        </p>
      )}
      {(actionLabel && (actionHref || onAction)) && (
        actionHref ? (
          <Link href={actionHref}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {actionLabel}
            </Button>
          </Link>
        ) : (
          <Button onClick={onAction}>
            <Plus className="w-4 h-4 mr-2" />
            {actionLabel}
          </Button>
        )
      )}
    </div>
  )
}

// Pre-configured empty states
export function NoProjectsEmptyState() {
  return (
    <EmptyState
      icon={<FolderOpen className="w-16 h-16" />}
      title="No projects yet"
      description="Create your first project to start managing your AI-powered workflow."
      actionLabel="Create Project"
      actionHref="/dashboard/projects?action=create"
    />
  )
}

export function NoTasksEmptyState() {
  return (
    <EmptyState
      icon={<ListTodo className="w-16 h-16" />}
      title="No tasks yet"
      description="Create tasks from the Kanban board to organize your work."
      actionLabel="Go to Kanban Board"
      actionHref="/dashboard/tasks"
    />
  )
}

export function NoIdeasEmptyState() {
  return (
    <EmptyState
      icon={<Lightbulb className="w-16 h-16" />}
      title="No ideas yet"
      description="Submit your first idea and let AI help you explore its potential!"
      actionLabel="Submit Idea"
      actionHref="/ideas?action=new"
    />
  )
}

export function NoChatMessagesEmptyState() {
  return (
    <EmptyState
      icon={<MessageCircle className="w-16 h-16" />}
      title="Start a conversation"
      description="Begin chatting with your AI team to get assistance with your projects."
    />
  )
}

export function NoFilesEmptyState() {
  return (
    <EmptyState
      icon={<FileText className="w-16 h-16" />}
      title="No files yet"
      description="Upload files or create new documents to build your knowledge base."
      actionLabel="Create File"
    />
  )
}

export function NoTeamMembersEmptyState() {
  return (
    <EmptyState
      icon={<Users className="w-16 h-16" />}
      title="No team members"
      description="Invite team members to collaborate on your projects."
      actionLabel="Invite Team Member"
      actionHref="/team?action=invite"
    />
  )
}

export function NoSkillsEmptyState() {
  return (
    <EmptyState
      icon={<Zap className="w-16 h-16" />}
      title="No skills installed"
      description="Add skills to enhance your AI agents' capabilities."
      actionLabel="Browse Skills"
      actionHref="/dashboard/skills"
    />
  )
}

export function NoSearchResultsEmptyState({ query }: { query: string }) {
  return (
    <EmptyState
      icon={<Search className="w-16 h-16" />}
      title="No results found"
      description={`No matches found for "${query}". Try adjusting your search terms.`}
    />
  )
}

export { EmptyState }