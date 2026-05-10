import React from "react"

export interface AppLayoutProps {
  sidebar: React.ReactNode
  children: React.ReactNode
}

export function AppLayout({ sidebar, children }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      {/* Sidebar for settings */}
      <aside className="w-80 h-full border-r border-border bg-card flex flex-col overflow-y-auto shrink-0 shadow-xl z-10">
        {sidebar}
      </aside>

      {/* Main workspace area */}
      <main className="flex-1 h-full relative overflow-hidden bg-accent/20">
        {children}
      </main>
    </div>
  )
}
