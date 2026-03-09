import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Upload, LayoutDashboard, MessageSquare, Network, FileText, Shield, Image, Clock } from "lucide-react";

const navItems = [
  { to: "/", label: "Upload", icon: Upload },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/chat", label: "AI Search", icon: MessageSquare },
  { to: "/graph", label: "Network", icon: Network },
  { to: "/timeline", label: "Timeline", icon: Clock },
  { to: "/images", label: "Media", icon: Image },
  { to: "/report", label: "Report", icon: FileText },
];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-sidebar border-r border-border flex flex-col">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Shield className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-base font-bold font-mono text-primary cyber-text-glow tracking-wide">FORENSIX</h1>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Digital Forensics Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                  active
                    ? "bg-primary/10 text-primary cyber-border cyber-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="text-[10px] text-muted-foreground font-mono">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-glow" />
              SYSTEM ONLINE
            </div>
            <div>v1.0.0 — Secure Mode</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
