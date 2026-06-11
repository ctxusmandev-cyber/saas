import { Layout } from "@/components/layout";
import { useCustomerAuth, type CustomerUser } from "@/lib/customer-auth";
import { useLocation, Link } from "wouter";
import { useRestaurantPath } from "@/lib/use-slug";
import { useRestaurant } from "@/lib/restaurant-context";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import {
  User, LogOut, ShoppingBag, Clock, CheckCircle2, Utensils,
  Package, Bike, XCircle, ChevronRight, Pencil, Check, X, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: "Order Received", color: "bg-amber-100 text-amber-800 border-amber-200",   icon: <Clock className="w-3 h-3" /> },
  confirmed: { label: "Confirmed",      color: "bg-blue-100 text-blue-800 border-blue-200",       icon: <CheckCircle2 className="w-3 h-3" /> },
  preparing: { label: "Preparing",      color: "bg-purple-100 text-purple-800 border-purple-200", icon: <Utensils className="w-3 h-3" /> },
  ready:     { label: "Ready",          color: "bg-green-100 text-green-800 border-green-200",    icon: <Package className="w-3 h-3" /> },
  delivered: { label: "Delivered",      color: "bg-gray-100 text-gray-700 border-gray-200",       icon: <Bike className="w-3 h-3" /> },
  cancelled: { label: "Cancelled",      color: "bg-red-100 text-red-800 border-red-200",          icon: <XCircle className="w-3 h-3" /> },
};

interface Order {
  id: number;
  status: string;
  total: number;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
});
type ProfileValues = z.infer<typeof profileSchema>;

function EditProfileForm({ user, onSave, onCancel }: {
  user: CustomerUser;
  onSave: (v: ProfileValues) => Promise<void>;
  onCancel: () => void;
}) {
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, phone: user.phone ?? "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-3">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl><Input className="h-10 rounded-xl" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem>
            <FormLabel>Phone <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
            <FormControl><Input type="tel" className="h-10 rounded-xl" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="flex gap-2 pt-1">
          <Button type="submit" size="sm" disabled={form.formState.isSubmitting} className="rounded-xl">
            {form.formState.isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
            Save
          </Button>
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={onCancel}>
            <X className="w-3.5 h-3.5 mr-1" />Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function Account() {
  const { user, token, logout, updateProfile, loading } = useCustomerAuth();
  const [, setLocation] = useLocation();
  const rpath = useRestaurantPath();
  const { restaurant } = useRestaurant();
  const slug = (restaurant as any)?.slug ?? "terra";

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      setLocation(rpath("/login"));
    }
  }, [loading, user]);

  useEffect(() => {
    if (!token) return;
    setOrdersLoading(true);
    fetch(`${API_BASE}/api/auth/orders`, {
      headers: { Authorization: `Bearer ${token}`, "x-restaurant-slug": slug },
    })
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [token, slug]);

  const handleSaveProfile = async (values: ProfileValues) => {
    setSaveError("");
    const { error } = await updateProfile(values);
    if (error) { setSaveError(error); return; }
    setEditing(false);
  };

  const handleLogout = () => {
    logout();
    setLocation(rpath(""));
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 max-w-3xl space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold">My Account</h1>
            <p className="text-muted-foreground mt-1">Manage your profile and order history</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl text-destructive hover:text-destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        {/* Profile Card */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="font-bold text-lg">{user.name}</p>
                <p className="text-muted-foreground text-sm">{user.email}</p>
                {user.phone && <p className="text-muted-foreground text-sm">{user.phone}</p>}
              </div>
            </div>
            {!editing && (
              <Button variant="ghost" size="sm" className="gap-1.5 rounded-xl shrink-0" onClick={() => setEditing(true)}>
                <Pencil className="w-3.5 h-3.5" />Edit
              </Button>
            )}
          </div>

          {editing && (
            <div className="border-t pt-5 mt-2">
              {saveError && (
                <div className="mb-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">{saveError}</div>
              )}
              <EditProfileForm user={user} onSave={handleSaveProfile} onCancel={() => setEditing(false)} />
            </div>
          )}

          <div className="border-t mt-4 pt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </div>
        </div>

        {/* Order History */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-serif font-bold">Order History</h2>
            {orders.length > 0 && (
              <Badge variant="secondary" className="text-xs">{orders.length} order{orders.length !== 1 ? "s" : ""}</Badge>
            )}
          </div>

          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border rounded-xl p-5 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-muted/30 border-2 border-dashed border-border rounded-2xl p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
                <ShoppingBag className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-semibold mb-1">No orders yet</p>
              <p className="text-muted-foreground text-sm mb-5">Orders placed while signed in will appear here.</p>
              <Button asChild size="sm">
                <Link href={rpath("/menu")}>Start Ordering</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                const date = new Date(order.createdAt);
                return (
                  <Link key={order.id} href={rpath(`/order/${order.id}`)}>
                    <div className="bg-card border rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1">
                            <span className="font-serif font-bold">Order #{order.id}</span>
                            <Badge variant="outline" className={cn("flex items-center gap-1 text-xs px-2 py-0.5", cfg.color)}>
                              {cfg.icon}
                              {cfg.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            {" · "}
                            {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2 truncate">
                            {order.items.slice(0, 3).map((it, i) => (
                              <span key={i}>{i > 0 && ", "}{it.quantity}× {it.name}</span>
                            ))}
                            {order.items.length > 3 && <span className="text-primary font-medium"> +{order.items.length - 3} more</span>}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="font-bold text-primary">{formatCurrency(order.total)}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
