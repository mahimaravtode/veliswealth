import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Wallet } from "lucide-react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

export function NavSidebar({ items }: { items: NavItem[] }) {
  const location = useLocation();

  return (
    <aside
      className="fixed hidden top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border lg:flex flex-col"
    >
      <div className="px-4 pt-5 pb-4">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="p-2 bg-primary/10 rounded-2xl shrink-0">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">
            WealthifyMe
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {items.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium no-underline",
                active
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <span className="w-5 h-5 shrink-0 flex items-center justify-center">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground">&copy; 2026 WealthifyMe</p>
      </div>
    </aside>
  );
}
