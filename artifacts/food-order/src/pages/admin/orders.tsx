import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useListOrders, useUpdateOrderStatus, useUpdateOrderPaymentStatus, useListRiders, useAssignRider, getListOrdersQueryKey, getGetOrderQueryKey, getGetDashboardStatsQueryKey, getListRidersQueryKey } from "@workspace/api-client-react";
import type { Order, OrderStatusUpdateStatus } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import {
  RefreshCw, Banknote, Smartphone, MapPin, Phone, Clock,
  StickyNote, CreditCard, Printer, ChefHat, CalendarIcon, Bike, Download, Ticket,
} from "lucide-react";
import { useRestaurant } from "@/lib/restaurant-context";
import { Input } from "@/components/ui/input";

const PAYMENT_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  cash_on_delivery: { label: "Cash",      icon: <Banknote className="w-3 h-3" />,   color: "bg-green-100 text-green-800 border-green-200" },
  jazz_cash:        { label: "JazzCash",  icon: <Smartphone className="w-3 h-3" />, color: "bg-red-100 text-red-800 border-red-200" },
  easy_paisa:       { label: "EasyPaisa", icon: <Smartphone className="w-3 h-3" />, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  preparing: "bg-purple-100 text-purple-800 border-purple-200",
  ready:     "bg-green-100 text-green-800 border-green-200",
  delivered: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", hour12: true }),
  };
}

function printDeliveryBill(order: Order, restaurantName: string) {
  const win = window.open("", "_blank", "width=420,height=650");
  if (!win) return;
  const { date, time } = formatDateTime(order.createdAt);
  const pm = PAYMENT_LABELS[order.paymentMethod]?.label ?? order.paymentMethod;
  win.document.write(`<!DOCTYPE html><html><head><title>Bill #${order.id}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 13px; padding: 20px; color: #111; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .big { font-size: 16px; }
  .xl { font-size: 20px; }
  .divider { border-top: 1px dashed #555; margin: 10px 0; }
  .row { display: flex; justify-content: space-between; gap: 8px; margin: 3px 0; }
  .item-name { flex: 1; }
  .info-row { margin: 3px 0; }
  .footer { margin-top: 16px; text-align: center; font-size: 11px; color: #555; }
  @media print { @page { margin: 8mm; } }
</style></head>
<body onload="window.print(); setTimeout(window.close, 500);">
<div class="center">
  <div class="xl bold">${restaurantName}</div>
  <div style="margin-top:4px">DELIVERY RECEIPT</div>
  <div style="margin-top:2px; font-size:11px">${date} ${time}</div>
</div>
<div class="divider"></div>
<div class="row bold big"><span>Order #${order.id}</span><span>${pm.toUpperCase()}</span></div>
<div class="divider"></div>
<div class="info-row"><span class="bold">Customer: </span>${order.customerName}</div>
<div class="info-row"><span class="bold">Phone: </span>${order.customerPhone}</div>
${order.customerAddress ? `<div class="info-row"><span class="bold">Address: </span>${order.customerAddress}</div>` : ""}
${order.notes ? `<div class="info-row"><span class="bold">Notes: </span>${order.notes}</div>` : ""}
<div class="divider"></div>
<div class="bold" style="margin-bottom:6px">ITEMS</div>
${order.items.map((i: {name:string;quantity:number;unitPrice:number}) => `<div class="row"><span class="item-name">${i.name}</span><span>x${i.quantity}</span><span>Rs ${(i.unitPrice * i.quantity).toFixed(0)}</span></div>`).join("")}
<div class="divider"></div>
<div class="row bold big"><span>TOTAL</span><span>Rs ${order.total.toFixed(0)}</span></div>
<div class="divider"></div>
<div class="footer">Thank you for your order!<br>Keep this receipt for your records.</div>
</body></html>`);
  win.document.close();
}

