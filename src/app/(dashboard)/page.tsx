export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to GenPlatform.ai Mission Control
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dashboard content will be added in Task 17 */}
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold">Projects</h3>
          <p className="text-sm text-muted-foreground">Manage your projects</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold">Skills</h3>
          <p className="text-sm text-muted-foreground">Agent capabilities</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold">Memory</h3>
          <p className="text-sm text-muted-foreground">Browse memory files</p>
        </div>
      </div>
    </div>
  )
}