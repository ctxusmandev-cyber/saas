import { Link, useLocation } from "wouter";
import { LayoutDashboard, Store, LogOut, Menu as MenuIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSuperAdmin } from "@/lib/admin-auth";
import { useState } from "react";

const navItems = [
  { href: "/super-admin", label: "Restaurants", icon: LayoutDashboard },
];

function Sidebar({ location, onClose }: { location: string; onClose?: () => void }) {
  const { logout } = useSuperAdmin();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/super-admin/login");
    onClose?.();
  };

  return (
    <div className="w-full h-full flex flex-col bg-card">
      <div className="h-16 flex items-center justify-between px-6 border-b shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-serif text-xl font-bold text-primary">Terra</span>
          <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium">SUPER</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== "/super-admin" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <span className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}>
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] flex bg-muted/40">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 border-r flex-col shrink-0">
        <Sidebar location={location} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 max-w-[85vw] shadow-xl">
            <Sidebar location={location} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col min-h-[100dvh] overflow-y-auto">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 h-14 border-b bg-card sticky top-0 z-40">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground hover:text-foreground">
            <MenuIcon className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-primary">Terra</span>
            <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium">SUPER</span>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
