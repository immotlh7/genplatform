"use client"

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">Mission Control</h1>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <button className="p-2 text-sm">
            Theme Toggle (Task 11)
          </button>
          <div className="w-8 h-8 rounded-full bg-muted">
            {/* User avatar placeholder */}
          </div>
        </div>
      </div>
    </header>
  )
}