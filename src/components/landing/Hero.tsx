import { Button } from "@/components/ui/button"
import { ArrowRight, ShieldCheck, Activity, BarChart3 } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="container max-w-7xl px-4 sm:px-8">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-xs font-semibold text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" /> Enterprise Fleet & Reliability Management
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">
            Drive Uptime with <span className="text-primary">Reliability-Based</span> Maintenance
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
            Transition from reactive repairs to predictive reliability. Manage multi-tenant fleets, digital inspection checklists, work orders, and FMEA analytics seamlessly.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button size="lg" className="gap-2">
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline">
              Explore Architecture
            </Button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto">
          <div className="p-6 rounded-xl border border-border/60 bg-card shadow-xs space-y-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg">Dynamic PM Triggers</h3>
            <p className="text-sm text-muted-foreground">Automate preventive maintenance schedules based on real-time kilometers, engine hours, and calendar intervals.</p>
          </div>
          <div className="p-6 rounded-xl border border-border/60 bg-card shadow-xs space-y-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg">Digital Inspections</h3>
            <p className="text-sm text-muted-foreground">Empower drivers and technicians with customizable digital inspection checklists and instant defect reporting.</p>
          </div>
          <div className="p-6 rounded-xl border border-border/60 bg-card shadow-xs space-y-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg">Reliability Analytics</h3>
            <p className="text-sm text-muted-foreground">Track MTBF, MTTR, fleet compliance, and execute structured Root Cause Analysis (RCA) and FMEA reviews.</p>
          </div>
        </div>
      </div>
    </section>
  )
}