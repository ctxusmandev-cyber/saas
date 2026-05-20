import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRestaurant } from "@/lib/restaurant-context";
import { useAdminAuth } from "@/lib/admin-auth";
import { useState } from "react";
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminSettings() {
  const { restaurant } = useRestaurant();
  const { session } = useAdminAuth();
  const slug = session?.slug ?? restaurant?.slug ?? "terra";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");
    setMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setStatus("error");
      setMessage("All fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      setStatus("error");
      setMessage("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("New passwords do not match.");
      return;
    }

    setStatus("loading");

    try {
      const verifyRes = await fetch(`/api/restaurants/${slug}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: currentPassword }),
      });

      if (!verifyRes.ok) {
        setStatus("error");
        setMessage("Current password is incorrect.");
        return;
      }

      const updateRes = await fetch(`/api/restaurants/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword: newPassword }),
      });

      if (!updateRes.ok) {
        setStatus("error");
        setMessage("Failed to update password. Please try again.");
        return;
      }

      setStatus("success");
      setMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setStatus("error");
      setMessage("Connection error. Please try again.");
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-xl">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-serif font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your admin account settings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-primary" />
              Change Admin Password
            </CardTitle>
            <CardDescription>
              Update the password used to log in to the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {message && (
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
              )}

              <Button type="submit" disabled={status === "loading"} className="w-full">
                {status === "loading" ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