function printKitchenTicket(order: Order) {
  const win = window.open("", "_blank", "width=380,height=500");
  if (!win) return;
  const { date, time } = formatDateTime(order.createdAt);
  win.document.write(`<!DOCTYPE html><html><head><title>Kitchen #${order.id}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 15px; padding: 16px; color: #000; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .xl { font-size: 26px; font-weight: bold; }
  .divider { border-top: 2px solid #000; margin: 10px 0; }
  .row { display: flex; justify-content: space-between; align-items: center; margin: 6px 0; gap: 8px; }
  .item-name { flex: 1; }
  .qty { font-size: 20px; font-weight: bold; min-width: 36px; text-align: right; }
  .notes { border: 2px solid #000; padding: 8px; margin-top: 10px; font-size: 14px; }
  @media print { @page { margin: 6mm; } }
</style></head>
<body onload="window.print(); setTimeout(window.close, 500);">
<div class="center">
  <div>*** KITCHEN ORDER ***</div>
  <div class="xl">ORDER #${order.id}</div>
  <div style="font-size:12px; margin-top:4px">${date} — ${time}</div>
</div>
<div class="divider"></div>
${order.items.map((i: {name:string;quantity:number}) => `<div class="row"><span class="item-name bold">${i.name}</span><span class="qty">x${i.quantity}</span></div>`).join("")}
<div class="divider"></div>
<div style="font-size:13px"><span class="bold">Customer: </span>${order.customerName}</div>
${order.notes ? `<div class="notes"><strong>⚠ NOTES:</strong> ${order.notes}</div>` : ""}
</body></html>`);
  win.document.close();
}

const PAYMENT_STATUS_META: Record<string, { label: string; color: string }> = {
  not_required:  { label: "N/A",       color: "bg-gray-100 text-gray-700 border-gray-200" },
  pending:       { label: "Pending",   color: "bg-amber-100 text-amber-800 border-amber-200" },
  confirmed:     { label: "Confirmed", color: "bg-green-100 text-green-800 border-green-200" },
};

