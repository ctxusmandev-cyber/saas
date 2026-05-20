import { Layout } from "@/components/layout";
import { useParams, Link } from "wouter";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import {
  CheckCircle2, Clock, MapPin, Phone, Package, ChefHat,
  Bike, PartyPopper, XCircle, ShoppingBag, RefreshCw, ChevronLeft,
  Smartphone, AlertCircle, CircleCheck, Printer, Share2, Check,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRestaurantPath } from "@/lib/use-slug";
import { useEffect, useState, useRef } from "react";

const ORDER_STEPS = [
  { key: "pending",   label: "Received",   icon: ShoppingBag,  desc: "We've got your order" },
  { key: "confirmed", label: "Confirmed",  icon: CheckCircle2, desc: "Kitchen is on it" },
  { key: "preparing", label: "Preparing",  icon: ChefHat,      desc: "Being prepared now" },
  { key: "ready",     label: "Ready",      icon: Bike,         desc: "Ready for delivery" },
  { key: "delivered", label: "Delivered",  icon: PartyPopper,  desc: "Enjoy your meal!" },
] as const;

const STATUS_ORDER = ["pending", "confirmed", "preparing", "ready", "delivered"];

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  pending:   { color: "text-amber-700",   bg: "bg-amber-100 border-amber-300",  label: "Order Received" },
  confirmed: { color: "text-blue-700",    bg: "bg-blue-100 border-blue-300",    label: "Kitchen Confirmed" },
  preparing: { color: "text-violet-700",  bg: "bg-violet-100 border-violet-300",label: "Preparing Food" },
  ready:     { color: "text-green-700",   bg: "bg-green-100 border-green-300",  label: "Ready for Pickup" },
  delivered: { color: "text-gray-700",    bg: "bg-gray-100 border-gray-300",    label: "Delivered" },
  cancelled: { color: "text-red-700",     bg: "bg-red-100 border-red-300",      label: "Cancelled" },
};

const REFETCH_INTERVAL = 10000;

