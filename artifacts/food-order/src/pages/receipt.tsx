import { useParams, Link } from "wouter";
import { useGetOrder } from "@workspace/api-client-react";
import { useRestaurant } from "@/lib/restaurant-context";
import { useRestaurantPath } from "@/lib/use-slug";
import { formatCurrency } from "@/lib/format";
import { Printer, ArrowLeft, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PAYMENT_LABELS: Record<string, string> = {
  cash_on_delivery: "Cash on Delivery",
  jazz_cash: "JazzCash",
  easy_paisa: "EasyPaisa",
};

function formatReceiptDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-PK", { day: "2-digit", month: "long", year: "numeric" }),
    time: d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", hour12: true }),
  };
}

export default function Receipt() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ? parseInt(params.id, 10) : undefined;
  const { restaurant } = useRestaurant();
  const rpath = useRestaurantPath();

  const { data: order, isLoading } = useGetOrder(orderId!, {
    query: { enabled: !!orderId },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="space-y-4 w-full max-w-sm">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-muted-foreground">Order not found.</p>
      </div>
    );
  }

  const { date, time } = formatReceiptDate(order.createdAt);
  const pm = PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod;

  return (
    <>
      {/* Print controls — hidden when printing */}
      <div className="print:hidden bg-muted/40 border-b px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-10">
        <Link href={rpath(`/order/${order.id}`)}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Order
          </Button>
        </Link>
        <Button onClick={() => window.print()} className="gap-2" size="sm">
          <Printer className="w-4 h-4" />
          Print / Save as PDF
        </Button>
      </div>

      {/* Receipt */}
      <div className="min-h-screen bg-gray-100 print:bg-white flex justify-center py-8 print:py-0">
        <div
          id="receipt"
          className="bg-white w-full max-w-sm mx-4 print:mx-0 print:max-w-none rounded-lg shadow-md print:shadow-none p-6 print:p-4 font-mono text-sm"
        >
          {/* Header */}
          <div className="text-center border-b border-dashed pb-4 mb-4">
            {restaurant?.logoUrl && (
              <img
                src={restaurant.logoUrl}
                alt={restaurant.name}
                className="h-12 w-12 object-contain mx-auto mb-2 rounded"
              />
            )}
            <h1 className="text-xl font-bold tracking-wide uppercase">
              {restaurant?.name ?? "Restaurant"}
            </h1>
            {restaurant?.address && (
              <p className="text-xs text-gray-500 mt-0.5">{restaurant.address}</p>
            )}
            {restaurant?.phone && (
              <p className="text-xs text-gray-500">{restaurant.phone}</p>
            )}
            <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest">Receipt</p>
          </div>

          {/* Order info */}
          <div className="space-y-1 border-b border-dashed pb-4 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Order #</span>
              <span className="font-bold">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span>{date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Time</span>
              <span>{time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment</span>
              <span>{pm}</span>
            </div>
          </div>

          {/* Customer info */}
          <div className="space-y-1 border-b border-dashed pb-4 mb-4">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500 shrink-0">Customer</span>
              <span className="text-right">{order.customerName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500 shrink-0">Phone</span>
              <span className="text-right">{order.customerPhone}</span>
            </div>
            {order.customerAddress && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Address</span>
                <span className="text-right text-xs leading-snug">{order.customerAddress}</span>
              </div>
            )}
          </div>

          {/* Rider info */}
          {order.riderName && (
            <div className="space-y-1 border-b border-dashed pb-4 mb-4">
              <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                <Bike className="w-3 h-3" />
                <span className="uppercase tracking-wide">Delivery Rider</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Name</span>
                <span>{order.riderName}</span>
              </div>
              {order.riderPhone && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 shrink-0">Phone</span>
                  <span>{order.riderPhone}</span>
                </div>
              )}
            </div>
          )}

          {/* Items */}
          <div className="border-b border-dashed pb-4 mb-4">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Items</p>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between gap-2">
                  <span className="flex-1 leading-snug">{item.name}</span>
                  <span className="text-gray-500 shrink-0">×{item.quantity}</span>
                  <span className="shrink-0 text-right">{formatCurrency(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="space-y-1 border-b border-dashed pb-4 mb-4">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Delivery</span>
              <span>—</span>
            </div>
            <div className="flex justify-between font-bold text-base mt-1">
              <span>TOTAL</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 space-y-0.5">
            <p className="font-semibold text-gray-600">Thank you for your order!</p>
            <p>We hope you enjoy your meal.</p>
            {restaurant?.phone && <p>Questions? Call {restaurant.phone}</p>}
          </div>

          {/* Barcode-style decoration */}
          <div className="mt-4 flex justify-center opacity-20">
            <div className="flex gap-0.5">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="bg-black" style={{ width: i % 3 === 0 ? 3 : 1, height: 24 }} />
              ))}
            </div>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-1">#{String(order.id).padStart(8, "0")}</p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          #receipt { box-shadow: none !important; }
        }
      `}</style>
    </>
  );
}
