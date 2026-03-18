"use client"

export function Sidebar() {
  return (
    <div className="w-64 bg-muted/30 border-r">
      <div className="p-6">
        <h2 className="text-lg font-semibold">GenPlatform.ai</h2>
      </div>
      <nav className="px-6 space-y-2">
        <a href="/" className="block p-2 text-sm hover:bg-muted rounded">Dashboard</a>
        <a href="/projects" className="block p-2 text-sm hover:bg-muted rounded">Projects</a>
        <a href="/skills" className="block p-2 text-sm hover:bg-muted rounded">Skills</a>
        <a href="/memory" className="block p-2 text-sm hover:bg-muted rounded">Memory</a>
        <a href="/cron" className="block p-2 text-sm hover:bg-muted rounded">Cron Jobs</a>
        <a href="/reports" className="block p-2 text-sm hover:bg-muted rounded">Reports</a>
        <a href="/settings" className="block p-2 text-sm hover:bg-muted rounded">Settings</a>
      </nav>
    </div>
  )
}