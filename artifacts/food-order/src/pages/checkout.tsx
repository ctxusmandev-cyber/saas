import { Layout } from "@/components/layout";
import { useCart } from "@/lib/cart";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { saveOrderId } from "@/lib/order-history";
import { useLocation, Link } from "wouter";
import { useRestaurantPath } from "@/lib/use-slug";
import { Trash2, Banknote, Smartphone, ShoppingBag, ChevronLeft, Plus, Minus, Tag, Lock, AlertCircle, Copy, CheckCheck, X, Loader2, Ticket, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useRestaurant } from "@/lib/restaurant-context";
import { useCustomerAuth } from "@/lib/customer-auth";
import { useState, useEffect } from "react";

const PAYMENT_METHODS = [
  {
    value: "cash_on_delivery",
    label: "Cash on Delivery",
    description: "Pay when your order arrives",
    icon: Banknote,
    colorClass: "text-green-600",
    bg: "bg-green-50 border-green-200",
    activeBg: "bg-green-100 border-green-500",
    badge: "Most Popular",
  },
  {
    value: "jazz_cash",
    label: "JazzCash",
    description: "Pay via JazzCash mobile wallet",
    icon: Smartphone,
    colorClass: "text-red-600",
    bg: "bg-red-50 border-red-200",
    activeBg: "bg-red-100 border-red-500",
    badge: null,
  },
  {
    value: "easy_paisa",
    label: "EasyPaisa",
    description: "Pay via EasyPaisa mobile wallet",
    icon: Smartphone,
    colorClass: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    activeBg: "bg-emerald-100 border-emerald-500",
    badge: null,
  },
] as const;

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerPhone: z.string().min(10, "Enter a valid phone number"),
  customerAddress: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["cash_on_delivery", "jazz_cash", "easy_paisa"]),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground ml-2"
    >
      {copied ? <CheckCheck className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function PaymentInstructions({ method, restaurant }: {
  method: "jazz_cash" | "easy_paisa";
  restaurant: { jazzCashNumber?: string | null; easyPaisaNumber?: string | null } | null;
}) {
  const isJazzCash = method === "jazz_cash";
  const accountNumber = isJazzCash ? restaurant?.jazzCashNumber : restaurant?.easyPaisaNumber;
  const label = isJazzCash ? "JazzCash" : "EasyPaisa";
  const colorBg = isJazzCash ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200";
  const colorText = isJazzCash ? "text-red-700" : "text-emerald-700";
  const colorDot = isJazzCash ? "bg-red-500" : "bg-emerald-500";

  return (
    <div className={cn("rounded-xl border p-4 mt-3", colorBg)}>
      <div className={cn("flex items-center gap-2 font-semibold text-sm mb-3", colorText)}>
        <AlertCircle className="w-4 h-4" />
        How to pay with {label}
      </div>
      {accountNumber ? (
        <>
          <div className="bg-white/80 rounded-lg p-3 mb-3 border flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Send payment to</p>
              <p className="font-bold text-base tracking-wide">{accountNumber}</p>
            </div>
            <CopyButton text={accountNumber} />
          </div>
          <ol className="space-y-2">
            {[
              `Open your ${label} app`,
              `Go to "Send Money" or "Mobile Account"`,
              `Enter the number above and the order total`,
              `Use your order number as the reference/note`,
              `Send the screenshot to us for confirmation`,
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className={cn("w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5", colorDot)}>
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted-foreground mt-3 border-t pt-3">
            Your order will be confirmed once payment is verified by our team.
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Payment details will be provided by the restaurant. Please contact them after placing your order.
        </p>
      )}
    </div>
  );
}

interface AppliedCoupon {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  description?: string | null;
  discountAmount: number;
}

function CouponInput({ subtotal, onApply, onRemove, appliedCoupon, restaurantId }: {
  subtotal: number;
  onApply: (coupon: AppliedCoupon) => void;
  onRemove: () => void;
  appliedCoupon: AppliedCoupon | null;
  restaurantId: number;
}) {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!code.trim()) return;
    setIsValidating(true);
    setError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-restaurant-id": String(restaurantId) },
        body: JSON.stringify({ code: code.trim(), orderTotal: subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        onApply({ ...data.coupon, discountAmount: data.discountAmount });
        setCode("");
      } else {
        setError(data.error ?? "Invalid coupon");
      }
    } catch {
      setError("Failed to validate coupon. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 flex items-center gap-3">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
          <Ticket className="w-4 h-4 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-green-800">{appliedCoupon.code}</span>
            <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1.5 py-0">Applied</Badge>
          </div>
          <p className="text-xs text-green-700 mt-0.5">
            {appliedCoupon.discountType === "percentage"
              ? `${appliedCoupon.discountValue}% off`
              : `Rs ${appliedCoupon.discountValue} off`}
            {" · "}saving {formatCurrency(appliedCoupon.discountAmount)}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-lg text-green-600 hover:bg-green-100 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Enter coupon code"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
            className={cn("pl-9 rounded-xl h-10 font-mono uppercase", error && "border-destructive")}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApply())}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleApply}
          disabled={!code.trim() || isValidating}
          className="h-10 px-4 rounded-xl shrink-0"
        >
          {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export default function Checkout() {
  const { items, total, removeFromCart, updateQuantity, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const rpath = useRestaurantPath();
  const createOrder = useCreateOrder();
  const queryClient = useQueryClient();
  const { restaurant } = useRestaurant();
  const { user } = useCustomerAuth();
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      notes: "",
      paymentMethod: "cash_on_delivery",
    },
  });

  useEffect(() => {
    if (user) {
      form.setValue("customerName", user.name, { shouldValidate: false });
      if (user.phone) form.setValue("customerPhone", user.phone, { shouldValidate: false });
    }
  }, [user?.id]);

  const selectedPayment = form.watch("paymentMethod");
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const grandTotal = Math.max(0, total - discountAmount);

  const onSubmit = (data: CheckoutFormValues) => {
    if (items.length === 0) return;
    createOrder.mutate(
      {
        data: {
          ...data,
          items: items.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })),
          // @ts-ignore — couponCode is handled server-side, passed through
          couponCode: appliedCoupon?.code,
        },
      },
      {
        onSuccess: (order) => {
          clearCart();
          saveOrderId(order.id);
          queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(order.id) });
          setLocation(rpath(`/order/${order.id}`));
        },
      }
    );
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-28 text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-9 w-9 text-muted-foreground/50" />
          </div>
          <h1 className="text-3xl font-serif font-bold mb-3">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
            Looks like you haven't added anything to your order yet. Head to the menu to get started.
          </p>
          <Link href={rpath("/menu")}>
            <Button size="lg" className="rounded-xl px-8">Browse Menu</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-muted/30 border-b py-4">
        <div className="container mx-auto px-4">
          <Link href={rpath("/menu")}>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft className="h-4 w-4" /> Back to Menu
            </button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-bold">Checkout</h1>
          <p className="text-muted-foreground mt-1 text-sm">{items.length} item{items.length > 1 ? "s" : ""} in your order</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Form Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Customer Info */}
            <div className="bg-card border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</div>
                <h2 className="text-xl font-serif font-bold">Your Details</h2>
              </div>
              <Form {...form}>
                <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Ahmed Ali" className="rounded-xl h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="03XX-XXXXXXX" className="rounded-xl h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="customerAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Delivery Address
                          <span className="text-muted-foreground font-normal ml-1">(optional — leave blank for pickup)</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea placeholder="Street address, building, area..." className="resize-none rounded-xl" rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Order Notes
                          <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea placeholder="Allergies, spice level, special instructions..." className="resize-none rounded-xl" rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>

            {/* Payment */}
            <div className="bg-card border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</div>
                <h2 className="text-xl font-serif font-bold">Payment Method</h2>
              </div>
              <Form {...form}>
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <div className="space-y-3">
                        {PAYMENT_METHODS.map((method) => {
                          const Icon = method.icon;
                          const isSelected = field.value === method.value;
                          return (
                            <button
                              key={method.value}
                              type="button"
                              onClick={() => field.onChange(method.value)}
                              className={cn(
                                "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                                isSelected ? method.activeBg : cn(method.bg, "hover:opacity-80")
                              )}
                            >
                              <div className={cn("p-2.5 rounded-xl bg-white/70 shadow-sm", method.colorClass)}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-sm">{method.label}</p>
                                  {method.badge && (
                                    <Badge className="text-[10px] px-2 py-0 bg-primary/10 text-primary border-primary/20">
                                      {method.badge}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{method.description}</p>
                              </div>
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                                isSelected ? "border-current bg-current" : "border-muted-foreground/40"
                              )}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Form>

              {/* Payment instructions */}
              {(selectedPayment === "jazz_cash" || selectedPayment === "easy_paisa") && (
                <PaymentInstructions
                  method={selectedPayment}
                  restaurant={restaurant as any}
                />
              )}
            </div>
          </div>

          {/* Order Summary Column */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">
              <div className="bg-card border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">3</div>
                  <h2 className="text-xl font-serif font-bold">Order Summary</h2>
                </div>

                <div className="space-y-3 mb-5 max-h-64 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.menuItemId} className="flex gap-3 items-center bg-muted/40 p-3 rounded-xl border">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-14 h-14 object-cover rounded-lg shrink-0" />
                      ) : (
                        <div className="w-14 h-14 bg-muted rounded-lg shrink-0 flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm font-serif truncate">{item.name}</h4>
                        <div className="text-primary font-medium text-sm">{formatCurrency(item.price)}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          className="w-7 h-7 rounded-lg border bg-background hover:bg-muted flex items-center justify-center transition-colors"
                          onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          className="w-7 h-7 rounded-lg border bg-background hover:bg-muted flex items-center justify-center transition-colors"
                          onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          className="w-7 h-7 rounded-lg hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors ml-1 text-muted-foreground"
                          onClick={() => removeFromCart(item.menuItemId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Section */}
                <div className="mb-4 pb-4 border-b">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2.5 flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5" /> Have a coupon?
                  </p>
                  {restaurant && (
                    <CouponInput
                      subtotal={total}
                      appliedCoupon={appliedCoupon}
                      onApply={setAppliedCoupon}
                      onRemove={() => setAppliedCoupon(null)}
                      restaurantId={restaurant.id}
                    />
                  )}
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        Coupon ({appliedCoupon?.code})
                      </span>
                      <span>− {formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Delivery Fee</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-3 border-t mt-1">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(grandTotal)}</span>
                  </div>
                  {selectedPayment && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                      <Tag className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Paying via <strong className="text-foreground">{PAYMENT_METHODS.find((m) => m.value === selectedPayment)?.label}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                form="checkout-form"
                className="w-full text-base h-13 rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/30 transition-shadow"
                size="lg"
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                    Placing Order...
                  </span>
                ) : (
                  `Place Order · ${formatCurrency(grandTotal)}`
                )}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Your information is safe and secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
