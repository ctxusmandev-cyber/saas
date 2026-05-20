import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRestaurant } from "@/lib/restaurant-context";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/format";
import {
  Plus, Tag, Pencil, Trash2, ToggleLeft, ToggleRight, RefreshCw,
  Percent, DollarSign, Calendar, Hash, AlertCircle, CheckCircle2, Copy, CheckCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Coupon {
  id: number;
  code: string;
  description?: string | null;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount?: number | null;
  maxUses?: number | null;
  usedCount: number;
  active: boolean;
  expiresAt?: string | null;
  createdAt: string;
}

const EMPTY_FORM = {
  code: "",
  description: "",
  discountType: "percentage" as "percentage" | "fixed",
  discountValue: "",
  minOrderAmount: "",
  maxUses: "",
  active: true,
  expiresAt: "",
};

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      title="Copy code"
    >
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function AdminCoupons() {
  const { restaurant } = useRestaurant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchCoupons = async () => {
    if (!restaurant) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/coupons", {
        headers: { "x-restaurant-id": String(restaurant.id) },
      });
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: "Error", description: "Failed to load coupons", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, [restaurant?.id]);

  const openCreate = () => {
    setEditingCoupon(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description ?? "",
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrderAmount: coupon.minOrderAmount ? String(coupon.minOrderAmount) : "",
      maxUses: coupon.maxUses ? String(coupon.maxUses) : "",
      active: coupon.active,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!restaurant) return;
    if (!form.code.trim()) { toast({ title: "Error", description: "Coupon code is required", variant: "destructive" }); return; }
    if (!form.discountValue || isNaN(Number(form.discountValue)) || Number(form.discountValue) <= 0) {
      toast({ title: "Error", description: "Enter a valid discount value", variant: "destructive" }); return;
    }
    if (form.discountType === "percentage" && Number(form.discountValue) > 100) {
      toast({ title: "Error", description: "Percentage cannot exceed 100%", variant: "destructive" }); return;
    }

    setIsSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description || undefined,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      active: form.active,
      expiresAt: form.expiresAt || null,
    };

    try {
      const url = editingCoupon ? `/api/coupons/${editingCoupon.id}` : "/api/coupons";
      const method = editingCoupon ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-restaurant-id": String(restaurant.id) },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: editingCoupon ? "Coupon updated" : "Coupon created", description: `Code: ${payload.code}` });
      setDialogOpen(false);
      fetchCoupons();
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? "Failed to save coupon", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    if (!restaurant) return;
    try {
      await fetch(`/api/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-restaurant-id": String(restaurant.id) },
        body: JSON.stringify({ active: !coupon.active }),
      });
      fetchCoupons();
    } catch {
      toast({ title: "Error", description: "Failed to toggle coupon", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!restaurant) return;
    try {
      await fetch(`/api/coupons/${id}`, {
        method: "DELETE",
        headers: { "x-restaurant-id": String(restaurant.id) },
      });
      toast({ title: "Coupon deleted" });
      setDeleteConfirm(null);
      fetchCoupons();
    } catch {
      toast({ title: "Error", description: "Failed to delete coupon", variant: "destructive" });
    }
  };

  const activeCoupons = coupons.filter((c) => c.active);
  const totalRedemptions = coupons.reduce((s, c) => s + c.usedCount, 0);

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold">Coupons</h1>
            <p className="text-muted-foreground text-sm mt-1">Create and manage discount codes for customers</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchCoupons} disabled={isLoading} className="gap-2">
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              New Coupon
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Coupons", value: coupons.length, icon: Tag, color: "text-blue-600 bg-blue-50" },
            { label: "Active", value: activeCoupons.length, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
            { label: "Total Redemptions", value: totalRedemptions, icon: Hash, color: "text-primary bg-primary/10" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className={cn("p-2.5 rounded-lg", color)}><Icon className="w-5 h-5" /></div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Coupons list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
            <Tag className="w-10 h-10 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">No coupons yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Create your first discount code to attract customers</p>
            <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Create First Coupon</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {coupons.map((coupon) => {
              const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
              const isExhausted = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;
              const usagePercent = coupon.maxUses ? Math.round((coupon.usedCount / coupon.maxUses) * 100) : null;

              return (
                <div
                  key={coupon.id}
                  className={cn(
                    "bg-card border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm hover:border-primary/30 transition-colors",
                    !coupon.active && "opacity-60"
                  )}
                >
                  {/* Code + discount */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      coupon.discountType === "percentage" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {coupon.discountType === "percentage" ? <Percent className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-base tracking-wider">{coupon.code}</span>
                        <CopyCodeButton code={coupon.code} />
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            coupon.active && !isExpired && !isExhausted
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          )}
                        >
                          {!coupon.active ? "Inactive" : isExpired ? "Expired" : isExhausted ? "Exhausted" : "Active"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                        <span className="font-semibold text-primary text-sm">
                          {coupon.discountType === "percentage" ? `${coupon.discountValue}% off` : `Rs ${coupon.discountValue} off`}
                        </span>
                        {coupon.description && <span className="truncate max-w-[200px]">{coupon.description}</span>}
                        {coupon.minOrderAmount && <span>Min: {formatCurrency(coupon.minOrderAmount)}</span>}
                        {coupon.expiresAt && (
                          <span className={cn("flex items-center gap-1", isExpired && "text-destructive")}>
                            <Calendar className="w-3 h-3" />
                            Expires {new Date(coupon.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Usage */}
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-center">
                      <p className="text-lg font-bold">{coupon.usedCount}</p>
                      <p className="text-xs text-muted-foreground">
                        {coupon.maxUses ? `/ ${coupon.maxUses} uses` : "uses"}
                      </p>
                      {usagePercent !== null && (
                        <div className="w-16 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", usagePercent >= 100 ? "bg-destructive" : "bg-primary")}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggle(coupon)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          coupon.active ? "text-green-600 hover:bg-green-50" : "text-muted-foreground hover:bg-muted"
                        )}
                        title={coupon.active ? "Deactivate" : "Activate"}
                      >
                        {coupon.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => openEdit(coupon)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(coupon.id)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
          <DialogContent className="max-w-md w-[95vw]">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">{editingCoupon ? "Edit Coupon" : "New Coupon"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Coupon Code *</Label>
                <Input
                  placeholder="e.g. SAVE20"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="font-mono uppercase"
                />
                <p className="text-xs text-muted-foreground">Customers enter this at checkout</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Discount Type *</Label>
                  <Select value={form.discountType} onValueChange={(v: "percentage" | "fixed") => setForm({ ...form, discountType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (Rs)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Discount Value *</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder={form.discountType === "percentage" ? "20" : "100"}
                      value={form.discountValue}
                      onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {form.discountType === "percentage" ? "%" : "Rs"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  placeholder="e.g. Welcome discount for new customers"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Min. Order Amount <span className="text-muted-foreground font-normal">(Rs)</span></Label>
                  <Input
                    type="number"
                    placeholder="500"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Uses <span className="text-muted-foreground font-normal">(blank = unlimited)</span></Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Expires On <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Customers can use this coupon</p>
                </div>
                <button
                  onClick={() => setForm({ ...form, active: !form.active })}
                  className={cn(
                    "transition-colors",
                    form.active ? "text-green-600" : "text-muted-foreground"
                  )}
                >
                  {form.active ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : editingCoupon ? "Save Changes" : "Create Coupon"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <Dialog open={deleteConfirm !== null} onOpenChange={(v) => !v && setDeleteConfirm(null)}>
          <DialogContent className="max-w-sm w-[95vw]">
            <DialogHeader>
              <DialogTitle className="font-serif">Delete Coupon?</DialogTitle>
            </DialogHeader>
            <div className="flex items-start gap-3 py-2">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                This will permanently delete the coupon and customers will no longer be able to use it. This action cannot be undone.
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