function useLastUpdated(isFetching: boolean) {
  const [secondsAgo, setSecondsAgo] = useState(0);
  const lastFetchRef = useRef(Date.now());

  useEffect(() => {
    if (isFetching) {
      lastFetchRef.current = Date.now();
      setSecondsAgo(0);
    }
  }, [isFetching]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(Math.round((Date.now() - lastFetchRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return secondsAgo;
}

function ShareButton({ orderId }: { orderId: number }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Track Order #${orderId}`, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors border rounded-md px-2.5 py-1.5 bg-background"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? "Link Copied!" : "Share"}
    </button>
  );
}

export default function OrderTracking() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ? parseInt(params.id, 10) : undefined;
  const rpath = useRestaurantPath();
  const isDelivered = useRef(false);

  const { data: order, isLoading, refetch, isFetching } = useGetOrder(orderId!, {
    query: {
      enabled: !!orderId,
      queryKey: getGetOrderQueryKey(orderId!),
      refetchInterval: isDelivered.current ? false : REFETCH_INTERVAL,
    },
  });

  const secondsAgo = useLastUpdated(isFetching);

  useEffect(() => {
    if (order?.status === "delivered" || order?.status === "cancelled") {
      isDelivered.current = true;
    }
  }, [order?.status]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-2xl space-y-6">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-52 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
            <Package className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <h1 className="text-2xl font-serif font-bold mb-2">Order Not Found</h1>
          <p className="text-muted-foreground text-sm mb-6">
            We couldn't find this order. It may have been removed or the link is incorrect.
          </p>
          <Link href={rpath("/menu")}>
            <Button className="rounded-xl">Back to Menu</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const meta = STATUS_META[order.status] ?? STATUS_META["pending"];
  const isCancelled = order.status === "cancelled";
  const isDone = order.status === "delivered" || isCancelled;
  const currentStepIndex = STATUS_ORDER.indexOf(order.status);

  return (
    <Layout>
      <div className="bg-muted/30 border-b py-4">
        <div className="container mx-auto px-4 max-w-2xl flex items-center justify-between flex-wrap gap-3">
          <Link href={rpath("/my-orders")}>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft className="h-4 w-4" /> My Orders
            </button>
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            {/* LIVE indicator */}
            {!isDone && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2.5 py-1.5 bg-background">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                {secondsAgo < 5 ? "Just updated" : `${secondsAgo}s ago`}
              </span>
            )}
            <ShareButton orderId={order.id} />
            <Link href={rpath(`/order/${order.id}/receipt`)}>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors border rounded-md px-2.5 py-1.5 bg-background">
                <Printer className="h-3.5 w-3.5" />
                Receipt
              </button>
            </Link>
            <button
              onClick={() => refetch()}
              className={cn(
                "flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors",
                isFetching && "opacity-50 pointer-events-none"
              )}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-2xl">
        {/* Confirmation Header */}
        <div className="text-center mb-10">
          {isCancelled ? (
            <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">
            {isCancelled ? "Order Cancelled" : `Thank you, ${order.customerName}!`}
          </h1>
          <p className="text-muted-foreground">
            {isCancelled
              ? "This order was cancelled. Please contact us if you need help."
              : `Order #${order.id} has been placed successfully.`}
          </p>
          <Badge className={cn("mt-4 px-4 py-1.5 border text-sm font-semibold", meta.bg, meta.color)} variant="outline">
            {meta.label}
          </Badge>

          {/* Share tracking link callout */}
          {!isCancelled && (
            <div className="mt-5 inline-flex items-center gap-2 bg-muted/60 border rounded-xl px-4 py-2.5 text-sm text-muted-foreground">
              <Share2 className="h-4 w-4 shrink-0 text-primary" />
              <span>Share this page to let someone track your order live</span>
              <ShareButton orderId={order.id} />
            </div>
          )}
        </div>

        {/* Progress Tracker */}
        {!isCancelled && (
          <Card className="mb-6 overflow-hidden border shadow-sm">
            <CardHeader className="bg-primary/5 border-b pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Order Progress
                </CardTitle>
                {!isDone && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                    </span>
                    Auto-updates every 10s
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start gap-0">
                {ORDER_STEPS.map((step, idx) => {
                  const isCompleted = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  const Icon = step.icon;
                  const isLast = idx === ORDER_STEPS.length - 1;

                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center relative">
                      {!isLast && (
                        <div
                          className={cn(
                            "absolute top-5 left-1/2 right-0 h-0.5 z-0 transition-all duration-700",
                            isCompleted ? "bg-primary" : "bg-muted"
                          )}
                          style={{ width: "calc(100% - 20px)", left: "calc(50% + 10px)" }}
                        />
                      )}
                      <div
                        className={cn(
                          "relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 mb-2",
                          isCompleted
                            ? "bg-primary border-primary text-primary-foreground"
                            : isCurrent
                            ? "bg-primary/15 border-primary text-primary animate-pulse"
                            : "bg-muted border-muted-foreground/20 text-muted-foreground/40"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className={cn(
                        "text-xs font-semibold text-center leading-tight",
                        isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground/50"
                      )}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
              {currentStepIndex >= 0 && currentStepIndex < ORDER_STEPS.length && (
                <p className="text-center text-sm text-muted-foreground mt-6">
                  {ORDER_STEPS[currentStepIndex].desc}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment Status Banner */}
        {order.paymentMethod !== "cash_on_delivery" && (
          <Card className={cn(
            "mb-6 shadow-sm border-2",
            order.paymentStatus === "confirmed"
              ? "border-green-300 bg-green-50"
              : "border-amber-300 bg-amber-50"
          )}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  order.paymentStatus === "confirmed"
                    ? "bg-green-100 text-green-600"
                    : "bg-amber-100 text-amber-600"
                )}>
                  {order.paymentStatus === "confirmed"
                    ? <CircleCheck className="w-5 h-5" />
                    : <AlertCircle className="w-5 h-5" />
                  }
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={cn(
                      "font-semibold text-sm",
                      order.paymentStatus === "confirmed" ? "text-green-800" : "text-amber-800"
                    )}>
                      {order.paymentStatus === "confirmed" ? "Payment Confirmed" : "Payment Pending"}
                    </p>
                    <Badge variant="outline" className={cn(
                      "text-[10px] px-2 py-0",
                      order.paymentMethod === "jazz_cash"
                        ? "border-red-300 text-red-700 bg-red-50"
                        : "border-emerald-300 text-emerald-700 bg-emerald-50"
                    )}>
                      {order.paymentMethod === "jazz_cash"
                        ? <><Smartphone className="w-2.5 h-2.5 mr-1 inline" />JazzCash</>
                        : <><Smartphone className="w-2.5 h-2.5 mr-1 inline" />EasyPaisa</>
                      }
                    </Badge>
                  </div>
                  <p className={cn(
                    "text-xs mt-0.5",
                    order.paymentStatus === "confirmed" ? "text-green-700" : "text-amber-700"
                  )}>
                    {order.paymentStatus === "confirmed"
                      ? "Your payment has been verified. Thank you!"
                      : "We're waiting to verify your payment. Please ensure you've sent the correct amount."
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rider Info */}
        {order.riderName && (
          <Card className="mb-6 shadow-sm border-blue-200 bg-blue-50">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-blue-900">Your Delivery Rider</p>
                  <p className="text-blue-800 font-medium">{order.riderName}</p>
                  {order.riderPhone && (
                    <a href={`tel:${order.riderPhone}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />{order.riderPhone}
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Info */}
        <Card className="mb-6 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-serif">Delivery Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Order Time</p>
                  <p className="font-medium text-sm mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Contact</p>
                  <p className="font-medium text-sm mt-0.5">{order.customerPhone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                    {order.customerAddress ? "Delivery Address" : "Pickup"}
                  </p>
                  <p className="font-medium text-sm mt-0.5">{order.customerAddress || "In-store pickup"}</p>
                </div>
              </div>
              {order.notes && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Notes</p>
                    <p className="font-medium text-sm mt-0.5">{order.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-serif">Items Ordered</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 py-2 border-b last:border-0">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {item.quantity}×
                  </div>
                  <span className="font-medium text-sm flex-1">{item.name}</span>
                  <span className="font-semibold text-sm">{formatCurrency(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Delivery Fee</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-3 border-t">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href={rpath("/menu")}>
            <Button variant="outline" className="rounded-xl gap-2">
              <ShoppingBag className="h-4 w-4" /> Order Again
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
