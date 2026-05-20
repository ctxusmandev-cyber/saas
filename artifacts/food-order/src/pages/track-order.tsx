import { Layout } from "@/components/layout";
import { useState } from "react";
import { useLocation } from "wouter";
import { useRestaurantPath } from "@/lib/use-slug";
import { Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const rpath = useRestaurantPath();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = orderId.trim().replace(/^#/, "");
    if (!id || isNaN(Number(id)) || Number(id) <= 0) {
      setError("Please enter a valid order number.");
      return;
    }
    setError("");
    setLocation(rpath(`/order/${id}`));
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5">
            <Package className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-serif font-bold mb-2">Track Your Order</h1>
          <p className="text-muted-foreground text-sm">
            Enter your order number to see the live status of your delivery.
          </p>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-serif">Order Lookup</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="order-id">Order Number</Label>
                <Input
                  id="order-id"
                  placeholder="e.g. 42"
                  value={orderId}
                  onChange={(e) => {
                    setOrderId(e.target.value);
                    setError("");
                  }}
                  className="text-center text-lg font-mono tracking-widest"
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  You can find your order number in the confirmation message sent after placing the order.
                </p>
              </div>
              <Button type="submit" className="w-full gap-2">
                <Search className="h-4 w-4" />
                Track Order
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
