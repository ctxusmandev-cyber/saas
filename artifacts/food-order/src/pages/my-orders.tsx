import { Layout } from "@/components/layout";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { getOrderIds } from "@/lib/order-history";
import { Link } from "wouter";
import { useRestaurantPath } from "@/lib/use-slug";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ChevronRight, ShoppingBag, Package, CheckCircle2, Utensils, Bike, XCircle } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; step: number }> = {
  pending:   { label: "Order Received",       color: "bg-amber-100 text-amber-800 border-amber-200",     icon: <Clock className="w-3.5 h-3.5" />,       step: 1 },
  confirmed: { label: "Confirmed",             color: "bg-blue-100 text-blue-800 border-blue-200",        icon: <CheckCircle2 className="w-3.5 h-3.5" />, step: 2 },
  preparing: { label: "Preparing",             color: "bg-purple-100 text-purple-800 border-purple-200",  icon: <Utensils className="w-3.5 h-3.5" />,     step: 3 },
  ready:     { label: "Ready for Pickup",      color: "bg-green-100 text-green-800 border-green-200",     icon: <Package className="w-3.5 h-3.5" />,      step: 4 },
  delivered: { label: "Delivered",             color: "bg-gray-100 text-gray-700 border-gray-200",        icon: <Bike className="w-3.5 h-3.5" />,          step: 5 },
  cancelled: { label: "Cancelled",             color: "bg-red-100 text-red-800 border-red-200",           icon: <XCircle className="w-3.5 h-3.5" />,      step: 0 },
};

const STEPS = ["pending", "confirmed", "preparing", "ready", "delivered"];

function StatusBar({ status }: { status: string }) {
  const currentStep = STATUS_CONFIG[status]?.step ?? 0;
  if (status === "cancelled") return null;
  return (
    <div className="flex items-center gap-1 mt-3">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-1 flex-1 last:flex-none">
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${STATUS_CONFIG[s].step <= currentStep ? "bg-primary" : "bg-muted"}`} />
          {i === STEPS.length - 1 && (
            <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].step <= currentStep ? "bg-primary" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function OrderCard({ orderId }: { orderId: number }) {
  const rpath = useRestaurantPath();
  const { data: order, isLoading } = useGetOrder(orderId, {
    query: {
      enabled: true,
      queryKey: getGetOrderQueryKey(orderId),
      refetchInterval: 15000,
    },
  });

  if (isLoading) {
    return (
      <div className="bg-card border rounded-xl p-5 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-2 w-full mt-3" />
      </div>
    );
  }

  if (!order) return null;

  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const date = new Date(order.createdAt);

  return (
    <Link href={rpath(`/order/${order.id}`)}>
      <div className="bg-card border rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-serif font-bold text-lg">Order #{order.id}</span>
              <Badge variant="outline" className={`flex items-center gap-1 text-xs px-2 py-0.5 ${cfg.color}`}>
                {cfg.icon}
                {cfg.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              {" · "}
              {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </p>

            <div className="mt-3 text-sm text-muted-foreground">
              {order.items.slice(0, 3).map((item, i) => (
                <span key={i}>{i > 0 && ", "}{item.quantity}× {item.name}</span>
              ))}
              {order.items.length > 3 && (
                <span className="text-primary font-medium"> +{order.items.length - 3} more</span>
              )}
            </div>

            <StatusBar status={order.status} />
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="font-bold text-lg text-primary">{formatCurrency(order.total)}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function MyOrders() {
  const rpath = useRestaurantPath();
  const orderIds = getOrderIds();

  if (orderIds.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 max-w-2xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-muted rounded-full mb-6">
            <ShoppingBag className="w-9 h-9 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-serif font-bold mb-3">No Orders Yet</h1>
          <p className="text-muted-foreground text-lg mb-8">
            You haven't placed any orders on this device. Start exploring our menu!
          </p>
          <Button asChild size="lg">
            <Link href={rpath("/menu")}>Browse Menu</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">Track your orders and view your order history. Updates every 15 seconds.</p>
        </div>

        <div className="space-y-4">
          {orderIds.map((id) => <OrderCard key={id} orderId={id} />)}
        </div>

        <div className="mt-10 text-center">
          <Button variant="outline" asChild>
            <Link href={rpath("/menu")}>Order Again</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
