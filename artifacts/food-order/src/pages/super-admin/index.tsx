import { useState } from "react";
import { SuperAdminLayout } from "@/components/super-admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Pencil, Trash2, ExternalLink, Eye, EyeOff, Power,
  KeyRound, ShieldCheck, Users, CheckCircle2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Restaurant {
  id: number;
  name: string;
  slug: string;
  description?: string;
  phone?: string;
  address?: string;
  active: boolean;
  createdAt: string;
}

interface RestaurantForm {
  name: string;
  slug: string;
  adminPassword: string;
  description: string;
  phone: string;
  address: string;
}

const emptyForm: RestaurantForm = { name: "", slug: "", adminPassword: "", description: "", phone: "", address: "" };

function useRestaurants() {
  return useQuery<Restaurant[]>({
    queryKey: ["super-admin-restaurants"],
    queryFn: () => fetch("/api/restaurants").then((r) => r.json()),
    refetchInterval: 30000,
  });
}

function useCommonPasswordStatus() {
  return useQuery<{ isSet: boolean }>({
    queryKey: ["common-password-status"],
    queryFn: () => fetch("/api/super-admin/common-password-status").then((r) => r.json()),
  });
}

function RestaurantFormDialog({
  trigger, initial, onSave, title,
}: {
  trigger: React.ReactNode;
  initial?: RestaurantForm;
  onSave: (data: RestaurantForm) => Promise<void>;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RestaurantForm>(initial ?? emptyForm);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = (key: keyof RestaurantForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setErr("");
    setSaving(true);
    try {
      await onSave(form);
      setOpen(false);
    } catch (e: any) {
      setErr(e.message ?? "Error saving");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setForm(initial ?? emptyForm); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg w-[95vw]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Restaurant Name *</Label>
              <Input value={form.name} onChange={set("name")} placeholder="My Restaurant" />
            </div>
            <div className="space-y-1">
              <Label>URL Slug * <span className="text-xs text-muted-foreground">(unique)</span></Label>
              <Input value={form.slug} onChange={set("slug")} placeholder="my-restaurant" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Admin Password *</Label>
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                value={form.adminPassword}
                onChange={set("adminPassword")}
                placeholder="Strong password"
                className="pr-10"
              />
              <button type="button" onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Input value={form.description} onChange={set("description")} placeholder="About this restaurant" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={set("phone")} placeholder="+92-300-..." />
            </div>
            <div className="space-y-1">
              <Label>Address</Label>
              <Input value={form.address} onChange={set("address")} placeholder="City, Pakistan" />
            </div>
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.slug || !form.adminPassword}>
              {saving ? "Saving..." : "Save Restaurant"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PasswordField({
  label, value, onChange, placeholder, id,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; id: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function StatusMessage({ status, message }: { status: "success" | "error"; message: string }) {
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm",
      status === "success"
        ? "bg-green-50 text-green-800 border border-green-200"
        : "bg-red-50 text-red-800 border border-red-200"
    )}>
      {status === "success"
        ? <CheckCircle2 className="h-4 w-4 shrink-0" />
        : <AlertCircle className="h-4 w-4 shrink-0" />}
      {message}
    </div>
  );
}

function CommonPasswordCard() {
  const queryClient = useQueryClient();
  const { data: status } = useCommonPasswordStatus();
  const [superPwd, setSuperPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [result, setResult] = useState<{ status: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    if (!superPwd) { setResult({ status: "error", message: "Super admin password is required." }); return; }
    if (newPwd && newPwd !== confirmPwd) { setResult({ status: "error", message: "New passwords do not match." }); return; }
    if (newPwd && newPwd.length < 6) { setResult({ status: "error", message: "Common password must be at least 6 characters." }); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/common-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ superAdminPassword: superPwd, newCommonPassword: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ status: "error", message: data.error ?? "Failed to update." });
      } else {
        setResult({
          status: "success",
          message: data.cleared ? "Common password removed successfully." : "Common password updated successfully.",
        });
        setSuperPwd(""); setNewPwd(""); setConfirmPwd("");
        queryClient.invalidateQueries({ queryKey: ["common-password-status"] });
      }
    } catch {
      setResult({ status: "error", message: "Connection error. Please try again." });
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-primary" />
          Common Admin Password
        </CardTitle>
        <CardDescription>
          This password works as a universal login for <strong>any</strong> restaurant admin panel.
          {status !== undefined && (
            <span className={cn(
              "ml-2 text-xs font-medium px-1.5 py-0.5 rounded",
              status.isSet ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"
            )}>
              {status.isSet ? "Currently set" : "Not set"}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <PasswordField
            id="cp-super"
            label="Your Super Admin Password (to verify)"
            value={superPwd}
            onChange={setSuperPwd}
            placeholder="Current super admin password"
          />
          <PasswordField
            id="cp-new"
            label="New Common Password"
            value={newPwd}
            onChange={setNewPwd}
            placeholder="Leave empty to remove the common password"
          />
          <PasswordField
            id="cp-confirm"
            label="Confirm New Common Password"
            value={confirmPwd}
            onChange={setConfirmPwd}
            placeholder="Repeat new common password"
          />
          {result && <StatusMessage status={result.status} message={result.message} />}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !superPwd} className="flex-1">
              {loading ? "Saving..." : "Save Common Password"}
            </Button>
            {status?.isSet && (
              <Button
                type="button"
                variant="outline"
                disabled={loading || !superPwd}
                className="text-destructive hover:bg-destructive/10"
                onClick={async () => {
                  setResult(null);
                  setLoading(true);
                  try {
                    const res = await fetch("/api/super-admin/common-password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ superAdminPassword: superPwd, newCommonPassword: "" }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setResult({ status: "error", message: data.error ?? "Failed." });
                    } else {
                      setResult({ status: "success", message: "Common password removed." });
                      setSuperPwd(""); setNewPwd(""); setConfirmPwd("");
                      queryClient.invalidateQueries({ queryKey: ["common-password-status"] });
                    }
                  } catch {
                    setResult({ status: "error", message: "Connection error." });
                  }
                  setLoading(false);
                }}
              >
                Remove
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SuperAdminPasswordCard() {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [result, setResult] = useState<{ status: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    if (!currentPwd || !newPwd || !confirmPwd) { setResult({ status: "error", message: "All fields are required." }); return; }
    if (newPwd.length < 6) { setResult({ status: "error", message: "New password must be at least 6 characters." }); return; }
    if (newPwd !== confirmPwd) { setResult({ status: "error", message: "New passwords do not match." }); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ status: "error", message: data.error ?? "Failed to update." });
      } else {
        setResult({ status: "success", message: "Super admin password updated. Use the new password next time you log in." });
        setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      }
    } catch {
      setResult({ status: "error", message: "Connection error. Please try again." });
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Super Admin Password
        </CardTitle>
        <CardDescription>
          Change the password used to access this Super Admin panel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <PasswordField
            id="sa-current"
            label="Current Password"
            value={currentPwd}
            onChange={setCurrentPwd}
            placeholder="Current super admin password"
          />
          <PasswordField
            id="sa-new"
            label="New Password"
            value={newPwd}
            onChange={setNewPwd}
            placeholder="New super admin password"
          />
          <PasswordField
            id="sa-confirm"
            label="Confirm New Password"
            value={confirmPwd}
            onChange={setConfirmPwd}
            placeholder="Repeat new password"
          />
          {result && <StatusMessage status={result.status} message={result.message} />}
          <Button type="submit" disabled={loading || !currentPwd || !newPwd || !confirmPwd} className="w-full">
            {loading ? "Updating..." : "Update Super Admin Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function SuperAdminDashboard() {
  const { data: restaurants = [], isLoading } = useRestaurants();
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (data: RestaurantForm) =>
      fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Error");
        return r.json();
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["super-admin-restaurants"] }),
  });

  const update = useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: Partial<RestaurantForm & { active: boolean }> }) =>
      fetch(`/api/restaurants/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Error");
        return r.json();
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["super-admin-restaurants"] }),
  });

  const remove = useMutation({
    mutationFn: (slug: string) =>
      fetch(`/api/restaurants/${slug}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["super-admin-restaurants"] }),
  });

  const toggleActive = (r: Restaurant) => {
    update.mutate({ slug: r.slug, data: { active: !r.active } });
  };

  return (
    <SuperAdminLayout>
      <div className="p-4 md:p-8 space-y-10">
        {/* ── Restaurant Management ─────────────────────── */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold">Restaurant Management</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {restaurants.length} restaurant{restaurants.length !== 1 ? "s" : ""} registered
              </p>
            </div>
            <RestaurantFormDialog
              title="Create New Restaurant"
              trigger={<Button className="gap-2 shrink-0"><Plus className="w-4 h-4" /> Add Restaurant</Button>}
              onSave={(data) => create.mutateAsync(data)}
            />
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-card rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Slug / URL</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</td>
                    </tr>
                  ) : restaurants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">No restaurants yet.</td>
                    </tr>
                  ) : (
                    restaurants.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{r.name}</div>
                          {r.description && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{r.description}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{r.slug}</code>
                            <a href={`/r/${r.slug}`} target="_blank" rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">{r.phone ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{r.address ?? "—"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={r.active ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}>
                            {r.active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost" size="icon"
                              className={`h-8 w-8 ${r.active ? "text-green-600 hover:text-red-600 hover:bg-red-50" : "text-muted-foreground hover:text-green-600 hover:bg-green-50"}`}
                              onClick={() => toggleActive(r)}
                              title={r.active ? "Deactivate restaurant" : "Activate restaurant"}
                            >
                              <Power className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <a href={`/r/${r.slug}/admin`}><ExternalLink className="w-4 h-4" /></a>
                            </Button>
                            <RestaurantFormDialog
                              title={`Edit ${r.name}`}
                              trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="w-4 h-4" /></Button>}
                              initial={{ name: r.name, slug: r.slug, adminPassword: "", description: r.description ?? "", phone: r.phone ?? "", address: r.address ?? "" }}
                              onSave={(data) => update.mutateAsync({ slug: r.slug, data })}
                            />
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => { if (confirm(`Delete "${r.name}"? This cannot be undone.`)) remove.mutate(r.slug); }}
                              disabled={r.slug === "terra"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : restaurants.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No restaurants yet.</div>
            ) : (
              restaurants.map((r) => (
                <div key={r.id} className="bg-card rounded-xl border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold">{r.name}</div>
                      {r.description && <div className="text-xs text-muted-foreground truncate">{r.description}</div>}
                    </div>
                    <Badge variant="outline" className={`shrink-0 ${r.active ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}`}>
                      {r.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{r.slug}</code>
                    {r.phone && <span>· {r.phone}</span>}
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <Button
                      variant="outline" size="sm"
                      className={`gap-1.5 text-xs ${r.active ? "text-red-600 border-red-200 hover:bg-red-50" : "text-green-600 border-green-200 hover:bg-green-50"}`}
                      onClick={() => toggleActive(r)}
                    >
                      <Power className="w-3 h-3" />
                      {r.active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                      <a href={`/r/${r.slug}/admin`}><ExternalLink className="w-3 h-3" /> Admin</a>
                    </Button>
                    <div className="ml-auto flex gap-1">
                      <RestaurantFormDialog
                        title={`Edit ${r.name}`}
                        trigger={<Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="w-3.5 h-3.5" /></Button>}
                        initial={{ name: r.name, slug: r.slug, adminPassword: "", description: r.description ?? "", phone: r.phone ?? "", address: r.address ?? "" }}
                        onSave={(data) => update.mutateAsync({ slug: r.slug, data })}
                      />
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => { if (confirm(`Delete "${r.name}"?`)) remove.mutate(r.slug); }}
                        disabled={r.slug === "terra"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Security Settings ─────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <KeyRound className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-serif font-bold">Security Settings</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <CommonPasswordCard />
            <SuperAdminPasswordCard />
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
