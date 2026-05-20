import { Link, useLocation, useParams } from "wouter";
import {
  LayoutDashboard, UtensilsCrossed, Tags, ShoppingCart,
  ArrowLeft, LogOut, Bell, BellOff, Palette, Menu as MenuIcon, X, Bike, Settings,
  Volume2, VolumeX, CheckCircle2, AlertCircle, BellRing,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/lib/admin-auth";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useRestaurant } from "@/lib/restaurant-context";
import { useOrderNotifications } from "@/hooks/use-order-notifications";
import { Button } from "@/components/ui/button";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

function buildNav(slug: string) {
  return [
    { href: `/r/${slug}/admin`, label: "Dashboard", icon: LayoutDashboard },
    { href: `/r/${slug}/admin/orders`, label: "Orders", icon: ShoppingCart },
    { href: `/r/${slug}/admin/riders`, label: "Riders", icon: Bike },
    { href: `/r/${slug}/admin/menu`, label: "Menu Items", icon: UtensilsCrossed },
    { href: `/r/${slug}/admin/categories`, label: "Categories", icon: Tags },
    { href: `/r/${slug}/admin/appearance`, label: "Appearance", icon: Palette },
    { href: `/r/${slug}/admin/settings`, label: "Settings", icon: Settings },
  ];
}

function NewOrderWatcher({ notify }: { notify: (id: number, name: string, total: number, items: number) => void }) {
  const { data: orders } = useListOrders(
    { status: "pending" },
    { query: { queryKey: getListOrdersQueryKey({ status: "pending" }), refetchInterval: 10000 } }
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const prevIdsRef = useRef<Set<number>>(new Set());
  const initialized = useRef(false);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    if (!orders) return;
    const currentIds = new Set(orders.map((o) => o.id));

    if (!initialized.current) {
      initialized.current = true;
      prevIdsRef.current = currentIds;
      return;
    }

    const incoming = orders.filter((o) => !prevIdsRef.current.has(o.id));
    if (incoming.length > 0) {
      setNewCount((n) => n + incoming.length);
      incoming.forEach((order) => {
        notify(order.id, order.customerName, Number(order.total), order.items.length);
        toast({
          title: `New Order #${order.id}`,
          description: `${order.customerName} — ${order.items.length} item${order.items.length !== 1 ? "s" : ""} — Rs ${Number(order.total).toFixed(0)}`,
          duration: 8000,
        });
      });
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
    }
    prevIdsRef.current = currentIds;
  }, [orders, toast, queryClient, notify]);

  return newCount > 0 ? (
    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
      {newCount > 9 ? "9+" : newCount}
    </span>
  ) : null;
}

function NotificationControls() {
  const {
    permission,
    soundEnabled,
    notifEnabled,
    toggleSound,
    toggleNotif,
    requestPermission,
  } = useOrderNotifications();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="px-3 py-2 rounded-lg bg-muted/50 border border-border/50 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">Alerts</p>

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          className="w-full flex items-center justify-between gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5"
        >
          <span className="flex items-center gap-2">
            {soundEnabled ? (
              <Volume2 className="h-3.5 w-3.5 text-primary" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" />
            )}
            Alert Sound
          </span>
          <span className={cn(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded",
            soundEnabled ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
          )}>
            {soundEnabled ? "ON" : "OFF"}
          </span>
        </button>

        {/* Browser notification */}
        {permission === "unsupported" ? null : (
          <div className="flex items-center justify-between gap-2 text-sm py-0.5">
            <button
              onClick={permission === "granted" ? toggleNotif : requestPermission}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {permission === "granted" && notifEnabled ? (
                <BellRing className="h-3.5 w-3.5 text-primary" />
              ) : permission === "granted" ? (
                <BellOff className="h-3.5 w-3.5" />
              ) : (
                <Bell className="h-3.5 w-3.5" />
              )}
              {permission === "granted" ? "Browser Alerts" : "Enable Alerts"}
            </button>

            {permission === "granted" ? (
              <button
                onClick={toggleNotif}
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                  notifEnabled ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                )}
              >
                {notifEnabled ? "ON" : "OFF"}
              </button>
            ) : permission === "denied" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-700 cursor-help">
                    BLOCKED
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[180px] text-xs">
                  Notifications blocked in browser settings. Click the lock icon in your address bar to allow them.
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={requestPermission}
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
              >
                ALLOW
              </button>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

function Sidebar({
  slug,
  location,
  session,
  notify,
  onClose,
}: {
  slug: string;
  location: string;
  session: any;
  notify: (id: number, name: string, total: number, items: number) => void;
  onClose?: () => void;
}) {
  const navItems = buildNav(slug);
  const { logout } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { restaurant } = useRestaurant();

  const handleLogout = () => {
    logout();
    setLocation(`/r/${slug}/admin/login`);
    onClose?.();
  };

  const displayName = restaurant?.name ?? session?.name ?? "Terra";

  return (
    <div className="w-full h-full flex flex-col bg-card">
      <div className="h-16 flex items-center justify-between px-6 border-b shrink-0">
        <div className="min-w-0">
          <span className="font-serif text-lg font-bold text-primary truncate block">{displayName} Admin</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-2 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== `/r/${slug}/admin` && location.startsWith(item.href));
          const isOrders = item.href.endsWith("/orders");
          return (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <span className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}>
                <span className="relative shrink-0">
                  <Icon className="h-4 w-4" />
                  {isOrders && <NewOrderWatcher notify={notify} />}
                </span>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t space-y-3 shrink-0">
        <NotificationControls />

        <Link href={`/r/${slug}`} onClick={onClose}>
          <span className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            Back to Site
          </span>
        </Link>
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

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { session } = useAdminAuth();
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? session?.slug ?? "terra";
  const [mobileOpen, setMobileOpen] = useState(false);
  const { notify } = useOrderNotifications();

  const stableNotify = useCallback(notify, [notify]);

  return (
    <div className="min-h-[100dvh] flex bg-muted/40">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 border-r flex-col shrink-0">
        <Sidebar slug={slug} location={location} session={session} notify={stableNotify} />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 max-w-[85vw] shadow-xl">
            <Sidebar slug={slug} location={location} session={session} notify={stableNotify} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col min-h-[100dvh] overflow-y-auto">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 h-14 border-b bg-card sticky top-0 z-40">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground hover:text-foreground">
            <MenuIcon className="h-5 w-5" />
          </button>
          <span className="font-serif font-bold text-primary">Admin Panel</span>
        </div>

        {children}
      </main>
    </div>
  );
}
