import { Button } from "@/components/ui/button"
import { Wrench } from "lucide-react"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
            <Wrench className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Onyx RBMMS</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#architecture" className="transition-colors hover:text-foreground">Architecture</a>
          <a href="#benefits" className="transition-colors hover:text-foreground">Benefits</a>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">Log in</Button>
          <Button size="sm">Get Started</Button>
        </div>
      </div>
    </header>
  )
}