function OrderDetailDialog({
  order, open, onClose, restaurantName,
}: {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  restaurantName: string;
}) {
  const updateStatus = useUpdateOrderStatus();
  const updatePaymentStatus = useUpdateOrderPaymentStatus();
  const assignRider = useAssignRider();
  const queryClient = useQueryClient();
  const { data: riders = [] } = useListRiders({ query: { queryKey: getListRidersQueryKey() } });
  const [selectedRiderId, setSelectedRiderId] = useState<string>("none");

  useEffect(() => {
    setSelectedRiderId(order?.riderId != null ? String(order.riderId) : "none");
  }, [order?.id, order?.riderId]);

  if (!order) return null;

  const { date, time } = formatDateTime(order.createdAt);
  const pm = PAYMENT_LABELS[order.paymentMethod] ?? { label: order.paymentMethod, icon: null, color: "bg-gray-100 text-gray-800" };
  const ps = PAYMENT_STATUS_META[order.paymentStatus] ?? PAYMENT_STATUS_META["not_required"];

  const handleStatusChange = (newStatus: OrderStatusUpdateStatus) => {
    updateStatus.mutate(
      { id: order.id, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        },
      }
    );
  };

  const handleConfirmPayment = () => {
    updatePaymentStatus.mutate(
      { id: order.id, data: { paymentStatus: "confirmed" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(order.id) });
        },
      }
    );
  };

  const handleAssignRider = () => {
    const riderId = selectedRiderId === "none" ? null : Number(selectedRiderId);
    assignRider.mutate(
      { id: order.id, data: { riderId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        },
      }
    );
  };

  const activeRiders = riders.filter((r) => r.active);
  const currentRider = riders.find((r) => r.id === order.riderId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-serif text-xl">
            Order #{order.id}
            <Badge className={STATUS_COLORS[order.status] ?? "bg-gray-100"} variant="outline">
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Customer</p>
              <p className="font-semibold text-sm">{order.customerName}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1"><Clock className="w-3 h-3" /> Time</p>
              <p className="font-semibold text-sm">{date}</p>
              <p className="text-xs text-muted-foreground">{time}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
              <p className="font-semibold text-sm">{order.customerPhone}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1"><CreditCard className="w-3 h-3" /> Payment</p>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge className={`${pm.color} gap-1`} variant="outline">
                  {pm.icon}{pm.label}
                </Badge>
                <Badge className={`${ps.color}`} variant="outline">
                  {ps.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Confirm payment button for JazzCash / EasyPaisa */}
          {order.paymentMethod !== "cash_on_delivery" && order.paymentStatus !== "confirmed" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-800">Payment Awaiting Confirmation</p>
                <p className="text-xs text-amber-700 mt-0.5">Mark as paid once you've verified the transfer.</p>
              </div>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                disabled={updatePaymentStatus.isPending}
                onClick={handleConfirmPayment}
              >
                {updatePaymentStatus.isPending ? "Confirming..." : "Confirm Payment"}
              </Button>
            </div>
          )}
          {order.paymentMethod !== "cash_on_delivery" && order.paymentStatus === "confirmed" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-green-800">Payment Confirmed</p>
              <p className="text-xs text-green-700 mt-0.5">This order's payment has been verified.</p>
            </div>
          )}

          {/* Rider Assignment */}
          <div className="bg-muted/40 border rounded-lg p-3 space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
              <Bike className="w-3 h-3" /> Delivery Rider
            </p>
            {currentRider ? (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{currentRider.name}</p>
                  <p className="text-xs text-muted-foreground">{currentRider.phone}</p>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Assigned</Badge>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No rider assigned yet</p>
            )}
            {activeRiders.length > 0 && (
              <div className="flex gap-2 items-center pt-1">
                <Select value={selectedRiderId} onValueChange={setSelectedRiderId}>
                  <SelectTrigger className="flex-1 h-8 text-sm">
                    <SelectValue placeholder="Select a rider…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No rider —</SelectItem>
                    {activeRiders.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name} · {r.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 h-8 text-xs"
                  disabled={assignRider.isPending || selectedRiderId === (order.riderId != null ? String(order.riderId) : "none")}
                  onClick={handleAssignRider}
                >
                  {assignRider.isPending ? "Saving…" : "Assign"}
                </Button>
              </div>
            )}
            {activeRiders.length === 0 && (
              <p className="text-xs text-muted-foreground">Add active riders on the Riders page to assign deliveries.</p>
            )}
          </div>

          {order.customerAddress && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1"><MapPin className="w-3 h-3" /> Delivery Address</p>
              <p className="text-sm font-medium">{order.customerAddress}</p>
            </div>
          )}

          {order.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
              <p className="text-xs text-amber-700 font-medium uppercase tracking-wide flex items-center gap-1"><StickyNote className="w-3 h-3" /> Special Notes</p>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Items Ordered</p>
            <div className="border rounded-lg overflow-hidden">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b last:border-0 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-primary/10 text-primary text-xs font-bold rounded flex items-center justify-center">{item.quantity}x</span>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
              {(order as any).discountAmount > 0 && (
                <>
                  <div className="flex items-center justify-between px-4 py-2.5 border-b text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.total + (order as any).discountAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 border-b text-sm text-green-700 bg-green-50/60">
                    <span className="flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5" />
                      Coupon {(order as any).couponCode ? `(${(order as any).couponCode})` : ""}
                    </span>
                    <span className="font-semibold">− {formatCurrency((order as any).discountAmount)}</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between px-4 py-3 bg-muted/50 font-bold text-base">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Update Status</p>
            <Select value={order.status} onValueChange={(val: OrderStatusUpdateStatus) => handleStatusChange(val)} disabled={updateStatus.isPending}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Print Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => printDeliveryBill(order, restaurantName)}
            >
              <Printer className="w-4 h-4" />
              Print Delivery Bill
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => printKitchenTicket(order)}
            >
              <ChefHat className="w-4 h-4" />
              Print Kitchen Ticket
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { restaurant } = useRestaurant();

  const queryParams: Record<string, any> = {};
  if (statusFilter !== "all") queryParams.status = statusFilter;
  if (dateFrom) queryParams.dateFrom = dateFrom;
  if (dateTo) queryParams.dateTo = dateTo;

  const { data: orders, isLoading, refetch, isFetching } = useListOrders(
    queryParams,
    { query: { queryKey: getListOrdersQueryKey(queryParams), refetchInterval: 15000 } }
  );

  const updateStatus = useUpdateOrderStatus();
  const queryClient = useQueryClient();

  const handleStatusChange = (orderId: number, newStatus: OrderStatusUpdateStatus) => {
    updateStatus.mutate(
      { id: orderId, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        },
      }
    );
  };

  const clearDates = () => { setDateFrom(""); setDateTo(""); };

  const exportCSV = () => {
    if (!orders || orders.length === 0) return;
    const headers = ["Order ID", "Date", "Time", "Customer", "Phone", "Address", "Items", "Total (Rs)", "Payment", "Payment Status", "Status", "Notes"];
    const rows = orders.map((o) => {
      const d = new Date(o.createdAt);
      const date = d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
      const time = d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", hour12: true });
      const items = o.items.map((i: {name:string;quantity:number}) => `${i.name}×${i.quantity}`).join("; ");
      const pm = PAYMENT_LABELS[o.paymentMethod]?.label ?? o.paymentMethod;
      return [
        o.id,
        date,
        time,
        o.customerName,
        o.customerPhone,
        o.customerAddress ?? "",
        items,
        o.total.toFixed(0),
        pm,
        o.paymentStatus,
        o.status,
        o.notes ?? "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `orders-${restaurant?.name ?? "export"}-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold">Orders</h1>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Auto-refreshes every 15s · click a row for details</p>
            </div>
            <div className="flex gap-2 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                disabled={!orders || orders.length === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 w-36 text-sm"
                placeholder="From"
              />
              <span className="text-muted-foreground text-sm">—</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 w-36 text-sm"
                placeholder="To"
              />
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={clearDates} className="h-9 px-2 text-xs">
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      {Array(8).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                    </TableRow>
                  ))
                ) : orders?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No orders found{(dateFrom || dateTo) ? " for this date range" : ""}.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders?.map((order) => {
                    const { date, time } = formatDateTime(order.createdAt);
                    const pm = PAYMENT_LABELS[order.paymentMethod] ?? { label: order.paymentMethod, icon: null, color: "bg-gray-100 text-gray-800 border-gray-200" };
                    return (
                      <TableRow key={order.id} className="cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => setSelectedOrder(order)}>
                        <TableCell className="font-bold text-primary">#{order.id}</TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{date}</div>
                          <div className="text-xs text-muted-foreground">{time}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                          {order.customerAddress && (
                            <div className="text-xs text-muted-foreground truncate max-w-[160px]">{order.customerAddress}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>{order.items.reduce((acc, item) => acc + item.quantity, 0)} items</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {order.items.map(i => i.name).join(", ")}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(order.total)}</TableCell>
                        <TableCell>
                          <Badge className={`${pm.color} gap-1 flex items-center w-fit`} variant="outline">
                            {pm.icon}{pm.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[order.status] ?? "bg-gray-100"} variant="outline">
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Select value={order.status} onValueChange={(val: OrderStatusUpdateStatus) => handleStatusChange(order.id, val)} disabled={updateStatus.isPending}>
                            <SelectTrigger className="w-[130px] ml-auto h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="preparing">Preparing</SelectItem>
                              <SelectItem value="ready">Ready</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
          ) : orders?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No orders found.</div>
          ) : (
            orders?.map((order) => {
              const { date, time } = formatDateTime(order.createdAt);
              const pm = PAYMENT_LABELS[order.paymentMethod] ?? { label: order.paymentMethod, icon: null, color: "bg-gray-100 text-gray-800 border-gray-200" };
              return (
                <div
                  key={order.id}
                  className="bg-card rounded-xl border p-4 cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="font-bold text-primary text-base">Order #{order.id}</div>
                      <div className="text-sm font-medium">{order.customerName}</div>
                      <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-base">{formatCurrency(order.total)}</div>
                      <div className="text-xs text-muted-foreground">{date} {time}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={STATUS_COLORS[order.status] ?? "bg-gray-100"} variant="outline">
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                    <Badge className={`${pm.color} gap-1`} variant="outline">{pm.icon}{pm.label}</Badge>
                    <span className="text-xs text-muted-foreground">{order.items.reduce((a, i) => a + i.quantity, 0)} items</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <OrderDetailDialog
        order={selectedOrder}
        open={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        restaurantName={restaurant?.name ?? "Restaurant"}
      />
    </AdminLayout>
  );
}
